import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TokenManager } from "@/auth/token-manager.js";
import type { Config } from "@/config.js";

vi.mock("@/auth/encrypted-store.js", () => ({
  EncryptedStore: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  })),
}));

const MOCK_TOKEN_RESPONSE = {
  access_token: "mock-access-token",
  api_server: "https://api01.iq.questrade.com/",
  expires_in: 1800,
  refresh_token: "mock-new-refresh-token",
  token_type: "Bearer",
};

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    refreshToken: "test-refresh-token",
    environment: "production",
    transport: "stdio",
    port: 3100,
    encryptionKey: "test-key",
    ...overrides,
  };
}

function mockFetchOk(response = MOCK_TOKEN_RESPONSE) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...response }),
    }),
  );
}

describe("TokenManager", () => {
  beforeEach(() => {
    mockFetchOk();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("initializes by exchanging the refresh token", async () => {
    const tm = new TokenManager(makeConfig());
    await tm.initialize();

    expect(fetch).toHaveBeenCalledOnce();
    expect(await tm.getAccessToken()).toBe("mock-access-token");
    expect(tm.getApiServer()).toBe("https://api01.iq.questrade.com/");

    tm.destroy();
  });

  it("throws if no refresh token is available", async () => {
    const tm = new TokenManager(makeConfig({ refreshToken: undefined }));
    await expect(tm.initialize()).rejects.toThrow("No refresh token available");
    tm.destroy();
  });

  it("uses the correct OAuth URL for production", async () => {
    const tm = new TokenManager(makeConfig({ environment: "production" }));
    await tm.initialize();

    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const url = calls[0]![0] as string;
    expect(url).toContain("login.questrade.com");
    expect(url).not.toContain("practicelogin");

    tm.destroy();
  });

  it("uses the correct OAuth URL for practice", async () => {
    const tm = new TokenManager(makeConfig({ environment: "practice" }));
    await tm.initialize();

    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
    const url = calls[0]![0] as string;
    expect(url).toContain("practicelogin.questrade.com");

    tm.destroy();
  });

  it("deduplicates concurrent refresh calls", async () => {
    const tm = new TokenManager(makeConfig());
    await tm.initialize();

    // Reset call count after initialize
    (fetch as ReturnType<typeof vi.fn>).mockClear();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ...MOCK_TOKEN_RESPONSE,
          access_token: "refreshed-token",
          refresh_token: "refreshed-refresh",
        }),
    });

    const [r1, r2] = await Promise.all([
      tm.refreshCurrent(),
      tm.refreshCurrent(),
    ]);

    expect(r1.accessToken).toBe("refreshed-token");
    expect(r2.accessToken).toBe("refreshed-token");
    // Should only call fetch once despite two concurrent refreshCurrent calls
    expect(fetch).toHaveBeenCalledTimes(1);

    tm.destroy();
  });

  it("throws on failed token refresh", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad Request"),
      }),
    );

    const tm = new TokenManager(makeConfig());
    await expect(tm.initialize()).rejects.toThrow("Token refresh failed (400)");
    tm.destroy();
  });
});
