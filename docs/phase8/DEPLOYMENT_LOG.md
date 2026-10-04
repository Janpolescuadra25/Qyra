# Phase 8: Marketing Landing-Page Deployment Log
**Deployment Timestamp:** 2026-10-03T08:42:18.657Z
**Target Server:** vortex (Hetzner Cloud cx33, 2.28.120.85)
**Destination Path:** /var/www/qyra/web
**Domain:** https://qyra.space
**Status:** DEPLOYED & LIVE

## Verification Checklist:
- [x] Next.js 16 static export compiled (`landing-page/out/`).
- [x] Transferred to `/var/www/qyra/web` via SSH key `id_ed25519_hetzner`.
- [x] Verified remote `index.html` existence and size.
- [x] Verified HTTP 200 response from live Nginx web server.

## Patch Update (2026-10-03T00:00:00.000Z)
- Resolved React Error #310 by deferring the `setGone(true)` transition via `queueMicrotask` in `intro-sequence.tsx`.
- Rebuilt the static export and redeployed to `/var/www/qyra/web` on vortex.
- Verified the live site returns HTTP 200 from https://qyra.space.

---

### Emergency Maintenance: Landing Page Blank Screen Resolution (2026-10-03)
- **Defect**: Visiting https://qyra.space rendered only the dark navy grid background without intro text or main landing page content.
- **Root Cause**: `landing-page/src/components/qyra/intro-sequence.tsx` contained a conflicting early return path that unmounted the intro overlay while `AnimatePresence` was still handling exit transitions. This allowed the fixed background layer to remain visible while the content was removed from the DOM.
- **Resolution**:
  1. Removed the conflicting early return and kept the component mounted until the exit animation completed.
  2. Coordinated clean exit transition via `<AnimatePresence onExitComplete={onComplete}>` with `exit={{ opacity: 0 }}`.
  3. Added a 7000ms fail-open timeout to guarantee the intro overlay always exits safely.
  4. Updated `landing-page/src/app/page.tsx` to pass the `onComplete` callback to `IntroSequence`.
  5. Recompiled the static export and redeployed the updated bundle to the Hetzner VPS web root.
  6. Restarted Nginx and verified live HTTP 200 responses from https://qyra.space.
- **Verification**: Verified the live page renders fully and returns HTTP 200 from the public domain after redeploy.
