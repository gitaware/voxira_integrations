<img src="../images/logo_no_eu_dark_background.png" alt="Voxira" width="280">

# Voxira integration for monday workflows

Add a **Place a Voxira call** action to monday workflows. Users can combine
it with status, assignment, deadline and other monday triggers.

For Voxira access and support, contact
[contact@voxira.eu](mailto:contact@voxira.eu).

## Requirements

- A monday developer app and permission to add workflow automation blocks.
- Node.js 18 or newer, or a container runtime.
- A public HTTPS URL for this action service.
- Voxira tenant credentials and approved tenant hostnames.

## Installation: deploy the runtime

Run `npm start` or build [Dockerfile](Dockerfile). Configure:

| Environment variable | Required | Description |
| --- | --- | --- |
| `MONDAY_SIGNING_SECRET` | Yes | App Signing Secret from Developer Center. |
| `MONDAY_ACTION_URL` | Yes | Exact public URL ending in `/action/run`; used for JWT audience validation. |
| `VOXIRA_ALLOWED_HOSTS` | Yes | Comma-separated exact tenant hostnames allowed to receive API keys. |
| `PORT` | No | Listen port; defaults to `3000`. |

`VOICECAST_ALLOWED_HOSTS` remains a temporary fallback for existing deployments;
new and updated deployments should use `VOXIRA_ALLOWED_HOSTS`.

`GET /health` returns service health. Terminate TLS at a trusted reverse proxy
and do not expose the service over plain public HTTP.

## Configuration in monday

1. Add an **API Token Credentials** feature for the Voxira API key.
2. Add an Action automation block named **Place a Voxira call**.
3. Attach the credential with key `voxira`.
4. Create required inputs:

| Key | Type | Value |
| --- | --- | --- |
| `voxira_url` | Text | Tenant HTTPS base URL. |
| `callee` | Text or Phone | E.164 destination. |
| `callflow` | Text | Voxira callflow UUID. |
| `message` | Long text | Spoken text; monday mappings are supported. |

5. Add text output `call_uuid`, set Run URL to `/action/run`, and deploy.

The runtime verifies monday's HS256 JWT signature, expiry and audience. It
restricts credential forwarding to `VOXIRA_ALLOWED_HOSTS`, follows no
redirects and makes one API request. Run offline tests with `npm test`.

Reference: [monday workflow actions](https://developer.monday.com/apps/docs/workflows-actions).

This integration does not imply endorsement or certification by monday.com.
