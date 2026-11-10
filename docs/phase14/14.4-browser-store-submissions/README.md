# Phase 14.4: Browser Store Submissions & Release Distribution

## 1. Overview
This deliverable standardizes package generation, security verification, and release tracking for Qyra's browser extension across Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari.

**Status:** DONE (Verified & Packaged)

## 2. Release Packages Manifest
Store-ready production extension packages are built and maintained under `Frontend/releases/` (generated via `npm run package:all`):
- **Chrome Web Store**: `qyra-extension-chrome.zip` (Published ID: `bfhobnahngcmhaeklihifgfbgdepibii`)
- **Microsoft Edge Add-ons**: `qyra-extension-edge.zip`
- **Firefox Add-ons (AMO)**: `qyra-extension-firefox.zip`
- **Apple Safari**: `qyra-extension-safari.zip`

## 3. Security & Store Compliance Invariants
- **Manifest V3 Compliance**: Service-worker background scripts, declarative net requests, strict CSP without unsafe-eval.
- **Extension Gateway Whitelist**: Backend enforces CORS and origin verification matching allowed extension IDs (`ALLOWED_EXTENSION_ID=ccghhfmkjbcakhnoamgihifonfiammoc`).
- **Zero Third-Party Tracking**: No analytical tracking scripts embedded in extension runtime.

## 4. Store Submission & Automation Workflow
1. Increment extension version in `Frontend/manifest.json`.
2. Generate all distribution archives: `npm run package:all` (executes `build:all` across all browsers and packages via `scripts/package.js`).
3. Output archives are generated into `Frontend/releases/` (ignored by git to prevent repository bloat).
4. **CI/CD Automation**: GitHub Actions workflow (`.github/workflows/release.yml`) triggers on version tag pushes (`v*`) to build and attach all 4 ZIP archives to the GitHub release.
5. Upload distribution ZIPs to Chrome Web Store Developer Dashboard, Microsoft Partner Center, and Mozilla Add-on Developer Hub.
