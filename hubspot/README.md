<img src="../images/logo_no_eu_dark_background.png" alt="Voxira" width="280">

# Voxira integration for HubSpot workflows

Use a HubSpot custom-code workflow action to queue a Voxira phone call from
contact, company, deal, ticket or other workflow data.

For Voxira access and support, contact
[contact@voxira.eu](mailto:contact@voxira.eu).

## Requirements

- A HubSpot subscription that supports workflow custom-code actions.
- A Voxira tenant URL, API key and callflow UUID.
- A workflow property containing an international phone number.

## Installation

1. Add a **Custom code** action to a HubSpot workflow and choose Node.js.
2. Paste [custom-code-action.js](custom-code-action.js) into the editor.
3. Configure secrets:

| Secret | Required | Description |
| --- | --- | --- |
| `VOXIRA_URL` | Yes | Tenant HTTPS base URL without `/api`. |
| `VOXIRA_API_KEY` | Yes | Voxira bearer API key. |
| `VOXIRA_CALLFLOW` | No | Default callflow UUID when the input does not supply one. |

The corresponding `VOICECAST_*` secret names remain accepted during migration.

4. Define string input fields and map CRM properties or fixed values:

| Input | Required | Description |
| --- | --- | --- |
| `callee` | Yes | One E.164 number. Normalize HubSpot phone data before this action. |
| `message` | Yes | Spoken message assembled from workflow properties. |
| `callflow` | Conditional | Required unless `VOXIRA_CALLFLOW` is configured. |

5. Define a string output named `call_uuid`.
6. Test on a controlled record; the test places a real call.

The code uses HubSpot's provided `axios` library, a 20-second timeout and no
redirects. It performs one request and sanitizes errors. Do not configure
automatic action retries unless duplicate calls are acceptable. Success means
the call is queued; it does not prove that the recipient answered.

This integration does not imply endorsement or certification by HubSpot.
