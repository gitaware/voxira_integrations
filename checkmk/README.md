<img src="../images/logo_no_eu_dark_background.png" alt="Voxira" width="280">

# Voxira integration for Checkmk

Send Checkmk host and service state changes to an on-call telephone number with
a site-local notification script. The client uses only Python's standard
library and does not expose the API key on the command line.

For Voxira access and support, contact
[contact@voxira.eu](mailto:contact@voxira.eu).

## Requirements

- Checkmk with permission to install site-local notification scripts.
- Python 3.8 or newer and outbound HTTPS access from the Checkmk site.
- A Voxira tenant URL, API key, callflow UUID and E.164 destination number.

## Installation

Run as the Checkmk site user. `$OMD_ROOT` must refer to that site:

```bash
install -m 0755 voxira "$OMD_ROOT/local/share/check_mk/notifications/voxira"
install -m 0600 voxira.json.example "$OMD_ROOT/etc/voxira.json"
```

Edit `$OMD_ROOT/etc/voxira.json` and replace every example value:

| Setting | Required | Description |
| --- | --- | --- |
| `url` | Yes | HTTPS tenant base URL, without `/api`. |
| `api_key` | Yes | Dedicated Voxira bearer key. |
| `callflow` | Yes | Callflow UUID supplied for this integration. |
| `callee` | Yes | One international E.164 number, such as `+31612345678`. |
| `timeout` | No | Network timeout from 1 to 60 seconds; default is 20. |

Keep the configuration mode at `0600`; never commit the real key. Set
`VOXIRA_CONFIG` in the notification environment only when a different path
is required.
The legacy `VOICECAST_CONFIG` name remains accepted during migration.

## Checkmk configuration

1. Activate changes so Checkmk discovers the local notification script.
2. Create a notification rule and select **Voxira phone call** as the
   notification method.
3. Select the hosts, services, states, notification types, contacts and time
   periods that should result in calls.
4. Avoid broad default rules: begin with a dedicated test host or service.

The script reads Checkmk's `NOTIFY_...` environment variables. It sends the
notification type, host, optional service, state and plugin output as callflow
parameters, plus a concise `message`, `alert_text` and `source: checkmk`.

## Test

First validate configuration and payload construction without placing a call:

```bash
NOTIFY_NOTIFICATIONTYPE=TEST NOTIFY_HOSTNAME=test-host NOTIFY_HOSTSTATE=DOWN \
NOTIFY_HOSTOUTPUT='Controlled Voxira test' \
"$OMD_ROOT/local/share/check_mk/notifications/voxira" --dry-run
```

Remove `--dry-run` to queue a real call, or use Checkmk's notification test UI
to validate the entire rule. Success is written to Checkmk's notification log
as `Queued Voxira call <uuid>`.

## Delivery behavior

The script exits `0` only after HTTP 201 and a call UUID. It exits `2` for
configuration, HTTP, TLS, timeout and response errors. This deliberately marks
failures as final: a timeout can occur after Voxira saved the call, so an
automatic Checkmk retry could create a duplicate. Check Voxira Calls before
manually retrying.

A queued call is asynchronous and may still fail or go unanswered. Checkmk is
not automatically acknowledged when the recipient answers. Plugin output is
spoken and sent to Voxira, so exclude secrets and keep it concise.

| Result | Check |
| --- | --- |
| Configuration error | JSON syntax, file permissions, tenant base URL, E.164 number and UUID. |
| HTTP 401/403 | API key, API user status and tenant access policy. |
| HTTP 400 | Number, callflow and generated payload. |
| Script absent in rule UI | Path, executable bit, site user and Checkmk activation. |
| Rule sends no call | Rule conditions, contacts, time period, notification types and notification log. |

Reference: [Checkmk notifications](https://docs.checkmk.com/latest/en/notifications.html).

This integration does not imply endorsement or certification by Checkmk.
