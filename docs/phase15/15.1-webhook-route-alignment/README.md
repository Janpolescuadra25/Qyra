# STATUS: DONE (Local Alignment Verified — 2026-11-14)

# Phase 15.1 Deliverable: Webhook Route Path Alignment (QF25) & Clean-Build Origin Cleanup

---

## 1. Objective & Summary
Aligned operational webhook documentation with the live Express mount path (`POST /api/webhooks/stripe`) and eliminated the remaining clean-build Render fallback in the extension build pipeline.

*(Note: Adding an Nginx server block + Let's Encrypt certificate for `api.qyra.space` alongside `qyra.space` on Hetzner VPS `vortex` remains tracked under Phase 16.1.)*

---

## 2. Verified Implementation & Documentation Changes
- **Mounted Webhook Route (`Backend/src/index.ts:132`, `Backend/src/routes/webhooks.ts:90-91`):** Confirmed `app.use('/api/webhooks', express.raw({ type: 'application/json', limit: '1mb' }), webhookRoutes)` + `router.post('/stripe', ...)` resolves to `POST /api/webhooks/stripe`.
- **Clean-Build Render Fallback Removed (`Frontend/scripts/build.js:25`):** Replaced fallback `'https://qyra-backend.onrender.com'` with `'https://api.qyra.space'`, matching `Frontend/src/lib/config.ts:2`, `Frontend/manifest.json`, and `Frontend/releases/qyra-extension-chrome.zip`.
- **Operational Docs Aligned:**
  - `docs/phase14/production-deployment-checklist.md`: Updated Stripe webhook endpoint URL to `https://qyra.space/api/webhooks/stripe` (`POST /api/webhooks/stripe`, noting `api.qyra.space` Phase 16.1 vhost rollout).
  - `docs/phase14/README.md`: Updated Stripe webhook endpoint references from `/api/webhooks` and `/webhooks/stripe` to `/api/webhooks/stripe`.
  - `Backend/public/landing/PARTICLE_ANIMATION.md`: Replaced stale `nest-backend-mddn.onrender.com` snippet with same-origin guidance matching `Backend/public/js/landing.js`.

---

## 3. Verification
- Verified `Frontend/scripts/build.js` syntax (`node --check scripts/build.js`), `npm run typecheck`, and `npx vitest run` in `Frontend/`.
- Verified zero remaining `onrender.com` references in `Frontend/scripts/build.js` and `Backend/public/landing/PARTICLE_ANIMATION.md`.