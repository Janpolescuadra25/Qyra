# Feature F-06: Scan Data Flow Hardening

**Status**: DONE
**Last Updated**: 2026-09-25

---

## Overview
Phase F-06 hardens the popup scan pipeline by centralizing the live scan session and persisting it to `chrome.storage.local`. This prevents parsed scan data, selected templates, and active row state from being destroyed when the user switches tabs or reopens the extension popup.

---

## Architecture

### Centralized Scan Context
The app now uses a dedicated `ScanContext` provider located at `Frontend/src/popup/contexts/ScanContext.tsx`.

This context owns the following state:
- `scanData`
- `scanRecordId`
- `scanEntries`
- `activeScanEntryId`
- `scanMode`
- `selectedLocationId`
- `selectedTemplateForScan`

The `ScanProvider` is mounted at the top of `Frontend/src/popup/App.tsx`, replacing the previous local in-memory state in the root app component.

### Persistence Pattern
State is persisted under the storage key:

```ts
const STORAGE_KEY = 'qyra_scan_session_v1';
```

On mount, the provider reads from `chrome.storage.local` and restores the last valid session. On every state update, it writes the serialized scan session back to storage. This keeps the popup reload/resume flow stable without resetting the user mid-workflow.

---

## Lifecycle & Behavior

### Mount restoration
- If persisted scan state exists, it is read and restored into context state.
- The provider marks `isRestoring` while it loads persisted values so UI can avoid racing with hydration.

### Auto-sync
- After the initial restore completes, any change to the session state is written back to `chrome.storage.local`.
- The persisted payload captures the core scan state required for tab navigation continuity.

### Clear on reset
- `clearScanSession()` removes all in-memory scan state and deletes the persisted session key from storage.
- This is called when the user intentionally starts a new scan or after a successful sync completion.

---

## Edge Cases Handled

### Tab switching
Switching between scan, mapping, preview, and sync tabs no longer discards the active scan session because the app state now lives in a provider shared across the popup tree.

### Popup reopen / reload
When the extension popup closes and reopens, the provider restores the latest scan session from `chrome.storage.local` instead of starting from blank state.

### File object separation
File references such as `invoiceFile` and `uploadedExcelFile` are not serialized into `chrome.storage.local`, since browser `File` objects are not JSON-safe. Those file handles remain in memory while the parsed `scanData`, `scanEntries`, and template metadata are persisted.

---

## Status
**DONE (2026-09-25)**
