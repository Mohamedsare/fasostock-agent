import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { serverEnv } from "@/lib/env";

/**
 * Symmetric secret encryption for tenant credentials (per-org OpenAI keys,
 * per-agent Wasender session keys). AES-256-GCM with a key derived from
 * APP_ENCRYPTION_KEY. Ciphertext is stored as base64 of: iv(12) | tag(16) | ct.
 *
 * NOTE: rotating APP_ENCRYPTION_KEY invalidates every stored secret — they must
 * be re-entered. Keep it stable and backed up.
 */

const ALGO = "aes-256-gcm";

/** Derive a stable 32-byte key from the configured passphrase (any length). */
function key(): Buffer {
  return createHash("sha256").update(serverEnv.appEncryptionKey).digest();
}

/** Encrypt a plaintext secret. Returns a base64 token, or null for empty input. */
export function encryptSecret(plain: string | null | undefined): string | null {
  if (!plain) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

/** Decrypt a token produced by encryptSecret. Returns null on any failure. */
export function decryptSecret(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const buf = Buffer.from(token, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = createDecipheriv(ALGO, key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch (err) {
    console.error("[crypto] decrypt failed:", err);
    return null;
  }
}
