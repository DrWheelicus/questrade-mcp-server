# Questrade MCP Server

An [MCP](https://modelcontextprotocol.io/) server for the Questrade trading API.
Use it from MCP-compatible clients (Claude, ChatGPT, Cursor, and others) to inspect
portfolio data, quotes, market history, orders, and account activity.

This server is designed around outcome-oriented tools: each tool performs the
necessary Questrade API orchestration internally so agents can get complete results
with fewer round-trips.

## Table of Contents

- [Quick Start](#quick-start)
- [MCP Features](#mcp-features)
- [Tools](#tools)
- [Configuration](#configuration)
- [Token Management](#token-management)
- [Real-Time Data Notes](#real-time-data-notes)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Docker](#docker)
- [CI/CD](#cicd)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

### Prerequisites

- Node.js 22+
- A [Questrade](https://www.questrade.com/) account with API access enabled

### 1) Clone, Install, Build

```bash
git clone <your-repo-url>
cd Questrade
npm install
npm run build
```

### 2) Get a Questrade Refresh Token

1. Open the [Questrade API Hub](https://www.questrade.com/api)
2. Register a personal app (or reuse an existing one)
3. Select **Generate new token for manual authorization**
4. Copy the refresh token

### 3) Add Server to Your MCP Client

Use a config like this (replace with your local absolute path):

```json
{
  "mcpServers": {
    "questrade": {
      "command": "node",
      "args": ["/absolute/path/to/Questrade/dist/index.js"],
      "env": {
        "QUESTRADE_REFRESH_TOKEN": "<your-token>"
      }
    }
  }
}
```

Common locations:

- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- Claude Code: project `.mcp.json` or `~/.claude/mcp.json`
- Cursor: Settings -> MCP Servers

### 4) Verify

Restart your MCP client and ask:

> Show me my portfolio

## MCP Features

- **Tools**: purpose-built portfolio and market data operations
- **Transport support**: `stdio` for local clients, Streamable HTTP for remote clients
- **Validation**: tool inputs validated with Zod schemas
- **Token lifecycle management**: encrypted persistence and automatic refresh

This server currently exposes MCP **tools** (not prompts/resources).

## Tools

| Tool | Description |
| ---- | ----------- |
| `getPortfolio` | Full portfolio overview across accounts with positions and balances |
| `getPositions` | Positions held in a specific account |
| `getBalances` | Cash balances and buying power for an account |
| `lookupSymbol` | Search by ticker/name and return symbol details plus live quote |
| `getQuotes` | Batch Level 1 quotes by ticker names or symbol IDs |
| `getPriceHistory` | Historical OHLCV candles at intervals from 1 minute to yearly |
| `getOrders` | Order history with state and date filters |
| `getAccountActivity` | Combined activities and executions timeline |

## Configuration

All runtime configuration is environment-driven:

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `QUESTRADE_REFRESH_TOKEN` | Yes (first run) | - | OAuth refresh token from Questrade |
| `QUESTRADE_ENVIRONMENT` | No | `production` | `production` or `practice` |
| `QUESTRADE_MCP_TRANSPORT` | No | `stdio` | `stdio` or `http` |
| `QUESTRADE_MCP_PORT` | No | `3100` | Port for HTTP transport |
| `QUESTRADE_ENCRYPTION_KEY` | No | machine-derived | Override encryption key for token storage |
| `LOG_LEVEL` | No | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` |

The CLI flag `--transport` overrides `QUESTRADE_MCP_TRANSPORT`.

### HTTP Mode (Remote Clients)

```bash
QUESTRADE_REFRESH_TOKEN=<your-token> node dist/index.js --transport=http
```

Server endpoint:

- `http://localhost:3100/mcp`

## Token Management

Questrade uses single-use refresh tokens. This server:

1. Exchanges the initial refresh token on first startup
2. Encrypts and stores token material with AES-256-GCM
3. Renews access proactively before expiry
4. Retries once on `401` responses after refreshing

Token storage paths:

| Platform | Path |
| -------- | ---- |
| Windows | `%APPDATA%\questrade-mcp\token.enc` |
| macOS | `~/Library/Application Support/questrade-mcp/token.enc` |
| Linux | `~/.config/questrade-mcp/token.enc` |

After first successful startup, `QUESTRADE_REFRESH_TOKEN` is only needed again if the cached token expires.

## Real-Time Data Notes

Questrade requires a paid market data subscription for real-time quotes.
Without one, `getQuotes` returns snap quotes with daily exchange limits and may
fall back to delayed data. Use `isDelayed` in quote responses to detect this.

## Development Setup

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Project Structure

```text
.
├── src/
│   ├── index.ts                # Server entrypoint and transport selection
│   ├── server.ts               # MCP server and tool registration
│   ├── config.ts               # Env/config parsing
│   ├── log.ts                  # Logger setup
│   ├── auth/                   # Token persistence and refresh
│   ├── client/                 # Questrade API client and rate limiting
│   ├── tools/                  # MCP tool implementations
│   ├── transports/             # stdio and HTTP transport handlers
│   └── types/                  # Shared API/domain types
├── tests/                      # Unit/integration tests
├── .github/workflows/          # CI/CD workflows
└── Dockerfile
```

## Docker

Build and run HTTP transport:

```bash
docker build -t questrade-mcp .
docker run -p 3100:3100 -e QUESTRADE_REFRESH_TOKEN=<your-token> questrade-mcp
```

## CI/CD

- **CI** on push/PR to `main`: type check, lint, build, tests, `npm audit`, dependency review
- **CD** on tags matching `v*.*.*`: multi-arch Docker image to GHCR and GitHub Release

## Security

- Token material encrypted at rest (AES-256-GCM)
- Refresh tokens rotated by design (Questrade behavior)
- Token values redacted from logs
- Read-only server scope (no trade placement tools)
- Input validation on all tool parameters (Zod)
- HTTP transport uses per-client session isolation
- Docker image runs as non-root user

## Contributing

Issues and pull requests are welcome. Please include clear reproduction steps for bugs and tests for behavioral changes.

## License

Proprietary - All Rights Reserved.

No permission is granted to copy, modify, redistribute, sublicense, or use this
code except with explicit written permission from the copyright holder.
