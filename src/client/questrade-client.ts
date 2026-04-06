import type { TokenManager } from "@/auth/token-manager.js";
import { RateLimiter } from "@/client/rate-limiter.js";
import { logger } from "@/log.js";
import type {
  AccountsResponse,
  ActivitiesResponse,
  BalancesResponse,
  CandleInterval,
  CandlesResponse,
  ExecutionsResponse,
  OrdersResponse,
  PositionsResponse,
  QuestradeErrorResponse,
  QuotesResponse,
  SymbolSearchResponse,
  SymbolsResponse,
} from "@/types/questrade.js";

export class QuestradeClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly questradeCode?: number,
  ) {
    super(message);
    this.name = "QuestradeClientError";
  }
}

export class QuestradeClient {
  private readonly limiter = new RateLimiter();

  constructor(private readonly tokenManager: TokenManager) {}

  // ── Account endpoints ──

  async getAccounts(): Promise<AccountsResponse> {
    return this.get<AccountsResponse>("/v1/accounts");
  }

  async getPositions(accountId: string): Promise<PositionsResponse> {
    return this.get<PositionsResponse>(`/v1/accounts/${accountId}/positions`);
  }

  async getBalances(accountId: string): Promise<BalancesResponse> {
    return this.get<BalancesResponse>(`/v1/accounts/${accountId}/balances`);
  }

  async getOrders(accountId: string, params?: { startTime?: string; endTime?: string; stateFilter?: string }): Promise<OrdersResponse> {
    const qs = buildQuery(params);
    return this.get<OrdersResponse>(`/v1/accounts/${accountId}/orders${qs}`);
  }

  async getActivities(accountId: string, startTime: string, endTime: string): Promise<ActivitiesResponse> {
    const qs = buildQuery({ startTime, endTime });
    return this.get<ActivitiesResponse>(`/v1/accounts/${accountId}/activities${qs}`);
  }

  async getExecutions(accountId: string, startTime: string, endTime: string): Promise<ExecutionsResponse> {
    const qs = buildQuery({ startTime, endTime });
    return this.get<ExecutionsResponse>(`/v1/accounts/${accountId}/executions${qs}`);
  }

  // ── Market data endpoints ──

  async searchSymbols(prefix: string): Promise<SymbolSearchResponse> {
    return this.get<SymbolSearchResponse>(`/v1/symbols/search?prefix=${encodeURIComponent(prefix)}`);
  }

  async getSymbols(ids: number[]): Promise<SymbolsResponse> {
    return this.get<SymbolsResponse>(`/v1/symbols?ids=${ids.join(",")}`);
  }

  async getQuotes(ids: number[]): Promise<QuotesResponse> {
    return this.get<QuotesResponse>(`/v1/markets/quotes?ids=${ids.join(",")}`);
  }

  async getCandles(symbolId: number, params: { startTime: string; endTime: string; interval: CandleInterval }): Promise<CandlesResponse> {
    const qs = buildQuery(params);
    return this.get<CandlesResponse>(`/v1/markets/candles/${symbolId}${qs}`);
  }

  // ── HTTP layer ──

  private async get<T>(path: string, retried = false): Promise<T> {
    await this.limiter.acquire();

    const baseUrl = this.tokenManager.getApiServer();
    const token = await this.tokenManager.getAccessToken();
    const url = `${baseUrl}v1${path.startsWith("/v1") ? path.slice(3) : path}`;

    logger.info({ path }, "GET %s", path);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 && !retried) {
      logger.warn("Received 401, refreshing token and retrying");
      await this.tokenManager.refreshCurrent();
      return this.get<T>(path, true);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      let questradeCode: number | undefined;
      let message = `Questrade API error (${response.status}): ${body}`;

      try {
        const parsed = JSON.parse(body) as QuestradeErrorResponse;
        questradeCode = parsed.code;
        message = `Questrade API error ${parsed.code}: ${parsed.message}`;
      } catch {
        // Use raw body as message
      }

      throw new QuestradeClientError(message, response.status, questradeCode);
    }

    return (await response.json()) as T;
  }
}

function buildQuery(params?: Record<string, string | undefined>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries).toString();
}
