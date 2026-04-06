import { z } from "zod";

const configSchema = z.object({
  refreshToken: z.string().min(1).optional(),
  environment: z.enum(["production", "practice"]).default("production"),
  transport: z.enum(["stdio", "http"]).default("stdio"),
  port: z.coerce.number().int().min(1).max(65535).default(3100),
  encryptionKey: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    refreshToken: env("QUESTRADE_REFRESH_TOKEN"),
    environment: env("QUESTRADE_ENVIRONMENT"),
    transport: env("QUESTRADE_MCP_TRANSPORT"),
    port: env("QUESTRADE_MCP_PORT"),
    encryptionKey: env("QUESTRADE_ENCRYPTION_KEY"),
  });
}

function env(key: string): string | undefined {
  const value = process.env[key];
  return value === "" ? undefined : value;
}

export function getOAuthBaseUrl(environment: Config["environment"]): string {
  return environment === "practice"
    ? "https://practicelogin.questrade.com"
    : "https://login.questrade.com";
}
