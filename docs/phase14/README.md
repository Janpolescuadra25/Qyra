# Phase 14: Live Production Validation & Commercial Activation

**Phase Owner:** CYPRA (Planning & Prompts) · HYDRA (Auditing) · MANTRA (Execution) · JP (Operator & Authority)  
**Status:** IN PROGRESS  
**Target Environment:** Production VPS `vortex` (`2.28.120.85`), Chrome Web Store, Edge Add-ons, Mozilla AMO, Stripe Live, Intuit App Center  

---

## 1. Executive Summary
Phase 14 transitions Qyra from pre-launch store packaging into live commercial activation and production telemetry monitoring. Having completed all extension builds, least-privilege permission audits, and financial reporting verification in Phase 13, this phase establishes operational reliability, monitors commercial transactions, tracks browser store submissions, and ensures robust application security.

---

## 2. Deliverables Breakdown

| Deliverable | Description | Target Component | Status |
|---|---|---|---|
| **14.1 Production Telemetry & Sentry Integration** | Client & server error monitoring, performance tracing, sanitization of financial PII | `Frontend/`, `Backend/` | COMPLETED (Commit 89e39f5) |
| 14.2 | Stripe Live Mode Activation & Checkout Verification | IN PROGRESS (Architecture Ready, Pending VPS Verification) | Stripe Live Mode Architecture Alignment & Verification |
| 14.3 | QuickBooks Online Production OAuth App Verification | IN PROGRESS (Architecture & Tests Ready, Pending Live Verification) | QuickBooks Online Production OAuth & Journal Entry Sync |
| **14.4 Browser Store Submission Tracking** | Chrome Web Store, Edge Add-ons, Mozilla AMO review status & compliance tracking | Store Dashboards | IN PROGRESS |
| **14.5 Production Security & Rate Limiting** | CORS origin locking, Express rate limiters, Helmet headers, reverse proxy security | `Backend/`, Nginx | COMPLETED |
| **14.6 Phase 14 Operator Handbook & Sign-Off** | Operator runbooks, incident response protocols, disaster recovery procedures | `docs/phase14/` | NOT STARTED |

---

## 3. Architecture & Operational Guidelines

### 3.1 Telemetry & Privacy Invariant
- All error tracking (Sentry / logger) MUST sanitize user passwords, financial documents, credit card metadata, and QuickBooks access tokens.
- Telemetry must be disabled or fail-safe in local development environments.

### 3.2 Live Commercial Infrastructure
- Live Stripe secrets remain strictly on production VPS `vortex` (`/var/www/qyra/Backend/.env`) and are NEVER committed to repository or worklogs.
- Test mode prices and test webhook endpoints remain functional for CI test suites.

### 3.3 Browser Extension Store Tracking
- Release packages built during Deliverable 13.3 are submitted via official web dashboards:
  - Chrome Web Store Developer Dashboard
  - Microsoft Partner Center (Edge Add-ons)
  - Mozilla Add-on Developer Hub (AMO)
- Any store reviewer feedback or clarification requests regarding permissions must be routed through Hydra audit before response.

---

## 4. Quality Gates & Verification Standards
- **Frontend Typecheck:** `npm run typecheck` in `Frontend/` must exit with 0 errors.
- **Backend Test Suite:** `npm test` in `Backend/` must pass all test suites and tests.
- **Fail-Closed Git Verification:** Working tree must remain clean; only designated files may be staged and committed.

## Phase 14.1: Production Telemetry & Sentry Integration — STATUS: DONE

### Overview
Integrated Sentry backend CPU and transaction profiling into the Qyra API service while preserving 100% of the battle-tested, fail-closed PII sanitization logic and browser telemetry.

