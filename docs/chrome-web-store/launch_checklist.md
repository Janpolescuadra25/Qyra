# Chrome Web Store Launch Checklist & Listing Metadata
**App Name:** Qyra - POS to QuickBooks Automation
**Extension Version:** 1.0.2
**Manifest Version:** Manifest V3
**Target Category:** Productivity / Accounting & Finance
**Last Updated:** October 2026

---

## 1. Store Listing Copy

### Title (Max 45 chars)
Qyra: POS to QuickBooks Sync & Automation

### Short Summary / Description (Max 132 chars)
Seamlessly scan invoices, map POS categories, and sync bills and journal entries directly into QuickBooks Online with one click.

### Detailed Description
Qyra bridges the gap between restaurant POS platforms and QuickBooks Online. Designed specifically for multi-location operators, hospitality accountants, and bookkeepers, Qyra eliminates manual data entry, transcription errors, and end-of-day reconciliation delays.

**Key Features:**
- **Instant POS Scanning:** Automatic OCR extraction from POS daily sales summaries, invoices, and checkout reports (Toast, Salido, Oracle Restaurants).
- **Intelligent Entity & Chart of Accounts Mapping:** Rule-based matching for vendors, expense categories, payment tenders, and tax lines.
- **Location-Scoped Presets:** Save, clone, and export mapping presets across multiple store branches or concepts.
- **12-Column Fixed-Format Parsers:** Native support for fixed-format Bills, Cheques, and Vendor Credits.
- **Audit-Proof Sync:** Direct API integration with QuickBooks Online featuring strict idempotency keys to guarantee zero duplicate transactions.
- **Failure Alerts & Logging:** Automated detection and alerts for sync exceptions with detailed transaction status tracking.

### Support & Contact Information
- **Support Email:** support@qyra.space
- **Privacy Policy URL:** https://qyra.space/privacy
- **Terms of Service URL:** https://qyra.space/terms

---

## 2. Single Purpose & Permissions Justification

### Single Purpose Statement
To extract sales and invoice data from supported point-of-sale (POS) web portals and automate the synchronization of bills, payments, and journal entries into QuickBooks Online.

### Permissions Justification
- `activeTab`: Used strictly when the user clicks the extension popup on a supported POS report tab to extract table data and invoice text for processing.
- `storage`: Used to persist local user UI preferences, active session tokens, and location mapping selections securely within the browser.
- `tabs`: Used to detect when a supported POS URL is active and display the relevant scan action banner.
- `scripting`: Used to inject deterministic content extractors on authorized POS portals to parse document figures into standardized payloads.
- `windows`: Used to open focused OAuth authorization popups for QuickBooks and Stripe connections.
- `host_permissions`: Strictly limited to Qyra backend APIs and authorized POS domains (Toast, Salido, Oracle MICROS).

---

## 3. Pre-Submission Checklist
- [x] Manifest V3 compliance verified (Frontend/manifest.json v1.0.2).
- [x] Production build and zip package generated (`Frontend/qyra-extension.zip`).
- [x] Store listing metadata and description verified.
- [x] Single purpose and permissions justification documented.
- [ ] 4 Store Screenshots captured (1280x800 px) per `SCREENSHOTS_SPEC.md`:
  - [ ] 01-scan-flow.png
  - [ ] 02-mapping-flow.png
  - [ ] 03-sync-history.png
  - [ ] 04-settings.png
- [ ] Developer Dashboard submission completed.

---

## 4. Preserved Historical Verification Notes

# Chrome Web Store Launch Pre-Flight Checklist
## Status: READY FOR USER STORE SUBMISSION
Date: 2026-09-30

### 1. Pre-Flight Verification Results
- **Production Package**: `Frontend/qyra-extension.zip` verified (1,593,746 bytes)
- **Manifest Version**: `1.0.2` in `Frontend/manifest.json`
- **Extension ID**: `bfhobnahngcmhaeklihifgbgdepibii` configured in `landing-page/src/components/qyra/constants.ts`
- **Privacy Policy**: `https://qyra.space/privacy` verified active
- **Test Suites**:
  - Backend: 26/26 suites, 157/157 tests PASS
  - Frontend: 12/12 files, 135/135 tests PASS
- **Production Builds**: Clean builds on `landing-page/` and `Backend/` (0 errors)

### 2. Required User Launch Actions
1. **Store Listing Screenshots**:
   - Capture 4 required store screenshots at 1280x800 or 1920x1080 resolution (refer to `SCREENSHOTS_SPEC.md`):
     - Screenshot 1: Document Scan & Auto-Detection flow
     - Screenshot 2: Field Mapping & Preset Manager interface
     - Screenshot 3: Batch Sync History & Analytics dashboard
     - Screenshot 4: Extension Settings & QuickBooks Connection status
2. **Developer Console Submission**:
   - Upload `Frontend/qyra-extension.zip` (version 1.0.2) to Chrome Web Store Developer Dashboard
   - Attach store screenshots and marketing tile assets
   - Confirm Privacy Policy URL is set to `https://qyra.space/privacy`
   - Submit extension package for Google review
3. **Post-Submission Monitoring**:
   - Monitor Chrome Web Store review queue for reviewer inquiries
   - Track live error telemetry on Hetzner VPS backend upon public rollout
