# Payload Validation & CustomerRef Mapping — Implementation Documentation

**Directory**: `docs/features/PayloadValidation/`
**Last Updated**: 2026-09-27
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
- **Type Definitions**: All mapping and transaction types are consolidated in `Frontend/src/types/index.ts` (explicit typing for `QBBillLineItem.customerRef`, `accountRef`, `classRef`, and `taxCodeRef`).

### Backend
- Payload validation occurs client-side in `Frontend/src/popup/lib/batch-payload-builder.ts` before transmission to the QuickBooks sync endpoints (`Backend/src/routes/quickbooks.ts`).
- The backend verifies payload structural integrity and handles QuickBooks API authentication and error mapping.

## 3. Cross-Feature Integration & Error Handling
- **Integration with Batch Scanning (F-7)**: Multi-document batches in `ScanContext` are transformed one-by-one using `buildBillLikePayload()` before being dispatched to the QuickBooks sync endpoint.
- **Graceful Fallbacks**: If a customer string cannot be matched to an active QuickBooks customer, `resolveValueMapping()` applies the configured default customer fallback rather than halting the batch sync.
- **Pre-Flight Validation**: If required fields (e.g., account references or balanced debits/credits for journal entries) are missing, clear validation errors are surfaced in the UI before transmission, preventing QuickBooks 400 Bad Request rejections.

## 4. Verification & Test Evidence
- **Frontend Tests**: 135/135 tests passing (100% success rate).
- **Backend Tests**: 142/142 tests passing (100% success rate).
- **Frontend Build**: `npm run build` exits with code 0 (zero TypeScript errors).