### Technical Implementation Details
- **Dependencies Installed:** `@sentry/profiling-node@11.4.0` (pinned exact in `Backend/package.json`) aligned with `@sentry/node@11.4.0` to eliminate package version skew.
- **Backend Profiling Integration:**
  - File: `Backend/src/lib/logger.ts`.
  - Initialized `nodeProfilingIntegration()` in `Sentry.init()`.
  - Resolved Sentry 11.4.0 API requirement by configuring `profileSessionSampleRate` with fallback to `process.env.SENTRY_PROFILES_SAMPLE_RATE`.
  - Profiling sample rates: `0.1` (10%) in production, `1.0` (100%) in development and testing.
  - Safe initialization bypass: Sentry initialization is cleanly skipped if `process.env.SENTRY_DSN` is undefined, preventing test suite pollution.
- **PII Sanitization Preservation:**
  - Preserved all 50+ lines of existing production `beforeSend` sanitization in `Backend/src/lib/logger.ts` byte-for-byte.
  - Redaction enforced for 7 sensitive headers (`authorization`, `cookie`, `set-cookie`, `x-api-key`, `x-auth-token`, `jwt`, `session`).
  - Redaction enforced for 8 URL query parameters (`token`, `key`, `password`, `secret`, `auth`, `access_token`, `refresh_token`, `code`).
  - Automatic stripping of user PII (`ip_address`, `email`, `username`).
  - Recursive masking of sensitive metadata keys in extra payloads.
  - Fail-closed error handling: Any exception thrown during event sanitization triggers `return null`, safely dropping the event to prevent data leakage.
- **Frontend Telemetry Untouched:**
  - `Frontend/src/popup/App.tsx` browser crash reporting and fail-closed sanitization verified complete and left 100% untouched.
- **Environment Variable Manifests:**
  - `Backend/.env.example`: Documents `SENTRY_PROFILES_SAMPLE_RATE=1.0`.
  - `Backend/.env.production.example`: Documents `SENTRY_PROFILES_SAMPLE_RATE=0.1`.

### Verification Gates Passed (Commit `89e39f54fac68372adab84539e05e717e6f72809`)
- Backend Jest tests: 35/35 suites passed, 210/210 tests passed (`npm test -- --ci --bail` exit code 0).
- Backend TypeScript compilation: Passed (`npm run build` exit code 0).
- Frontend TypeScript typecheck: Passed (`npm run typecheck` exit code 0).
- Frontend production build: Passed (`npm run build` exit code 0).
- Remote synchronization: Local `HEAD` successfully pushed and matched to `origin/main`.

---

### Phase 14.2 — STATUS: IN PROGRESS (Architecture Ready, Pending VPS Verification)
**Deliverable:** Stripe Live Mode Activation & Production Checkout Verification  
**Architecture & Integration Verification:**
1. **Hosted Checkout Architecture:**
   - Server-side session creation implemented at `POST /api/checkout/create-session` in `Backend/src/routes/checkout.ts`.
   - Browser Extension triggers checkout in `Frontend/src/popup/components/PricingView.tsx` by requesting session URL and invoking `browser.tabs.create({ url })`.
   - Zero publishable key requirement on client; zero PCI DSS scope on frontend.
2. **Webhook & Raw Body Pipeline:**
   - Middleware mounted in `Backend/src/index.ts` with `express.raw({ type: 'application/json', limit: '1mb' })` specifically on `/api/webhooks` preceding global `express.json()`.
   - Cryptographic signature validation via `stripe.webhooks.constructEvent` in `Backend/src/routes/webhooks.ts`.
   - Dynamic mode-guard rejection: test events sent to live backend (or live events to test backend) are blocked with HTTP 400.
3. **Stripe Pricing Schema Alignment:**
   - Synchronized 12-variable pricing manifest across `.env.example` and `.env.production.example`.
   - 4 subscription tiers (Starter, Professional, Premium, Enterprise) with dedicated monthly and annual price IDs.
   - 3 one-time scan pack tiers (100, 250, 500 scans) mapped to fixed price IDs.

**Hetzner VPS vortex Production Operator Deployment Protocol:**
1. **Repository Pull:**
   - On VPS `vortex` (`2.28.120.85`), navigate to `/var/www/qyra/Backend`.
   - Execute `git pull origin main` to synchronize configuration schemas.
