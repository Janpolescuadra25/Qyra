# Phase 14.1: Sentry Telemetry Integration & PII Redaction

- **Status:** CODE COMPLETE & VERIFIED (PENDING PRODUCTION DSN ACTIVATION)
- **Module:** Full-Stack Monitoring (`Backend/src/lib/logger.ts`, `Backend/src/lib/errors.ts`, `Frontend/src/popup/App.tsx`, `Frontend/src/popup/components/ErrorBoundary.tsx`)
- **Verified Commit:** `914799acd1bfa14dec241e021fcee6de6ad789c6`

---

## 1. Architectural Overview

Qyra implements unified error tracking and performance profiling via Sentry with strict fail-closed data scrubbing to prevent credential or PII leaks.

### Backend Architecture
- **SDK**: `@sentry/node` (v11.4.0) with `@sentry/profiling-node`.
- **Initialization**: Configured conditionally in `Backend/src/lib/logger.ts`.
- **Traces Sample Rate**: 20% in production (`tracesSampleRate: 0.2`), 100% in non-production.
- **Global Error Handler**: `Backend/src/lib/errors.ts` automatically captures unhandled API exceptions and forwards them to Sentry with request IDs.
- **Fail-Closed Header Scrubbing**: In `beforeSend`, all sensitive headers are deleted (`authorization`, `cookie`, `set-cookie`, `x-api-key`, `x-auth-token`, `jwt`, `session`). Any error during scrubbing drops the event (`return null`).

### Frontend Architecture
- **SDK**: `@sentry/browser` (v11.4.0).
- **Initialization**: Configured in `Frontend/src/popup/App.tsx`.
- **React Error Boundary**: `Frontend/src/popup/components/ErrorBoundary.tsx` wraps the popup tree in `Frontend/src/popup/Popup.tsx`, captures render exceptions via `Sentry.captureException()`, and displays `ErrorCard` with `sentryEventId`.
- **Client Scrubbing**: Strips query parameters (`code`, `token`, `access_token`, etc.), redacts user email/IP, and masks sensitive state keys (`[REDACTED]`).
- **CSP Integration**: Helmet in `Backend/src/index.ts` explicitly includes `*.sentry.io` in `connectSrc`.

---

## 2. Production Activation Checklist

When deploying to Hetzner VPS `vortex`:
1. Add `SENTRY_DSN=<production-dsn>` to `/var/www/qyra/Backend/.env`.
2. Add `VITE_SENTRY_DSN=<production-frontend-dsn>` to `/var/www/qyra/Frontend/.env`.
3. Reload PM2 process `qyra-backend` (`pm2 reload qyra-backend`).
4. Sentry will automatically transition from local Pino logging to full cloud monitoring.