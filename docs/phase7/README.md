# PHASE 7: POST-LAUNCH MONITORING & TELEMETRY
## Status: IN PROGRESS | Target Completion: 2026-10-04
## Last Verified: 2026-10-04

### Core Objective
Implement Sentry-powered error tracking and automated retry queues for failed background jobs to ensure production stability across the backend, extension, and deployment host.

### Architecture Overview
- Backend: Sentry Node SDK + Pino logging integration + centralized error capture + existing retry queue correlation
- Frontend: Sentry Browser SDK + React ErrorBoundary + service worker error listeners
- Infrastructure: Hetzner VPS with `SENTRY_DSN` deployed and extension manifests whitelisted for Sentry traffic

### Files Created / Modified
#### New Files
- `Frontend/src/popup/components/ErrorBoundary.tsx` — React popup error boundary
- `docs/phase7/IMPLEMENTATION_LOG.md` — implementation and verification log

#### Modified Files
- `Backend/src/lib/logger.ts` — guarded Sentry initialization and Pino integration
- `Backend/src/lib/errors.ts` — centralized request-correlation capture for exceptions
- `Backend/src/cron/retry-queue.ts` — Sentry capture for retry execution failures while preserving retry behavior
- `Backend/src/index.ts` — Helmet `connect-src` whitelist for `https://*.sentry.io`
- `Backend/.env.example` — added `SENTRY_DSN`
- `Frontend/src/popup/App.tsx` — Sentry init and ErrorBoundary wrapping
- `Frontend/src/popup/Popup.tsx` — boundary mounting at root render
- `Frontend/src/background/service-worker.ts` — global `error` and `unhandledrejection` capture
- `Frontend/src/popup/components/shared/ErrorCard.tsx` — displays `sentryEventId` when available
- `Frontend/scripts/build.js` — exposes `VITE_SENTRY_DSN` to bundled code
- `Frontend/manifest.json` — allows Sentry connect access in extension pages
- `Frontend/.env.example` — added `VITE_SENTRY_DSN`
- `Road_Map.md` — marks Phase 7 as active

### Verification Criteria
1. Backend exceptions are logged to Pino and captured to Sentry when `SENTRY_DSN` is configured.
2. Existing QuickBooks sync retry queue still processes failures with exponential backoff and safe tracking.
3. Frontend render errors are recovered through the popup ErrorBoundary and captured to Sentry.
4. Browser extension CSP and host permissions permit Sentry telemetry without violating Manifest V3 rules.
5. The extension bundle rebuilds successfully and the release archive is refreshed.
