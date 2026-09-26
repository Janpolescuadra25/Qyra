# Auto-Retry Foundation — Implementation Documentation

**Directory**: `docs/features/AutoRetryFoundation/`
**Last Updated**: 2026-09-27
**Status**: DONE (Completed: 2026-09-27)

---

## 1. Overview
The Auto-Retry Foundation enables automatic, resilient re-attempts of transient QuickBooks sync failures (such as HTTP 429 rate limits, HTTP 502/503/504 gateway/server timeouts, and network socket disconnects) using exponential backoff with randomized jitter. It prevents accounting data sync loss without requiring manual user intervention.

## 2. Architecture & Components
- **Prisma Schema**: `Backend/prisma/schema.prisma`
  - `SyncLog` model extended with: `nextRetryAt: DateTime?`, `retryInterval: Int?`, `maxAttempts: Int @default(5)`, `retryCount: Int @default(0)`.
  - Composite query index: `@@index([status, nextRetryAt])` for efficient cron queue polling.
- **Error Classifier**: `Backend/src/lib/error-classifier.ts`
  - `isTransientSyncError(error: any): boolean`: Classifies transient failures (HTTP 429, 502, 503, 504, `ECONNRESET`, `ETIMEDOUT`, throttle messages) vs permanent failures (HTTP 400 validation, 401 unauthenticated, 403 forbidden).
- **Exponential Backoff Helper**: `Backend/src/lib/dedup.ts`
  - `calculateExponentialBackoff(retryCount: number): number`: Base delay 1000ms, doubled exponentially, capped at 300,000ms (5 minutes), with randomized jitter between 0.8x and 1.2x.
  - `createSyncLogEntry()`: Updated with backward compatibility and `Prisma.JsonNull` payload safety.
- **Retry Queue Cron**: `Backend/src/cron/retry-queue.ts`
  - `queryPendingRetries()`: Queries failed syncs where `nextRetryAt <= now()` and `retryCount < maxAttempts`.
  - `processRetryQueue()`: Re-attempts QuickBooks sync via `qbService.createJournalEntry()`, promoting to `SUCCESS` upon recovery or calculating the next exponential backoff interval.
  - `startAutoRetryCron()` / `stopAutoRetryCron()`: Runs every 30 seconds.
- **Server Startup Integration**: `Backend/src/index.ts`
  - Registers `startAutoRetryCron()` alongside existing background jobs.
- **Unit Tests**: `Backend/tests/retry.test.ts`
  - Validates exponential backoff math, jitter bounds, max capping, and error classification.

## 3. Verification & Test Evidence
- **Backend Test Suite**: 24/24 suites passing, 148/148 tests passing (100% success rate).
- **Frontend Test Suite**: 12/12 files passing, 135/135 tests passing (100% success rate).
- **Prisma Migration**: Pushed to database with zero schema conflicts.
