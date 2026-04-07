import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EncryptedStore } from "@/auth/encrypted-store.js";
import type { PersistedTokens } from "@/types/questrade.js";

const MOCK_TOKENS: PersistedTokens = {
  accessToken: "access-abc",
  refreshToken: "refresh-xyz",
  apiServer: "https://api01.iq.questrade.com/",
  expiresAt: Date.now() + 30 * 60 * 1000,
};

let mockFs: Record<string, string>;

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(async (path: string) => {
    const content = mockFs[path];
    if (content === undefined) {
      const err = new Error(`ENOENT: no such file or directory, open '${path}'`);
      (err as NodeJS.ErrnoException).code = "ENOENT";
      throw err;
    }
    return content;
  }),
  writeFile: vi.fn(async (path: string, data: string) => {
    mockFs[path] = data;
  }),
  mkdir: vi.fn(async () => undefined),
  unlink: vi.fn(async (path: string) => {
    delete mockFs[path];
  }),
}));

describe("EncryptedStore", () => {
  beforeEach(() => {
    mockFs = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips save and load with the same key", async () => {
    const store = new EncryptedStore("test-secret");

    await store.save(MOCK_TOKENS);
    const loaded = await store.load();

    expect(loaded).not.toBeNull();
    expect(loaded!.accessToken).toBe(MOCK_TOKENS.accessToken);
    expect(loaded!.refreshToken).toBe(MOCK_TOKENS.refreshToken);
    expect(loaded!.apiServer).toBe(MOCK_TOKENS.apiServer);
    expect(loaded!.expiresAt).toBe(MOCK_TOKENS.expiresAt);
  });

  it("returns null when no file exists", async () => {
    const store = new EncryptedStore("test-secret");
    const result = await store.load();
    expect(result).toBeNull();
  });

  it("returns null when decryption fails with wrong key", async () => {
    const store1 = new EncryptedStore("key-one");
    await store1.save(MOCK_TOKENS);

    const store2 = new EncryptedStore("key-two");
    const result = await store2.load();
    expect(result).toBeNull();
  });

  it("clear removes the token file", async () => {
    const store = new EncryptedStore("test-secret");
    await store.save(MOCK_TOKENS);

    await store.clear();
    const result = await store.load();
    expect(result).toBeNull();
  });

  it("clear does not throw if file does not exist", async () => {
    const store = new EncryptedStore("test-secret");
    await expect(store.clear()).resolves.toBeUndefined();
  });

  it("produces different ciphertext for each save (random IV)", async () => {
    const store = new EncryptedStore("test-secret");

    await store.save(MOCK_TOKENS);
    const files = Object.values(mockFs);
    const first = files[0];

    await store.save(MOCK_TOKENS);
    const second = Object.values(mockFs)[0];

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first).not.toBe(second);
  });
});
