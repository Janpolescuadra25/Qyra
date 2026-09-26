# Frontend Popup Contexts Architecture

**Directory**: `Frontend/src/popup/contexts/`
**Last Updated**: 2026-09-26
**Status**: DONE (Queue State Model Implemented & Verified)

---

## 1. Core Modules

### `ScanContext.tsx` (Scan Session & Multi-Document Queue Management)
- **Status**: DONE (Extended with Multi-Document Queue Lifecycle)
- **Storage Contract**: Persists to `chrome.storage.local` using key `qyra_scan_session_v1`.
- **Key Capabilities**:
  - **Single & Multi-Entry Storage**: Holds `scanEntries: ScanEntry[]` array representing all parsed or queued documents.
  - **Queue Lifecycle States**:
    - `queued`: Ingested file waiting for OCR/extraction.
    - `scanning`: Document currently undergoing OCR or field extraction.
    - `completed`: Successfully extracted and ready for review.
    - `failed`: Extraction failed with error message recorded in `error`.
  - **Batch State Controls**:
    - `isBatchProcessing`: Indicates active queue processing.
    - `batchProgress`: Overall percentage progress across the queue.
  - **Queue Operations**:
    - `enqueueScanEntries()`: Batch enqueues raw documents into the session.
    - `updateQueueStatus()`: Transitions document status with optional error messages.
    - `removeQueueEntry()`: Removes a document from the active session queue.
    - `clearScanSession()`: Resets the entire session.
