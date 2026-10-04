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

### Phase 7: Post-Launch Monitoring & Telemetry
- **Status:** ACTIVE - IN PROGRESS
- **Description:** Production monitoring, automated alerting, and transient sync retry handling on live infrastructure.
- **Implementation:** Deployment of telemetry and error tracking on Hetzner VPS (vortex), Sentry/telemetry alerting, automated background retry queues for transient sync failures (see docs/phase7/SPECIFICATION.md).
- **Expected Output:** Production monitoring dashboard, automated alerts for sync exceptions.
- **Dependencies:** Phase 6 (extension live in production).
- **Completion Criteria:** All production runtime errors captured with proactive alerting to engineering leads.

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

### Phase 8: Marketing Landing-Page Static Deployment
- **Status:** 100% COMPLETED and VERIFIED (2026-10-03)
- **Reference:** See landing-page/README.md and docs/phase8/DEPLOYMENT_LOG.md.
- **Scope Completed:**
  - Next.js 16 static export deployed to Hetzner VPS vortex (2.28.120.85) at /var/www/qyra/web/.
  - Live production domain: https://qyra.space (HTTP 200 verified).
  - Post-launch maintenance: Resolved intro-sequence state race condition with queueMicrotask guard; updated Nginx CSP script-src to include 'unsafe-inline' for Next.js inline hydration.