2. **Environment Variable Configuration:**
   - Inspect `/var/www/qyra/Backend/.env`.
   - Populate `STRIPE_SECRET_KEY` with live secret key (`sk_live_...`).
   - Populate `STRIPE_WEBHOOK_SECRET` with live webhook endpoint secret (`whsec_...`).
   - Populate all 12 live Price IDs corresponding to live Stripe Dashboard products.
   - Enforce file permissions: `chmod 600 /var/www/qyra/Backend/.env`.
3. **Stripe Dashboard Webhook Registration:**
   - Endpoint URL: `https://api.qyra.space/api/webhooks`
   - Subscribed Events:
     * `checkout.session.completed`
     * `customer.subscription.updated`
     * `customer.subscription.deleted`
     * `invoice.payment_succeeded`
     * `invoice.payment_failed`
4. **PM2 Process Reload:**
   - Run `pm2 restart qyra-backend` (ensure sibling processes `jp-frontend`, `jp-backend`, `hayp-frontend` remain untouched).
5. **Live Payment Verification & Rollback Plan:**
   - Perform live checkout transaction of $1.00 or Starter Monthly plan using real credit card.
   - Verify webhook 200 receipt and automatic subscription activation in PostgreSQL database `qyra_db`.
   - **Rollback Procedure:** If live webhook fails or signature error occurs, restore `sk_test_...` credentials in `/var/www/qyra/Backend/.env` and execute `pm2 restart qyra-backend`.

---

### Phase 14.3 — STATUS: IN PROGRESS (Architecture & Tests Ready, Pending Live Verification)
**Deliverable:** QuickBooks Online Production OAuth App Verification & Journal Entry Sync  
**Architecture & Integration Verification:**
1. **OAuth 2.0 Flow & State Validation:**
   - Routes mounted at `/api/quickbooks/*` in `Backend/src/routes/quickbooks.ts`.
   - Minimal scope enforcement: `com.intuit.quickbooks.accounting`.
   - CSRF protection: 16-byte cryptographically random hex token hashed with `hashToken()`, persisted to `OAuthState` model with 15-minute TTL, deleted immediately upon single use.
   - Browser Extension triggers OAuth via `useQuickBooks.ts` opening authorization tab via background service worker.
2. **Token Lifecycle & Automatic Refresh:**
   - Implemented in `Backend/src/services/qb.service.ts` (32 service methods across query, bills, journal entries, attachments).
   - Proactive refresh in `getValidToken()` checking expiration against `expiresAt`.
   - Reactive 401 retry in `callQB()` invoking `forceRefreshToken()` and re-executing API call.
   - Direct Intuit OAuth2 token endpoint: `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer` using native `fetchWithTimeout`.
   - Token deduplication for concurrent user requests via `pendingRefreshes` map.
   - At-rest AES-256 encryption using `encrypt()` utility before storage in `QBToken` model; decrypted in memory only via `decryptSafe()`.
   - Stale token isolation: failed refresh marks `stale: true`, requiring re-authentication.
3. **Automated Test Hardening:**
   - Dedicated unit test suite in `Backend/tests/quickbooks-oauth.test.ts`.
   - Coverage: Proactive refresh on expired token, 400 invalid grant error handling with stale marking, valid token bypass.

**Hetzner VPS vortex Production Operator Verification Protocol:**
1. **Intuit Developer Portal Production Settings:**
   - Confirm App ID and Client ID match `Backend/.env` (`ABnJGWv9uA34NkQf17It4i15yM82XWVPSIePLe0XRhv9llLnms`).
   - Confirm Redirect URI is registered exactly: `https://qyra.space/api/quickbooks/callback`.
   - Confirm production keys are active and terms accepted in Intuit Developer Dashboard.
2. **Environment Variable Configuration on vortex:**
   - File: `/var/www/qyra/Backend/.env`
   - Verify: `QB_ENVIRONMENT=production`, `QB_CLIENT_ID`, `QB_CLIENT_SECRET`, `QB_REDIRECT_URI=https://qyra.space/api/quickbooks/callback`, `QB_API_BASE_URL=https://quickbooks.api.intuit.com/v3/company`.
