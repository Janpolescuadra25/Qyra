# Cheque Parser README

## 11-Column Cheque Excel Format Specification

The backend CHEQUE parser expects exactly 11 columns in this order:

1. `payee`
2. `bank account`
3. `payment date`
4. `check no.`
5. `category`
6. `description`
7. `amount`
8. `tax`
9. `customer`
10. `qb memo`
11. `tax type`

Header validation is case-sensitive after trimming. The parser converts header cells to lowercase for comparison, so the expected header strings are exactly the lowercased values listed above.

All 11 columns are required in the header row.

## Parsing Logic

- The CHEQUE parser runs for templates with `transactionType === 'CHEQUE'`.
- The parser requires at least a header row plus one data row.
- The header row must contain exactly 11 columns.
- The parser validates each header column against the exact expected lowercased labels.
- Each non-empty data row becomes one transaction.
- Rows with an empty row (all blank cells) are skipped.
- Rows with a non-numeric `amount` value are skipped and counted in `skippedRows`.

Column mapping by index:

- Column 1 → `payeeName`
- Column 2 → `bankAccount`
- Column 3 → `paymentDate`
- Column 4 → `checkNo`
- Column 5 → `category`
- Column 6 → `description`
- Column 7 → `amount`
- Column 8 → `tax`
- Column 9 → `customer`
- Column 10 → `memo`
- Column 11 → `taxType`

## Output Structure

A parsed CHEQUE transaction is returned as:

```json
{
  "type": "CHEQUE",
  "header": {
    "payeeName": "Acme Supplies",
    "bankAccount": "Checking 1234",
    "paymentDate": "2026-08-21",
    "checkNo": "1001"
  },
  "lineItems": [
    {
      "payeeName": "Acme Supplies",
      "bankAccount": "Checking 1234",
      "paymentDate": "2026-08-21",
      "checkNo": "1001",
      "category": "Office Supplies",
      "description": "Printer ink",
      "amount": "120.00",
      "tax": "Taxable",
      "customer": "Customer A",
      "memo": "August order",
      "taxType": "NonTaxable"
    }
  ]
}
```

The endpoint response includes:

- `transactions`: array of CHEQUE transactions
- `totalRows`: number of rows processed excluding the header row
- `skippedRows`: number of invalid or blank rows skipped

## Validation Rules

- Header row must contain exactly 11 columns.
- Header labels must exactly match the expected lowercase strings after trimming.
- The file must include at least one data row after the header.
- Rows with non-numeric `amount` values are skipped, not returned as transactions.
- Blank rows are skipped.

Errors returned by the backend include:

- `Cheque file must contain at least a header row and one data row.`
- `Cheque file must have exactly 11 columns per row. Found X columns.`
- `Header mismatch: Column N: expected "...", found "..."`

## Frontend Integration

- `CheckPreviewForm.tsx` auto-populates cheque form header fields from parsed `transaction.header` values.
- Each CHEQUE transaction is displayed as an individual preview card with one line item.
- For full frontend workflow details, see `Frontend/src/popup/components/CHEQUE_SCAN_FLOW.md`.

## Status

- DONE: Backend CHEQUE parser implemented and documented.
