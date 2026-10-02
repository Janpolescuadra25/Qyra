# Bill 12-Column Fixed-Format Banner Implementation
## Status: DONE (updated 2026-08-28)

### Overview
Hides the editable "Column Roles — Line Items" section for 12-column Bill Excel files, replacing it with a fixed-format info banner that matches the existing Cheque/JE UI pattern. Users no longer see or interact with column mapping configuration for standard 12-column Bill spreadsheets.

### Files Modified
- `Frontend/src/popup/components/MappingView/index.tsx`
  - Added `isBill12Col` detection constant (lines ~543-551)
  - Updated banner condition to include `isBill12Col` (line ~2195)
  - Added Bill-specific banner header: "Fixed format required (12 columns)"
  - Added Bill-specific banner content with 12-column list (lines ~2208-2212)

### Detection Logic
`isBill12Col` now uses `selectedTemplate?.transactionType === 'BILL'` — matching the `isCheque`/`isJE` pattern and requiring no parsed file data. The amber banner shows immediately upon selecting a Bill>Excel template.

This matches ScanView.tsx `effectiveColumnMappings` behavior for Bill templates and avoids dependency on `activeScanEntry`.

### UI Behavior
- Shows amber warning banner (`bg-amber-50 border-amber-200`) with "Fixed format required (12 columns)"
- Lists the exact required column order: `Supplier | Terms | Bill Date | Due Date | Bill No. | Category | Description | Amount | Tax | Customer | Amount Type | Memo`
- No editable dropdowns, no "Save Column Roles" button, no "0 selected" counter
- Uses Cheque-style `<div>` wrapper (not JE's `<pre>` wrapper) since it's a single-line column list

### Related Components
- **Auto-apply useEffect** (lines 585-629): Silently sets `localColMap` with `{ productColumn: 'category', amountColumn: 'amount', descriptionColumn: 'description', taxCodeColumn: 'tax' }` — the banner hides the UI but the mappings are still applied for downstream sync
- **Value mapping useEffect** (lines 634+): Independently handles vendor/terms defaults — unaffected by this change
- **`isSectionVisible('columnMapping', ...)`** in `scan-mode-utils.ts`: Still returns `true` for all EXCEL mode — the local `isBill12Col` condition handles the hide logic within MappingView
- **Backend parser**: `Backend/src/routes/templates.ts` (line 416) — converts all headers to lowercase before validation, guaranteeing the frontend's exact-case checks work correctly

### Backward Compatibility
- Legacy Bill Excel files without `category`/`customer` headers → `isBill12Col` is `false` → editable column roles section still shown
- Bill from image/PDF → source is not `excel` → entire column mapping section hidden by `isSectionVisible`
- Cheque and JE banners remain completely unchanged

### Validation
- `npx tsc --noEmit` passes with zero errors
