<img src="../images/logo_no_eu_dark_background.png" alt="Voxira" width="280">

# Voxira notifications for PRTG

Turn PRTG alarms into automated Voxira telephone calls using an **Execute
Program** notification and the supplied PowerShell client.

For Voxira access and support, contact
[contact@voxira.eu](mailto:contact@voxira.eu).

## Requirements

- PRTG Network Monitor with permission to install notification scripts.
- Windows PowerShell 5.1 or PowerShell 7 on every executing core/cluster node.
- Voxira tenant URL, API key, callflow UUID and destination number.

## Installation

1. Copy [voxira-notification.ps1](voxira-notification.ps1) to PRTG's
   `Notifications\EXE` directory.
2. Copy [voxira.json.example](voxira.json.example) beside it as
   `voxira.json` and restrict access to administrators and the PRTG service.
3. Configure:

| JSON key | Description |
| --- | --- |
| `url` | Tenant HTTPS base URL without `/api`. |
| `api_key` | Voxira bearer API key. |
| `callflow` | Default callflow UUID. |
| `to` | Default E.164 destination. |

4. Create an **Execute Program** notification template using PowerShell:

```text
-NoProfile -NonInteractive -ExecutionPolicy RemoteSigned -File "C:\Program Files (x86)\PRTG Network Monitor\Notifications\EXE\voxira-notification.ps1" -Message "[%status] %device, %sensor: %message"
```

## Script options

| Option | Required | Description |
| --- | --- | --- |
| `-Message` | Yes | Spoken text; PRTG placeholders are supported. |
| `-To` | No | Overrides the configured destination. |
| `-ConfigPath` | No | Alternate JSON configuration path. |
| `-DryRun` | No | Prints the generated payload without sending it. |

Copy files to every PRTG cluster node. Test with `-DryRun`, then use PRTG's
notification test, which places a real call. The script follows no redirects
and makes one request; PRTG may retry a nonzero exit, so inspect Calls v2 after
timeouts to prevent duplicates.

This integration does not imply endorsement or certification by Paessler PRTG.
