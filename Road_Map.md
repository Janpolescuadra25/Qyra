# Qyra Production Roadmap

---

## ACTIVE PHASES
### Phase 12: Customer Self-Service Portal & Multi-Region Expansion
- **Status:** PLANNING (IN PROGRESS)
- **Reference Baseline:** `d30ef5da6037143d784f56e875fb2bfcc6da1d3d` (Post-Phase 11 Archive & Phase 12 Init)
- **Documentation:** `docs/phase12/README.md`
- **Scope & Objectives:**
  * Self-service customer subscription management portal (payment method updates, plan transitions, cancellation flow)
  * Additional payment methods integration (Apple Pay, Google Pay, PayPal)
  * Advanced subscription metrics & MRR churn telemetry
  * Multi-region database replication & cross-browser extension rollout

---

## ARCHIVED COMPLETED PHASES
### Phase 11: Stripe Production Hardening & Webhook Monitoring
- **Status:** 100% COMPLETED / VERIFIED (2026-10-25)
- **Reference Baseline:** Commit `2cfea4f` (`2cfea4f10628ee496ab7c58dd8c09c02eef70de8`)
- **Documentation:** `docs/phase11/README.md`
- **Wave 1 Deliverables (COMPLETED - 2026-10-25):**
  * [x] Production hardening of Stripe webhook lifecycle handling (`Backend/src/routes/webhooks.ts`).
  * [x] Add dedicated billing status endpoint (`GET /api/billing/status`) for client synchronization (`Backend/src/routes/billing.ts`).
  * [x] Verify and harden `invoice.paid` handling with optimized line item period extraction and safe fallback.
- **Wave 2 Deliverables (COMPLETED / VERIFIED):**
  * [x] Implement webhook dead-letter tracking / failure alerting for subscription state consistency (2026-10-25).
  * [x] End-to-end Stripe signature validation and test webhook replay verification (2026-10-25).
- **Prerequisites Verified:**
  * Stripe SDK configured with testmode price IDs in `Backend/src/lib/stripe.ts`.
  * Raw body parsing enabled in `Backend/src/index.ts` for `/api/webhooks`, with Stripe-specific handler at `/api/webhooks/stripe`.
  * Subscription management and checkout sessions implemented in `Backend/src/routes/checkout.ts`.
  * Billing router mounted at `/api/billing` in `Backend/src/index.ts`.

### Phase 10: Wave 1 Production VPS Deployment & Health Verification
- **Status:** 100% COMPLETED and VERIFIED (2026-10-24)
- **Reference Commit:** `c6f9775` (`c6f97752fcbf9e8268a188aaea01ecdd7c58d888`)
- **Documentation:** `docs/phase10/README.md`
- **Scope & Deliverables Completed:**
  * Self-hosted production deployment to Hetzner Cloud VPS `vortex` (`2.28.120.85`).
  * Backend API service `qyra-backend` running on PM2 port `3005`.
  * Nginx reverse proxy routing `https://api.qyra.space` -> `127.0.0.1:3005` and `https://qyra.space` -> `/var/www/qyra/web`.
  * Multi-repo coexistence invariants fully preserved: zero interference with `hayp-frontend` (port 3003) or `jp_escuadra` (ports 3000, 3001).
  * Production health verification confirmed with HTTP 200 OK across public HTTPS endpoints.

---

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