# Qyra Project Roadmap

## OVERVIEW
Qyra is an enterprise-grade automated accounting integration platform that bridges point-of-sale (POS) systems (Toast, Salido, Oracle Restaurants) with QuickBooks Online.

---

## ACTIVE & PENDING PHASES

### Phase 6: Chrome Web Store Final Submission
- **Status:** ACTIVE - SUBMITTED / AWAITING GOOGLE REVIEW (all engineering tasks complete, pending Google publication)
- **Description:** Extension package, showcase screenshots, metadata, and permission justifications submitted to Google for store review.
- **Implementation:** Engineering submission tasks 100% complete (see docs/chrome-web-store/SUBMISSION_LOG.md). Extension package (Frontend/qyra-extension.zip, v1.0.2) and 4 showcase screenshots submitted. Awaiting Google review and publication.
- **Expected Output:** Extension approved and published on the Chrome Web Store.
- **Dependencies:** Phase 5 (extension package and listing metadata complete).
- **Completion Criteria:** Extension published and live on the Chrome Web Store.

---

## ARCHIVED COMPLETED PHASES

### Phases 1-5: Core Extension Build & Store Packaging
- **Status:** 100% COMPLETED and VERIFIED (2026-10-03)
- **Reference:** See Frontend/README.md for full component breakdown and build architecture.
- **Scope Completed:**
  - Phase 1: Core Extension Build (Manifest V3, background service worker, popup UI).
  - Phase 2: POS Extraction (Toast, Salido, Oracle Restaurants content scanners).
  - Phase 3: QuickBooks Online Integration (OAuth2 token exchange, journal entry synchronization).
  - Phase 4: Frontend UI (Configuration, sync controls, connection status).
  - Phase 5: Chrome Web Store Packaging (Automated build pipeline, asset generation, zip bundle).

### Phase 7: Post-Launch Monitoring & Telemetry
- **Status:** 100% COMPLETED and VERIFIED (2026-10-04)
- **Reference:** See docs/phase7/README.md and docs/phase7/IMPLEMENTATION_LOG.md.
- **Scope Completed:**
  - Backend Sentry Node SDK integration with centralized error handler correlation (requestId, statusCode, path).
  - Helmet CSP updated to whitelist https://*.sentry.io in connectSrc.
  - Background retry queue (Backend/src/cron/retry-queue.ts) enhanced with Sentry exception tracking while preserving exponential backoff and QuickBooks sync retry logic.
  - Frontend root React ErrorBoundary (Frontend/src/popup/components/ErrorBoundary.tsx) wrapping AppContent with component stack trace capture.
  - ErrorCard.tsx updated to accept and display sentryEventId for customer support escalation.
  - Global error and unhandledrejection listeners added to Frontend background service worker.
  - Frontend extension bundle rebuilt and qyra-extension.zip repackaged.

### Phase 8: Marketing Landing-Page Static Deployment
- **Status:** 100% COMPLETED and VERIFIED (2026-10-03)
- **Reference:** See landing-page/README.md and docs/phase8/DEPLOYMENT_LOG.md.
- **Scope Completed:**
  - Next.js 16 static export deployed to Hetzner VPS vortex (2.28.120.85) at /var/www/qyra/web/.
  - Live production domain: https://qyra.space (HTTP 200 verified).
  - Post-launch maintenance: Resolved intro-sequence state race condition with queueMicroTask guard; updated Nginx CSP script-src to include 'unsafe-inline' for Next.js inline hydration.
