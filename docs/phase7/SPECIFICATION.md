# Phase 7: Post-Launch Monitoring & Telemetry Specification

## 1. Executive Overview
Phase 7 establishes production-grade telemetry, error tracking, automated alerting, and transient sync retry handling for the Qyra ecosystem (Chrome Extension, Node.js Backend, and Hetzner VPS infrastructure).

- **Target Systems**: Chrome Extension (Frontend), Express API (Backend on Hetzner VPS vortex: `2.28.120.85`), and QuickBooks/POS sync pipelines.
- **Primary Telemetry Provider**: Sentry (`@sentry/node` for Backend, `@sentry/browser` for Frontend).
- **Primary Logging Framework**: Pino 10.3.1 (already implemented in `Backend/src/lib/logger.ts`).

---

## 2. Verified Integration Baseline (Hydra Audit: 2026-10-03)

### A. Backend Architecture
- **Logging**: Configured via Pino in `Backend/src/lib/logger.ts` with request ID correlation. Sentry will hook into the centralized logger as an error destination without replacing Pino.
- **Centralized Error Middleware**: `createErrorHandler()` in `Backend/src/lib/errors.ts` catches all unhandled Express errors, sanitizes responses, and manages status codes (400 for Zod validation, 403 for QuickBooks auth).
- **Cron Jobs Baseline**:
  - `Backend/src/cron/sync-failure-alerts.ts` exists and is initialized via `startSyncFailureAlertCron()`.
  - `Backend/src/index.ts` imports the `startAutoRetryCron()` function placeholder, but **`Backend/src/cron/retry-queue.ts` does not exist on disk** and must be created from scratch during Phase 7 implementation.
- **Security (CSP)**: Helmet CSP in `Backend/src/index.ts` already includes `connectSrc` allowing third-party API connectivity. Must be extended with `https://*.sentry.io`.

### B. Frontend Architecture
- **Service Worker**: `Frontend/src/background/service-worker.ts` currently lacks production error tracking. Will be equipped with Sentry unhandled rejection listeners.
- **UI Error Display**: `Frontend/src/popup/components/shared/ErrorCard.tsx` exists for manual caught errors. Will be extended to display Sentry event IDs for user support reporting.
- **Global Error Boundaries**: React error boundaries will be added around `App.tsx` in `Frontend/src/popup/App.tsx` to catch unhandled component render exceptions.

---

## 3. Package Dependencies & Injection Strategy

### A. Backend Dependencies
- `@sentry/node`: Sentry SDK for Node.js / Express.
- `p-retry`: Exponential backoff retry utility for 429 rate limits and 5xx transient upstream POS/QuickBooks errors.

### B. Frontend Dependencies
- `@sentry/browser`: Sentry client SDK for browser / Manifest V3 extension environments.

### C. Environment Configuration
- **Backend**: `SENTRY_DSN` loaded via `dotenv` in root `.env` and consumed in `Backend/src/lib/logger.ts`.
- **Frontend**: `VITE_SENTRY_DSN` loaded via Vite build configuration and exposed safely in client code.

---

## 4. Implementation Workstreams

### Workstream 1: Backend Telemetry, Alerts & Retry Queue
1. Install `@sentry/node` and `p-retry` in `Backend/`.
2. Initialize Sentry in `Backend/src/lib/logger.ts` guarded by `process.env.SENTRY_DSN`.
3. In `Backend/src/lib/errors.ts`, attach `Sentry.captureException(err)` with `req.id` context before sending client responses.
4. Update Helmet CSP in `Backend/src/index.ts` to add `https://*.sentry.io` to `connectSrc`.
5. **Create `Backend/src/cron/retry-queue.ts` from scratch**, implementing `startAutoRetryCron()` with `p-retry` exponential backoff for transient sync failures.

### Workstream 2: Frontend Extension Telemetry
1. Install `@sentry/browser` in `Frontend/`.
2. Initialize Sentry in `Frontend/src/popup/index.tsx` guarded by `import.meta.env.VITE_SENTRY_DSN`.
3. Implement a root `ErrorBoundary` in `Frontend/src/popup/components/ErrorBoundary.tsx` wrapping `App.tsx`.
4. Add global `self.addEventListener('error')` and `self.addEventListener('unhandledrejection')` in `Frontend/src/background/service-worker.ts`.
5. Update `ErrorCard.tsx` to accept and render optional `sentryEventId` for customer support escalation.

### Workstream 3: Verification & Operational Readiness
1. Trigger intentional test exception in backend staging route to verify Sentry event capture and Pino log output.
2. Trigger intentional render error in frontend component to verify ErrorBoundary capture and Sentry dispatch.
3. Validate that no sensitive user credentials, tokens, or PII are transmitted in Sentry breadcrumbs or error payloads.

---

## 5. Acceptance Criteria
- [ ] Backend uncaught errors automatically logged to Pino AND dispatched to Sentry with request IDs.
- [ ] `Backend/src/cron/retry-queue.ts` authored, implementing `startAutoRetryCron()` with exponential backoff.
- [ ] Frontend render errors caught by React Error Boundary with user-facing recovery options.
- [ ] Transient 429 / 5xx QuickBooks and POS sync errors retried automatically before triggering alerts.
- [ ] Zero telemetry interference with Chrome Web Store Manifest V3 compliance or Content Security Policy.
- [ ] Documentation updated in `docs/phase7/README.md` upon execution.
