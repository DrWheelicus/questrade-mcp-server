#!/usr/bin/env node

import "dotenv/config";
import { parseArgs } from "node:util";
import { loadConfig } from "@/config.js";
import { createServer } from "@/server.js";
import { startStdio } from "@/transports/stdio.js";
import { startHttp } from "@/transports/http.js";
import { logger } from "@/log.js";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      transport: { type: "string", short: "t" },
    },
    strict: false,
  });

  const config = loadConfig();
  const transport = (values.transport as string | undefined) ?? config.transport;

  logger.info("Starting questrade-mcp-server (transport=%s)", transport);

  const ctx = await createServer(config);

  switch (transport) {
    case "stdio":
      await startStdio(ctx);
      break;
    case "http":
      await startHttp(ctx, config.port);
      break;
    default:
      throw new Error(`Unknown transport: ${transport}. Use "stdio" or "http".`);
  }
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
