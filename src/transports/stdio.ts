import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "@/log.js";
import type { ServerContext } from "@/server.js";

export async function startStdio(ctx: ServerContext): Promise<void> {
  const transport = new StdioServerTransport();

  process.on("SIGINT", () => {
    logger.info("SIGINT received, shutting down stdio transport");
    ctx.tokenManager.destroy();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down stdio transport");
    ctx.tokenManager.destroy();
    process.exit(0);
  });

  await ctx.server.connect(transport);
  logger.info("MCP server running on stdio transport");
}
