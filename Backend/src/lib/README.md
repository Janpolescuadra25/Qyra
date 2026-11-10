# Backend Core Cryptographic & Utility Library (`src/lib`)

## 1. Overview & Architectural Role
This directory contains core cryptographic security utilities, payload signing, verification routines, deduplication mechanisms, and encryption helpers supporting Qyra's multi-tenant backend architecture. 

Specifically, this library satisfies **Phase 14.9: Cryptographic Binding & Payload Integrity**, ensuring that cross-origin payloads, webhook callbacks, and sensitive data stored at rest or passed in transit are cryptographically verified, timing-attack resistant, and tamper-evident.

---

## 2. Module Index

| File | Purpose | Phase Alignment |
|---|---|---|
| `encryption.ts` | AES-256-GCM data encryption, SHA-256 HMAC signing, canonicalization & timing-safe verification | Phase 14.9 (Cryptographic Binding) & Phase 14.5 |
| `dedup.ts` | Distributed in-flight promise deduplication cache (e.g., QuickBooks token refresh deduplication) | Phase 14.3 (OAuth Deduplication) |

---

## 3. Cryptographic Binding Specifications (`encryption.ts`)

### 3.1 HMAC Payload Signing (`createPayloadHmac`)
- **Algorithm:** HMAC-SHA256
- **Key Source:** `process.env.ENCRYPTION_KEY`
- **Signature Format:** Hex-encoded 64-character string
- **Behavior:**
  - Deterministically canonicalizes payload objects prior to hashing.
  - Sorts object keys recursively to ensure payload key-order invariance.
  - Generates an unforgeable cryptographic authentication tag over arbitrary JSON-serializable payloads.

```typescript
import { createPayloadHmac } from './encryption';

const signature = createPayloadHmac({ accountId: 'acc_123', amount: 5000 });
```

### 3.2 Timing-Safe Verification (`verifyPayloadHmac`)
- **Security Control:** Protects against timing-based side-channel attacks.
- **Implementation:** Leverages Node.js native `crypto.timingSafeEqual()`.
- **Validation:**
  - Recomputes the expected HMAC using the canonicalized incoming payload.
  - Converts both expected and candidate hashes to byte buffers of identical length.
  - Performs constant-time comparison. Returns `false` immediately if buffer lengths differ or if verification fails.

```typescript
import { verifyPayloadHmac } from './encryption';

const isValid = verifyPayloadHmac(incomingPayload, candidateSignature);
if (!isValid) {
  throw new Error('Cryptographic signature verification failed: payload tampered or key mismatch');
}
```

### 3.3 Symmetric Data Encryption (AES-256-GCM)
- **Cipher:** `aes-256-gcm` (Authenticated Encryption with Associated Data)
- **Key Requirement:** 32-byte secret key provided via `ENCRYPTION_KEY` environment variable.
- **Initialization Vector (IV):** 16 cryptographically secure random bytes generated per encryption operation via `crypto.randomBytes(16)`.
- **Authentication Tag:** 16-byte GCM authentication tag verifying ciphertext integrity.
- **Serialized Ciphertext Format:**
  `ivHex:authTagHex:encryptedContentHex`
- **Primary Methods:**
  - `encrypt(text: string): string` — Encrypts sensitive string data (e.g., OAuth tokens, credentials).
  - `decrypt(encryptedText: string): string` — Authenticates and decrypts ciphertext; throws on tampering or authentication tag mismatch.
  - `decryptSafe(encryptedText: string): string | null` — Fail-safe decryption wrapper returning `null` on corruption without throwing unhandled exceptions.
  - `hashToken(token: string): string` — SHA-256 token hashing for lookup indexing without storing raw tokens.

---

## 4. Key Management & Environment Invariants
1. **Secret Hygiene:** `ENCRYPTION_KEY` must never be hardcoded, logged, or exposed in client bundles.
2. **Key Length:** Must be an exact 32-character string or 64-character hex string representing 256 bits.
3. **Immutability:** Rotating `ENCRYPTION_KEY` invalidates previously generated HMAC signatures and requires database re-encryption for stored secrets.

---

## 5. Status & Roadmap Verification
- **Status:** COMPLETED & VERIFIED (Unit tested in test suites; core encryption and HMAC binding active)
- **Roadmap Anchor:** Phase 14.9 (Cryptographic Binding & Verification)