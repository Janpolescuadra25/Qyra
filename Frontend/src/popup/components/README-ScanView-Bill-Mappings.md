# ScanView Bill Default Column Mappings
## Status: DONE (verified 2026-08-27)

### Overview
Adds `BILL_DEFAULT_COLUMN_MAPPINGS` to ScanView.tsx, unblocking 12-column Bill Excel scanning. Previously, Bill templates showed "This template has no column mapping configured" and disabled the Parse button. Now Bill behaves identically to Cheque — users can scan directly without pre-configuration.

### Files Modified
- `Frontend/src/popup/components/ScanView.tsx`
  - Added `BILL_DEFAULT_COLUMN_MAPPINGS` constant (lines 114-128) with all 12 required columns
  - Extended `effectiveColumnMappings` useMemo (lines 408-416) to return Bill defaults for `transactionType === 'BILL'`

### Implementation Pattern
Mirrors the existing Cheque pattern exactly:
- `CHEQUE_DEFAULT_COLUMN_MAPPINGS` (lines 100-112) → `BILL_DEFAULT_COLUMN_MAPPINGS` (lines 114-128)
- Same type: `Record<string, string>`
- Same guard in useMemo: empty check with `console.warn`, then return defaults
- Same 1:1 key/value mapping (column header maps to itself)

### BILL_DEFAULT_COLUMN_MAPPINGS Columns
Supplier | Terms | Bill Date | Due Date | Bill No. | Category | Description | Amount | Tax | Customer | Amount Type | Memo

### How It Unblocks Scanning
- `effectiveColumnMappings` now returns 12 keys for BILL templates
- Warning condition (line 1237): `Object.keys(...).length === 0` → false → no warning
- Parse button guard (line 1256): same check → false → button enabled
- No changes needed to the warning or parse button conditions themselves

### Backward Compatibility
- Cheque/JE workflows completely unchanged
- Non-12-column Bill Excel files: scan is unblocked but backend parser rejects invalid formats with clear error
- Image/PDF Bill scans: unaffected (different upload flow)

### Validation
- `npx tsc --noEmit` passes with zero errors
