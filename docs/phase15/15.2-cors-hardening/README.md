# STATUS: DONE (Local Code & Tests Verified — 2026-11-14)

# Phase 15.2 Deliverable: Web Origin & Extension Allowlist Hardening (QF23)

---

## 1. Objective & Summary
Restricted development web origins (`http://localhost:3000`, `http://localhost:5173`) and the hardcoded unpacked development Chrome extension ID (`ccghhfmkjbcakhnoamgihifonfiammoc`) strictly to non-production environments in `Backend/src/index.ts`, while keeping all production domains and extension authorization rules active when `NODE_ENV === 'production'`.

*(Note: Production rollout onto Hetzner VPS `vortex` remains gated on Phase 16.1 reconciliation.)*

---

## 2. Modified & Verified Files
- **`Backend/src/index.ts` (`lines 62–131`):** Separated allowlist builders and evaluated them dynamically per request in `cors({ origin })`.
- **`Backend/tests/cors.test.ts` (`lines 1–160`):** Preserved all 9 Phase 14.5 tests and added 3 Phase 15.2 unit + Supertest integration tests (`12/12` passing).

---

## 3. Architecture & Origin Rules

### 3.1 Exported Helpers (`Backend/src/index.ts`)
- **`getAllowedOrigins(nodeEnv = process.env.NODE_ENV): string[]`**
  - Production (`nodeEnv === 'production'`): returns `['https://qyra.space', 'https://api.qyra.space', 'https://www.qyra.space']`.
  - Non-production (`development`, `test`, unset): prepends `['http://localhost:3000', 'http://localhost:5173']`.
- **`getAllowedExtensionIds(env = process.env): string[]`**
  - Always includes published Chrome Web Store ID `bfhobnahngcmhaeklihifgfbgdepibii`.
  - Includes hardcoded dev ID `ccghhfmkjbcakhnoamgihifonfiammoc` **only** when `env.NODE_ENV !== 'production'`.
  - Parses comma-separated `env.ALLOWED_EXTENSION_ID` entries, trims whitespace, discards blank tokens, and deduplicates via `Set`.

### 3.2 Preserved Middleware Contract
- Requests without an `Origin` header (server-to-server, curl, native clients) remain allowed.
- `chrome-extension://<id>` origins extract `<id>` stripping any trailing path and validate against `getAllowedExtensionIds()`.
- `credentials: true`, `methods`, `allowedHeaders`, `exposedHeaders: ['Set-Cookie']`, and rejection error messages remain unchanged.

---

## 4. Verification
- Verified via `npx tsc --noEmit` (`exit 0`), `Backend/tests/cors.test.ts` (`12/12` tests passing), and full Backend `npm run build` + `npm test`.