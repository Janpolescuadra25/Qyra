# F-10G: Static Next.js Landing Page Deployment to VPS Web Root
## Status: DONE (Completed: 2026-09-30)

### Architecture
Implemented static export of Next.js 16 landing page (using output: 'export' and images: { unoptimized: true } in landing-page/next.config.ts) and synchronized all production assets to the web/ directory for Nginx serving on the Hetzner VPS (qyra.space). The deployment maintains strict separation between Next.js development source (landing-page/) and static production hosting root (web/).

### Critical Files Preserved
- web/billing-success.html: Stripe payment success page with full redirect flow
- web/billing-cancel.html: Stripe payment cancellation flow
- All existing static assets in web/ remained unmodified or were updated cleanly from the Next.js export

### Verification
- All 6 Node.js static assertion checks passed during deployment:
  * web/index.html exists: PASS
  * web/billing-success.html preserved: PASS
  * web/billing-cancel.html preserved: PASS
  * web/_next directory exists: PASS
  * web/privacy exists: PASS
  * web/terms exists: PASS
- landing-page/next.config.ts pre-configured with static export settings
- Git commit: bfab015 ("feat(web): deploy hardened Next.js landing page static export to VPS web directory")

### Completion Criteria
- [x] Static assets synced to web/ directory
- [x] No breaking changes to existing Stripe billing flows
- [x] All static validation checks passed
- [x] Changes committed and pushed to origin/main
