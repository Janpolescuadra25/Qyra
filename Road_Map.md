# Qyra - Project Roadmap & Architecture
**Last updated: 2026-10-01**

## Current Verified State
- **Frontend Chrome Extension**: Manifest V3 v1.0.2 ready in `Frontend/` (12 test files, 135/135 tests passing). Multi-document batch scanner and payload builder active, production package ready in `Frontend/dist/` and `Frontend/qyra-extension.zip`.
- **Backend API Server**: Express TypeScript server on port 3005 with PostgreSQL Prisma schema (52 migrations), QuickBooks Online sync engine with idempotent retry tracking, Stripe billing webhooks, Gemini AI value suggestion endpoint in `src/routes/mappings.ts`, and root route serving Next.js landing page. Deployed to Hetzner VPS Slot 3 (`vortex`, 2.28.120.85) under PM2.
- **Landing Page & Web**: Next.js 16 static export hosted on Hetzner VPS via Express/Nginx at `https://qyra.space/` with SSL, hardened intro sequence (F-10H), client mount guard, motion-primitives fallback, and preserved Stripe checkout callbacks (`billing-success.html`, `billing-cancel.html`).
- **All Core Development Phases (F-5A through F-11) are 100% COMPLETE**.

---

## Active Priority: Chrome Web Store Submission & Launch (User-Dependent)
The codebase and infrastructure are 100% production-ready. The remaining launch actions are user-dependent store submission tasks:
1. **Store Screenshots**: Capture 4 extension screenshots (1280x800) per `docs/chrome-web-store/SCREENSHOTS_SPEC.md`.
2. **Store Submission**: Upload `Frontend/qyra-extension.zip` to Chrome Web Store Developer Dashboard, confirm privacy URL (`https://qyra.space/privacy`), and submit for review.
3. **Launch Monitoring**: Monitor review queue and track post-launch user telemetry.

---

## Immediate Operational Priority: Production Landing Page Validation
Following server pull on Hetzner VPS (`cd /var/www/qyra && git pull origin main && npm --prefix Backend run build && pm2 restart qyra-backend`):
- Validate that `https://qyra.space/` loads the Next.js fail-safe landing page with visible content.
- Confirm browser console has zero CSP violations.
- Verify authentication routes (`/invite`, `/reset-password`, `/verify-email`) and legal routes (`/privacy`, `/terms`) are fully responsive.

---

## Post-Launch Priorities (Planned)
- **F-12**: Multi-Currency Reconciliation & Advanced Accounting Rules (Foreign currency conversion, exchange rate tracking, and automated multi-currency line-item reconciliation with QuickBooks Online).

---

## Archived Completed Phases (100% Code-Verified)
- **Backend-Landing-Migration: Express Root Route to Next.js Landing Page (Completed: 2026-10-01)** — Switched Express root route to serve `../public/index.html`, synchronized whitelisted Next.js static assets, and preserved all authentication assets. See `Backend/README.md`.
- **F-11: AI-Powered Value Mapping & Self-Learning Field Extraction (Completed: 2026-09-25)** — Implemented Gemini-powered value suggestion engine, fuzzy matching for OCR data, and backend API (`POST /api/mappings/suggest-values`). See `docs/features/F-11-AI-Value-Mapping.md`.
- **F-10H: Intro Sequence SSR Guard & Motion Primitive Fallbacks (Completed: 2026-10-01)** — Added client-side mount guard to prevent intro overlay from rendering in static HTML, added opacity-100 fallback for reduced-motion and non-JS users, resolved timer restart race condition, stabilized Escape listener, and updated Next.js static export. See `docs/features/IntroSequenceFix_F10H/README.md` and `docs/features/LandingPageSSRFix_20261001/README.md`.
- **F-10G: Static Next.js Landing Page Deployment to VPS (Completed: 2026-09-30)** — Executed static export of Next.js landing page to `web/` for Hetzner VPS Nginx serving, preserved Stripe billing callbacks. See `docs/features/LandingPageDeployment_F10G/README.md`.
- **SecurityFixes_QYRA-PROD-SEC-01: Critical Production Security Hardening (Completed: 2026-09-30)** — Hardened webhook signatures, rate limiting, and environment variable isolation. See `docs/features/SecurityFixes_QYRA-PROD-SEC-01/README.md`.
- **F-10F: Landing Page Intro Hardening (Completed: 2026-09-30)** — Added `sessionStorage` safeguard and Escape key listener. See `docs/features/LandingPageHardening_F10F/README.md`.
- **F-10E: CWS Version Bump & Package Rebuild (Completed: 2026-09-30)** — Version bumped to 1.0.2, rebuilt production zip. See `docs/features/CWSPackageRebuild_F-10/README.md`.
- **F-10D: Production Domain Migration (Completed: 2026-09-29)** — Migrated all endpoints to `qyra.space` and `api.qyra.space`. See `docs/features/DomainMigration_F-10/README.md`.
- **F-10C: Extension Maturation & CWS Prep (Completed: 2026-09-28)** — Complete CWS checklist, screenshots spec, extension hardening. See `docs/features/ExtensionMaturation_F-10/README.md`.
- **F-10B: Landing Page & Legal Pages Upgrade (Completed: 2026-09-28)** — Added privacy and terms pages. See `docs/features/LandingPageUpgrade_F-10/README.md`.
- **F-10A: VPS Deployment Infrastructure (Completed: 2026-09-27)** — Hetzner cx33 VPS setup, Nginx reverse proxy, PM2. See `docs/features/VPSDeploymentPrep_F-10/README.md`.
- **F-9: Sync Analytics & Auto-Retry (Completed: 2026-09-27)** — Background retry queue, error classification, analytics endpoints. See `docs/features/SyncAnalyticsDashboard/README.md`.
- **F-8: Advanced Mapping Presets (Completed: 2026-09-26)** — Preset manager modal, custom account mappings, Prisma schema. See `docs/features/PresetManager/README.md`.
- **F-7: Multi-Document Batch Scanning (Completed: 2026-09-26)** — Batch scanner, multi-file upload, queue processing. See `docs/features/BatchScanning/README.md`.
- **F-5A: User QA & Payload Validation (Completed: 2026-09-26)** — QuickBooks customer ref resolution, field validation. See `docs/features/PayloadValidation/README.md`.

