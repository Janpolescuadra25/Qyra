# Qyra Project Roadmap

## OVERVIEW
Qyra is an enterprise-grade automated accounting integration platform that bridges point-of-sale (POS) systems (Toast, Salido, Oracle Restaurants) with QuickBooks Online.

> **Note on Completed Work (Phases 1-5):**
> Phases 1 through 5 (Core Extension Build, POS Extraction, QuickBooks Integration, Frontend UI, and Chrome Web Store Packaging) are **100% COMPLETED and VERIFIED**. Comprehensive architectural documentation and verification records are preserved in Frontend/README.md.

---

## ACTIVE & PENDING PHASES

### Phase 6: Chrome Web Store Final Submission
- **Status:** READY FOR SUBMISSION
- **Description:** Capturing store showcase screenshots and submitting the extension package to the Google Chrome Web Store Developer Dashboard for review.
- **Implementation:** Capture 4 required listing screenshots (1280x800 px) per docs/chrome-web-store/SCREENSHOTS_SPEC.md, upload Frontend/qyra-extension.zip, enter metadata from docs/chrome-web-store/launch_checklist.md, and submit for review.
- **Expected Output:** 4 screenshot PNGs in docs/chrome-web-store/, extension submitted for Google review.
- **Dependencies:** Phase 5 (extension package and listing metadata complete).
- **Completion Criteria:** Extension published and live on the Chrome Web Store.

### Phase 7: Post-Launch Monitoring & Telemetry
- **Status:** PENDING
- **Description:** Production monitoring, automated alerting, and transient sync retry handling on live infrastructure.
- **Implementation:** Deployment of telemetry and error tracking on Hetzner VPS (vortex), Sentry/telemetry alerting, automated background retry queues for transient sync failures.
- **Expected Output:** Production monitoring dashboard, automated alerts for sync exceptions.
- **Dependencies:** Phase 6 (extension live in production).
- **Completion Criteria:** All production runtime errors captured with proactive alerting to engineering leads.

### Phase 8: Marketing Landing-Page Static Deployment (Nginx)
- **Status:** PARTIALLY COMPLETED
- **Description:** Build and deploy a high-conversion static Next.js marketing website to Nginx on /var/www/qyra/web to support Qyra's production launch.
- **Implementation:** Next.js 16 with static export (output: "export"), unified intro-sequence.tsx combining reference cinematic scenes with robust UX features (sessionStorage, Escape skip, safety timer), and responsive Tailwind CSS components.
- **Expected Output:** landing-page/out/ directory containing static HTML/CSS/JS assets, Nginx-ready for deployment to /var/www/qyra/web.
- **Dependencies:** None (independent project supporting the Phase 6 launch timeline).
- **Completion Criteria:** Static export builds successfully (verified ~89 KB), intro sequence functional, changes committed to landing-page submodule, and assets deployed to production Nginx server.
