# Phase 14.4: Browser Store Submissions & Release Distribution

## 1. Overview
This deliverable standardizes package generation, security verification, and release tracking for Qyra's browser extension across Google Chrome, Microsoft Edge, and Mozilla Firefox.

## 2. Release Packages Manifest
Store-ready production extension packages are built and maintained under `Frontend/releases/`:
- **Chrome Web Store**: `qyra-extension-chrome.zip` (Published ID: `bfhobnahngcmhaeklihifgfbgdepibii`)
- **Microsoft Edge Add-ons**: `qyra-extension-edge.zip`
- **Firefox Add-ons (AMO)**: `qyra-extension-firefox.zip`

## 3. Security & Store Compliance Invariants
- **Manifest V3 Compliance**: Service-worker background scripts, declarative net requests, strict CSP without unsafe-eval.
- **Extension Gateway Whitelist**: Backend enforces CORS and origin verification matching allowed extension IDs (`ALLOWED_EXTENSION_ID=ccghhfmkjbcakhnoamgihifonfiammoc`).
- **Zero Third-Party Tracking**: No analytical tracking scripts embedded in extension runtime.

## 4. Store Submission & Update Workflow
1. Increment extension version in `Frontend/manifest.json`.
2. Generate distribution archives via build script: `npm run build:extension`.
3. Verify output archives under `Frontend/releases/`.
4. Upload distribution ZIP to Chrome Web Store Developer Dashboard and Microsoft Partner Center.