3. **Live Production Flow Verification:**
   - Open Qyra Extension popup -> Settings/Integrations -> Click "Connect QuickBooks".
   - Complete Intuit production authorization screen with live company file.
   - Verify redirect back to `https://qyra.space/api/quickbooks/callback` -> success view.
   - Inspect PostgreSQL `qyra_db`: verify `QBToken` record created with encrypted `accessToken` and `refreshToken`.
   - Trigger single receipt/invoice sync -> verify balanced Journal Entry created in live QuickBooks Online account.

---

## 14.5 Production Security, Rate Limiting & CORS Hardening

### CORS Whitelist Hardening
- **Strict Origin Whitelisting:** Permissive wildcards (`*.qyra.space` and `chrome-extension://*`) were completely eliminated.
- **Allowed Web Origins:** `http://localhost:3000`, `http://localhost:5173`, `https://qyra.space`, `https://api.qyra.space`, `https://www.qyra.space`.
- **Allowed Extension Origins:**
  - Chrome Web Store ID: `bfhobnahngcmhaeklihifgfbgdepibii`
  - Unpacked Dev ID: `ccghhfmkjbcakhnoamgihifonfiammoc`
  - Configurable: `process.env.ALLOWED_EXTENSION_ID`
- **Security Regression Tests:** `Backend/tests/cors.test.ts` validates that approved origins receive `Access-Control-Allow-Origin` and unauthorized origins/extensions are denied CORS headers.

### Rate Limiting Architecture (`Backend/src/middleware/rate-limit.ts`)
- **General API Limiter:** 100 requests per 60 seconds (`apiLimiter`).
- **Auth Limiter:** 10 requests per 15 minutes (`authLimiter`).
- **Password Reset Limiter:** 3 requests per 15 minutes (`passwordResetLimiter`).
- **Email Verification Limiter:** 3 requests per 15 minutes (`emailVerificationLimiter`).
- **Gemini OCR Suggest Limiter:** 10 requests per 60 seconds (`geminiSuggestLimiter`).


### Verification Gates Passed (14.5)
- **Commit Baseline:** `df72449` (`df724497bbaec2bfba0ce65c792d82e959af0ee0`)
- **CORS Suite Execution:** 9/9 passing (`Backend/tests/cors.test.ts`)
- **TypeScript Compile Gate:** `npm run build` exit code 0
- **Origin Allowlist:** Strictly locked to `http://localhost:3000`, `http://localhost:5173`, `https://qyra.space`, `https://api.qyra.space`, `https://www.qyra.space` (zero wildcard matches)
- **Extension Origin Allowlist:** Whitelisted IDs `bfhobnahngcmhaeklihifgfbgdepibii` (CWS Store) and `ccghhfmkjbcakhnoamgihifonfiammoc` (dev/unpacked), with optional `ALLOWED_EXTENSION_ID` env override
- **Rate Limiters:** 5 distinct Redis-backed / in-memory rate limiters active (`auth`, `scan`, `sync`, `export`, `api`)
- **Status:** VERIFIED COMPLETED (Signed off 2026-11-03)



---

## 14.6 Production Operator Handbook & Runbooks

### 1. Service Architecture & Process Lifecycle (VPS: vortex)
Qyra operates on a dedicated Hetzner Cloud cx33 VPS (`vortex`, `2.28.120.85`) alongside sibling applications (`johnpaulescuadra.com` on ports 3000/3001 and `haypstudios.com` on port 3003).

- **Multi-Tenant VPS Isolation Invariant:** Under NO circumstances may sibling PM2 processes (`jp-frontend`, `jp-backend`, `hayp-frontend`) be stopped, restarted, or modified during Qyra maintenance.
- **Port Allocation:**
  * Port `80` / `443`: Nginx reverse proxy & static landing page (`/var/www/qyra/web`).
  * Port `3005`: Qyra Express API backend (`qyra-backend`).
  * Port `5432`: Local PostgreSQL database (`qyra_db`).
