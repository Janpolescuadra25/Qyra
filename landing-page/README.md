# Qyra Landing Page Documentation

## Overview
The Qyra public web landing page provides product presentation, feature highlights, tier pricing plans, scan pack add-ons, and onboarding access for the Qyra financial automation platform.

## Architecture & Hosting
- **Asset Locations:**
  - Landing HTML & Markup: `Backend/public/landing/index.html`
  - Client JavaScript: `Backend/public/js/landing.js`
  - Supporting Documentation: `Backend/public/landing/CSP_FIX.md`, `Backend/public/landing/PARTICLE_ANIMATION.md`
- **Backend Service:** Served via Express static middleware in `Backend/src/index.ts`:
  ```typescript
  app.use(express.static(path.join(__dirname, '../public')));
  ```
  Assets are resolved relative to the public root (e.g. `/landing/index.html`, `/js/landing.js`).
- **Port:** Port `3005` (bound to `process.env.PORT || 3005`).
- **Production URL:** `https://qyra.space` (and `https://www.qyra.space`) fronted by Nginx reverse proxy on Hetzner VPS `vortex` (`2.28.120.85`).
- **API Proxy:** API endpoints are consumed at `https://api.qyra.space` (or relative path `/api/` on same-origin requests).

## Features Implemented
1. **Hero Section:** Value proposition, Chrome Web Store CTA, interactive extension preview.
2. **Pricing Plans (Stripe Integrated):**
   - Starter Monthly / Annual
   - Professional Monthly / Annual
   - Premium Monthly / Annual
   - Enterprise Monthly / Annual
3. **Scan Packs (One-time Add-ons):**
   - 100 Scans (`price_1TvjRvCEe03Mr82wP0FCn8ic`)
   - 250 Scans (`price_1TvLrRCEe03Mr82wvFNbCYJQ`)
   - 500 Scans (`price_1TvLsKCEe03Mr82w1MzXutp9`)
4. **Integration Showcase:** QuickBooks Online automated sync, Gemini AI multimodal OCR, Cloudflare R2 attachment storage.
5. **Security & Compliance Badges:** Intuit OAuth 2.0 certified, 256-bit encryption standards, Stripe testmode verification.
