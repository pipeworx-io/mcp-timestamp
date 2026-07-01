# mcp-timestamp

Unix timestamp MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1173+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `from_timestamp` | Convert a Unix timestamp to an ISO-8601 UTC date + human forms. Auto-detects seconds vs milliseconds by magnitude (override with `unit`). Keyless, offline. |
| `to_timestamp` | Convert an ISO-8601 (or other parseable) date string to a Unix timestamp (seconds + milliseconds). Keyless, offline. |
| `now` | The current UTC time as ISO-8601 and Unix timestamp (seconds + milliseconds). |
| `relative_time` | Humanize a date/time relative to now (or a given `from`): "2 hours ago", "in 3 days". Keyless, offline. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "timestamp": {
      "url": "https://gateway.pipeworx.io/timestamp/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1173+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Timestamp data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
