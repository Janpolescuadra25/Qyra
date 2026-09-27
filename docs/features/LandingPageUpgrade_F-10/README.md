# Landing Page & Legal Pages Upgrade (Phase F-10)
## Status: DONE (Completed: 2026-09-27)

### Overview
Integrated the high-performance Next.js 15 landing page suite into a dedicated `landing-page/` project and deployed static assets to `Backend/public/`:
1. **Interactive Experience**: Cinematic intro sequence, WebGL canvas particle field, smooth Framer Motion reveals, and video preview.
2. **Full Legal Suite**: Privacy Policy (`/privacy`, `/privacy.html`) and Terms of Service (`/terms`, `/terms.html`) matching Chrome Web Store requirements.
3. **Pricing Accuracy**: Fully reconciled with live Stripe configuration:
   - Free ($0), Starter ($19/mo, $15/mo annual), Professional ($39/mo, $31/mo annual), Premium ($79/mo, $63/mo annual).
   - Enterprise ($149/mo, $119/mo annual) card added.
   - Scan Packs add-on grid (100 for $19, 250 for $39, 500 for $69) integrated with CWS link.
4. **Static Export**: Built via Next.js static HTML export (`output: 'export'`) and deployed to `Backend/public/` for Express and Nginx root delivery. Legacy `web/` folder preserved.
5. **CSP Hardening**: Updated Express Helmet CSP to permit Next.js client chunks, video media, and Framer Motion runtime.

### Deliverables Verified
- `landing-page/`: Dedicated Next.js 15 source project with static export configuration.
- `Backend/public/index.html`: Production landing page.
- `Backend/public/privacy/index.html` & `Backend/public/privacy.html`: Live privacy policy endpoints.
- `Backend/public/terms/index.html` & `Backend/public/terms.html`: Live terms of service endpoints.
- `Backend/src/index.ts`: Routes, path import, and CSP updated.

### Security & Static Export Notes
- The reference landing page included an incompatible `/api` route for an example server; it was removed for static export compatibility.
- `landing-page/` was kept separate from legacy `web/` assets to preserve the original storefront bundle.
- The landing-page static export is purposely deployed to `Backend/public` so Express can serve the production legal pages without breaking the extension or API subpaths.
