# Popup Contexts Architecture

**Directory**: `Frontend/src/popup/contexts/`
**Last Updated**: 2026-09-25
**Status**: DONE (Verified in Phase F-6)

---

## 1. Overview
This directory houses global React Context providers for the Chrome extension popup. Because Chrome extension popups unmount when closed or during tab transitions, contexts in this folder handle cross-view state sharing and persistence.

---

## 2. Context Inventory

### 1. `QBContext.tsx`
- **Purpose**: Manages QuickBooks Online connection state, realm ID, company name, and OAuth token validity.
- **Hook**: `useQBContext()`
- **Lifecycle**: Initializes on popup open; validates token expiration against backend `/api/quickbooks/status`.

### 2. `ScanContext.tsx`
- **Purpose**: Centralizes active scan session state, eliminating data loss when navigating between extension tabs or reopening the popup.
- **Hook**: `useScanContext()`
- **Storage Key**: `qyra_scan_session_v1` (stored via `chrome.storage.local`)
- **Managed State**:
  - `scanData`: Parsed document rows and extracted header/line item values.
  - `scanRecordId`: Backend database record ID for the current scan.
  - `scanEntries`: Array of scan line items.
  - `activeScanEntryId`: Currently selected/active entry ID.
  - `scanMode`: Active scan source (`pos`, `excel`, `invoice`).
  - `selectedLocationId`: Active location reference.
  - `selectedTemplateForScan`: Active template schema.
  - `isRestoring`: Boolean flag indicating initial restoration from storage.
- **Lifecycle**:
  - *Mount*: Restores persisted session from `chrome.storage.local`.
  - *State Update*: Debounced write to `chrome.storage.local`.
  - *File Object Separation*: In-memory browser `File` handles (`invoiceFile`, `uploadedExcelFile`) are preserved in memory and excluded from JSON serialization.
  - *Clear*: `clearScanSession()` resets state and purges storage key upon sync completion or deliberate new scan.
- **Full Specification**: See `docs/features/F-06-Scan-Data-Flow-Hardening.md`.
