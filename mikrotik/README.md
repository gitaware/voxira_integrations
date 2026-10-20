<img src="../images/logo_no_eu_dark_background.png" alt="Voxira" width="280">

# Voxira integration for MikroTik RouterOS

Queue spoken telephone alerts directly from a MikroTik router. The integration
installs a native RouterOS script that sends an HTTPS request to Voxira, so
Netwatch, the scheduler and other router scripts can call an on-call number
without a separate automation server.

For Voxira access and support, contact
[contact@voxira.eu](mailto:contact@voxira.eu).

## Features

- Native RouterOS 7 script with no package or external runtime.
- Safe JSON serialization of arbitrary alert text.
- HTTPS certificate validation and no HTTP redirects.
- A default recipient with a per-event E.164 override.
- Netwatch, scheduler and reusable script examples.
- Router identity, RouterOS version and event metadata for callflows.
- No automatic retry after an ambiguous timeout.

## Requirements

| Component | Requirement |
| --- | --- |
| MikroTik | RouterOS 7 with `/tool fetch`, `:serialize` and `:deserialize`. Use a current stable release. |
| Permissions | An administrator who can upload/import a file and create a system script. Event callers need the `read,test` policies. |
| Voxira | Tenant HTTPS URL, API key, callflow UUID and an international E.164 destination. |
| Connectivity | Working DNS, time synchronization, and outbound TCP 443 access from the router to the Voxira tenant. |
| TLS | The router must trust the tenant certificate chain. Current RouterOS releases provide a built-in CA store for Fetch. |

The script sends one immediate `POST /api/call/v2` request. A successful
response only means Voxira queued the call; it does not mean the recipient
answered or heard it.

## Installation

### 1. Prepare Voxira

1. Request Voxira access from contact@voxira.eu and generate an API
   key from your profile.
2. Create a callflow with connected **Start → TTS → Hangup** blocks.
3. Configure a valid caller ID in Start and set the TTS text to
   `{{alert_text}}`.
4. Save the callflow and copy its UUID. Ensure the Voxira dispatcher and TTS
   service are running.

The integration provides these callflow parameters:

| Placeholder | Value |
| --- | --- |
| `{{alert_text}}` | Alert text passed by the router |
| `{{message}}` | The same alert text |
| `{{source}}` | `mikrotik` |
| `{{event}}` | Optional caller-supplied event name |
| `{{router_identity}}` | Router identity from `/system identity` |
| `{{routeros_version}}` | Installed RouterOS version |

### 2. Configure and import the script

Download [voxira.rsc](voxira.rsc) and edit only the four values in its
configuration section:

```routeros
:local voxiraUrl "https://voxira.example.com"
:local voxiraApiKey "REPLACE_WITH_VOXIRA_API_KEY"
:local voxiraCallflow "550e8400-e29b-41d4-a716-446655440000"
:local voxiraDefaultTo "+31612345678"
```

Use the tenant base URL without `/api`; HTTPS is required. Upload the edited
file through WinBox, WebFig, SFTP or SCP. On RouterOS 7.16 or newer, optionally
check its syntax without changing the router first:

```routeros
/import file-name=voxira.rsc verbose=yes dry-run
```

Import it:

```routeros
/import file-name=voxira.rsc verbose=yes
```

The installer stops if `voxira-call` already exists and never silently
replaces it. Once imported, remove the uploaded file because it contains the
API key:

```routeros
/file remove [find where name="voxira.rsc"]
```

The installed system script still contains the key. Users who can read router
configuration may be able to view it, and exports or backups may retain it.
Restrict router administration and backup access, use a dedicated Voxira API
key, and rotate the key if a router or backup is exposed.

### 3. Test a call

Run the stored source as a function so arguments remain local to this event:

```routeros
:local voxiraCall [:parse [/system script get [find where name="voxira-call"] source]]
:put [$voxiraCall message="This is a MikroTik test alert." event="manual_test"]
```

