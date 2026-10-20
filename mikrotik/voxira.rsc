# Voxira integration for MikroTik RouterOS 7.
# Replace the four values in the configuration section before importing.
# The API key remains visible in the installed script source; restrict router access.

:local scriptName "voxira-call"

:if ([:len [/system script find where name=$scriptName]] > 0) do={
    :error "Voxira: a script named voxira-call already exists"
}

/system script add name=$scriptName comment="Queue a Voxira call through the Calls v2 API" \
    dont-require-permissions=no policy=read,test source={
    # --- Voxira configuration ---
    :local voxiraUrl "https://voxira.example.com"
    :local voxiraApiKey "REPLACE_WITH_VOXIRA_API_KEY"
    :local voxiraCallflow "550e8400-e29b-41d4-a716-446655440000"
    :local voxiraDefaultTo "+31612345678"
    # --- End configuration ---

    :if ([:pick $voxiraUrl 0 8] != "https://") do={
        :error "Voxira: the tenant URL must use HTTPS"
    }
    :if ([:pick $voxiraUrl ([:len $voxiraUrl] - 1) [:len $voxiraUrl]] = "/") do={
        :set voxiraUrl [:pick $voxiraUrl 0 ([:len $voxiraUrl] - 1)]
    }
    :if (($voxiraApiKey = "") || ($voxiraApiKey = "REPLACE_WITH_VOXIRA_API_KEY")) do={
        :error "Voxira: configure the API key"
    }
    :if ([:len $voxiraCallflow] != 36) do={
        :error "Voxira: configure a valid callflow UUID"
    }
    :if (([:typeof $message] != "str") || ([:len $message] = 0)) do={
        :error "Voxira: message is required"
    }

    :local destination $voxiraDefaultTo
    :if ([:typeof $to] = "str") do={
        :if ([:len $to] > 0) do={
            :set destination $to
        }
    }
    :if (([:len $destination] < 8) || ([:len $destination] > 16) || ([:pick $destination 0 1] != "+")) do={
        :error "Voxira: destination must be an international E.164 number"
    }

    :local eventName ""
    :if ([:typeof $event] = "str") do={
        :set eventName $event
    }

    :local parameters ({
        "alert_text"=$message;
        "event"=$eventName;
        "message"=$message;
        "router_identity"=[/system identity get name];
        "routeros_version"=[/system resource get version];
        "source"="mikrotik"
    })
    :local payload ({
        "callee"=$destination;
        "callflow"=$voxiraCallflow;
        "parameters"=$parameters
    })
    :local requestBody [:serialize to=json value=$payload options=json.no-string-conversion]
    :local endpoint ($voxiraUrl . "/api/call/v2")
    :local headers ("Authorization: Bearer " . $voxiraApiKey . ",Content-Type: application/json,Accept: application/json")
    :local fetchResult

    :onerror fetchError in={
        :set fetchResult [/tool fetch url=$endpoint http-method=post http-header-field=$headers \
            http-data=$requestBody check-certificate=yes-without-crl http-max-redirect-count=0 \
            duration=20s idle-timeout=10s output=user as-value]
    } do={
        :log error "Voxira: request failed; check connectivity, credentials and Calls v2 before retrying"
        :error "Voxira request failed"
    }

    :if ($fetchResult->"status" != "finished") do={
        :log error "Voxira: request did not finish"
        :error "Voxira request did not finish"
    }

    :local response
    :onerror parseError in={
        :set response [:deserialize from=json value=($fetchResult->"data") options=json.no-string-conversion]
    } do={
        :log error "Voxira: API returned an invalid response"
        :error "Voxira returned an invalid response"
    }

    :if ($response->"success" != true) do={
        :log error "Voxira: API did not accept the call"
        :error "Voxira did not accept the call"
    }

    :local callUuid ($response->"data"->"call_uuid")
    :if (([:typeof $callUuid] != "str") || ([:len $callUuid] != 36)) do={
        :log error "Voxira: API response did not contain a call UUID"
        :error "Voxira response did not contain a call UUID"
    }

    :log info ("Voxira: queued call " . $callUuid)
    :return $callUuid
}

:put "Installed system script: voxira-call"
:put "Delete this import file from Files because it contains the Voxira API key."
