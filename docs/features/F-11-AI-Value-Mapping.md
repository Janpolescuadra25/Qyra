# Feature F-11: AI-Powered Value Mapping Suggestions

**Status**: PARTIALLY COMPLETED (Core Logic & Endpoint Implemented)
**Last Updated**: 2026-09-25
**Related Modules**:
- `Backend/src/routes/mappings.ts`
- `Backend/src/lib/gemini.ts`
- `Frontend/src/popup/components/MappingView/MappingFilters.tsx`

---

## 1. Overview
Feature F-11 provides intelligent, automated value mapping suggestions for transaction imports. When importing scanned documents (e.g., Cheques, Bills, Vendor Credits, Journal Entries), scanned values must be mapped to QuickBooks entity references (Vendor, Customer, Account, Terms, Tax Code).

---

## 2. Implemented Architecture & Endpoints

### Backend Endpoint: `POST /api/mappings/suggest-values`
- **Location**: `Backend/src/routes/mappings.ts` (Lines 260–322)
- **Purpose**: Accepts scanned column values and target QuickBooks entity lists, then invokes Gemini models to generate confidence-ranked value mappings.
- **Request Payload**:
```json
{
  "templateId": "string",
  "valueCategories": [
    {
      "sourceField": "string",
      "fieldType": "string",
      "scannedValues": ["string"]
    }
  ]
}
```
- **Response**: Array of suggested mappings with confidence scores and reasoning.

### Fuzzy Matching Engine: `suggestValueMappings()`
- **Location**: `Backend/src/lib/gemini.ts` (Lines 764–895)
- **Logic**: Uses structured Gemini prompts to compare messy scanned strings against official QuickBooks names, accounting for abbreviations, OCR typos, and formatting differences.

---

## 3. Current In-Progress Items & Limitations
1. **Rate Limiting**: Route currently relies on upstream 429 error handling; in-process route rate limiting is pending.
2. **Reference Data Caching**: QuickBooks reference entities are retrieved per request; Redis or in-memory TTL caching will be added to minimize API calls to Intuit.
