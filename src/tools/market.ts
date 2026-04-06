import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QuestradeClient } from "@/client/questrade-client.js";
import type { CandleInterval } from "@/types/questrade.js";

const candleIntervals: [CandleInterval, ...CandleInterval[]] = [
  "OneMinute", "TwoMinutes", "ThreeMinutes", "FourMinutes", "FiveMinutes",
  "TenMinutes", "FifteenMinutes", "TwentyMinutes", "HalfHour",
  "OneHour", "TwoHours", "FourHours",
  "OneDay", "OneWeek", "OneMonth", "OneYear",
];

export function registerMarketTools(server: McpServer, client: QuestradeClient): void {
  server.tool(
    "lookupSymbol",
    "Search for a stock/ETF by ticker or name and return symbol details with a live quote",
    {
      query: z.string().describe("Ticker symbol or partial name to search (e.g., 'AAPL', 'Apple')"),
    },
    async ({ query }) => {
      const { symbols } = await client.searchSymbols(query);

      if (symbols.length === 0) {
        return {
          content: [{ type: "text" as const, text: `No symbols found matching "${query}"` }],
        };
      }

      const quotableIds = symbols.filter((s) => s.isQuotable).map((s) => s.symbolId);
      let quotes: Record<number, unknown> = {};

      if (quotableIds.length > 0) {
        const { quotes: quoteList } = await client.getQuotes(quotableIds);
        quotes = Object.fromEntries(quoteList.map((q) => [q.symbolId, q]));
      }

      const results = symbols.map((sym) => ({
        ...sym,
        quote: quotes[sym.symbolId] ?? null,
      }));

      return {
        content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
      };
    },
  );

  server.tool(
    "getQuotes",
    "Get live Level 1 market quotes for one or more symbols. Accepts ticker names (resolved automatically) or Questrade symbol IDs.",
    {
      tickers: z
        .array(z.string())
        .optional()
        .describe("Ticker symbols to quote (e.g., ['AAPL', 'MSFT']). Resolved to IDs automatically."),
      symbolIds: z
        .array(z.number())
        .optional()
        .describe("Questrade internal symbol IDs if already known"),
    },
    async ({ tickers, symbolIds }) => {
      const ids: number[] = [...(symbolIds ?? [])];

      if (tickers && tickers.length > 0) {
        const resolved = await Promise.all(
          tickers.map(async (t) => {
            const { symbols } = await client.searchSymbols(t);
            const exact = symbols.find((s) => s.symbol.toUpperCase() === t.toUpperCase());
            return exact?.symbolId ?? symbols[0]?.symbolId;
          }),
        );
        ids.push(...resolved.filter((id): id is number => id !== undefined));
      }

      if (ids.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No valid symbols found to quote" }],
          isError: true,
        };
      }

      const { quotes } = await client.getQuotes(ids);

      const formatted = quotes.map((q) => ({
        symbol: q.symbol,
        symbolId: q.symbolId,
        lastTradePrice: q.lastTradePrice,
        bidPrice: q.bidPrice,
        askPrice: q.askPrice,
        volume: q.volume,
        openPrice: q.openPrice,
        highPrice: q.highPrice,
        lowPrice: q.lowPrice,
        isDelayed: q.delay !== 0,
        isHalted: q.isHalted,
        lastTradeTime: q.lastTradeTime,
      }));

      return {
        content: [{ type: "text" as const, text: JSON.stringify(formatted, null, 2) }],
      };
    },
  );

  server.tool(
    "getPriceHistory",
    "Get historical OHLCV candlestick data for a symbol. Returns up to 2000 candles per request.",
    {
      ticker: z.string().optional().describe("Ticker symbol (e.g., 'AAPL'). Either ticker or symbolId is required."),
      symbolId: z.number().optional().describe("Questrade internal symbol ID. Either ticker or symbolId is required."),
      startTime: z.string().describe("Start of range in ISO 8601 format (e.g., '2025-01-01T00:00:00-05:00')"),
      endTime: z.string().describe("End of range in ISO 8601 format (e.g., '2025-12-31T23:59:59-05:00')"),
      interval: z.enum(candleIntervals).default("OneDay").describe("Candle interval (default: OneDay)"),
    },
    async ({ ticker, symbolId, startTime, endTime, interval }) => {
      let resolvedId = symbolId;

      if (!resolvedId && ticker) {
        const { symbols } = await client.searchSymbols(ticker);
        const exact = symbols.find((s) => s.symbol.toUpperCase() === ticker.toUpperCase());
        resolvedId = exact?.symbolId ?? symbols[0]?.symbolId;
      }

      if (!resolvedId) {
        return {
          content: [{ type: "text" as const, text: "Could not resolve symbol. Provide a valid ticker or symbolId." }],
          isError: true,
        };
      }

      const { candles } = await client.getCandles(resolvedId, { startTime, endTime, interval });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ symbolId: resolvedId, ticker, interval, count: candles.length, candles }, null, 2),
        }],
      };
    },
  );
}
