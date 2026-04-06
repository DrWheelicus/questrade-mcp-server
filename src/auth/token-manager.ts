import { getOAuthBaseUrl, type Config } from "@/config.js";
import { EncryptedStore } from "@/auth/encrypted-store.js";
import { logger } from "@/log.js";
import type { PersistedTokens, TokenResponse } from "@/types/questrade.js";

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
      logger.info("Loaded cached tokens from encrypted store");
      this.scheduleRenewal();
      return;
    }

    const persistedToken = persisted?.refreshToken;
    const envToken = this.config.refreshToken;

    if (!persistedToken && !envToken) {
      throw new Error(
        "No refresh token available. Set QUESTRADE_REFRESH_TOKEN or run a previous session to cache tokens.",
      );
    }

    if (persistedToken) {
      try {
        await this.refresh(persistedToken);
        return;
      } catch (err) {
        logger.warn("Cached refresh token failed, clearing encrypted store");
        await this.store.clear();

        if (!envToken) throw err;
        logger.info("Retrying with QUESTRADE_REFRESH_TOKEN from environment");
      }
    }

    await this.refresh(envToken!);
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
    logger.info("Refreshing Questrade OAuth tokens");

    // Questrade expects form body + Content-Type, not query params on an empty POST
    const response = await fetch(`${this.oauthBaseUrl}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const rawBody = await response.text().catch(() => "");
      const body = rawBody.trim() || "<empty response body>";
      const bodyPreview = body.length > 400 ? `${body.slice(0, 400)}...` : body;
      const diagnostics = [
        `Token refresh failed (${response.status}${response.statusText ? ` ${response.statusText}` : ""})`,
        `Questrade environment=${this.config.environment}`,
        `OAuth host=${this.oauthBaseUrl}`,
        `response=${bodyPreview}`,
      ];

      if (response.status === 400) {
        diagnostics.push(
          "Likely causes: refresh token is expired/revoked/invalid, the token was generated for a different environment (practice vs production), or the env value has extra whitespace/quotes.",
        );
      }

      throw new Error(diagnostics.join(". "));
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
    logger.info({ apiServer: tokens.apiServer }, "Tokens refreshed and persisted");

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
        logger.error({ err }, "Proactive token renewal failed");
      });
    }, delay);

    // Don't keep the process alive just for token renewal
    this.renewalTimer.unref();
  }
}
