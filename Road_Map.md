# Qyra — Product Roadmap
Last Updated: 2026-09-25

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

- **F-7: Multi-Document Batch Scanning**
  - Queue state model and document lifecycle tracking.
  - Multi-upload ingestion and batch session persistence.
  - Progress tracking and per-document processing status.
  - Batch review and sync orchestration for queued documents.

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
1. **Immediate (F-7)**: Multi-Document Batch Scanning (Queue State Model → Multi-Upload UI → Queue Processing → Batch Review & Sync).
2. **Short-term (F-8)**: Advanced Mapping Presets & User Custom Mappings.
3. **Medium-term (F-9 → F-10)**: Sync Analytics, Auto-Retry, and Chrome Web Store Launch.

## Completed Phases
- **F-5A: User QA & Verification** (Completed: 2026-09-26)
  - Validated all 4 transaction templates (Bills, Cheques, Vendor Credits, Journal Entries) with line-item CustomerRef mapping.
  - Confirmed value mapping resolution for customer entities and fallback paths.
  - Completed frontend payload validation and formal QA checklist verification.

