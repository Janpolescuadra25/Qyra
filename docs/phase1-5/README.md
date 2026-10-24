# Qyra Chrome Extension Core Architecture & Implementation Summary (Phases 1–5)

## 1. Executive Summary & Core Mission
The Qyra Chrome Extension is a high-reliability, Manifest V3 browser extension built to bridge modern Point-of-Sale (POS) interfaces directly with Intuit QuickBooks Online. Across Phases 1 through 5, the core client-side ingestion, payload generation, schema validation, mapping management, and synchronization recovery capabilities were designed, implemented, and rigorously unit-tested.

---

## 2. Architectural Overview (Manifest V3)
The extension follows Google Chrome Manifest V3 architectural requirements, isolating concerns across background workers, injected content scripts, and reactive popup contexts:

```
+-------------------------------------------------------------------------------+
|                             Chrome Browser Environment                        |
|                                                                               |
|  +---------------------------+        +------------------------------------+  |
|  |     POS Web Pages         |        |         Qyra Extension Popup       |  |
|  |  (Toast / Salido / Oracle)|        |           (React + Tailwind)       |  |
|  +-------------+-------------+        +------------------+-----------------+  |
|                |                                         |                    |
|       DOM Data Ingestion                        Mapping & State Management    |
|                |                                         |                    |
|                v                                         v                    |
|  +---------------------------+        +------------------------------------+  |
|  | Content Scripts           |        | Context & Hook Infrastructure      |  |
|  | - scanner.ts (Toast)      |        | - QBContext.tsx (OAuth State)      |  |
|  | - salido-scanner.ts       |        | - ScanContext.tsx (Extracted Data) |  |
|  | - oracle-scanner.ts       |        | - useQuickBooks.ts (Sync Engine)   |  |
|  +-------------+-------------+        +------------------+-----------------+  |
|                |                                         |                    |
|                +--------------------+--------------------+                    |
|                                     |                                         |
|                                     v                                         |
|                      +------------------------------+                         |
|                      | Background Service Worker    |                         |
|                      | (service-worker.ts)          |                         |
|                      | - Window Lifecycle Management|                         |
|                      | - OAuth Callback Delegation  |                         |
|                      | - Chrome Storage Sync        |                         |
|                      +--------------+---------------+                         |
+-------------------------------------|-----------------------------------------+
                                      | HTTPS (Bearer Token Auth)
                                      v
                       +------------------------------+
                       | Qyra Production Backend API  |
                       | (Express / Node.js on VPS)   |
                       +------------------------------+
```

---

## 3. Phase-by-Phase Component Matrix

### Phase 1: Manifest V3 Foundation & Multi-POS Ingestion
- **Manifest Specification (`Frontend/manifest.json`):**
  - Declares Manifest V3 compliance with permissions: `activeTab`, `storage`, `tabs`, `scripting`, `windows`.
  - Injected Host Permissions: `https://*.toasttab.com/*`, `https://*.salido.com/*`, `https://*.oraclerestaurants.com/*`.
  - Service Worker: `background/service-worker.js`.
- **Content Ingestion Engine (`Frontend/src/content/`):**
  - `scanner.ts`: Targeted DOM query selectors extracting sales summaries, net totals, tax lines, tip allocations, and tender splits from Toast POS report views.
  - `salido-scanner.ts`: Normalized table extraction for Salido end-of-day settlement reports.
  - `oracle-scanner.ts`: Structural DOM scraper for Oracle Hospitality / Simphony cloud reporting.

### Phase 2: Batch Scanning & Multi-Document Processing
- **Queue & Batch Processing (`docs/features/BatchScanning/README.md`):**
  - Ingests multiple receipts, daily books, and end-of-day settlement reports across distinct shifts and business days.
  - State machine lifecycle: `QUEUED` -> `PARSING` -> `VALIDATING` -> `READY_FOR_SYNC` -> `SYNCED` | `FAILED`.
  - Local caching within `chrome.storage.local` with optimistic concurrency protection.

### Phase 3: QuickBooks Payload Transformation & CustomerRef Validation
- **Payload Builders (`Frontend/src/popup/lib/`):**
  - `batch-payload-builder.ts`: Aggregates scanned POS records into standardized Intuit API payload structures.
  - `je-builder.ts`: Generates double-entry balanced Journal Entries enforcing fundamental accounting invariants (`Debit Sum == Credit Sum`).
  - `api.ts`: Typed API client handling authenticated proxy requests to backend endpoints (`/api/quickbooks/*`).
- **Validation Engine (`docs/features/PayloadValidation/README.md`):**
  - In-flight schema assertions ensuring required QuickBooks properties (`AccountRef`, `CustomerRef`, `DepartmentRef`, `ClassRef`) are non-empty.
  - Dynamic fallback mappings: Automatically redirects unmatched customer transactions to configured default clearing accounts.

### Phase 4: Preset Management & Custom Account Mapping
- **Mapping Management (`Frontend/src/popup/components/PresetManagerModal.tsx`):**
  - Enables hospitality operators to create, name, duplicate, and assign reusable accounting presets.
  - Links POS category codes (e.g., "Food Sales", "Beverage Sales", "Tips Payable", "Cash Over/Short") directly to specific Chart of Accounts (COA) numbers.
  - `MappingView/index.tsx`: Interactive preview grid allowing operators to inspect and adjust line items before committing sync requests.

### Phase 5: Resilience, Auto-Retry, & Sync Recovery
- **Error Boundaries & Feedback (`Frontend/src/popup/components/`):**
  - `ErrorBoundary.tsx`: React error boundary capturing UI crashes and presenting actionable debugging details without freezing the extension window.
  - `ErrorCard.tsx`: Reusable error display component surfacing transient API errors, expired OAuth tokens, and rate limits.
- **Auto-Retry & Circuit Breaking (`docs/features/AutoRetryFoundation/README.md`):**
  - Exponential backoff retry logic for transient 429 (Rate Limit) and 5xx network interruptions.
  - Persistent failure queue with automated alerts and dead-letter queue inspection via backend cron infrastructure.

---

## 4. Test Verification & Quality Gates
The core architecture is verified through extensive automated test suites:
- **Unit Test Suites (`Frontend/src/popup/lib/__tests__/`):**
  - 14+ unit test suites covering batch payload building, journal entry balance validation, preset mapping serialization, and token lifecycle management.
- **Backend Quality Gates (`Backend/`):**
  - Strict TypeScript compilation (`tsc --noEmit`).
  - 28 test suites / 164 passing Jest tests verifying API routes, error handlers, retry queues, and Stripe billing safety guards.
