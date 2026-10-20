<img src="../images/logo_no_eu_dark_background.png" alt="Voxira" width="280">

# Voxira integration for Windmill

Use a native TypeScript script to place Voxira calls from Windmill scripts,
schedules, webhooks, Flows and Apps.

For Voxira access and support, contact
[contact@voxira.eu](mailto:contact@voxira.eu).

## Installation

1. Add a resource type named `voxira` and paste
   [voxira.resource-type.json](voxira.resource-type.json) as its schema.
2. Create a Windmill **secret Variable** containing the API key.
3. Create a Voxira Resource and reference the secret as `$var:<path>`.
4. Create a native TypeScript/Bun script from
   [place_voxira_call.ts](place_voxira_call.ts).
5. Associate its `voxira` argument with the resource type and deploy.

Using `$var:` keeps the API key itself out of Windmill resource version history.

## Resource fields

| Field | Required | Description |
| --- | --- | --- |
| `url` | Yes | Tenant HTTPS base URL without `/api`. |
| `api_key` | Yes | Prefer a Windmill secret Variable reference. |
| `default_callflow` | No | Default callflow UUID. |

## Script parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `voxira` | Yes | Voxira Resource selected in Windmill. |
| `callee` | Yes | One E.164 number. |
| `message` | Yes | Spoken text. |
| `callflow` | Conditional | Overrides the resource default; required if no default exists. |

The result contains `call_uuid` for later Flow steps. The script follows no
redirects, has a 20-second timeout and makes one request. Check Calls v2 before
rerunning after a timeout. Run offline tests with:

```bash
node --experimental-strip-types test.mjs
```

This integration does not imply endorsement or certification by Windmill.
