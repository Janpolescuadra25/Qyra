# Phase 7: Post-Launch Monitoring & Telemetry Implementation

## 1. Overview
This directory tracks the implementation of Phase 7 (Post-Launch Monitoring & Telemetry) for the Qyra ecosystem across the Chrome Extension, Express Backend, and Hetzner VPS production host (`vortex: 2.28.120.85`).

- **Technical Blueprint**: See `docs/phase7/SPECIFICATION.md`
- **Status**: ⏳ **IN PREPARATION / READY FOR IMPLEMENTATION**

---

## 2. Workstream Implementation Matrix

| Workstream | Scope & Deliverables | Status | Key Files |
|---|---|---|---|
| **Workstream 1: Backend Telemetry & Retry Queue** | Install `@sentry/node` & `p-retry`; hook Sentry into `Backend/src/lib/logger.ts`; capture errors in `Backend/src/lib/errors.ts`; update CSP; author `Backend/src/cron/retry-queue.ts` | READY | `Backend/src/lib/logger.ts`, `Backend/src/lib/errors.ts`, `Backend/src/cron/retry-queue.ts`, `Backend/src/index.ts` |
| **Workstream 2: Frontend Telemetry** | Install `@sentry/browser`; initialize Sentry in `Frontend/src/popup/index.tsx`; create `Frontend/src/popup/components/ErrorBoundary.tsx`; attach unhandled listeners in `Frontend/src/background/service-worker.ts`; extend `ErrorCard.tsx` | READY | `Frontend/src/popup/index.tsx`, `Frontend/src/popup/components/ErrorBoundary.tsx`, `Frontend/src/background/service-worker.ts`, `Frontend/src/popup/components/shared/ErrorCard.tsx` |
| **Workstream 3: Verification & Readiness** | Test error dispatch with request ID correlation; verify ErrorBoundary recovery; audit zero-PII transmission | READY | Staging test scripts, Sentry dashboard validation |

---

## 3. Environment Variables
- **Backend**: `SENTRY_DSN` (configured in root `.env`)
- **Frontend**: `VITE_SENTRY_DSN` (configured in frontend build environment)

---

## 4. Completion & Verification Criteria
- [ ] Backend uncaught errors logged to Pino and captured in Sentry.
- [ ] `Backend/src/cron/retry-queue.ts` authored with exponential backoff via `p-retry`.
- [ ] Frontend render errors caught by React Error Boundary with user recovery options.
- [ ] Zero telemetry interference with Chrome Web Store Manifest V3 compliance or Content Security Policy.
- [ ] Hydra audit confirms 100% verification on disk.
