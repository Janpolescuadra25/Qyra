# Qyra Project Roadmap

## OVERVIEW
Qyra is an enterprise-grade automated accounting integration platform that bridges point-of-sale (POS) systems (Toast, Salido, Oracle Restaurants) with QuickBooks Online. This roadmap provides a comprehensive breakdown of all project phases, implementation details, dependencies, and completion criteria.

---

## PROJECT PHASES

### Phase 1: Core Extension Build & Manifest V3 Compliance
- **Status:** COMPLETED
- **Description:** Build pipeline and runtime foundation for the Qyra Chrome Extension adhering strictly to Chrome Web Store Manifest V3 guidelines.
- **Implementation:** TypeScript compilation with esbuild, background service worker, secure chrome.storage session management, and content script injection.
- **Expected Output:** `Frontend/manifest.json` (v1.0.2), build scripts in `Frontend/scripts/`, production bundle in `Frontend/dist/`.
- **Dependencies:** Node.js, esbuild, TypeScript toolchain.
- **Completion Criteria:** Manifest V3 compliant, zero localhost permissions in production build, extension loads cleanly in `chrome://extensions`.

### Phase 2: POS Data Extraction & OCR Implementation
- **Status:** COMPLETED
- **Description:** High-precision automated text and table data extraction from POS web portals and document scans.
- **Implementation:** Content script extractors targeting daily sales summaries, checkout reports, and payment summaries from Toast, Salido, and Oracle Restaurants (MICROS).
- **Expected Output:** POS extraction modules and standardized JSON transaction payloads.
- **Dependencies:** Phase 1 (extension runtime and content script injection).
- **Completion Criteria:** Valid structured extraction across all 3 supported POS platforms with error handling for unexpected table structures.

### Phase 3: QuickBooks Online API Integration
- **Status:** COMPLETED
- **Description:** Direct, secure accounting synchronization with QuickBooks Online via Intuit REST APIs.
- **Implementation:** OAuth 2.0 authorization, idempotency key generation to prevent duplicate entries, deterministic 12-column parsing for Bills, Cheques, and Vendor Credits.
- **Expected Output:** Accounting sync engines, test suites in `Backend/tests/`, and API routes.
- **Dependencies:** Phase 2 (standardized transaction payloads) and Intuit OAuth credentials.
- **Completion Criteria:** Full automated sync of bills, payments, and journal entries with strict idempotency and zero duplicate transactions.

### Phase 4: Frontend UI Implementation
- **Status:** COMPLETED
- **Description:** Responsive, user-friendly extension popup and management interface.
- **Implementation:** React components for Scan Flow, Entity/Account Mapping View, PresetManagerModal (CRUD for multi-location mapping presets), Sync History with audit logs, and Settings.
- **Expected Output:** Complete UI suite, test suites (135/135 frontend tests passing).
- **Dependencies:** Phase 1 and Phase 3 (backend endpoints).
- **Completion Criteria:** All core user flows operational end-to-end, location-scoped presets operational, all test suites passing.

### Phase 5: Chrome Web Store Packaging & Submission Prep
- **Status:** COMPLETED
- **Description:** Production packaging, build verification, and compliance documentation for the Chrome Web Store.
- **Implementation:** Automated packaging script (`Frontend/scripts/package.js`), complete store listing metadata, permissions justifications in `docs/chrome-web-store/launch_checklist.md`.
- **Expected Output:** `Frontend/qyra-extension.zip` (v1.0.2, ~1.55 MB), updated launch checklist, privacy policy and terms verification (`https://qyra.space/privacy`).
- **Dependencies:** Phase 1–4 completed and verified.
- **Completion Criteria:** Clean production build, verified zip package size >1MB, all metadata and permission justifications documented.

### Phase 6: Chrome Web Store Final Submission
- **Status:** PENDING (READY FOR EXECUTION)
- **Description:** Capturing store showcase screenshots and submitting the extension package to the Google Chrome Web Store Developer Dashboard for review.
- **Implementation:** Capture 4 required listing screenshots (1280x800 px) per `docs/chrome-web-store/SCREENSHOTS_SPEC.md`, upload `Frontend/qyra-extension.zip`, enter metadata from `launch_checklist.md`, and submit for review.
- **Expected Output:** 4 screenshot PNGs in `docs/chrome-web-store/`, extension submitted for Google review.
- **Dependencies:** Phase 5 (extension package and listing metadata).
- **Completion Criteria:** Extension published and live on the Chrome Web Store.

### Phase 7: Post-Launch Monitoring & Telemetry
- **Status:** PENDING
- **Description:** Production monitoring, automated alerting, and transient sync retry handling on live infrastructure.
- **Implementation:** Deployment of telemetry and error tracking on Hetzner VPS, Sentry/telemetry alerting, automated background retry queues for transient sync failures.
- **Expected Output:** Production monitoring dashboard, automated alerts for sync exceptions.
- **Dependencies:** Phase 6 (extension live in production).
- **Completion Criteria:** All production runtime errors captured with proactive alerting to engineering leads.

### Phase 8: Marketing Landing-Page Static Deployment (Nginx)
- **Status:** PARTIALLY COMPLETED
- **Description:** Build and deploy a high-conversion static Next.js marketing website to Nginx on `/var/www/qyra/web` to support Qyra's production launch.
- **Implementation:** Next.js 16 with static export (`output: "export"`), unified `intro-sequence.tsx` combining reference cinematic scenes with robust UX features (sessionStorage, Escape skip, safety timer), and responsive Tailwind CSS components.
- **Expected Output:** `landing-page/out/` directory containing static HTML/CSS/JS assets, Nginx-ready for deployment to `/var/www/qyra/web`.
- **Dependencies:** None (independent project supporting the Phase 6 launch timeline).
- **Completion Criteria:** Static export builds successfully, intro sequence functional, changes committed to landing-page submodule, and assets deployed to production Nginx server.
