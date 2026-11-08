import crypto from 'crypto';
import { canonicalize } from './dedup';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export interface ApprovedPayload {
  txnDate: string;
  lines: unknown[];
}

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    encrypted,
    tag.toString('hex'),
  ].join(':');
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }

  const [ivHex, encryptedHex, tagHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Computes a deterministic HMAC-SHA256 signature for an arbitrary payload.
 * The payload is canonically sorted via canonicalize() to ensure key-order invariance.
 */
export function createPayloadHmac(payload: unknown): string {
  const key = getKey();
  const canonicalString = JSON.stringify(canonicalize(payload) ?? null);
  return crypto.createHmac('sha256', key).update(canonicalString, 'utf8').digest('hex');
}

/**
 * Timing-safe verification of an expected HMAC against a given payload.
 */
export function verifyPayloadHmac(payload: unknown, expectedHmac: string): boolean {
  if (!expectedHmac || typeof expectedHmac !== 'string') {
    return false;
  }
  try {
    const computed = createPayloadHmac(payload);
    const expectedBuf = Buffer.from(expectedHmac, 'hex');
    const computedBuf = Buffer.from(computed, 'hex');
    if (expectedBuf.length !== computedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, computedBuf);
  } catch {
    return false;
  }
}