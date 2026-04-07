import pino from "pino";

const pretty = !!process.env["LOG_PRETTY"];

/** Writes to stderr so stdio transport JSON on stdout is never polluted. */
export const logger = pino({
  name: "questrade-mcp-server",
  level: process.env["LOG_LEVEL"] ?? "info",
  ...(pretty
    ? { transport: { target: "pino-pretty", options: { destination: 2 } } }
    : {}),
}, pretty ? undefined : pino.destination({ dest: 2, sync: true }));
