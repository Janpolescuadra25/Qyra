# Vendor Credit Excel — Fixed-Format Banner & Value Mappings
## Status: DONE (updated 2026-08-28)

### Overview
Adds complete Vendor Credit Excel support in the frontend mapping flow. This includes both the fixed-format banner on the Map tab and the Vendor Credit Value Mappings section for Excel templates. Vendor Credit templates now use default column mappings automatically and render the same consistent UX pattern as Bill and Cheque.

### Files Modified
- `Frontend/src/popup/components/ScanView.tsx`
  - Added `VENDOR_CREDIT_DEFAULT_COLUMN_MAPPINGS` constant
  - Extended `effectiveColumnMappings` useMemo to return Vendor Credit defaults for `transactionType === 'VENDOR_CREDIT'`
  - Added Scan tab format guidance for Vendor Credit Excel
- `Frontend/src/popup/components/MappingView/index.tsx`
  - Added `isVendorCredit` to the amber fixed-format banner condition
  - Added Vendor Credit banner content with the exact required 12-column list
  - Added `buildVendorCreditColumnConfigs` import from `value-mapping-column-utils`
  - Added `vendorCreditColumnConfigs` useMemo after `billColumnConfigs`
  - Added `Vendor Credit Value Mappings` JSX block rendering `ValueMappingSection` components
- `Frontend/src/popup/lib/value-mapping-column-utils.ts`
  - Added `buildVendorCreditColumnConfigs` factory function mirroring the Bill value mapping pattern

### Detection Logic
`isVendorCredit` uses `selectedTemplate?.transactionType === 'VENDOR_CREDIT'` — matching the `isCheque`/`isJE`/`isBill12Col` pattern. No parsed file data is required for the banner to display.

### UI Behavior
- Shows amber warning banner (`bg-amber-50 border-amber-200`) with "Fixed format required (12 columns)"
- Lists the exact required column order: `Supplier | Terms | Credit Date | Due Date | Credit No. | Category | Description | Amount | Tax | Customer | Amount Type | Memo`
- Renders a Vendor Credit Value Mappings section for Excel templates when `isVendorCredit && activeScanMode === 'EXCEL' && selectedTemplateId`
- Uses the shared `ValueMappingSection` component for each mapped field
- No editable dropdowns, no "Save Column Roles" button, no "0 selected" counter in the fixed-format banner state

### Value Mappings Implementation
- Added `buildVendorCreditColumnConfigs` to `Frontend/src/popup/lib/value-mapping-column-utils.ts`
  - Reuses the existing `BillColumnOptions` interface
  - Returns 9 mapped fields: `vendorRef`, `apAccountRef`, `termsRef`, `supplier`, `terms`, `category`, `tax`, `customer`, `amountType`
- Updated `Frontend/src/popup/components/MappingView/index.tsx`
  - Imported `buildVendorCreditColumnConfigs` from `value-mapping-column-utils`
  - Added `vendorCreditColumnConfigs` useMemo after the Bill configs
  - Uses the same options and dependency pattern as `billColumnConfigs`
- Added a new JSX block rendered when Vendor Credit is active in Excel mode:
  - Section heading: "Vendor Credit Value Mappings"
  - Subtitle: "Map each vendor credit header field to the correct QuickBooks target"
  - Maps over `vendorCreditColumnConfigs` to render `ValueMappingSection` components
  - Reuses the shared `ValueMappingSection` component already used by Bill and Cheque

### Related Components
- `value-mapping-column-utils.ts` — added `buildVendorCreditColumnConfigs`; vendor credit mirrors Bill and Cheque factory patterns
- `MappingView/index.tsx` — imports the new factory, creates `vendorCreditColumnConfigs`, and renders the Vendor Credit value mappings section
- `ValueMappingSection.tsx` — shared component used for Bill, Cheque, and Vendor Credit value mappings
- `buildBillColumnConfigs` — pattern that Vendor Credit mirrors for options, target lists, and field config structure

### Validation
- `npx tsc --noEmit` passes with zero errors
