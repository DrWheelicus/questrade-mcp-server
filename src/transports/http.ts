import { randomUUID } from "node:crypto";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { logger } from "@/log.js";
import type { ServerContext } from "@/server.js";

export async function startHttp(ctx: ServerContext, port: number): Promise<void> {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.all("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (req.method === "GET" || req.method === "DELETE") {
      const transport = sessionId ? transports.get(sessionId) : undefined;
      if (!transport) {
        res.status(400).json({ error: "Invalid or missing session" });
        return;
      }

      if (req.method === "DELETE") {
        await transport.close();
        transports.delete(sessionId!);
        res.status(204).end();
        return;
      }

      await transport.handleRequest(req, res);
      return;
    }

    // POST — create new session or route to existing
    if (sessionId && transports.has(sessionId)) {
      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res);
      return;
    }

    // New session
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports.set(id, transport);
        logger.info({ sessionId: id }, "HTTP session created");
      },
    });

    transport.onclose = () => {
      const id = [...transports.entries()].find(([, t]) => t === transport)?.[0];
      if (id) {
        transports.delete(id);
        logger.info({ sessionId: id }, "HTTP session closed");
      }
    };

    await ctx.server.connect(transport);
    await transport.handleRequest(req, res);
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", sessions: transports.size });
  });

  const server = app.listen(port, "127.0.0.1", () => {
    logger.info("MCP server running on Streamable HTTP transport at http://127.0.0.1:%d/mcp", port);
  });

  const shutdown = () => {
    logger.info("Shutting down HTTP transport");
    ctx.tokenManager.destroy();
    for (const transport of transports.values()) {
      transport.close().catch(() => {});
    }
    server.close();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
