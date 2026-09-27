# Qyra — Product Roadmap
Last Updated: 2026-09-27

## Current Verified State
- **Backend Test Suite**: 25/25 suites passing and 154/154 tests passing (includes tenant-isolation coverage).
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
  - Current Status: Initial extension package submitted to Chrome Web Store Developer Dashboard; currently Pending review (Extension ID: bfhobnahngcmhaeklihifgbgdepibii).
  - Store listing screenshots capture and upload (4 screenshots: scan flow, mapping flow, sync history, settings at 1280x800 or 1920x1080).
  - Live privacy policy URL verification and link in developer console (`https://api.qyra.io/privacy`).
  - Chrome Web Store review monitoring and address reviewer feedback.
  - Post-approval release: Upload production package with VPS HTTPS endpoints once approved.

## Next Priority
1. **Immediate (F-10)**: Chrome Web Store Submission & Launch.
2. **Follow-on**: Post-launch monitoring and user feedback iteration.

## Archived Completed Phases
> All completed phases have comprehensive architecture documentation in `docs/features/`.

- **F-5A: User QA & Payload Validation** (Completed: 2026-09-26) — See `docs/features/PayloadValidation/README.md`
- **F-7: Multi-Document Batch Scanning** (Completed: 2026-09-26) — See `docs/features/BatchScanning/README.md`
- **F-8: Advanced Mapping Presets & User Custom Mappings** (Completed: 2026-09-26) — See `docs/features/PresetManager/README.md`
- **F-9: Sync Analytics, Auto-Retry & Webhook Status** (Completed: 2026-09-27) — See `docs/features/AutoRetryFoundation/README.md` and `docs/features/SyncAnalyticsDashboard/README.md`
- **F-10A: VPS Deployment Infrastructure** (Completed: 2026-09-27) — Hardened Manifest V3 HTTPS permissions, Vite import.meta.env config, backend CORS whitelist, PM2 ecosystem on port 3005, Nginx reverse proxy with SSL/HSTS, and automated start:migrate script. See `docs/features/VPSDeploymentPrep_F-10/README.md`.
- **F-10B: Landing Page & Legal Pages Upgrade** (Completed: 2026-09-27) — Dedicated Next.js 15 landing page project with cinematic intro, canvas particles, Framer Motion animations, live Stripe pricing reconciliation, and Chrome Web Store legal pages (/privacy, /privacy.html, /terms, /terms.html) deployed statically to Backend/public. See `docs/features/LandingPageUpgrade_F-10/README.md`.

