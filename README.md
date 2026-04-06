# Questrade MCP Server

An [MCP](https://modelcontextprotocol.io/) server for the Questrade trading API. Query your portfolio, look up symbols, get live quotes, pull historical candles, and review orders through any MCP-compatible AI assistant (Claude, ChatGPT, Cursor, etc.).

Designed with **outcome-oriented tools** that serve user intent — each tool orchestrates multiple API calls internally to return complete answers, minimizing agent round-trips and context window usage.

## Features

- **Portfolio overview** — accounts, positions, and balances in a single call
- **Live market quotes** — Level 1 data by ticker name or symbol ID
- **Historical candles** — OHLCV data at any interval from 1-minute to yearly
- **Order history** — filter by state, date range
- **Account activity** — dividends, trades, deposits, and executions timeline
- **Dual transport** — stdio for local clients, Streamable HTTP for remote
- **Encrypted token storage** — AES-256-GCM, never plaintext on disk
- **Auto token refresh** — proactive renewal before expiry, retry on 401

## Prerequisites

- Node.js 22 or later
- A [Questrade](https://www.questrade.com/) account with API access enabled

## Quick Start

### 1. Get a Questrade Refresh Token

1. Log in to the [Questrade API Hub](https://www.questrade.com/api)
2. Register a personal app (or use an existing one)
3. Click **Generate new token for manual authorization**
4. Copy the token — it expires in 7 days if unused

### 2. Add to Your AI Client

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "questrade": {
      "command": "node",
      "args": ["H:/Projects/MCPs/Questrade/dist/index.js"],
      "env": {
        "QUESTRADE_REFRESH_TOKEN": "<your-token>"
      }
    }
  }
}
```

#### Cursor

Settings > MCP Servers > Add:

```json
{
  "mcpServers": {
    "questrade": {
      "command": "node",
      "args": ["H:/Projects/MCPs/Questrade/dist/index.js"],
      "env": {
        "QUESTRADE_REFRESH_TOKEN": "<your-token>"
      }
    }
  }
}
```

#### Claude Code

Add to `.mcp.json` in your project root or `~/.claude/mcp.json` globally:

```json
{
  "mcpServers": {
    "questrade": {
      "command": "node",
      "args": ["H:/Projects/MCPs/Questrade/dist/index.js"],
      "env": {
        "QUESTRADE_REFRESH_TOKEN": "<your-token>"
      }
    }
  }
}
```

#### Remote (Claude.ai / ChatGPT via HTTP)

Start the server in HTTP mode:

```bash
QUESTRADE_REFRESH_TOKEN=<your-token> node dist/index.js --transport=http
```

The server listens on `http://localhost:3100/mcp`. Point your remote MCP client at this URL.

### 3. Verify

Restart your AI client and ask: *"Show me my portfolio"*

## Tools

| Tool | Description |
|------|-------------|
| `getPortfolio` | Full portfolio overview — all accounts with positions and balances |
| `getPositions` | Positions held in a specific account |
| `getBalances` | Cash balances and buying power for an account |
| `lookupSymbol` | Search by ticker/name, returns symbol details with a live quote |
| `getQuotes` | Batch live L1 quotes by ticker names or symbol IDs |
| `getPriceHistory` | Historical OHLCV candle data at any interval |
| `getOrders` | Order history with state and date filters |
| `getAccountActivity` | Combined activities and executions timeline |

## Configuration

All configuration is via environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `QUESTRADE_REFRESH_TOKEN` | Yes (first run) | — | OAuth refresh token from Questrade |
| `QUESTRADE_ENVIRONMENT` | No | `production` | `production` or `practice` |
| `QUESTRADE_MCP_TRANSPORT` | No | `stdio` | `stdio` or `http` |
| `QUESTRADE_MCP_PORT` | No | `3100` | Port for HTTP transport |
| `QUESTRADE_ENCRYPTION_KEY` | No | machine-derived | Override encryption key for token storage |

The `--transport` CLI flag overrides `QUESTRADE_MCP_TRANSPORT`.

## Token Management

Questrade uses **single-use refresh tokens** — each token exchange produces a new pair. The server:

1. Exchanges your initial refresh token on first startup
2. Encrypts and persists both tokens with AES-256-GCM
3. Proactively renews 2 minutes before the 30-minute access token expires
4. Retries once on 401 responses with a fresh token

Token storage locations:

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\questrade-mcp\token.enc` |
| macOS | `~/Library/Application Support/questrade-mcp/token.enc` |
| Linux | `~/.config/questrade-mcp/token.enc` |

After the first run, `QUESTRADE_REFRESH_TOKEN` is only needed if the cached token expires (3–7 days of inactivity).

## Real-Time Data

Questrade requires a paid market data subscription ($19.95+/month) for real-time quotes. Without one, `getQuotes` returns **snap quotes** with a daily limit per exchange. Once the limit is reached, responses contain delayed data. The `isDelayed` field in quote responses always indicates whether the data is real-time or delayed.

## Development

```bash
# Install dependencies
npm install

# Run in development mode (auto-reload)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Docker

Build and run the HTTP transport in a container:

```bash
docker build -t questrade-mcp .
docker run -p 3100:3100 -e QUESTRADE_REFRESH_TOKEN=<your-token> questrade-mcp
```

## CI/CD

- **CI** runs on every push/PR to `main`: type-check, lint, build, test, `npm audit`, dependency review
- **CD** runs on semver tags (`v*.*.*`): builds multi-arch Docker image, pushes to GHCR, creates GitHub Release

## Security

- Tokens are never stored in plaintext — AES-256-GCM encryption at rest
- Refresh tokens are rotated on every use (Questrade enforces this)
- Token values are redacted from all log output
- All Questrade API calls use HTTPS (enforced by Questrade)
- Input validation on all tool parameters via Zod schemas
- Read-only by default — no trading tools are exposed
- HTTP transport uses per-client session isolation
- Docker image runs as non-root user

## License

MIT
