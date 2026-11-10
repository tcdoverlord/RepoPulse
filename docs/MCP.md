# RepoPulse MCP Server

RepoPulse MCP exposes the RepoPulse REST API as standardized Model Context Protocol tools over **stdio**. It is designed for local AI clients that launch an MCP server as a child process.

## Requirements

- Node.js 18 or newer (Node 20+ recommended)
- RepoPulse dependencies installed
- RepoPulse REST API running at `http://localhost:8787`

## Install

From the RepoPulse project directory:

```powershell
npm install
```

This installs the MCP TypeScript SDK and Zod alongside the existing project dependencies.

## Run

Start the REST API in one terminal:

```powershell
npm run api:dev
```

Start MCP in a second terminal:

```powershell
npm run mcp:dev
```

The MCP process uses stdin/stdout for the protocol. Its startup diagnostic is written to stderr. It is normal for the MCP terminal not to show a web page or HTTP listening port.

For a non-watch process:

```powershell
npm run mcp:start
```

If your API uses a different address:

```powershell
$env:REPOPULSE_API_URL = "http://localhost:8787"
npm run mcp:start
```

## Tools exposed

| Tool | Purpose |
|---|---|
| `check_repopulse_api` | Check API health |
| `get_repository_summary` | Repository metadata, metrics, and language byte counts |
| `get_repository_contributors` | Compact contributor records |
| `get_repository_releases` | Published releases |
| `get_repository_activity` | Compact recent commit activity |
| `get_repository_languages` | Language byte counts |

Repository tools accept `owner` and `repo`, for example `tcdoverlord` and `LocalAI-Angel`.

## Verify the MCP server

After dependencies are installed and the REST API is running, launch `npm run mcp:dev`. The process should connect without printing protocol data to the console. To verify tool discovery and calls, connect it from an MCP client and ask it to:

1. Check the RepoPulse API health.
2. Get the summary for `tcdoverlord/LocalAI-Angel`.
3. List contributors for that repository.

The server writes diagnostics to stderr because stdout is reserved for MCP JSON-RPC messages.

## Connect a local MCP client

The server uses stdio. An MCP-compatible client launches `server/mcp.ts` through the local `tsx` executable.

Example Claude Desktop configuration using the project path supplied for this setup. If you move the folder, update both absolute paths. A copy is also provided in `docs/claude-desktop-mcp-config.example.json`:

```json
{
  "mcpServers": {
    "repopulse": {
      "command": "node",
      "args": [
        "C:\\PATH\\TO\\RepoPulse\\node_modules\\tsx\\dist\\cli.mjs",
        "C:\\PATH\\TO\\RepoPulse\\server\\mcp.ts"
      ],
      "env": {
        "REPOPULSE_API_URL": "http://localhost:8787"
      }
    }
  }
}
```

For Claude Desktop, this JSON belongs in its `claude_desktop_config.json` under `mcpServers`. Other MCP clients have their own MCP server configuration screens or files. Keep the API process running while using the tools.

## Architecture

```text
AI assistant / MCP host
        |
        | MCP over stdio
        v
RepoPulse MCP server (server/mcp.ts)
        |
        | HTTP GET
        v
RepoPulse REST API (localhost:8787)
        |
        | GitHub REST API
        v
Public GitHub repository data
```

MCP does not call GitHub directly. It reuses the existing RepoPulse API, so the API remains the single data and caching layer.

## Security and limitations

- Read-only tools; no repository writes, issues, pull requests, or account actions.
- Public repository data only; no private repository access.
- No GitHub token is required; unauthenticated GitHub API rate limits still apply.
- Run locally by default. Do not expose the REST API or MCP process to the public internet without authentication, transport security, and deployment hardening.
- Contributor, release, and activity fields are normalized by the MCP layer. The REST API itself remains unchanged.
