# Feature F-11: AI-Powered Value Mapping Suggestions

**Status**: DONE (100% Implemented & Verified)
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

## 3. Implemented Controls & Limitations
1. **Rate Limiting**: `POST /api/mappings/suggest-values` now uses `geminiSuggestLimiter` with a 60-second window and a max of 10 requests per IP. Requests beyond the quota return HTTP 429 with a `Retry-After` header and an AppError message.
2. **Reference Data Caching**: `Backend/src/services/qb.service.ts` now caches `accounts`, `vendors`, `customers`, and `taxCodes` in an in-memory TTL cache for 5 minutes before re-fetching from QuickBooks. This reduces repeated Intuit API calls during value mapping suggestions while preserving the latest data on expiry.
3. **Verified Behavior**: Exact matches, fuzzy matches, confidence scoring, and response validation are in place and verified as part of the F-11 implementation.
