# Qyra — Product Roadmap
Last Updated: 2026-09-29

## Current Verified State
- **Backend Test Suite**: 26/26 suites passing and 157/157 tests passing (includes tenant-isolation coverage).
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

- **Chrome Web Store launch actions (user-dependent)**
  - Capture and upload the 4 required store listing screenshots (scan flow, mapping flow, sync history, settings at 1280x800 or 1920x1080).
  - Verify the live privacy policy URL and ensure the link is active in the Developer Console (`https://qyra.space/privacy`).
  - Monitor Chrome Web Store review queue and address any reviewer feedback before release.

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
- **F-10B: Landing Page & Legal Pages Upgrade (Completed: 2026-09-29)** — Migrated to static standalone web/index.html with Tailwind CSS CDN for zero-dependency hosting, cinematic intro overlay, canvas particles, restaurant branding update ("Your books, done before the rush hour.", Toast/SALIDO/Oracle POS integrations), and legal pages (/privacy, /terms) deployed. See `docs/features/LandingPageUpgrade_F-10/README.md`.
- **F-10C: Extension Maturation & CWS Review Prep** (Completed: 2026-09-28) — Idempotency key support for sync deduplication, QuickBooks vendor lookup endpoint, frontend UI ergonomic improvements, accountant-friendly negative number formatting, in-app error banners, and Chrome Web Store submission readiness fixes. See `docs/features/ExtensionMaturation_F-10/README.md`.
- **F-10D: Production Domain Migration to qyra.space** (Completed: 2026-09-29) — Migrated all legacy qyra.io/vortexsdo.com references to the registered production domain qyra.space across backend CORS, Helmet CSP, Chrome Extension manifest permissions, and frontend core settings. See `docs/features/DomainMigration_F-10/README.md`.
- **F-10E: Chrome Web Store Version Bump & Package Rebuild** (Completed: 2026-09-29) — Bumped extension version from 1.0.1 to 1.0.2, cleaned and rebuilt the frontend dist bundle, regenerated the qyra-extension.zip production package (1,593,746 bytes), and committed all changes. See `docs/features/CWSPackageRebuild_F-10/README.md`.

