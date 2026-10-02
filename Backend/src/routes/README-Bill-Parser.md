# 12-Column Bill Parser

This parser lives in `Backend/src/routes/templates.ts` and handles a new fixed-format Bill Excel layout alongside the legacy Bill parser.

## 12-Column Bill Excel Format Specification

The new fixed Bill parser accepts exactly 12 columns in this order:

- `Supplier`
- `Terms`
- `Bill Date`
- `Due Date`
- `Bill No`
- `Category`
- `Description`
- `Amount`
- `Tax`
- `Customer`
- `Amount Type`
- `Memo`

The header detection is case-insensitive.

Bill-level fields:
- `Supplier`
- `Terms`
- `Bill Date`
- `Due Date`
- `Bill No`
- `Amount Type`
- `Memo`

Line-item fields:
- `Category`
- `Description`
- `Amount`
- `Tax`
- `Customer`

## Grouping Rules

Rows are grouped into one transaction when they share all of these header values:

- `Bill No`
- `Supplier`
- `Terms`
- `Bill Date`
- `Due Date`
- `Amount Type`

If any bill-level field differs, a row starts a new transaction.

## Line Item Merging Rules

Within each grouped bill, duplicate line items are merged when all of these values match:

- `Category`
- `Description`
- `Tax`
- `Customer`

Matching line items are combined by summing their numeric `Amount` values.

## Output Structure

Parsed transactions are emitted as:

```json
{
  "type": "BILL",
  "header": {
    "date": "2026-08-10",
    "vendor": "Vendor A",
    "supplier": "Vendor A",
    "docNumber": "BILL-1001",
    "dueDate": "2026-08-30",
    "amountType": "Exclusive of tax",
    "taxType": "Exclusive of tax",
    "terms": "Net 30",
    "memo": "First line"
  },
  "lineItems": [
    {
      "category": "Office Supplies",
      "description": "Pens",
      "amount": "150.00",
      "tax": "Taxable",
      "customer": "Customer A",
      "postingType": "Credit"
    }
  ]
}
```

## Backward Compatibility

- The 12-column parser runs first when the header row matches the exact 12-column schema.
- If the header does not match, the route falls back to the legacy Bill parser.
- The legacy parser supports older bill formats such as `Date`, `Vendor`, `Bill No` / `Bill Number`, `Due Date`, `Account`, `Tax Type`, and `Amount`.
- It also supports optional legacy columns like `Memo`, `Terms`, `PO Number`, and `Department`.

## Validation Rules

- Header row must contain exactly 12 columns.
- Data rows must contain exactly 12 non-empty columns.
- Rows with more than 12 non-empty columns return a `400` error.
- `Amount` must parse as a numeric value.
- `Bill Date` and `Due Date` values are preserved as-is from the source file.

## Frontend Integration

The frontend Bill preview now supports the parsed 12-column format and includes customer information in each line item.

Value mapping for Bills is configured in:
- `Frontend/src/popup/components/MappingView/index.tsx`
- `Frontend/src/popup/lib/value-mapping-column-utils.ts`
