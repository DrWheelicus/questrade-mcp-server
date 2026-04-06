import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { log } from "../log.js";
import type { ServerContext } from "../server.js";

export async function startStdio(ctx: ServerContext): Promise<void> {
  const transport = new StdioServerTransport();

  process.on("SIGINT", () => {
    log("info", "SIGINT received, shutting down stdio transport");
    ctx.tokenManager.destroy();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    log("info", "SIGTERM received, shutting down stdio transport");
    ctx.tokenManager.destroy();
    process.exit(0);
  });

  await ctx.server.connect(transport);
  log("info", "MCP server running on stdio transport");
}
