<!-- Actively maintained roadmap — Last updated: 2026-11-10 -->

# Qyra Development Roadmap

## Active Phases (In Progress)

### Phase 14: Live Production Validation & Commercial Activation
- **Status:** IN PROGRESS (Initialization & Pre-Launch Validation)
- **Primary Goal:** Validate production telemetries, configure live commercial infrastructure, monitor browser store submission lifecycles, and verify end-to-end security hardening.
- **Deliverables:**
  - [ ] 14.1 Sentry Telemetry Integration (Code complete & tested with PII scrubbing; pending VPS production SENTRY_DSN configuration)
  - [ ] 14.2 Stripe Live Mode Activation & Guard Validation (Code complete & tested with 5 route-level mode guard tests; pending VPS production keys & live webhook verification)
  - [ ] 14.3 QuickBooks OAuth Deduplication (Code complete in qb.service.ts via pendingRefreshes; pending Intuit production app review)
  - [ ] 14.4 Browser Store Submission Packages (Build pipelines exist for Chrome, Edge, Firefox, Safari; pending Frontend/releases/ packaging workflow)
  - [ ] 14.5 Security Hardening (Pending PR #39 review & merge)
  - [ ] 14.6 Verification Docs (Pending comprehensive security & verification documentation)
  - [ ] 14.7 Storage Key Ownership (Test suite merged; pending service implementation PR #42)
  - [ ] 14.8 Storage Sync (Pending PR #45 review & merge)
  - [ ] 14.9 Cryptographic Binding (HMAC utilities merged in Backend/src/lib/encryption.ts; pending formal production security audit)
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
- **15.3 Scan Attachment Ownership (QF11)**: Mitigated via server-side path prefix validation (`scans/{userId}/...`) and `isValidStorageKey()` traversal protection.

### Phase 16: VPS vortex Commercial Deployment
- **Deployment Target**: Hetzner VPS `vortex` (`2.28.120.85`).
- **Execution Protocol**: Fast-forward git pull, server TypeScript build, PM2 reload (`qyra-backend` on port 3005), preserving sibling services (`jp-frontend`, `jp-backend`, `hayp-frontend`).
