# Qyra — Product Roadmap
Last Updated: 2026-09-26

## Current Verified State
- **Backend Test Suite**: 22/22 suites passing and 134/134 tests passing.
- **Backend Compilation**: Clean (`npm run build` / `tsc --noEmit` exits with 0).
- **Frontend Build**: Clean (`npm run build` exits with 0, zero bundling/type errors).
- **Frontend Payload Validation**: Bill-like payloads now resolve line-item customer refs from QuickBooks customer matches or value mappings, while preserving the older fallback path when no customer list is available.
  - `buildBillLikePayload()` iterates through `scanEntry.lineItems` when present and creates `QBBillLineItem` objects with `accountRef`, `classRef`, `taxCodeRef`, and per-line `customerRef`.
  - `resolveCustomerRef()` matches raw customer strings against QuickBooks customer entities using `DisplayName`/`CompanyName`, with a `resolveValueMapping()` fallback when direct matching is unavailable.
  - `QBBillLineItem.customerRef` is now typed explicitly so the payload contract matches backend expectations for bill line-level customer associations.
- **Deployment Infrastructure**: Qyra backend provisioned on Hetzner VPS Slot 3 under PM2 with Nginx + Let's Encrypt; other repo infrastructure remains separate.
- **Scan State Hardening**: Scan state persists through popup lifecycle changes using `chrome.storage.local` and clears on deliberate reset/successful sync.

## Current Active Focus

- **F-8: Advanced Mapping Presets & User Custom Mappings**
  - Built-in catalog presets for common industry mappings.
  - Custom preset creation, duplication, and scoped access by location.
  - JSON export/import workflow and protection for built-in defaults.
  - API-backed preset lifecycle with permission and location enforcement.

## Upcoming Phases

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
1. **Immediate (F-8)**: Advanced Mapping Presets & User Custom Mappings (Backend Presets API → Preset UI Selector & Manager → Import/Export & Offline Caching).
2. **Short-term (F-9)**: Sync Analytics, Auto-Retry & Webhook Status.
3. **Medium-term (F-10)**: Chrome Web Store Submission & Launch.

## Completed Phases
- **F-5A: User QA & Verification** (Completed: 2026-09-26)
  - Validated all 4 transaction templates (Bills, Cheques, Vendor Credits, Journal Entries) with line-item CustomerRef mapping.
  - Confirmed value mapping resolution for customer entities and fallback paths.
  - Completed frontend payload validation and formal QA checklist verification.
- **F-7: Multi-Document Batch Scanning** (Completed: 2026-09-26)
  - Implemented multi-file drag-and-drop UploadZone with MIME/extension and file size validation.
  - Added scan queue drawer in ScanView with document lifecycle states (`queued`, `scanning`, `completed`, `failed`).
  - Integrated ScanContext queue helpers (`enqueueScanEntries`, `removeQueueEntry`, batch progress tracking).
  - Implemented blob URL revocation on entry removal to eliminate memory leaks.
  - Maintained full backward compatibility with single-file scanning workflows.

