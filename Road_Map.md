# Qyra — Product Roadmap
Last Updated: 2026-09-27

## Current Verified State
- **Backend Test Suite**: 24/24 suites passing and 149/149 tests passing.
- **Frontend Test Suite**: 12/12 files passing and 135/135 tests passing.
- **Backend Compilation**: Clean (`npm run build` / `tsc --noEmit` exits with 0).
- **Frontend Build**: Clean (`npm run build` exits with 0, zero bundling/type errors).
- **Frontend Payload Validation**: Bill-like payloads now resolve line-item customer refs from QuickBooks customer matches or value mappings, while preserving the older fallback path when no customer list is available.
  - `buildBillLikePayload()` iterates through `scanEntry.lineItems` when present and creates `QBBillLineItem` objects with `accountRef`, `classRef`, `taxCodeRef`, and per-line `customerRef`.
  - `resolveCustomerRef()` matches raw customer strings against QuickBooks customer entities using `DisplayName`/`CompanyName`, with a `resolveValueMapping()` fallback when direct matching is unavailable.
  - `QBBillLineItem.customerRef` is now typed explicitly so the payload contract matches backend expectations for bill line-level customer associations.
- **Deployment Infrastructure**: Qyra backend provisioned on Hetzner VPS Slot 3 under PM2 with Nginx + Let's Encrypt; other repo infrastructure remains separate.
- **Scan State Hardening**: Scan state persists through popup lifecycle changes using `chrome.storage.local` and clears on deliberate reset/successful sync.

## Current Active Focus

- **F-10: Chrome Web Store Submission & Launch** (Active Priority)
  - Manifest audit and extension packaging.
  - Store listing screenshots, privacy policy verification, and review preparation.
  - Production deployment cleanup and launch monitoring.

## Upcoming Phases

### F-10: Chrome Web Store Submission & Launch
- **Status**: Pending review / launch prep
- **Goal**: Submit Qyra to the Chrome Web Store and launch publicly.
- **Prerequisites (user-dependent)**:
  - Capture 4 Chrome Web Store screenshots (scan flow, map flow, sync history, settings) at 1280×800 or 1920×1080
  - Open Chrome Web Store developer account (one-time $5 fee)
  - Provide live privacy policy URL (landing page `/privacy` or external)
- **Deliverables**:
  - Final production build (frontend + backend) deployed to Render.com
  - Chrome Web Store listing published (description from STORE_LISTING.md, screenshots, category, privacy policy)
  - Store review process monitored and any rejections addressed
  - Public announcement (landing page live, social links if applicable)
  - Post-launch monitoring (error tracking, user feedback channel)
- **Acceptance Criteria**:
  - Extension is live and installable from the Chrome Web Store
  - All store assets are approved by Chrome Web Store review
  - Production backend health endpoints respond within SLA
  - Zero critical errors in the first 48 hours post-launch

## Next Priority
1. **Immediate (F-10)**: Chrome Web Store Submission & Launch.
2. **Follow-on**: Post-launch monitoring and user feedback iteration.

## Archived Completed Phases
> All completed phases have comprehensive architecture documentation in `docs/features/`.

- **F-5A: User QA & Payload Validation** (Completed: 2026-09-26) — See `docs/features/PayloadValidation/README.md`
- **F-7: Multi-Document Batch Scanning** (Completed: 2026-09-26) — See `docs/features/BatchScanning/README.md`
- **F-8: Advanced Mapping Presets & User Custom Mappings** (Completed: 2026-09-26) — See `docs/features/PresetManager/README.md`
- **F-9: Sync Analytics, Auto-Retry & Webhook Status** (Completed: 2026-09-27) — See `docs/features/AutoRetryFoundation/README.md` and `docs/features/SyncAnalyticsDashboard/README.md`

