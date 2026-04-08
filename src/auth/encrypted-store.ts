import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "node:crypto";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { homedir, hostname, userInfo } from "node:os";
import type { PersistedTokens } from "@/types/questrade.js";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT = "questrade-mcp-token-store";
const PBKDF2_ITERATIONS = 100_000;

interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

export class EncryptedStore {
  private readonly keyBuffer: Buffer;
  private readonly filePath: string;

  constructor(encryptionKey?: string) {
    const secret = encryptionKey ?? deriveMachineSecret();
    this.keyBuffer = pbkdf2Sync(secret, SALT, PBKDF2_ITERATIONS, KEY_LENGTH, "sha512");
    this.filePath = getTokenFilePath();
  }

  async load(): Promise<PersistedTokens | null> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      const payload: EncryptedPayload = JSON.parse(raw);
      const decrypted = this.decrypt(payload);
      return JSON.parse(decrypted) as PersistedTokens;
    } catch {
      return null;
    }
  }

  async save(tokens: PersistedTokens): Promise<void> {
    const json = JSON.stringify(tokens);
    const payload = this.encrypt(json);
    const dir = join(this.filePath, "..");
    await mkdir(dir, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(payload), { mode: 0o600 });
  }

  async clear(): Promise<void> {
    try {
      await unlink(this.filePath);
    } catch {
      // File may not exist
    }
  }

  private encrypt(plaintext: string): EncryptedPayload {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.keyBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      ciphertext: encrypted.toString("base64"),
    };
  }

  private decrypt(payload: EncryptedPayload): string {
    const iv = Buffer.from(payload.iv, "base64");
    const authTag = Buffer.from(payload.authTag, "base64");
    const ciphertext = Buffer.from(payload.ciphertext, "base64");
    const decipher = createDecipheriv(ALGORITHM, this.keyBuffer, iv, { authTagLength: 16 });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf-8");
  }
}

function deriveMachineSecret(): string {
  const user = userInfo().username;
  const host = hostname();
  return `questrade-mcp:${user}@${host}`;
}

function getTokenFilePath(): string {
  const appName = "questrade-mcp";
  const fileName = "token.enc";

  switch (process.platform) {
    case "win32":
      return join(process.env["APPDATA"] ?? join(homedir(), "AppData", "Roaming"), appName, fileName);
    case "darwin":
      return join(homedir(), "Library", "Application Support", appName, fileName);
    default:
      return join(process.env["XDG_CONFIG_HOME"] ?? join(homedir(), ".config"), appName, fileName);
  }
}