This places a real call to the configured default destination. On success the
terminal and RouterOS log show `Voxira: queued call` followed by its UUID.
Check **Calls** and confirm the phone reads the test message.

Override the destination for one call:

```routeros
:local voxiraCall [:parse [/system script get [find where name="voxira-call"] source]]
:put [$voxiraCall to="+31612345678" message="Call the network engineer." event="manual"]
```

The parser/function form avoids shared global variables, so two event sources
cannot accidentally exchange their recipient or message.

## Netwatch alert

This example calls only when the probe changes to down. Change the probe host,
interval and message for your network:

```routeros
/tool netwatch add name="voxira-wan" host=1.1.1.1 type=icmp interval=30s timeout=3s \
    ignore-initial-down=yes down-script={
        :local voxiraCall [:parse [/system script get [find where name="voxira-call"] source]]
        $voxiraCall message="The WAN connectivity check is down." event="netwatch_down"
    }
```

`ignore-initial-down=yes` prevents a call for an initial unknown-to-down state;
the first call occurs after Netwatch has observed the target up and it later
goes down. Consider longer probe intervals or more specific Netwatch probe
settings to reduce calls caused by transient packet loss.

RouterOS runs Netwatch as the `sys` user and restricts it to
`read,write,test,reboot`. The installed Voxira script declares only
`read,test`, so it does not require `dont-require-permissions=yes`.

To place a recovery call as well, add an `up-script`:

```routeros
up-script={
    :local voxiraCall [:parse [/system script get [find where name="voxira-call"] source]]
    $voxiraCall message="The WAN connectivity check has recovered." event="netwatch_up"
}
```

## Scheduled call

This example places a monthly test call. Set the router's NTP client and time
zone before depending on scheduler times.

```routeros
/system scheduler add name="voxira-monthly-test" interval=30d start-time=09:00:00 \
    policy=read,test on-event={
        :local voxiraCall [:parse [/system script get [find where name="voxira-call"] source]]
        $voxiraCall message="This is the scheduled router alert test." event="scheduled_test"
    }
```

## Calling from another RouterOS script

```routeros
:local voxiraCall [:parse [/system script get [find where name="voxira-call"] source]]
:local callUuid [$voxiraCall \
    to="+31612345678" \
    message=("Router " . [/system identity get name] . " needs attention.") \
    event="router_script"]
:log info ("The Voxira call UUID is " . $callUuid)
```

Keep alert text concise for text-to-speech. Do not include passwords, API keys,
customer data or full configuration exports in spoken messages.

## Errors and retries

| Symptom | Check |
| --- | --- |
| `configure the API key` | Replace the placeholder in the import file and reinstall. |
| TLS/fetch failure | DNS, router clock, outbound firewall, tenant hostname and trusted CA chain. Do not disable certificate checking. |
| Request rejected | API key, enabled Voxira user, callflow UUID, tenant hostname and E.164 destination. |
| Queued but no call | Voxira dispatcher, call schedule, caller ID, trunk, and Calls event details. |
| Call connects but is silent | TTS configuration and the callflow's `{{alert_text}}` placeholder. |
| Netwatch does not execute | Netwatch state, `read,test` policies, script name and RouterOS logs. |

The script makes one request and does not retry. If Fetch times out, Voxira
may have queued the call before the response was lost. Check **Calls** before
running it again to avoid duplicate calls.

The script deliberately logs only a generic error or the successful call UUID;
it does not log the API key, request body, response body or spoken alert text.

## Update or remove

Back up the four configuration values securely. Remove only the integration's
named script, then edit and import the new file:

```routeros
/system script remove [find where name="voxira-call"]
```

Remove any Netwatch or scheduler entries you created separately if they are no
longer required. Rotate or delete the corresponding Voxira API key when
decommissioning a router.

RouterOS Fetch, scripting, Netwatch and scheduler behavior is documented in the
[official MikroTik RouterOS documentation](https://help.mikrotik.com/docs/).
This community integration does not imply endorsement or certification by
MikroTik.
