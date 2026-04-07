import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMarketTools } from "@/tools/market.js";
import type { QuestradeClient } from "@/client/questrade-client.js";

function createMockClient(): QuestradeClient {
  return {
    searchSymbols: vi.fn().mockResolvedValue({
      symbols: [
        { symbol: "AAPL", symbolId: 8049, description: "Apple Inc.", securityType: "Stock", listingExchange: "NASDAQ", isQuotable: true, isTradable: true, currency: "USD" },
        { symbol: "AAPX", symbolId: 9999, description: "Some other", securityType: "Stock", listingExchange: "NASDAQ", isQuotable: false, isTradable: false, currency: "USD" },
      ],
    }),
    getQuotes: vi.fn().mockResolvedValue({
      quotes: [
        { symbol: "AAPL", symbolId: 8049, tier: "", bidPrice: 149, bidSize: 100, askPrice: 151, askSize: 200, lastTradePriceTrHrs: null, lastTradePrice: 150, lastTradeSize: 50, lastTradeTick: "Up", lastTradeTime: "2025-06-01T10:00:00", volume: 10000, openPrice: 148, highPrice: 152, lowPrice: 147, delay: 0, isHalted: false },
      ],
    }),
    getCandles: vi.fn().mockResolvedValue({
      candles: [
        { start: "2025-01-02T00:00:00", end: "2025-01-02T23:59:59", open: 148, high: 152, low: 147, close: 150, volume: 5000 },
      ],
    }),
  } as unknown as QuestradeClient;
}

describe("Market Tools", () => {
  it("registers all three market tools on the server", () => {
    const server = new McpServer({ name: "test", version: "0.0.1" });
    const mockClient = createMockClient();

    const toolSpy = vi.spyOn(server, "tool");
    registerMarketTools(server, mockClient);

    const registeredNames = toolSpy.mock.calls.map((call) => call[0]);
    expect(registeredNames).toContain("lookupSymbol");
    expect(registeredNames).toContain("getQuotes");
    expect(registeredNames).toContain("getPriceHistory");
  });

  it("lookupSymbol returns symbols with quotes for quotable symbols", async () => {
    const mockClient = createMockClient();

    const { symbols } = await mockClient.searchSymbols("AAPL");
    expect(symbols).toHaveLength(2);

    const quotableIds = symbols.filter((s) => s.isQuotable).map((s) => s.symbolId);
    expect(quotableIds).toEqual([8049]);

    const { quotes } = await mockClient.getQuotes(quotableIds);
    expect(quotes).toHaveLength(1);
    expect(quotes[0]!.symbol).toBe("AAPL");
  });

  it("getQuotes resolves tickers to symbol IDs via search", async () => {
    const mockClient = createMockClient();

    const { symbols } = await mockClient.searchSymbols("AAPL");
    const exact = symbols.find((s) => s.symbol.toUpperCase() === "AAPL");
    expect(exact).toBeDefined();
    expect(exact!.symbolId).toBe(8049);
  });

  it("getQuotes returns formatted quote data", async () => {
    const mockClient = createMockClient();

    const { quotes } = await mockClient.getQuotes([8049]);
    const q = quotes[0]!;

    const formatted = {
      symbol: q.symbol,
      symbolId: q.symbolId,
      lastTradePrice: q.lastTradePrice,
      bidPrice: q.bidPrice,
      askPrice: q.askPrice,
      volume: q.volume,
      isDelayed: q.delay !== 0,
      isHalted: q.isHalted,
    };

    expect(formatted.symbol).toBe("AAPL");
    expect(formatted.isDelayed).toBe(false);
    expect(formatted.isHalted).toBe(false);
  });

  it("getPriceHistory resolves ticker to symbolId before fetching candles", async () => {
    const mockClient = createMockClient();

    const { symbols } = await mockClient.searchSymbols("AAPL");
    const exact = symbols.find((s) => s.symbol.toUpperCase() === "AAPL");
    const resolvedId = exact?.symbolId ?? symbols[0]?.symbolId;
    expect(resolvedId).toBe(8049);

    const { candles } = await mockClient.getCandles(resolvedId!, {
      startTime: "2025-01-01T00:00:00-05:00",
      endTime: "2025-12-31T23:59:59-05:00",
      interval: "OneDay",
    });

    expect(candles).toHaveLength(1);
    expect(candles[0]!.close).toBe(150);
    expect(mockClient.getCandles).toHaveBeenCalledWith(8049, expect.objectContaining({ interval: "OneDay" }));
  });
});
