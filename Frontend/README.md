# Qyra Frontend Chrome Extension
**Status: DONE (Verified October 2026)**

## Architecture & Structure
- Built with React, TypeScript, and Manifest V3.
- src/popup/: Full React UI with 40+ components/views (Dashboard, Scans, Mappings, Settings).
- src/content/: 3 scanner content scripts (Toasttab: scanner.ts, Salido: salido-scanner.ts, Oracle: oracle-scanner.ts).
- src/background/: service-worker.ts managing extension lifecycle and messaging.
- scripts/build.js & scripts/package.js: Build pipeline producing dist/ and qyra-extension.zip.

## Key Implementation Details
- Production URL: VITE_BACKEND_URL=https://api.qyra.space configured in .env.production.
- Package script: npm run package compiles assets and creates qyra-extension.zip (1555.59 KB).
- Tests: 135/135 frontend tests passing.

## Usage
- Development: npm run build:watch
- Production build: npm run package
- Load unpacked extension in Chrome from dist/ directory.
