import { getOAuthBaseUrl, type Config } from "../config.js";
import { EncryptedStore } from "./encrypted-store.js";
import { log } from "../log.js";
import type { PersistedTokens, TokenResponse } from "../types/questrade.js";

const REFRESH_BUFFER_MS = 2 * 60 * 1000; // Renew 2 min before expiry

export class TokenManager {
  private tokens: PersistedTokens | null = null;
  private renewalTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshPromise: Promise<PersistedTokens> | null = null;
  private readonly store: EncryptedStore;
  private readonly oauthBaseUrl: string;

  constructor(private readonly config: Config) {
    this.store = new EncryptedStore(config.encryptionKey);
    this.oauthBaseUrl = getOAuthBaseUrl(config.environment);
  }

  async initialize(): Promise<void> {
    const persisted = await this.store.load();

    if (persisted && persisted.expiresAt > Date.now()) {
      this.tokens = persisted;
      log("info", "Loaded cached tokens from encrypted store");
      this.scheduleRenewal();
      return;
    }

    const refreshToken = persisted?.refreshToken ?? this.config.refreshToken;
    if (!refreshToken) {
      throw new Error(
        "No refresh token available. Set QUESTRADE_REFRESH_TOKEN or run a previous session to cache tokens.",
      );
    }

    await this.refresh(refreshToken);
  }

  async getAccessToken(): Promise<string> {
    if (!this.tokens) {
      throw new Error("TokenManager not initialized — call initialize() first");
    }

    if (this.tokens.expiresAt <= Date.now()) {
      await this.refreshCurrent();
    }

    return this.tokens.accessToken;
  }

  getApiServer(): string {
    if (!this.tokens) {
      throw new Error("TokenManager not initialized — call initialize() first");
    }
    return this.tokens.apiServer;
  }

  /** Force a token refresh (e.g. after a 401). Deduplicates concurrent calls. */
  async refreshCurrent(): Promise<PersistedTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.tokens?.refreshToken ?? this.config.refreshToken;
    if (!refreshToken) {
      throw new Error("No refresh token available for renewal");
    }

    this.refreshPromise = this.refresh(refreshToken).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  destroy(): void {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer);
      this.renewalTimer = null;
    }
  }

  private async refresh(refreshToken: string): Promise<PersistedTokens> {
    log("info", "Refreshing Questrade OAuth tokens");

    const url = `${this.oauthBaseUrl}/oauth2/token?grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`;

    const response = await fetch(url, { method: "POST" });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Token refresh failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as TokenResponse;

    const tokens: PersistedTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      apiServer: data.api_server,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    this.tokens = tokens;
    await this.store.save(tokens);
    log("info", "Tokens refreshed and persisted", { apiServer: tokens.apiServer });

    this.scheduleRenewal();
    return tokens;
  }

  private scheduleRenewal(): void {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer);
    }

    if (!this.tokens) return;

    const delay = Math.max(0, this.tokens.expiresAt - Date.now() - REFRESH_BUFFER_MS);
    this.renewalTimer = setTimeout(() => {
      this.refreshCurrent().catch((err) => {
        log("error", "Proactive token renewal failed", { error: String(err) });
      });
    }, delay);

    // Don't keep the process alive just for token renewal
    this.renewalTimer.unref();
  }
}
