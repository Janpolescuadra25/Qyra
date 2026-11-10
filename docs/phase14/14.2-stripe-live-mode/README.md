# Phase 14.2: Stripe Live Mode Commercial Activation

## 1. Overview
This deliverable implements and standardizes the live commercial payment processing architecture for Qyra. It isolates live payment processing from sandbox/testmode operations, enforces cryptographic webhook signature verification, and establishes fail-closed mode validation.

## 2. Technical Architecture & Implementation
- **Webhook Route Handler**: `Backend/src/routes/webhooks.ts` mounted at `/api/webhooks/stripe` (lines 142–151)
- **Endpoint Path**: `/api/webhooks/stripe`
- **Mode Isolation**: Enforces runtime validation preventing test events (`sk_test_`) from executing on live accounts and live events (`sk_live_`) from being ingested into test environments.
- **Webhook Secret Validation**: All payloads verified against `STRIPE_WEBHOOK_SECRET` before processing.
- **Price ID Metadata Mapping**:
  - Starter Monthly: `price_1Tt9mhCEe03Mr82wEWHj5jrc`
  - Starter Annual: `price_1Tt9oFCEe03Mr82w05e66TkL`
  - Professional Monthly: `price_1Tt9rwCEe03Mr82wMBVcxBPv`
  - Professional Annual: `price_1Tt9sMCEe03Mr82wTGwS6zpG`
  - Premium Monthly: `price_1Tt9uoCEe03Mr82waOsX5kZM`
  - Premium Annual: `price_1Tt9v9CEe03Mr82wKv4o5Wy5`
  - Enterprise Monthly: `price_1Tt9wOCEe03Mr82wurRYH9oJ`
  - Enterprise Annual: `price_1Tt9wcCEe03Mr82wPm2M6vtk`
  - Scan Pack 100: `price_1TvjRvCEe03Mr82wP0FCn8ic`
  - Scan Pack 250: `price_1TvLrRCEe03Mr82wvFNbCYJQ`
  - Scan Pack 500: `price_1TvLsKCEe03Mr82w1MzXutp9`

## 3. Deployment & Operational Checklist
1. Maintain test keys during staging verification.
2. Production cutover requires updating `/var/www/qyra/Backend/.env` on VPS `vortex` with production keys:
   - `STRIPE_SECRET_KEY=<production-secret-key>`
   - `STRIPE_WEBHOOK_SECRET=<production-webhook-secret>`
3. Restart `qyra-backend` PM2 process: `pm2 reload qyra-backend`.
4. Perform live transaction verification and verify invoice issuance.

## 4. Security & Compliance Invariants
- Zero production secret keys committed to Git repositories.
- Mode mismatch returns HTTP 400 with fail-closed rejection.
- Webhook signature replay protection enforced via Stripe timestamp tolerances.

## Mode Safety Guard Integration Test Coverage

The fail-closed Stripe mode safety guards implemented in `Backend/src/routes/webhooks.ts` are verified through route-level integration coverage in `Backend/tests/webhooks.test.ts` using the live Express route via `buildApp()`, `rawPayload`, `supertest`, and `mockConstructEvent`.

1. **Live event rejected in test mode (`HTTP 400`)**: Validates that a live event (`livemode: true`) is rejected when `STRIPE_SECRET_KEY` is configured as a test key (`sk_test_...`). Asserts the JSON error body via `res.body.error`.
2. **Test event rejected in live mode (`HTTP 400`)**: Validates that a test event (`livemode: false`) is rejected when `STRIPE_SECRET_KEY` is configured as a live key (`sk_live_...`). Asserts the JSON error body via `res.body.error`.
3. **Matching mode accepted (`HTTP 200`)**: Confirms a matching test-mode event succeeds and the route persists the update via `mockedPrisma.user.updateMany` with the expected subscription metadata.
4. **Missing key guard (`HTTP 500`)**: Confirms that a missing `STRIPE_SECRET_KEY` fails closed and returns an application error payload with `res.body.error`.
5. **Invalid key format guard (`HTTP 500`)**: Confirms that a malformed secret prefix (`sk_...` not matching `sk_live_` or `sk_test_`) fails closed and returns `res.body.error`.