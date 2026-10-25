# Phase 12: Customer Self-Service Portal & Multi-Region Expansion

## 1. Executive Summary & Objective
Phase 12 expands Qyra's subscription infrastructure by delivering customer self-service billing capabilities and multi-region payment adaptability. Building upon the Stripe subscription architecture hardened in Phases 10 and 11, this phase operationalizes customer autonomy for subscription modifications, payment method updates, invoice history retrieval, and billing cancellations while maintaining strict authorization controls and transactional consistency.

- **Reference Baseline:** `d30ef5da6037143d784f56e875fb2bfcc6da1d3d` (Post-Phase 11 Archive & Phase 12 Init)
- **Status:** ACTIVE (IN PROGRESS)

---

## 2. Verified Architectural Grounding
Prior to Phase 12 implementation, the following foundational components are verified in the codebase:

1. **Existing Billing Portal Route (`Backend/src/routes/checkout.ts`):**
   - Endpoint: `POST /api/checkout/create-portal-session`
   - Guarded by `authenticate` middleware and `requireRole(['OWNER', 'ADMIN'])` authorization.
   - Automatically registers existing Stripe Customer IDs for users lacking one.
   - Invokes `stripe.billingPortal.sessions.create()` with a hardcoded return URL: `${process.env.FRONTEND_URL}/settings`.
2. **Existing Billing Status Route (`Backend/src/routes/billing.ts`):**
   - Endpoint: `GET /api/billing/status`
   - Returns active tier, interval, subscription status, and `cancelAtPeriodEnd` flag.
3. **Database Models (`Backend/prisma/schema.prisma`):**
   - Model `User`: Stores `stripeCustomerId`, `stripeSubscriptionId`, `cancelAtPeriodEnd`, `paymentIssue`, `currentPeriodEnd`, and `planInterval`.

---

## 3. Scope & Deliverable Breakdown

### Wave 1: Customer Portal Hardening & Dynamic Routing
- [x] **Deliverable 12.1 — Dynamic Return URL Whitelist & Origin Validation (COMPLETED - 2026-10-25):**
  - Enhance `POST /api/checkout/create-portal-session` to accept an optional `returnUrl` parameter.
  - Enforce strict origin validation against whitelisted domains (`FRONTEND_URL`, `EXTENSION_URL`, `https://qyra.space`) to prevent open-redirect vulnerabilities.
  - Fall back safely to `${process.env.FRONTEND_URL}/settings` when omitted or invalid.
- [x] **Deliverable 12.2 — Self-Service Subscription Cancellation & Reactivation Endpoints (COMPLETED - 2026-10-25):**
  - `POST /api/billing/cancel-subscription` schedules end-of-period cancellation via `stripe.subscriptions.update(id, { cancel_at_period_end: true })` and persists the `cancelAtPeriodEnd` flag to the user record.
  - `POST /api/billing/reactivate-subscription` reverses pending cancellations by sending `cancel_at_period_end: false` and restoring automatic renewal before the current billing period ends.
  - Both endpoints enforce authenticated owner/admin authorization, confirm a valid Stripe subscription exists, and reject unconfigured Stripe environments with a `503`.
  - Idempotent cancellation requests return a successful 200 with a lifecycle message instead of re-triggering the Stripe subscription update.
- [x] **Deliverable 12.3 — Tier Upgrade & Downgrade Proration API (COMPLETED - 2026-10-26):**
  - `GET /api/billing/preview-proration` previews the upcoming invoice impact of paid-tier and billing-interval changes.
  - `POST /api/billing/change-plan` applies an immediate Stripe subscription-item price change with prorations and synchronizes the canonical local billing fields.

#### Deliverable 12.3 API Contract

Both routes require authentication and owner or team-admin billing authority. Accounts must have both a Stripe customer ID and an active Stripe subscription ID. Direct transitions to `free` are rejected; use `POST /api/billing/cancel-subscription` for end-of-period cancellation.

**Preview proration**

- Route: `GET /api/billing/preview-proration`
- Query: `plan` is required; `interval` is optional and defaults to the current interval.
- Paid plan values: `starter`, `professional`, `premium`, `enterprise`.
- Interval values: canonical `month` or `year`; the aliases `monthly`, `annual`, and `yearly` are accepted and normalized.
- Stripe operation: `invoices.createPreview` with `subscription_details.proration_behavior: "create_prorations"`.
- The response includes `prorationDate`. Clients should send that value in the subsequent change request when the charged proration must match the preview calculation exactly.

```http
GET /api/billing/preview-proration?plan=professional&interval=annual
Authorization: Bearer <token>
```

```json
{
  "status": "success",
  "data": {
    "currentPlan": "starter",
    "currentInterval": "month",
    "targetPlan": "professional",
    "targetInterval": "year",
    "prorationDate": 1793012400,
    "amountDue": 1500,
    "subtotal": 1500,
    "total": 1500,
    "currency": "usd",
    "nextPaymentAttempt": "2026-11-26T00:00:00.000Z",
    "lines": []
  }
}
```

**Change plan**

- Route: `POST /api/billing/change-plan`
- Body: `plan` is required; `interval` and the preview response's `prorationDate` are optional.
- Stripe operation: `subscriptions.update` with `proration_behavior: "create_prorations"` and the active subscription item ID.
- After Stripe accepts the update, one Prisma update synchronizes `currentPlan`, `planInterval`, `currentPeriodEnd`, and `cancelAtPeriodEnd: false`. Signed Stripe webhooks remain the final reconciliation authority if a later local persistence failure creates temporary divergence.

```json
{
  "plan": "professional",
  "interval": "year",
  "prorationDate": 1793012400
}
```

### Wave 2: Multi-Region & Alternative Payment Methods
- **Deliverable 12.4 — Alternative Payment Methods & Tax Localisation:**
  - Enable Apple Pay, Google Pay, and SEPA/PayPal support in Stripe Checkout sessions.
  - Configure automatic tax calculation and currency conversion based on customer country, billing address, and IP geolocation.
- **Deliverable 12.5 — Customer Portal Configuration Validation:**
  - Scripted validation of Stripe Customer Portal settings (payment method updates, cancellation reason collection, billing address updates).

### Wave 3: Frontend Integration & End-to-End Verification
- **Deliverable 12.6 — Frontend Settings Portal Integration:**
  - Connect settings portal action button to `POST /api/checkout/create-portal-session`.
  - Reflect real-time subscription lifecycle updates (`cancelAtPeriodEnd`, renewal dates) in user dashboard.
- **Deliverable 12.7 — Localized Tax & Customer Portal UX Verification:**
  - Validate regional pricing, tax logic, and localized billing UX across supported markets.
  - Verify end-to-end Stripe testmode behavior for plan upgrades, cancellation flows, and webhook synchronization.

---

## 4. Safety Invariants & Rules of Engagement
1. **Never Echo Secrets:** Stripe secret keys and webhook secrets must remain strictly in environment variables.
2. **Server-Side Authorization:** Every billing modification endpoint must strictly verify ownership and prevent cross-tenant manipulation.
3. **Webhook as Final Authority:** Database status updates must remain driven by signed Stripe webhook events (`customer.subscription.updated`, `customer.subscription.deleted`).
4. **Fail Closed:** Invalid or inconsistent billing metadata must halt the flow and surface an error instead of silently mutating subscription state.
5. **Verification Checklist:**
   - Confirm origin allowlists before creating any portal session.
   - Validate billing status reads against the authenticated tenant's Stripe customer ID.
   - Verify one-to-one subscription mapping in all plan change and cancellation paths.
   - Confirm webhook replay and alert flows are tested before production rollout.
