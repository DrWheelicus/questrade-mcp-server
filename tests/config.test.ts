import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "@/config.js";

const KEYS = [
  "QUESTRADE_REFRESH_TOKEN",
  "QUESTRADE_ENVIRONMENT",
  "QUESTRADE_MCP_TRANSPORT",
  "QUESTRADE_MCP_PORT",
  "QUESTRADE_ENCRYPTION_KEY",
] as const;

type EnvKey = (typeof KEYS)[number];

const previous = new Map<EnvKey, string | undefined>(
  KEYS.map((key) => [key, process.env[key]]),
);

function setEnv(values: Partial<Record<EnvKey, string | undefined>>): void {
  for (const key of KEYS) {
    if (!(key in values)) continue;
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("loadConfig", () => {
  afterEach(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("applies defaults when optional env vars are unset", () => {
    setEnv({
      QUESTRADE_REFRESH_TOKEN: "tok",
      QUESTRADE_ENVIRONMENT: undefined,
      QUESTRADE_MCP_TRANSPORT: undefined,
      QUESTRADE_MCP_PORT: undefined,
      QUESTRADE_ENCRYPTION_KEY: undefined,
    });

    const config = loadConfig();

    expect(config.refreshToken).toBe("tok");
    expect(config.environment).toBe("production");
    expect(config.transport).toBe("stdio");
    expect(config.port).toBe(3100);
    expect(config.encryptionKey).toBeUndefined();
  });

  it("treats empty strings as unset and still applies defaults", () => {
    setEnv({
      QUESTRADE_REFRESH_TOKEN: "",
      QUESTRADE_ENVIRONMENT: "",
      QUESTRADE_MCP_TRANSPORT: "",
      QUESTRADE_MCP_PORT: "",
      QUESTRADE_ENCRYPTION_KEY: "",
    });

    const config = loadConfig();

    expect(config.refreshToken).toBeUndefined();
    expect(config.environment).toBe("production");
    expect(config.transport).toBe("stdio");
    expect(config.port).toBe(3100);
    expect(config.encryptionKey).toBeUndefined();
  });

  it("reads explicit environment, transport, port, and encryption key", () => {
    setEnv({
      QUESTRADE_REFRESH_TOKEN: "tok",
      QUESTRADE_ENVIRONMENT: "practice",
      QUESTRADE_MCP_TRANSPORT: "http",
      QUESTRADE_MCP_PORT: "4100",
      QUESTRADE_ENCRYPTION_KEY: "key",
    });

    expect(loadConfig()).toEqual({
      refreshToken: "tok",
      environment: "practice",
      transport: "http",
      port: 4100,
      encryptionKey: "key",
    });
  });

  it("rejects an invalid port", () => {
    setEnv({
      QUESTRADE_REFRESH_TOKEN: "tok",
      QUESTRADE_MCP_PORT: "0",
    });

    expect(() => loadConfig()).toThrow();
  });
});
