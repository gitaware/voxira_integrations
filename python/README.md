# Voxira Python client

Use the standard-library `VoxiraClient` class to queue immediate or
scheduled Voxira calls from Python, retrieve call status, and list available
outbound callflows.

For Voxira access and support, contact
[contact@voxira.eu](mailto:contact@voxira.eu).

## Requirements

- Python 3.10 or newer.
- A Voxira tenant HTTPS URL, API key, and outbound callflow UUID.
- A running Voxira dispatcher for call execution.

Create or replace the API key from your Voxira profile. You can copy a
callflow UUID from Voxira or call `list_callflows()` after configuration.

## Installation

Copy `voxira_client.py` into your application. It uses only the Python
standard library, so there are no packages to install:

```python
from voxira_client import VoxiraClient, VoxiraAPIError, VoxiraError
```

## Configuration

Keep credentials in environment variables or a secret manager, never in source
control:

```bash
export VOXIRA_URL='https://voxira.example.com'
export VOXIRA_API_KEY='replace-with-your-api-key'
export VOXIRA_CALLFLOW='550e8400-e29b-41d4-a716-446655440000'
```

`VOXIRA_URL` is the tenant base URL without `/api` or a trailing slash.

```python
import os
from voxira_client import VoxiraClient

client = VoxiraClient(
    os.environ["VOXIRA_URL"],
    os.environ["VOXIRA_API_KEY"],
)
```

The client requires HTTPS, verifies TLS certificates, refuses redirects, and
uses a 20-second timeout by default. Pass `timeout=30` to change it.

## Place a call

```python
import os

call_uuid = client.place_call(
    callee="+31612345678",
    callflow=os.environ["VOXIRA_CALLFLOW"],
    parameters={
        "message": "This is a Voxira test call.",
        "alert_text": "This is a Voxira test call.",
        "customer_id": "customer-123",
    },
)
print(f"Queued Voxira call {call_uuid}")
```

The destination must use international E.164 format. Values in `parameters`
are available to the callflow as variables such as `{{message}}` and
`{{customer_id}}`. The client adds `source=python` unless you provide a
different source.

A returned UUID confirms that Voxira saved the call with `pending` status.
It does not mean the destination answered or the callflow completed.

## Schedule a call

Pass a timezone-aware `datetime` value:

```python
from datetime import datetime, timezone
import os

scheduled_uuid = client.place_call(
    "+31612345678",
    os.environ["VOXIRA_CALLFLOW"],
    {"message": "Your appointment starts in one hour."},
    scheduled_at=datetime(2030, 1, 15, 8, 30, tzinfo=timezone.utc),
)
```

Omit `scheduled_at` to make the call available to the dispatcher immediately.

## List callflows and check status

```python
callflows = client.list_callflows()
for callflow in callflows.get("callflows", []):
    print(callflow["name"], callflow["flow_uuid"])

call = client.get_call(call_uuid)
print(call)
```

Typical call states are `pending`, `processing`, `done`, `busy`, and `failed`.

## Error handling

```python
from voxira_client import VoxiraAPIError, VoxiraError

try:
    call_uuid = client.place_call(
        "+31612345678",
        os.environ["VOXIRA_CALLFLOW"],
        {"message": "Service alert"},
    )
except ValueError as error:
    # Invalid local configuration, UUID, phone number, date, or parameters.
    print(error)
except VoxiraAPIError as error:
    # Voxira returned an HTTP error. The status is available separately.
    print(f"Voxira rejected the request ({error.status})")
except VoxiraError:
    # Transport failure, non-JSON response, or unexpected API response.
    print("Voxira request failed; inspect the application and Calls v2 logs")
```

Common HTTP statuses are `400` for invalid call data, `401` for an invalid API
key, `404` for an unknown tenant or call, and `423` when outbound calling is
suspended by high-usage protection.

The client deliberately does not retry. If a create request times out,
Voxira may already have saved it; check Calls v2 before submitting another
call to avoid duplicates.

## Security notes

- Store the API key in a secret manager or protected environment variable.
- Do not log request headers, the API key, or sensitive call parameters.
- Keep TLS verification enabled and use a tenant URL you trust.
- Give each environment its own API key so it can be rotated independently.

This community integration is provided as source code and is not an official
Python Software Foundation package or endorsement.
