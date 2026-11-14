# Qyra Commercial Activation & Production Deployment Checklist
**Phases Covered:** Phase 14.2 (Stripe Live Mode Activation) & Phase 14.3 (QuickBooks Online Production OAuth App Verification)  
**Target Infrastructure:** Hetzner Cloud VPS `vortex` (`2.28.120.85`)  
**Deployment Direction:** Pull-Only from GitHub `main` to `/var/www/qyra/Backend`  
**Security Invariant:** Zero secret values in version control. All production secrets reside exclusively on VPS `vortex` in `/var/www/qyra/Backend/.env`.

---

## 1. Safety & Sibling Process Isolation Rules (VPS `vortex`)
VPS `vortex` hosts three independent production applications:
1. `johnpaulescuadra.com` (PM2 `jp-frontend` port 3000, `jp-backend` port 3001)
2. `haypstudios.com` (PM2 `hayp-frontend` port 3003)
3. `qyra.space` (Static landing page via Nginx, API backend PM2 `qyra-backend` port 3005)

**CRITICAL SAFETY DIRECTIVE:**
- NEVER run `pm2 kill`, `pm2 delete all`, or reload processes belonging to sibling applications.
- When reloading Qyra backend, target exclusively: `pm2 reload qyra-backend`.
- Immediately after reloading, run `pm2 status` and assert that all sibling processes (`jp-frontend`, `jp-backend`, `hayp-frontend`) remain online.

---

## 2. Phase 14.2: Stripe Live Mode Activation Runbook

### Pre-Requisites in Stripe Dashboard (Live Mode)
- [ ] Log in to Stripe Dashboard and toggle from Test mode to **Live mode**.
- [ ] Verify business identity, payout bank accounts, and public business details under Settings > Public Details.
- [ ] Ensure Radar risk rules and 3D Secure / SCA are enabled under Settings > Radar.
- [ ] Create live products and prices matching all subscription billing tiers:
  - Starter Monthly (`STRIPE_STARTER_MONTHLY_PRICE_ID`)
  - Starter Annual (`STRIPE_STARTER_ANNUAL_PRICE_ID`)
  - Professional Monthly (`STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID`)
  - Professional Annual (`STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID`)
  - Premium Monthly (`STRIPE_PREMIUM_MONTHLY_PRICE_ID`)
  - Premium Annual (`STRIPE_PREMIUM_ANNUAL_PRICE_ID`)
  - Enterprise Monthly (`STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`)
  - Enterprise Annual (`STRIPE_ENTERPRISE_ANNUAL_PRICE_ID`)
- [ ] Create live one-time scan pack products and price IDs:
  - Scan Pack 100 (`STRIPE_SCAN_PACK_100_PRICE_ID`)
  - Scan Pack 250 (`STRIPE_SCAN_PACK_250_PRICE_ID`)
  - Scan Pack 500 (`STRIPE_SCAN_PACK_500_PRICE_ID`)
- [ ] Create a live Webhook Endpoint:
  - **Endpoint URL:** `https://qyra.space/api/webhooks/stripe` (canonical mounted route `POST /api/webhooks/stripe`; `https://api.qyra.space/api/webhooks/stripe` once `api.qyra.space` Nginx vhost/TLS is activated under Phase 16.1)
  - **Events to listen for:**
    - `checkout.session.completed`
    - `invoice.payment_succeeded`
    - `customer.subscription.deleted`
  - **Capture Webhook Signing Secret:** Copy `whsec_...` for server configuration.

### Server Configuration (`vortex`)
- [ ] SSH to server: `ssh -i ~/.ssh/id_ed25519_hetzner root@2.28.120.85`
- [ ] **Mandatory Backup:** `cp /var/www/qyra/Backend/.env /var/www/qyra/Backend/.env.bak.$(date +%F)`
- [ ] Edit `/var/www/qyra/Backend/.env`:
  ```env
  STRIPE_SECRET_KEY=sk_live_<production_secret>
  STRIPE_WEBHOOK_SECRET=whsec_<production_webhook_secret>
  STRIPE_STARTER_MONTHLY_PRICE_ID=price_<live_id>
  STRIPE_STARTER_ANNUAL_PRICE_ID=price_<live_id>
  STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_<live_id>
  STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_<live_id>
  STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_<live_id>
  STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_<live_id>
  STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_<live_id>
  STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_<live_id>
  STRIPE_SCAN_PACK_100_PRICE_ID=price_<live_id>
  STRIPE_SCAN_PACK_250_PRICE_ID=price_<live_id>
  STRIPE_SCAN_PACK_500_PRICE_ID=price_<live_id>
  ```
