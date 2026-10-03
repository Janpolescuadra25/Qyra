# Qyra Project Roadmap

## OVERVIEW
Qyra is an enterprise-grade automated accounting integration platform that bridges point-of-sale (POS) systems (Toast, Salido, Oracle Restaurants) with QuickBooks Online.

> **Note on Completed Work (Phases 1-5, Phase 8):**
> Phases 1 through 5 (Core Extension Build, POS Extraction, QuickBooks Integration, Frontend UI, and Chrome Web Store Packaging) are **100% COMPLETED and VERIFIED** (see Frontend/README.md). Phase 8 (Marketing Landing-Page Static Deployment) is also **100% COMPLETED and VERIFIED** (deployed to https://qyra.space, see docs/phase8/DEPLOYMENT_LOG.md and landing-page/README.md).
> - *Additional post-launch maintenance (2026-10-03):* Fixed intro-sequence state race condition by adding queueMicrotask guard to sessionStorage shortcut logic, ensuring the component safely skips the intro only after React state is fully initialized. Rebuilt and redeployed the landing page to production to resolve the issue.

---

## ACTIVE & PENDING PHASES

### Phase 6: Chrome Web Store Final Submission
- **Status:** IN_PROGRESS (submitted to Chrome Web Store Developer Dashboard)
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