- **PM2 Process Commands:**
  ```bash
  # Check status of Qyra process only
  pm2 status qyra-backend
  
  # Stream live backend logs
  pm2 logs qyra-backend --lines 100
  
  # Graceful restart with zero downtime
  pm2 reload qyra-backend --update-env
  
  # Stop / Start
  pm2 stop qyra-backend
  pm2 start qyra-backend
  ```

---

### 2. Secret Management & Scheduled Rotation Cadence
Secrets live exclusively in `/var/www/qyra/Backend/.env` on VPS `vortex` and are never committed to Git or echoed into terminal logs.

| Secret Key | Purpose | Rotation Frequency | Rotation Procedure |
|---|---|---|---|
| `JWT_SECRET` | Auth session token signing | 90 Days | Generate 64-byte hex; update `.env`; restart `qyra-backend` |
| `ENCRYPTION_KEY` | At-rest encryption key | 180 Days | Requires re-encrypting encrypted DB columns before cutover |
| `STRIPE_SECRET_KEY` | Stripe billing & webhooks | On Compromise / 180 Days | Rotate in Stripe Dashboard; update `.env`; reload PM2 |
| `QB_CLIENT_SECRET` | QuickBooks OAuth client secret | Annual / Intuit Requirement | Rotate in Intuit Developer Portal; update `.env` (see §14.3) |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 bucket access | 90 Days | Generate new API token in Cloudflare dashboard; update `.env` |
| `RESEND_API_KEY` | Transactional email delivery | 90 Days | Generate new token in Resend portal; update `.env` |
| `ALLOWED_EXTENSION_ID` | Chrome Extension Origin Gateway | On Extension Re-publish | Update to published Web Store ID (see §14.5) |

---

### 3. Synthetic Health & Automated Probes
The backend exposes public health and diagnostic probes configured for uptime monitoring:
- **Liveness Probe:** `GET https://api.qyra.space/api/health`
  * Expected Response: `{"status":"ok","timestamp":"..."}` (HTTP 200)
- **Database Connectivity Probe:** `GET https://api.qyra.space/api/health/db`
  * Expected Response: `{"database":"connected","latencyMs":...}` (HTTP 200)
- **R2 Storage Connectivity Probe:** `GET https://api.qyra.space/api/health/storage`
  * Expected Response: `{"storage":"reachable"}` (HTTP 200)
- **Thresholds & SLAs:**
  * API latency p95: `< 250ms`
  * Database query latency: `< 50ms`
  * Uptime SLA: `99.9%`

---

### 4. Standard Incident Response Runbooks

#### Runbook A: High Memory Usage / PM2 Restart Loop
1. **Detection:** Sentry alerts or PM2 restart counter incrementing rapidly (`pm2 status qyra-backend`).
2. **Triage:**
   ```bash
   pm2 logs qyra-backend --err --lines 50
   top -b -n 1 -u root | grep node
   ```
3. **Mitigation:**
   - If memory leak detected: Restart process with garbage collection flag:
     ```bash
     pm2 restart qyra-backend --node-args="--max-old-space-size=1024"
     ```
   - Check disk space:
     ```bash
     df -h /
     ```

#### Runbook B: Database Connection Exhaustion & Pool Hangs
1. **Detection:** Backend logs show `PrismaClientInitializationError` or `Timed out fetching a new connection from the pool`.
2. **Triage:** Check active PostgreSQL connections on VPS:
   ```bash
   sudo -u postgres psql -d qyra_db -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
   ```
3. **Mitigation:**
   - Terminate idle or orphaned connections:
     ```bash
     sudo -u postgres psql -d qyra_db -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < current_timestamp - INTERVAL '15' MINUTE;"
     ```
   - Reload backend process: `pm2 reload qyra-backend`

#### Runbook C: QuickBooks OAuth Token Expiration / Intuit Sync Disconnects
*Cross-reference: See Section 14.3 for complete OAuth token refresh architecture.*
1. **Detection:** Error logs showing HTTP 401 from Intuit API or user sync failure emails via Resend.
2. **Triage:**
   - Verify token refresh loop in `Backend/src/services/qb.service.ts`.
   - Verify if user's refresh token has expired (100-day Intuit hard limit).
