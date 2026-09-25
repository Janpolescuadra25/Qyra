# Frontend Popup Library Architecture

**Directory**: `Frontend/src/popup/lib/`
**Last Updated**: 2026-09-26
**Status**: DONE (100% Implemented & Verified)

---

## 1. Core Modules

### `batch-payload-builder.ts` (QuickBooks Transaction Payload Construction)
- **Status**: DONE (Verified across Cheques, Bills, Vendor Credits, and Journal Entries)
- **Purpose**: Transforms raw UI/scan entries into strict QuickBooks Online API payload contracts before batch synchronization via `/api/quickbooks/sync-batch`.
- **Key Functions**:
  - `buildBillLikePayload()`:
    - Constructs valid payloads (`BatchSyncItem`) for `Bill` and `VendorCredit` transaction types.
    - Resolves vendor reference from invoice headers.
    - Iterates over `scanEntry.lineItems` when present to build `QBBillLineItem` objects with `accountRef`, `classRef`, `taxCodeRef`, and per-line `customerRef`.
    - Supports backward-compatible fallback when `scanEntry.lineItems` is omitted.
  - `buildChequePayload()`:
    - Constructs valid `Cheque` payloads with bank account reference and line-item expense details.
    - Resolves cheque header customer reference using value mappings.
  - `buildJournalEntryPayload()`:
    - Constructs balanced debits and credits from scanned entries.
    - Validates that total debits match total credits prior to submission.
  - `resolveCustomerRef()`:
    - Matches raw customer strings against QuickBooks customer entities (`DisplayName`/`CompanyName`) with fallback to `resolveValueMapping`.
    - Returns a valid `customerRef` object with QB entity ID and display name if a match is found; returns `undefined` to preserve fallback behavior.
