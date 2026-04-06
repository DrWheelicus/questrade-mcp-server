import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { QuestradeClient, QuestradeClientError } from "./client/questrade-client.js";
import { TokenManager } from "./auth/token-manager.js";
import { registerPortfolioTools } from "./tools/portfolio.js";
import { registerMarketTools } from "./tools/market.js";
import { registerOrderTools } from "./tools/orders.js";
import { logger } from "./log.js";
import type { Config } from "./config.js";

export interface ServerContext {
  server: McpServer;
  tokenManager: TokenManager;
}

export async function createServer(config: Config): Promise<ServerContext> {
  const tokenManager = new TokenManager(config);
  await tokenManager.initialize();

  const client = new QuestradeClient(tokenManager);

  const server = new McpServer(
    {
      name: "questrade-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  wrapToolErrorHandling(server);

  registerPortfolioTools(server, client);
  registerMarketTools(server, client);
  registerOrderTools(server, client);

  logger.info("MCP server created with all tools registered");

  return { server, tokenManager };
}

/**
 * Patches server.tool so every handler is automatically wrapped with
 * structured error responses instead of throwing through the MCP layer.
 */
function wrapToolErrorHandling(server: McpServer): void {
  const original = server.tool.bind(server);

  // The SDK has multiple overloads; the handler is always the last argument
  server.tool = ((...args: unknown[]) => {
    const lastIdx = args.length - 1;
    const handler = args[lastIdx];
    if (typeof handler === "function") {
      args[lastIdx] = async (...handlerArgs: unknown[]) => {
        try {
          return await (handler as (...a: unknown[]) => Promise<unknown>)(...handlerArgs);
        } catch (err) {
          const message = formatError(err);
          logger.error({ error: message }, "Tool error");
          return {
            content: [{ type: "text" as const, text: message }],
            isError: true,
          };
        }
      };
    }
    return (original as (...a: unknown[]) => unknown)(...args);
  }) as typeof server.tool;
}

function formatError(err: unknown): string {
  if (err instanceof QuestradeClientError) {
    if (err.statusCode === 401) {
      return "Authentication failed. Your Questrade refresh token may have expired. Generate a new one at https://www.questrade.com/api and set QUESTRADE_REFRESH_TOKEN.";
    }
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
