/** Logs to stderr so stdio transport JSON on stdout is never polluted. */
export function log(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...meta,
  };
  process.stderr.write(JSON.stringify(entry) + "\n");
}
