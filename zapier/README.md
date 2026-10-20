<img src="../images/logo_no_eu_dark_background.png" alt="Voxira" width="280">

# Voxira integration for Zapier

Add a **Place Voxira Call** action to Zaps. Map data from any Zap trigger into
the destination number, callflow and spoken message.

For Voxira access and support, contact
[contact@voxira.eu](mailto:contact@voxira.eu).

## Requirements

- Node.js 18 or newer and the Zapier Platform CLI.
- Access to create a private Zapier integration.
- A Voxira tenant URL, API key and callflow UUID.

## Installation

```bash
npm install
zapier validate
zapier test
zapier push
```

## Voxira connection configuration

| Field | Description |
| --- | --- |
| `baseUrl` | Tenant HTTPS base URL without `/api`. |
| `apiKey` | Voxira bearer API key stored as a password field. |

The authentication test calls `/api/me`, so the API user must remain enabled.

## Place Voxira Call action

| Input | Required | Description |
| --- | --- | --- |
| `callee` | Yes | One E.164 number. |
| `callflow` | Yes | Voxira callflow UUID. |
| `message` | Yes | Spoken message mapped from earlier Zap steps. |

The action returns `call_uuid`, supplies a UTC queue time and follows no
redirects. It makes one request. Zapier retries can create duplicates when a
response is lost after Voxira saves the call, so inspect Calls v2 before
replaying a failed task.

This integration does not imply endorsement or certification by Zapier.