3. **Mitigation:**
   - If token expired: Direct user to re-authorize QuickBooks via `https://qyra.space/dashboard/integrations`.
   - If API outage: Check Intuit Developer System Status page (`https://developer.intuit.com/app/developer/dashboard`).

#### Runbook D: CORS Violation Spike & Origin Spoofing Detection
*Cross-reference: See Section 14.5 for CORS allowlist and rate limiting specifications.*
1. **Detection:** High frequency of HTTP 403 `Origin Not Allowed` errors in Sentry or Nginx logs.
2. **Triage:** Inspect requesting origin:
   ```bash
   grep "403" /var/log/nginx/access.log | tail -n 50
   ```
3. **Mitigation:**
   - Verify if an authorized extension updated its Chrome Web Store ID. If so, update `ALLOWED_EXTENSION_ID` in `/var/www/qyra/Backend/.env` and reload PM2.
   - If unauthorized origin attack: Fail-closed architecture safely blocks requests. Optionally ban aggressive IPs via `iptables` or fail2ban.

---

### 5. Backup, Recovery & Disaster Restoration Procedures
- **Automated PostgreSQL Daily Backups:**
  * Cron job runs daily at `02:00 UTC` dumping `qyra_db` to `/var/backups/qyra/`:
    ```bash
    pg_dump -U postgres qyra_db | gzip > /var/backups/qyra/qyra_db_\$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
    ```
  * Retention: 30 days local retention, synced weekly to Cloudflare R2 backup bucket.
- **Point-in-Time Database Restoration:**
  ```bash
  # Uncompress and restore database
  gunzip -c /var/backups/qyra/qyra_db_YYYYMMDD_HHMMSS.sql.gz | sudo -u postgres psql -d qyra_db
  ```
- **RTO / RPO Targets:**
  * Recovery Time Objective (RTO): `< 1 hour`
  * Recovery Point Objective (RPO): `< 24 hours` (daily backup)

---

### 6. Sentry Telemetry, Profiling & Alert Routing
*Cross-reference: See Section 14.1 for Sentry profiling and PII sanitization configuration.*
- **Alert Channels:** Critical errors routed to `paulescuadra25@gmail.com` and Sentry dashboard.
- **PII Scrubbing Verification:**
  * All transaction payloads, OCR strings, user passwords, and authorization headers are scrubbed before wire transmission (`beforeSend` hook in `Backend/src/index.ts`).
  * Verify zero PII in Sentry breadcrumbs: Ensure email addresses, bank accounts, and invoice text are masked as `[REDACTED]`.

---

### 7. Zero-Downtime Rollout & Post-Deployment Smoke Verification
- **Deployment Protocol (Pull-Only on Server):**
  1. All changes committed locally and pushed to GitHub `main`.
  2. SSH to VPS `vortex`:
     ```bash
     ssh -i ~/.ssh/id_ed25519_hetzner root@2.28.120.85
     ```
  3. Navigate to repository directory and pull:
     ```bash
     cd /var/www/qyra
     git pull origin main
     ```
  4. Build backend and apply any pending Prisma migrations:
     ```bash
     cd /var/www/qyra/Backend
     npm install --production=false
     npx prisma migrate deploy
     npm run build
     ```
  5. Reload backend process with zero downtime:
     ```bash
     pm2 reload qyra-backend
     ```
- **Post-Deployment Smoke Test Checklist:**
  - [ ] `curl -f https://api.qyra.space/api/health` returns HTTP 200.
  - [ ] `curl -f https://api.qyra.space/api/health/db` returns HTTP 200.
  - [ ] Sibling check: `curl -f https://johnpaulescuadra.com` returns HTTP 200.
  - [ ] Sibling check: `curl -f https://haypstudios.com` returns HTTP 200.
  - [ ] Nginx access log confirms zero 502 Bad Gateway errors.
