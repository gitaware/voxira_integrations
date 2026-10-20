public with sharing class VoxiraCallAction {
    public class Request {
        @InvocableVariable(required=true label='Telephone number') public String callee;
        @InvocableVariable(required=true label='Callflow UUID') public String callflow;
        @InvocableVariable(required=true label='Message') public String message;
    }
    public class Result {
        @InvocableVariable(label='Voxira call UUID') public String callUuid;
    }
    @InvocableMethod(label='Place a Voxira call' description='Queues a spoken telephone call through Voxira' callout=true)
    public static List<Result> placeCalls(List<Request> requests) {
        List<Result> results = new List<Result>();
        Pattern phone = Pattern.compile('^\\+[1-9][0-9]{6,14}$');
        Pattern uuid = Pattern.compile('^[0-9a-fA-F-]{36}$');
        Http client = new Http();
        for (Request input : requests) {
            if (input == null || !phone.matcher(input.callee == null ? '' : input.callee.trim()).matches() ||
                !uuid.matcher(input.callflow == null ? '' : input.callflow.trim()).matches() || String.isBlank(input.message)) {
                throw new CalloutException('Voxira requires an E.164 number, callflow UUID and message.');
            }
            HttpRequest request = new HttpRequest();
            request.setEndpoint('callout:Voxira/api/call/v2');
            request.setMethod('POST'); request.setHeader('Content-Type', 'application/json'); request.setTimeout(20000);
            request.setBody(JSON.serialize(new Map<String,Object>{
                'callee' => input.callee.trim(), 'callflow' => input.callflow.trim(),
                'calldate' => Datetime.now().formatGMT('yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
                'parameters' => new Map<String,Object>{'message'=>input.message.trim(),'alert_text'=>input.message.trim(),'source'=>'salesforce'}
            }));
            HttpResponse response = client.send(request);
            Map<String,Object> body;
            try { body = (Map<String,Object>)JSON.deserializeUntyped(response.getBody()); } catch (Exception ignored) { body = null; }
            if (response.getStatusCode() != 201 || body == null || body.get('success') != true) {
                throw new CalloutException('Voxira did not confirm the call; check Calls v2 before retrying.');
            }
            Map<String,Object> data = (Map<String,Object>)body.get('data');
            Result output = new Result(); output.callUuid = data == null ? null : (String)data.get('call_uuid');
            if (!uuid.matcher(output.callUuid == null ? '' : output.callUuid).matches()) throw new CalloutException('Voxira returned an invalid call identifier.');
            results.add(output);
        }
        return results;
    }
}
