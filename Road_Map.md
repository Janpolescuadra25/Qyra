<!-- Actively maintained roadmap — Last updated: 2026-11-14 -->

# Qyra Development Roadmap

## Active Phases (In Progress)

### Phase 14: Live Production Validation & Commercial Activation
- **Status:** IN PROGRESS (Active Production Validation, Blueprint Verification & Browser Store Review)
- **Primary Goal:** Validate production telemetry, configure live commercial infrastructure, monitor browser store review status, and resolve open verification/hardening gaps.
- **Deliverables:**
  - [x] 14.1 Sentry Telemetry Integration (Code complete & tested with PII scrubbing; pending VPS production `SENTRY_DSN` configuration)
  - [x] 14.2 Stripe Live Mode Activation & Guard Validation (Code complete & tested with route-level mode guards; pending VPS production keys & live webhook verification)
  - [x] 14.3 QuickBooks OAuth Deduplication (Code complete in `qb.service.ts` via `pendingRefreshes` mutex; pending Intuit production app review)
  - [x] 14.4 Browser Store Submission Packages (Multi-browser packaging complete for Chrome, Edge, Firefox, Safari in `Frontend/releases/` and CI release workflow configured)
  - [x] 14.5 Security Hardening (Router-level auth, RBAC, and location isolation verified; **open P1 follow-ups** for usage/capacity enforcement and approval/retry binding remain tracked under `BP-02` and `BP-03` in `docs/Qyra_plan.md` pending policy sign-off `D02`/`D03`/`D06`)
  - [x] 14.6 Verification Docs (Master verification summary, test suite sign-off, and production checklist documented in `docs/phase14/`)
  - [x] 14.7 Storage Key Ownership (Path prefix validation and tenant isolation defense enforced in `Backend/src/routes/scans.ts`)
  - [x] 14.8 Storage Key Synchronization & Retry-Safe Attachment Processing (Implemented in commit `1c373cd`: atomic scan creation transaction & QBO attachment sync error isolation; see `docs/phase14/README.md`. Broader multi-device sync remains future scope, and usage/retry integrity follow-ups remain tracked under `BP-02`/`BP-03`)
  - [x] 14.9 Cryptographic Binding (HMAC utilities merged in `Backend/src/lib/encryption.ts`; **open P1 follow-ups** for early-return bypasses, full payload context coverage, and `retry-queue.ts` alignment remain tracked under `BP-03` in `docs/Qyra_plan.md`)

---

## Archived Phases (Completed)
- **Phase 0-12**: Core application, backend, auth, credit system, AI integration, Stripe checkout, and automated testing completed and archived.
- **Phase 13**: Browser Store Packaging, Production Attributions & Verification (13.0–13.5) completed and archived (Commits: `18f5ca3`, `b06164d`, `7e8ab7d`, `9e8f234`, `ee2657d`, `eb6390e`).

## Next Steps
1. Reconcile VPS `vortex` `/var/www/qyra` working tree (`D web/*` vs canonical `Backend/public/`, `BP-01`/`BP-04`) and Nginx CSP override (`connect-src 'self'`) so `main` can pull cleanly without disrupting `qyra.space`.
2. Close open `BP-02` (usage/capacity integrity) and `BP-03` (approval/retry integrity) following JP commercial policy confirmation (`D02`/`D03`/`D06` in `docs/Qyra_plan.md`).
3. Monitor Chrome Web Store, Edge Add-ons, and Firefox AMO portals, and validate live QuickBooks Online OAuth in production.

## Active Backlog & Deployment

### Phase 15: Backlog Security & Route Hardening
- [x] **15.1 Webhook Route Path Alignment (QF25)**: Code route verified at `POST /api/webhooks/stripe` (`Backend/src/index.ts:132` raw middleware + `Backend/src/routes/webhooks.ts:90-91`), operational docs aligned (`docs/phase14/README.md`, `docs/phase14/production-deployment-checklist.md`, `docs/phase15/15.1-webhook-route-alignment/README.md`), and clean-build Render fallback removed in `Frontend/scripts/build.js:25` (`https://api.qyra.space`). Live `api.qyra.space` Nginx vhost/TLS activation on `vortex` is tracked in Phase 16.1 alongside `qyra.space/api/`.
- [x] **15.2 Web Origin & Extension Allowlist Hardening (QF23)**: Implemented in `Backend/src/index.ts` (`getAllowedOrigins`, `getAllowedExtensionIds`) and verified in `Backend/tests/cors.test.ts` (see `docs/phase15/15.2-cors-hardening/README.md`). When `NODE_ENV === 'production'`, `http://localhost:3000`, `http://localhost:5173`, and hardcoded dev extension `ccghhfmkjbcakhnoamgihifonfiammoc` are excluded while preserving `https://qyra.space`, `https://api.qyra.space`, `https://www.qyra.space`, published extension `bfhobnahngcmhaeklihifgfbgdepibii`, and explicit `${ALLOWED_EXTENSION_ID}` overrides (VPS `vortex` rollout tracked in Phase 16.1).
- [x] **15.3 Scan Attachment Ownership (QF11)**: Mitigated by Phase 14.7/14.8 implementation; server-side path prefix validation and traversal protection active.

### Phase 16: VPS `vortex` Commercial Deployment
- [ ] **16.1 VPS `vortex` Commercial Deployment (`BP-01` / `BP-04`)**: **BLOCKED / RECONCILIATION PENDING** — Read-only SSH probes (2026-11-14) verified that live `qyra-backend` (`PID 695538`) runs prior commit `0cccc24f` (behind `ff452e3b`) on port `10000` (code default in `Backend/src/index.ts:52` is `3005`; `127.0.0.1:3005/health` refused), returning `HTTP 200 OK` on `/health` (`HTTP 404` on root `/api/health` because `healthRouter` only mounts `/api/health/db-replication`) and serving `Backend/public/` via Express (`HTTP/2 200` on `https://qyra.space/`). Deployment of current `main` remains blocked by uncommitted `D web/*` deletions in `/var/www/qyra` and requires reconciling Nginx's `proxy_hide_header Content-Security-Policy` (`connect-src 'self'`) override.
  - **Deployment Target**: Hetzner VPS `vortex` (`2.28.120.85`).
  - **Execution Protocol**: Reconcile `web/` vs `Backend/public/` cleanly (`BP-01`/`BP-04`), fast-forward `git pull` to pinned `main` baseline, run TypeScript build, reload PM2 `qyra-backend` (port `10000` live / `3005` default), verify `/health` (`200 OK`) and `https://qyra.space/`, and confirm sibling services (`jp-frontend`, `jp-backend`, `vortex-frontend`, `hayp-frontend`) remain online.