- [ ] **Scan Pack Pre-Flight Check:** Verify all three scan pack price IDs (`STRIPE_SCAN_PACK_100_PRICE_ID`, `250`, `500`) are explicitly defined and non-empty.
- [ ] **Permissions Hardening:** `chmod 600 /var/www/qyra/Backend/.env` (restrict read/write access strictly to `root`).
- [ ] Verify fail-closed mode guard: The backend automatically rejects test-mode events when `STRIPE_SECRET_KEY` starts with `sk_live_`.

---

## 3. Phase 14.3: QuickBooks Online Production OAuth App Verification Runbook

### Pre-Requisites in Intuit Developer Dashboard
- [ ] Log in to [Intuit Developer Portal](https://developer.intuit.com/).
- [ ] Navigate to the Qyra production app settings under **Dashboard > Production Keys & OAuth**.
- [ ] Verify **Redirect URIs**:
  - `https://qyra.space/api/quickbooks/callback`
- [ ] Complete Intuit App Assessment Questionnaire (Privacy policy, Terms of Service, Security questions).
- [ ] Copy Production **Client ID** and **Client Secret**.

### Server Configuration (`vortex`)
- [ ] In `/var/www/qyra/Backend/.env`:
  ```env
  QB_ENVIRONMENT=production
  QB_CLIENT_ID=<production-client-id>
  QB_CLIENT_SECRET=<production-secret>
  QB_REDIRECT_URI=https://qyra.space/api/quickbooks/callback
  QB_AUTH_URL=https://appcenter.intuit.com/connect/oauth2
  QB_TOKEN_URL=https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer
  QB_API_BASE_URL=https://quickbooks.api.intuit.com/v3/company
  ```

---

## 4. Production Deployment & Process Reload Protocol

Execute strictly in order on `vortex`:
```bash
# 1. Navigate to Qyra backend directory
cd /var/www/qyra/Backend

# 2. Fetch and fast-forward latest commit from main
git pull origin main

# 3. Regenerate Prisma Client (if schema updated)
npx prisma generate

# 4. Build TypeScript backend
npm run build

# 5. Reload exclusively the Qyra backend PM2 process
pm2 reload qyra-backend

# 6. Sibling Process Isolation Assertion
pm2 status
# Assert: qyra-backend (port 3005), jp-frontend (3000), jp-backend (3001), hayp-frontend (3003) are all online.
```

---

## 5. Post-Deployment Smoke Test Protocol

### Smoke Test 1: Health & API Availability
```bash
curl -f https://api.qyra.space/health
# Expected: HTTP 200 {"status":"ok"}
```

### Smoke Test 2a: Stripe Subscription Checkout Session Creation
- Initiate a test subscription checkout from `https://qyra.space/pricing`.
- Verify redirect to Stripe Live Checkout with HTTPS and correct product title.
- Verify return redirect to `https://qyra.space/dashboard?session_id=cs_...`.

### Smoke Test 2b: Stripe One-Time Scan Pack Checkout
- In dashboard, select **Buy Scan Pack 100**.
- Complete live card payment; verify webhook receipt `checkout.session.completed`.
- Confirm user `bonusScans` in database increments by 100.

### Smoke Test 3: QuickBooks Production OAuth Connect & Token Lifecycle
- In Qyra dashboard settings, click **Connect to QuickBooks**.
- Verify authorization redirects to Intuit Production consent screen (`appcenter.intuit.com`).
- Authorize connection and verify return to callback with valid encrypted tokens stored in PostgreSQL `TenantSettings`.
- Test journal entry sync with a verified scan record; assert HTTP 200 and audit log entry.
- Monitor PM2 application logs for 7 days to verify automated token refresh deduplication runs without errors.

---

## 6. Post-Deployment Record & Operator Sign-Off
Once verification is complete, record:
- **Deployment Timestamp:** `YYYY-MM-DD HH:mm UTC`
- **Operator Signature:** `JP`
- **Verification Outcomes:**
  - Stripe Subscription Checkout: `PASS`
  - Stripe Scan Pack Checkout: `PASS`
  - QuickBooks Production OAuth: `PASS`
  - Sibling Processes Health: `PASS`