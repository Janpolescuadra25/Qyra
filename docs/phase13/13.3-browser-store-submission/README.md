# Deliverable 13.3: Browser Extension Store Submission Handbook

## Status: IN PROGRESS (Release Bundles Verified & Store Submission Handbook Completed)
**Milestone Date:** 2026-10-31  
**Extension Version:** `1.0.2` (Manifest V3)  
**Package Directory:** `Frontend/releases/`  

---

## 1. Overview & Architectural Intent
Deliverable 13.3 governs the release verification, compliance auditing, and multi-browser store submission of the Qyra Financial Automation web extension. Qyra enables accountants, bookkeepers, and retail/hospitality business owners to automatically capture point-of-sale (POS) settlement reports, invoices, and payment data directly from browser tabs and sync transactions to QuickBooks Online via AI-driven extraction.

---

## 2. Multi-Browser Release Bundles & Integrity Hashes
All extension packages are immutable release artifacts verified against the production Manifest V3 configuration without source maps or development dependencies.

| Browser Target | Release Bundle File | Target Store | Manifest Variant | Release Status |
|---|---|---|---|---|
| **Google Chrome** | `qyra-extension-chrome.zip` | Chrome Web Store | Manifest V3 (Standard) | **Packaged & Verified** |
| **Microsoft Edge** | `qyra-extension-edge.zip` | Microsoft Edge Add-ons | Manifest V3 (Edge compatible) | **Packaged & Verified** |
| **Mozilla Firefox** | `qyra-extension-firefox.zip` | Firefox Add-ons (AMO) | Manifest V3 (Gecko) | **Packaged & Verified** |
| **Apple Safari** | `Frontend/build/safari` | Mac App Store (Safari) | Safari Web Extension | **Pending macOS/Xcode Conversion** |

### Integrity Verification Protocol:
Compute and verify SHA-256 checksums prior to dashboard upload:
```powershell
Get-FileHash -Path Frontend/releases/*.zip -Algorithm SHA256
```

---

## 3. Store Listing Metadata & Copy

### General Extension Metadata:
- **Extension Name:** `Qyra — Financial Automation`
- **Short Description (max 132 chars):**  
  `Automatically scan POS reports and invoices, extract financial transactions with AI, and sync them directly to QuickBooks Online.`
- **Primary Category:** Productivity / Financial Tools
- **Secondary Category:** Workflow & Business Operations
- **Support & Documentation URL:** `https://qyra.space`
- **Privacy Policy URL:** `https://qyra.space/privacy`
- **Terms of Service URL:** `https://qyra.space/terms`

### Detailed Store Description:
```text
Qyra simplifies bookkeeping and reconciliation for businesses running modern Point of Sale (POS) and merchant systems. 

Key Capabilities:
• Instant Settlement Extraction: Automatically reads daily close-out and shift settlement reports across leading POS platforms (Toast, Square, Clover, Lightspeed).
• High-Accuracy Financial Parsing: Powered by intelligent document-parsing algorithms designed specifically for merchant processing statements, card breakdowns, fees, cash payouts, and sales taxes.
• One-Click QuickBooks Online Sync: Push structured journal entries and daily sales summaries directly into QuickBooks Online without manual double-entry.
• Bank-Grade Security: End-to-end HTTPS transmission with AES-256 database token encryption. Your credentials and financial transactions remain strictly confidential.

Designed for business owners, CPAs, accounting departments, and multi-location operators who want to eliminate manual data entry.
```

---

## 4. Permissions Justification Ledger (Single Purpose Principle)
Every declared permission in `Frontend/manifest.json` satisfies the least-privilege principle and adheres strictly to store developer policies:

| Permission | Purpose & Technical Justification | Store Policy Compliance |
|---|---|---|
| `storage` | Stores user authentication sessions, active organization ID, user interface preferences, and local report scan caches. | Data stored locally in extension sandbox; no third-party sharing. |
| `activeTab` | Grants temporary script access to the active merchant dashboard tab only when the user explicitly clicks the Qyra extension action icon. | Complies with Chrome/Firefox user-gesture security policy. |
| `tabs` | Required to detect navigation events on supported accounting and POS authentication callback URLs during initial setup. | Read-only URL inspection restricted to authorized OAuth flows. |
| `scripting` | Programmatically executes report table extraction scrapers on supported POS settlement dashboards. | Scripts executed dynamically only upon user confirmation. |
| `windows` | Opens dedicated, isolated review modals and authentication popups during QuickBooks Online OAuth authorization. | Necessary for secure external authentication windows. |

