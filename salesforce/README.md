<img src="../images/logo_no_eu_dark_background.png" alt="Voxira" width="280">

# Voxira action for Salesforce Flow

Deploy an invocable Apex action that lets Salesforce Flow queue spoken
Voxira telephone calls.

For Voxira access and support, contact
[contact@voxira.eu](mailto:contact@voxira.eu).

## Installation

1. Deploy `force-app` with Salesforce CLI or your normal metadata pipeline.
2. Create an **External Credential** for the Voxira bearer token.
3. Create a Named Credential with API name exactly `Voxira`:

| Setting | Value |
| --- | --- |
| URL | Tenant HTTPS base URL without `/api` |
| Authentication header | `Authorization: Bearer <Voxira API key>` |

4. Grant users access to the External Credential principal and
   `VoxiraCallAction` Apex class through permission sets.
5. In Flow Builder, add the Apex action **Place a Voxira call**.

## Configurable Flow fields

| Name | Required | Description |
| --- | --- | --- |
| `callee` | Yes | One international E.164 number. |
| `callflow` | Yes | Voxira callflow UUID. |
| `message` | Yes | Spoken message assembled from Flow resources. |
| `callUuid` | Output | UUID of the queued Voxira call. |

For record-triggered Flows, place the action on an asynchronous path because it
performs a callout. Use decision elements to restrict which status changes
produce calls. The action sends one request with a 20-second timeout and does
not retry. Check Calls v2 before rerunning an ambiguous failed Flow interview.

The integration uses Salesforce's current Named Credential model; no API key is
stored in Apex. See [Named Credentials](https://developer.salesforce.com/docs/platform/named-credentials/guide/get-started.html).

This integration does not imply endorsement or certification by Salesforce.
