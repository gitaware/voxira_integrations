'use strict';
const axios = require('axios');
const env = (name) => process.env['VOXIRA_' + name] || process.env['VOICECAST_' + name] || '';
exports.main = async (event, callback) => {
  try {
    const url = new URL(env('URL'));
    const callee = String(event.inputFields.callee || '').trim();
    const callflow = String(event.inputFields.callflow || env('CALLFLOW')).trim();
    const message = String(event.inputFields.message || '').trim();
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error();
    if (!/^\+[1-9][0-9]{6,14}$/.test(callee) || !/^[0-9a-f-]{36}$/i.test(callflow) || !message) throw new Error();
    const response = await axios.post(url.toString().replace(/\/$/,'') + '/api/call/v2', {callee,callflow,calldate:new Date().toISOString(),parameters:{message,alert_text:message,source:'hubspot'}}, {headers:{Authorization:'Bearer '+env('API_KEY')},timeout:20000,maxRedirects:0,validateStatus:()=>true});
    if (response.status !== 201 || response.data?.success !== true || !/^[0-9a-f-]{36}$/i.test(response.data?.data?.call_uuid || '')) throw new Error();
    callback({outputFields:{call_uuid:response.data.data.call_uuid}});
  } catch (_) { throw new Error('Voxira call failed; check Calls v2 before retrying'); }
};
