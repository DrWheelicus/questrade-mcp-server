import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QuestradeClient, QuestradeClientError } from "@/client/questrade-client.js";
import type { TokenManager } from "@/auth/token-manager.js";

function createMockTokenManager(overrides?: Partial<TokenManager>): TokenManager {
  return {
    getAccessToken: vi.fn().mockResolvedValue("mock-token"),
    getApiServer: vi.fn().mockReturnValue("https://api01.iq.questrade.com/"),
    refreshCurrent: vi.fn().mockResolvedValue({}),
    initialize: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  } as unknown as TokenManager;
}

describe("QuestradeClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("makes authenticated GET requests", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ accounts: [] }),
    });

    const client = new QuestradeClient(createMockTokenManager());
    const result = await client.getAccounts();

    expect(result).toEqual({ accounts: [] });
    const callHeaders = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.headers;
    expect(callHeaders?.Authorization).toBe("Bearer mock-token");
  });

  it("retries once on 401 after refreshing tokens", async () => {
    const mockTm = createMockTokenManager();

    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: false, status: 401, text: () => Promise.resolve("Unauthorized") })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ accounts: [{ number: "123" }] }) });

    const client = new QuestradeClient(mockTm);
    const result = await client.getAccounts();

    expect(mockTm.refreshCurrent).toHaveBeenCalledOnce();
    expect(result.accounts).toHaveLength(1);
  });

  it("throws QuestradeClientError on non-401 errors", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(JSON.stringify({ code: 1001, message: "Internal error" })),
    });

    const client = new QuestradeClient(createMockTokenManager());
    await expect(client.getAccounts()).rejects.toThrow(QuestradeClientError);
  });

  it("constructs correct URL for symbol search", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ symbols: [] }),
    });

    const client = new QuestradeClient(createMockTokenManager());
    await client.searchSymbols("AAPL");

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(url).toContain("/v1/symbols/search?prefix=AAPL");
  });

  it("constructs correct URL for candles with query params", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ candles: [] }),
    });

    const client = new QuestradeClient(createMockTokenManager());
    await client.getCandles(12345, {
      startTime: "2025-01-01T00:00:00-05:00",
      endTime: "2025-12-31T23:59:59-05:00",
      interval: "OneDay",
    });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(url).toContain("/v1/markets/candles/12345?");
    expect(url).toContain("interval=OneDay");
  });

  it("builds correct URL for quotes with multiple IDs", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ quotes: [] }),
    });

    const client = new QuestradeClient(createMockTokenManager());
    await client.getQuotes([111, 222, 333]);

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(url).toContain("ids=111,222,333");
  });
});