### Host Permissions Justification:
Host permissions are strictly limited to necessary functional endpoints (no `<all_urls>`):
- `https://*.toasttab.com/*`, `https://*.squareup.com/*`, `https://*.clover.com/*`, `https://*.lightspeedhq.com/*`: POS report extraction targets.
- `https://qyra.space/*`, `https://api.qyra.space/*`: API backend for auth and synchronization.
- `https://js.stripe.com/*`: Subscription checkout and tax verification.
- `https://*.sentry.io/*`: Production telemetry and error tracking.

---

## 5. Visual Asset Specifications & Quality Checklist
All visual assets must meet official browser store resolution, aspect ratio, and padding requirements:

### Extension Icons (in `Frontend/public/icons/`):
- [x] `icon16_qyra.png`: 16x16 px (Favicon and extension action bar)
- [x] `icon48_qyra.png`: 48x48 px (Extension management page `chrome://extensions`)
- [x] `icon128_qyra.png`: 128x128 px (Web store listing and installation dialog)

### Store Promotional Assets (dashboard-ready and staged in `Frontend/public/store-assets/`):
- [x] **Small Promo Tile:** 440x280 px (PNG, no transparency, high-contrast brand mark) - Established in `Frontend/public/store-assets/small-promo-tile.png`
- [x] **Marquee Banner:** 1400x560 px (PNG, hero background graphic for featured collection) - Established in `Frontend/public/store-assets/marquee-banner.png`
- [x] **Screenshots (5 minimum):** 1280x800 px (PNG) - Established in `Frontend/public/store-assets/screenshot-1.png` through `screenshot-5.png`:
  1. POS report auto-detection on active tab
  2. Transaction table preview and AI line-item classification
  3. QuickBooks Online chart of accounts mapping screen
  4. Multi-location summary and daily settlement totals
  5. One-click sync confirmation with audit log reference

---

## 6. Store-by-Store Submission Checklists

### A. Chrome Web Store (CWS) Developer Dashboard
- [ ] Sign in to Chrome Web Store Developer Console (`https://chrome.google.com/webstore/devconsole`).
- [ ] Upload `Frontend/releases/qyra-extension-chrome.zip`.
- [ ] Complete Store Listing tab: Description, Icons, Screenshots, Categories.
- [ ] Complete Privacy tab:
  * Single purpose: "Financial transaction capture and accounting synchronization."
  * Check declared permissions and paste justification text from Section 4.
  * Certify that extension does not sell user data, use data for credit/lending, or use data for advertising.
- [ ] Submit for review.

### B. Microsoft Edge Partner Center
- [ ] Sign in to Microsoft Partner Center (`https://partner.microsoft.com/dashboard/microsoftedge`).
- [ ] Create new submission and upload `Frontend/releases/qyra-extension-edge.zip`.
- [ ] Import store listing and promotional assets.
- [ ] Add privacy policy URL (`https://qyra.space/privacy`).
- [ ] Submit for certification.

### C. Mozilla Add-ons (AMO) Developer Hub
- [ ] Sign in to Mozilla Add-on Developer Hub (`https://addons.mozilla.org/developers/`).
- [ ] Submit a new Add-on: upload `Frontend/releases/qyra-extension-firefox.zip`.
- [ ] Source Code Submission Note: Provide clean archive of `Frontend/src/` with `npm run build:firefox` build instructions if requested by AMO reviewers for minified JS inspection.
- [ ] Complete listing details and submit for human review.

### D. Apple Safari Web Extension Conversion (macOS Environment Required)
- [ ] In a macOS environment with Xcode installed, run:
  ```bash
  xcrun safari-web-extension-converter Frontend/build/safari --app-name "Qyra" --bundle-identifier "com.qyra.extension"
  ```
- [ ] Open generated project in Xcode.
- [ ] Configure signing certificates with Apple Developer Team ID.
- [ ] Build, notarize, and archive for Mac App Store distribution.

---

## 7. Reviewer Test Account & Demo Protocol
Provide testing guidance in developer console review notes:
- **Test User Credentials:** Use dedicated pre-configured test account provisioned in production test mode.
- **Test Environment:** Production test mode enabled with Stripe automated tax validation.
- **Sample Data:** Test POS settlement PDF and HTML report fixtures located in test repository.
- **Support Contact:** Direct contact via verified domain support channels.

---

## 8. Post-Submission Review & Release Tracking
| Store | Submission Date | Review Status | Version | Reviewer Feedback / Resolution | Live URL |
|---|---|---|---|---|---|
| Chrome Web Store | Pending | Awaiting Submission | 1.0.2 | — | — |
| Microsoft Edge | Pending | Awaiting Submission | 1.0.2 | — | — |
| Mozilla AMO | Pending | Awaiting Submission | 1.0.2 | — | — |
| Apple Safari | Pending | Awaiting macOS/Xcode Conversion | 1.0.2 | — | — |