# Qyra Backend Services Architecture

**Directory**: `Backend/src/services/`
**Last Updated**: 2026-09-25
**Status**: DONE (Verified in Phase F-11)

---

## 1. Core Services

### `qb.service.ts` (QuickBooks Online Integration)
- **Status**: DONE (Verified in Phase F-11)
- **Core Functionality**: Centralized client for QuickBooks Online API calls, OAuth token management, entity query caching, and sync payload construction.
- **In-Memory Caching Layer (5-Minute TTL)**:
  - Cache storage: `qbEntityCache = Map<string, CacheEntry<unknown>>`
  - Cache key convention: `{realmId}:{entityType}` via `getCacheKey()`
  - Cached entities: Accounts (`getAccounts`), Vendors (`getVendors`), Customers (`getCustomers`), Tax Codes (`getTaxCodes`).
  - Cache operations: `getCachedEntity<T>()` and `setCachedEntity<T>()` with sliding TTL checks. Avoids redundant Intuit API round-trips and shields Intuit rate quotas.
- **Token Refresh Coordination**:
  - `pendingRefreshes = Map<string, Promise<string>>`: Coordinates concurrent refresh requests per realm to prevent duplicate token rotations.
- **Payload Builders**:
  - `buildBillPaymentPayload()`: Constructs bill-payment payloads with linked transaction references.
  - `buildJournalEntryPayload()`: Enforces required QB fields and validates Journal Entry debit/credit balance equality.
  - `buildBillPayload()`: Constructs valid QB Bill payloads with support for accountRef, classRef, taxCodeRef, and per-line-item customerRef.

### `rules.engine.ts` (Business Rules Engine)
- **Status**: Active
- **Core Functionality**: Evaluates conditional mapping rules, header transforms, and value substitutions against scanned input rows before QuickBooks sync.

---

## 2. Supporting Middleware Integration

### `rate-limit.ts` (`Backend/src/middleware/rate-limit.ts`)
- **Status**: DONE (Verified in Phase F-11)
- **`geminiSuggestLimiter`**: Dedicated rate limiter for `POST /api/mappings/suggest-values` enforcing a limit of 10 requests per minute per IP with standard 429 and Retry-After headers to protect Gemini API quotas.
- **Other Limiters**: `authLimiter` (10 req/15min), `passwordResetLimiter` (3 req/15min), `emailVerificationLimiter` (3 req/15min), and `apiLimiter` (100 req/60min).
