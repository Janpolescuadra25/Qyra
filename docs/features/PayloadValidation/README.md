# Payload Validation & CustomerRef Mapping — Implementation Documentation

**Directory**: `docs/features/PayloadValidation/`
**Last Updated**: 2026-09-26
**Status**: DONE (Completed: 2026-09-26)

---

## 1. Overview
The Payload Validation feature ensures data integrity and accounting correctness when transforming scanned receipt and bill data into QuickBooks API payloads. Specifically, it resolves line-item customer reference (`customerRef`) associations and provides fallback value mapping for unmatched entities across all supported transaction types.

## 2. Architecture & Components

### Frontend
- **Payload Construction & CustomerRef Resolution**: `Frontend/src/popup/lib/batch-payload-builder.ts`
  - `buildBillLikePayload()`: Assembles scan entries into compliant QuickBooks API payloads.
  - `resolveCustomerRef()`: Matches raw customer strings against QuickBooks customer entities (`DisplayName`, `CompanyName`).
  - `resolveValueMapping()`: Provides fallback mapping paths for unmatched customer entities to ensure transactions do not fail due to missing references.
  - Supported transaction templates: Bills, Cheques, Vendor Credits, and Journal Entries.
- **Type Definitions**: `Frontend/src/types/transactions.ts`
  - Mirrors QuickBooks transaction structures with explicit typings for `QBBillLineItem.customerRef`, `accountRef`, `classRef`, and `taxCodeRef`.

### Backend
- **Type Contract**: `Backend/src/types/transactions.ts`
  - Explicit typing for `QBBillLineItem.customerRef` enforcing contract compliance.
- **Validation Layer**: `Backend/src/lib/validation.ts`
  - Pre-flight schema validation rejecting malformed payloads before dispatching to QuickBooks API.

## 3. Cross-Feature Integration & Error Handling
- **Integration with Batch Scanning (F-7)**: Multi-document batches in `ScanContext` are transformed one-by-one using `buildBillLikePayload()` before being dispatched to the QuickBooks sync endpoint.
- **Graceful Fallbacks**: If a customer string cannot be matched to an active QuickBooks customer, `resolveValueMapping()` applies the configured default customer fallback rather than halting the batch sync.
- **Pre-Flight Validation**: If required fields (e.g., account references or balanced debits/credits for journal entries) are missing, clear validation errors are surfaced in the UI before transmission, preventing QuickBooks 400 Bad Request rejections.

## 4. Verification & Test Evidence
- **Frontend Tests**: 135/135 tests passing (100% success rate).
- **Backend Tests**: 142/142 tests passing (100% success rate).
- **Frontend Build**: `npm run build` exits with code 0 (zero TypeScript errors).
