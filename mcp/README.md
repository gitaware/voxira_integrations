# Voxira Model Context Protocol integration

Connect MCP-compatible assistants and automation agents to tenant-scoped
Voxira callflow and call tools over STDIO or authenticated Streamable HTTP.

For Voxira access and support, contact
[contact@voxira.eu](mailto:contact@voxira.eu).

## Requirements

- Voxira 1.19.0 or newer with the MCP integration enabled.
- For HTTP: a Voxira API key, tenant URL, writable MCP session directory,
  and an explicit allowed-host configuration.
- For STDIO: local command access to the Voxira application and one tenant
  hostname or UUID.

## Available tools

The read-only tools list and inspect callflows, return the versioned callflow
schema, validate proposed flow data, and retrieve call status. Two write tools
are opt-in: one creates an isolated callflow draft for review, and one queues a
real outbound telephone call.

The server never exposes generic chat, shell, filesystem, SQL, or OpenAI tools.
It does not call the Voxira AI assistant or consume the server-side OpenAI
project's tokens.

## HTTP installation and configuration

Ask the Voxira administrator to enable the MCP HTTP endpoint for your tenant
and provide an API key. Connect the MCP client to:

Connect the MCP client to:

```text
https://customer.example.com/mcp
Authorization: Bearer <Voxira API key>
```

The API key must belong to an enabled user in the hostname-selected tenant.
Voxira also applies the tenant API IP allowlist and rate limit. Leave browser
origins empty unless a trusted browser-based MCP client needs them; wildcard
origins are rejected.

## STDIO installation and configuration

Ask the Voxira administrator for a tenant-bound MCP command. A typical client
configuration looks like this:

```json
{
  "mcpServers": {
    "voxira": {
      "command": "php",
      "args": ["/absolute/path/to/voxira/bin/mcp-server.php"]
    }
  }
}
```

The administrator binds this command to one enabled tenant and can associate it
with an enabled Voxira user for audit logging.

## Enabling writes

Keep the default read-only configuration until the client and its confirmation
policy have been tested. The Voxira administrator can then enable draft
creation and real calls separately.

Disabled write tools are omitted from MCP tool discovery. The call tool is
non-idempotent: retrying the same request can queue another telephone call.
