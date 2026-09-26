# Frontend Popup Components Architecture

**Directory**: `Frontend/src/popup/components/`
**Last Updated**: 2026-09-26
**Status**: DONE (Multi-Upload UI Implemented & Verified)

---

## 1. Core Modules

### `UploadZone.tsx` (Multi-Document Drag-and-Drop Ingestion)
- **Status**: DONE (100% Implemented & Verified)
- **Purpose**: Reusable drag-and-drop and file input zone for single or multi-file ingestion.
- **Accepted Formats**: Images (`.png`, `.jpg`, `.jpeg`, `.webp`), PDFs (`.pdf`), and Excel spreadsheets (`.xlsx`, `.xls`).
- **Validation**: Enforces per-file size limits (15 MB default), batch size limits (20 files max), and MIME/extension validation with inline error feedback.
- **Memory Management**: Cooperates with caller to ensure object URLs generated for image previews are revoked upon removal.

### `ScanView.tsx` (Scanning Dashboard & Document Queue)
- **Status**: DONE (Integrated with Multi-Document Queue)
- **Props Preservation**: Retains existing parent-injected props while consuming batch queue controls (`enqueueScanEntries`, `removeQueueEntry`, `isBatchProcessing`, `batchProgress`) from `ScanContext`.
- **Shared Ingestion Pipeline**: Employs `processInvoiceFile(file: File)` to support both `<input>` change events and multi-file drag-and-drop.
- **Key Capabilities**:
  - Ingests multiple documents into `ScanContext` via `enqueueScanEntries()`.
  - Visualizes real-time queue states (`queued`, `scanning`, `completed`, `failed`).
  - Displays batch progress percentage across active scans.
  - Supports individual item removal before extraction with automatic `URL.revokeObjectURL` cleanup.
  - Preserves single-file scan flow backward compatibility.

### `shared/StatusBadge.tsx`
- **Supported Statuses**: `queued`, `scanning`, `completed`, `failed`, `active`, `pending`, `syncing`, and all system lifecycle statuses.
