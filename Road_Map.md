# Qyra Project Roadmap

## ACTIVE PHASES

### Phase 9: Post-Launch Monitoring & Auto-Retry Enhancements
- **Status:** IN PROGRESS (90% COMPLETE)
- **Description:** Build on Phase 7's telemetry infrastructure to add proactive sync failure alerts and automated transient error retry logic.
- **Implementation Completed:**
  - Automated Background Retry Queue (`Backend/src/cron/retry-queue.ts`)
  - Sync Failure Alert Cron Job (`Backend/src/cron/sync-failure-alerts.ts`)
  - Mapping Preset Manager Modal (`Frontend/src/popup/components/MappingView/PresetManagerModal.tsx` and test suite)
  - 12-Column Fixed-Format Parsers (Bill/Cheque/Vendor Credit)
- **Remaining Work:**
  - Dedicated unit tests for `retry-queue.ts` and `sync-failure-alerts.ts`
  - Production Sentry telemetry configuration verification
- **Reference:** `docs/phase9/README.md`

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
