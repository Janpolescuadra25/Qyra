# Qyra — Product Roadmap
Last Updated: 2026-09-25

## Current Verified State
- **Backend Test Suite**: 117/117 passing, 20/20 suites
- **Backend Compilation**: Clean (`tsc --noEmit` exits with 0)
- **Backend Logging**: Pino structured logging with request IDs. Zero console.* calls in src/.
- **Backend Error Shape**: Flat — `{ error: "message string" }` with optional `fields` object. 20/22 route files use the AppError/asyncHandler pipeline; 2 routes (exports, notifications) use asyncHandler without explicit AppError throws.
- **Backend Validation**: 18/22 route files have explicit Zod schema validation; 4 routes (email-verification, exports, webhooks, mappings) use alternative handling.
- **Backend Health Checks**: Liveness (`/health/live`) and readiness (`/health/ready`) with DB and S3 connectivity checks.
- **Landing Page**: Updated hero copy ("From Any Document to QuickBooks — Automatically"), all "reconciliation" wording removed, 3-slide auto-play intro overlay with skip button, CSS animations (fade-in-up keyframes, Intersection Observer scroll reveal on feature cards), particle + line constellation canvas animation (commit `1b2e061`).
- **Extension Welcome Overlay**: Logo + tagline fade-in-up animation. First-install logo splash screen (one-time, fullscreen, chrome.storage.local tracked). All original functionality preserved.
- **Frontend Type Check**: Clean (`tsc --noEmit` exits with 0, zero errors). All 6 type errors across 5 files resolved.
- **Extension Store Prep**: STORE_LISTING.md created, manifest description aligned, version 1.0.1, `<all_urls>` fully removed from host_permissions, content_scripts, and web_accessible_resources.
- **Deployment Infrastructure**: Qyra backend provisioned on Hetzner VPS Slot 3 under PM2 with Nginx + Let's Encrypt; other repo infrastructure remains separate.

## Current Active Focus

- **F-5A: User QA & Verification**

## Upcoming Phases

### F-7: Multi-Document Batch Scanning
- **Goal**: Allow users to upload and scan multiple documents in a single session, with a queue-based workflow and batch sync capability.
- **Deliverables**:
  - Multi-file upload UI (drag-and-drop zone accepts multiple files)
  - Scan queue panel showing processing status per document
  - Batch review table consolidating all parsed transactions
  - "Sync All" bulk action across all documents in the queue
  - Per-document error handling and retry
- **Acceptance Criteria**:
  - User can upload 3+ documents simultaneously
  - Failed individual scans don't block the rest of the batch
  - Sync All pushes all valid transactions across all documents

### F-8: Advanced Mapping Presets & User Custom Mappings
- **Goal**: Enable users to save, load, and share column mapping presets beyond the built-in template defaults.
- **Deliverables**:
  - "Save as Preset" button in mapping configuration
  - Preset management panel (list, rename, delete, export/import as JSON)
  - Apply saved preset to new scans of the same template type
  - Share preset via clipboard (copy JSON to clipboard)
- **Acceptance Criteria**:
  - User can save a custom mapping and reapply it in under 3 clicks
  - Exported preset JSON can be imported on another device
  - Built-in defaults are never overwritten by user presets

### F-9: Sync Analytics, Auto-Retry & Webhook Status
- **Goal**: Strengthen sync reliability and observability through auto-retry, error categorization, alerting, and dashboard metrics.
- **Deliverables**:
  - Auto-retry with exponential backoff and retry queue tracking
  - Error categorization and dashboard metrics
  - Webhook-driven sync status visibility
  - Failure alerting and retry summary reporting
- **Acceptance Criteria**:
  - Sync failures are retried and surfaced clearly in the dashboard
  - Error categories are visible for operators and support staff
  - Users can quickly identify failed vs. successful sync activity

### F-10: Chrome Web Store Submission & Launch
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
  - All store assets (4+ screenshots, description, privacy policy) are approved by Chrome Web Store review
  - Production backend health endpoints respond within SLA
  - Zero critical errors in the first 48 hours post-launch

## Next Priority
1. **Immediate (F-5A)**: Complete the user QA checklist. This is a prerequisite for store submission.
2. **Short-term (F-7)**: Multi-Document Batch Scanning.
3. **Medium-term (F-8 → F-9 → F-10)**: Custom presets, sync analytics, and Chrome Web Store launch — in that order.

## Archived Completed Phases

- [x] **VPS-QYRA-01**: Hetzner VPS Slot 3 Provisioning & Multi-Repo Deployment (Completed: 2026-09-25)
  - Deployed NestJS backend under PM2 (`qyra-backend`) on internal port 10000
  - Configured Nginx virtual host for `qyra.space` and `www.qyra.space` with 50MB body size limit
  - Issued Let's Encrypt SSL certificate; verified zero-touch isolation across all 3 hosted domains

- [x] **F-6: Scan Data Flow Hardening & Tab-Switch State Persistence** (Completed: 2026-09-25)
  - Centralized scan state into `ScanContext` with `chrome.storage.local` persistence
  - Preserved scan session across tab switches and popup reopen/close cycles
  - Cleared persisted session on deliberate new-scan and successful sync completion

- [x] **F-11: AI-Powered Value Mapping Suggestions** (Completed: 2026-09-25)
  - Added `geminiSuggestLimiter` with 10 req/min IP enforcement on `POST /api/mappings/suggest-values`
  - Added 5-minute in-memory TTL cache for QuickBooks accounts, vendors, customers, and tax codes
  - Verified API, backend build, and test suite for the completed F-11 implementation

