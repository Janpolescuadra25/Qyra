<!-- Actively maintained roadmap — Last updated: 2026-11-11 -->

# Qyra Development Roadmap

## Active Phases (In Progress)

### Phase 14: Live Production Validation & Commercial Activation
- **Status:** IN PROGRESS (Active Production Validation & Browser Store Review)
- **Primary Goal:** Validate production telemetries, configure live commercial infrastructure, monitor browser store submission lifecycles, and verify end-to-end security hardening.
- **Deliverables:**
  - [ ] 14.1 Sentry Telemetry Integration (Code complete & tested with PII scrubbing; pending VPS production SENTRY_DSN configuration)
  - [ ] 14.2 Stripe Live Mode Activation & Guard Validation (Code complete & tested with 5 route-level mode guard tests; pending VPS production keys & live webhook verification)
  - [ ] 14.3 QuickBooks OAuth Deduplication (Code complete in qb.service.ts via pendingRefreshes; pending Intuit production app review)
  - [x] 14.4 Browser Store Submission Packages (Multi-browser packaging complete for Chrome, Edge, Firefox, Safari in Frontend/releases/ and CI release workflow configured)
  - [x] 14.5 Security Hardening (Router-level authentication, RBAC, and location-based tenant isolation verified across all API endpoints)
  - [x] 14.6 Verification Docs (Master verification summary, 40/40 test suites sign-off, and production deployment readiness matrix documented)
  - [x] 14.7 Storage Key Ownership (Path prefix validation and tenant isolation defense enforced in scans.ts)
  - [ ] 14.8 Storage Sync (Planned; pending multi-device sync implementation)
  - [x] 14.9 Cryptographic Binding (HMAC utilities & documentation merged in Backend/src/lib/; pending formal production security audit)
---

## Archived Phases (Completed)
- **Phase 0-12**: Full core application, backend, auth, credit system, AI integration, Stripe checkout, automated testing. All phases 100% completed and archived.
- **Phase 13**: Browser Store Packaging, Production Attributions & Verification. All deliverables (13.0–13.5) 100% completed and archived (Commits: 18f5ca3, b06164d, 7e8ab7d, 9e8f234, ee2657d, eb6390e).

## Next Steps
1. Monitor Chrome Web Store, Edge Add-ons, and Firefox AMO developer portals for review status.
2. Validate production QuickBooks Online OAuth authorization flow in production environment.

## Future Backlog

### Phase 15: Backlog Security & Route Hardening
- **15.1 Webhook Route Path Alignment (QF25)**: Verify and document `/api/webhooks/stripe` across all operational guides and Nginx configs.
- **15.2 Web Origin & Extension Allowlist Hardening (QF23)**: Restrict CORS strictly to `https://qyra.space` and extension origin configured via `${ALLOWED_EXTENSION_ID}` in production.
- **[x] 15.3 Scan Attachment Ownership (QF11)**: Fully completed & mitigated by Phase 14.7 implementation; server-side path prefix validation and traversal protection active in production.

### Phase 16: VPS vortex Commercial Deployment
- **Deployment Target**: Hetzner VPS `vortex` (`2.28.120.85`).
- **Execution Protocol**: Fast-forward git pull, server TypeScript build, PM2 reload (`qyra-backend` on port 3005), preserving sibling services (`jp-frontend`, `jp-backend`, `hayp-frontend`).


