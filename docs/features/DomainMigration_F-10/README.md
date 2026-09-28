# F-10D: Production Domain Migration to qyra.space
Status: DONE (Completed: 2026-09-29)

## Overview
Migrated the entire codebase from legacy production domains (qyra.io, vortexsdo.com) to the registered primary production domain qyra.space, including all API, subdomain, and security configurations.

## Implementation Details
### Core Configuration Files Modified
- Frontend/src/lib/config.ts: Updated BACKEND_URL production fallback to https://api.qyra.space using nullish coalescing (??), preserving http://localhost:3000 for development.
- Frontend/manifest.json: Updated host_permissions to include https://qyra.space/*, https://api.qyra.space/*, and https://*.qyra.space/* (removing legacy qyra.io and vortexsdo.com). Updated CSP connect-src to include qyra.space endpoints and all required QuickBooks/Intuit domains (https://quickbooks.api.intuit.com and https://developer.intuit.com).
- Backend/src/index.ts: Updated CORS allowedOrigins to include qyra.space domains while preserving localhost:3000 and localhost:5173. Added origin.endsWith('.qyra.space') for wildcard subdomain support. Populated Helmet CSP connectSrc with all production and QuickBooks/Intuit origins.
- Frontend/src/popup/components/BillPreviewForm.tsx: Standardized fmt() helper to include the leading $ currency symbol, matching CheckPreviewForm, VendorCreditPreviewForm, and JournalEntryPreview.
- docs/chrome-web-store/README.md: Updated legal links to https://qyra.space/privacy and https://qyra.space/terms without trailing periods.

## Key Architectural Decisions
1. Preserved all localhost development origins across frontend config and backend CORS.
2. Wildcard subdomain support enforced via origin.endsWith('.qyra.space') in CORS callback.
3. Included all QuickBooks/Intuit API endpoints in both extension manifest CSP and backend Helmet connectSrc.
4. Maintained chrome-extension:// origin validation for browser extension requests.

## Verification Evidence
- Backend Tests: 157 passed / 157 total (npm test -- --runInBand)
- Backend Build: Exit code 0 (npm run build)
- Frontend Tests: 135 passed / 135 total (npm test run)
- Frontend Build: Exit code 0 (npm run build)
- Manifest Validation: node -e "JSON.parse(require('fs').readFileSync('Frontend/manifest.json'))" passed (MANIFEST_JSON_OK)
- Git Commit: e512ee8
