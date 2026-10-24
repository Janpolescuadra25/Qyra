# Qyra Project Roadmap

## ACTIVE PHASES

### Phase 10: Wave 1 Production VPS Deployment & Health Verification
- **Status:** IN PROGRESS (Target: 2026-10-24)
- **Target Server:** Hetzner Cloud VPS `vortex` (`2.28.120.85`), Ubuntu, Nginx reverse proxy
- **Service Configuration:** `qyra-backend` running on port 3005 via PM2 (`PORT=3005`, `NODE_ENV=production`)
- **Multi-Repo VPS Safety Invariant (CRITICAL):**
  - Strictly isolate operations to `/var/www/qyra/Backend`.
  - Never stop, restart, kill, or modify PM2 processes or socket listeners for sibling applications:
    * `jp-frontend` (port 3000)
    * `jp-backend` (port 3001)
    * `hayp-frontend` (port 3003)
- **Deployment Scope:**
  1. Fast-forward pull of `origin/main` on `vortex` to commit `7c832362e9d70317f83cfa07fc4892801b7f516e` (includes P0 port 3005 fallback, Stripe livemode safety guard, and landing-page documentation).
  2. Production `.env` schema validation in `/var/www/qyra/Backend/.env` (verifying `PORT=3005`, `NODE_ENV=production`, `APP_URL=https://qyra.space`).
  3. Clean restart of `qyra-backend` process under PM2.
  4. End-to-end post-deployment verification:
     - API health check: `https://api.qyra.space/api/health` returning HTTP 200.
     - Static landing page: `https://qyra.space` serving static assets via Nginx / Express static.
     - Stripe webhook endpoint: signature and mode enforcement check.
- **Completion Criteria:**
  - Verified commit hash on VPS matches local baseline SHA `7c832362e9d70317f83cfa07fc4892801b7f516e`.
  - HTTP 200 verified on `api.qyra.space` and `qyra.space`.
  - Sibling application ports (3000, 3001, 3003) confirmed healthy and unaffected.

## ARCHIVED COMPLETED PHASES

### Phases 1-5: Chrome Extension Core
- **Status:** 100% COMPLETED and VERIFIED.
- **Scope:** Manifest V3, POS extraction, QuickBooks sync, UI, and Chrome extension lifecycle tooling.

### Phase 6: Chrome Web Store Submission & Publication
- **Status:** 100% COMPLETED and VERIFIED (2026-10-05)
- **Reference:** Chrome Web Store listing is live and verified.
- **Scope Completed:**
  - Store submission package, screenshots, metadata, and permission justification finalized.
  - Extension is live on the Chrome Web Store (ID: `bfhobnahngcmhaeklihifgfbgdepibii`).

### Phase 7: Sentry Monitoring & Error Boundaries
- **Status:** 100% COMPLETED and VERIFIED.
- **Reference:** Production telemetry, error boundary hardening, and alerting infrastructure.
- **Scope Completed:**
  - Backend Sentry integration and request correlation.
  - Frontend ErrorBoundary and support event ID capture.
  - Retry queue and service-level monitoring improvements.

### Phase 8: Marketing Landing-Page Static Deployment
- **Status:** 100% COMPLETED and VERIFIED (2026-10-05)
- **Reference:** `landing-page/README.md` and deployment logs.
- **Scope Completed:**
  - Next.js static export deployed to `Backend/public/`, live on `https://qyra.space`.
  - Includes 2026-10-03 F-10H (intro/navbar UX) improvements and 2026-10-05 F-10J (body scroll restoration) fix.

### Phase 9: Post-Launch Monitoring & Auto-Retry Enhancements
- **Status:** 100% COMPLETED and VERIFIED (2026-10-05)
- **Reference:** `docs/phase9/README.md`
- **Scope Completed:**
  - Automated background retry queue with exponential backoff, error classifier, and Sentry context tags (`Backend/src/cron/retry-queue.ts`).
  - Daily sync failure alert cron job with 24h lead cooldown (`Backend/src/cron/sync-failure-alerts.ts`).
  - Mapping Preset Manager modal and test suite (`Frontend/src/popup/components/MappingView/PresetManagerModal.tsx`).
  - 12-column fixed-format parsers and documentation.
  - Unit test suites in `Backend/tests/retry-queue.test.ts` and `Backend/tests/sync-failure-alerts.test.ts`.
