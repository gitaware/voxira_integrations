'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const yaml = fs.readFileSync(path.join(__dirname, 'media_voxira.yaml'), 'utf8');
const block = yaml.match(/^      script: \|\n([\s\S]*?)^      description:/m);
assert.ok(block, 'embedded script exists');
const script = block[1].replace(/^        /gm, '');
const uuid = '550e8400-e29b-41d4-a716-446655440000';
const defaults = {
    URL: 'https://voxira.example.com/', APIKey: 'test-secret', Callflow: uuid,
    To: '+31612345678', Message: 'Host "db"\n失敗',
    HTTPProxy: ''
};
function run(overrides = {}, options = {}) {
    const capture = { headers: [], requests: [] };
    const context = {
        value: options.raw === undefined ? JSON.stringify({ ...defaults, ...overrides }) : options.raw,
        HttpRequest: function () {
            this.addHeader = header => capture.headers.push(header);
            this.setProxy = proxy => { capture.proxy = proxy; };
            this.post = (url, body) => {
                capture.requests.push({ url, body: JSON.parse(body) });
                if (options.transportError) throw new Error('test-secret');
                return options.response === undefined
                    ? JSON.stringify({ success: true, data: { call_uuid: uuid } }) : options.response;
            };
            this.getStatus = () => options.status === undefined ? 201 : options.status;
        }
    };
    try {
        capture.result = vm.runInNewContext('(function () {\n' + script + '\n})()', context);
    } catch (error) {
        capture.error = String(error);
    }
    return capture;
}

test('queues a call with bearer auth, UTC schedule and preserved speech text', () => {
    const before = Date.now();
    const result = run();
    assert.equal(result.error, undefined);
    assert.equal(result.result, 'Queued Voxira call ' + uuid);
    assert.deepEqual(result.headers, ['Content-Type: application/json', 'Authorization: Bearer test-secret']);
    assert.equal(result.requests.length, 1);
    const request = result.requests[0];
    assert.equal(request.url, 'https://voxira.example.com/api/call/v2');
    assert.equal(request.body.callee, defaults.To);
    assert.equal(request.body.callflow, uuid);
    assert.match(request.body.calldate, /Z$/);
    assert.ok(Date.parse(request.body.calldate) >= before);
    assert.ok(Date.parse(request.body.calldate) <= Date.now());
    assert.deepEqual(request.body.parameters, {
        message: defaults.Message,
        alert_text: defaults.Message, source: 'zabbix'
    });
});

test('supports a base path and optional proxy', () => {
    const result = run({ URL: 'https://voxira.example.com/voxira/', HTTPProxy: 'http://proxy:3128' });
    assert.equal(result.error, undefined);
    assert.equal(result.proxy, 'http://proxy:3128');
    assert.equal(result.requests[0].url, 'https://voxira.example.com/voxira/api/call/v2');
    assert.equal(result.requests[0].body.parameters.alert_text, defaults.Message);
});

test('ignores a legacy Subject parameter instead of speaking or forwarding it', () => {
    const result = run({ Subject: 'This must not be spoken' });
    assert.equal(result.error, undefined);
    assert.deepEqual(result.requests[0].body.parameters, {
        message: defaults.Message, alert_text: defaults.Message, source: 'zabbix'
    });
    assert.ok(!yaml.includes('{ALERT.SUBJECT}'));
});

test('rejects invalid settings before sending any HTTP request', () => {
    for (const overrides of [
        { URL: 'http://example.com' }, { URL: 'https://user:pass@example.com' },
        { URL: 'https://example.com?key=secret' }, { URL: 'https://example.com/api/call/v2' },
        { APIKey: '' }, { APIKey: '{$VOXIRA.API.KEY}' }, { APIKey: 'a\r\nb' },
        { Callflow: 'invalid' }, { To: '0612345678' }, { To: '+31612345678,+31687654321' },
        { To: '{ALERT.SENDTO}' }, { Message: '' }
    ]) {
        const result = run(overrides);
        assert.match(result.error, /^Voxira:/);
        assert.equal(result.requests.length, 0);
    }
    for (const raw of ['null', '[]', '{', '1']) {
        const result = run({}, { raw });
        assert.match(result.error, /^Voxira:/);
        assert.equal(result.requests.length, 0);
    }
});

test('reports HTTP failures without leaking response contents or retrying', () => {
    for (const status of [200, 301, 400, 401, 404, 429, 500]) {
        const result = run({}, { status, response: 'test-secret' });
        assert.match(result.error, new RegExp('HTTP ' + status));
        assert.ok(!result.error.includes('test-secret'));
        assert.equal(result.requests.length, 1);
    }
});

test('rejects malformed and unsuccessful responses', () => {
    for (const response of ['<html>test-secret</html>', 'null', '{}',
        '{"success":false}', '{"success":true,"data":{"call_uuid":"invalid"}}']) {
        const result = run({}, { response });
        assert.match(result.error, /Check Calls v2 before retrying/);
        assert.ok(!result.error.includes('test-secret'));
    }
});

test('sanitizes transport errors and does not retry', () => {
    const result = run({}, { transportError: true });
    assert.match(result.error, /HTTP request failed/);
    assert.ok(!result.error.includes('test-secret'));
    assert.equal(result.requests.length, 1);
});
