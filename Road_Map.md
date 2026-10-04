# Qyra Project Roadmap

## ACTIVE PHASES

None. All planned engineering phases (Phases 1 through 9) are 100% completed, verified, and deployed to production.

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
