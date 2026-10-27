# Deliverable 12.5: Self-Service Customer Management UI Portal

## 1. Executive summary

Deliverable 12.5 adds subscription self-service controls to the Chrome extension's Settings view. Stripe-backed accounts can inspect subscription state, preview and confirm paid-plan changes, schedule cancellation at the end of the current period, reactivate a pending cancellation, and open Stripe's hosted customer portal for payment methods and invoices. The Settings view also displays recent scan-pack purchases.

- **Implementation commit:** `c7b4b2c6fd86e6491df093810dc91024b058bc3e`
- **Status:** Complete and verified
- **UI integration point:** `Frontend/src/popup/components/SettingsView.tsx`
- **Client API:** `Frontend/src/popup/lib/api.ts`
- **Backend routes:** `Backend/src/routes/billing.ts`

## 2. Runtime flow

1. `SettingsView` loads billing status only when `user.subscriptionSource === 'stripe'`.
2. `SubscriptionStatusCard` renders the current subscription and exposes the available lifecycle actions.
3. A plan or interval selection in `PlanChangeModal` requests a live Stripe proration preview.
4. Confirmation reuses the preview's `prorationDate` when calling the plan-change endpoint, keeping the preview and mutation on the same Stripe proration timestamp.
5. Cancellation schedules the Stripe subscription to end at the current period boundary; reactivation clears that pending cancellation.
6. Payment methods and Stripe invoices are managed in the hosted Stripe customer portal.
7. `PaymentHistoryCard` separately displays scan-pack purchase history from the checkout API.

## 3. Component architecture

### `SubscriptionStatusCard`

`Frontend/src/popup/components/billing/SubscriptionStatusCard.tsx`

- Displays the tier, active/inactive state, payment-issue state, billing interval, and formatted renewal or cancellation date.
- Opens `PlanChangeModal` through `onOpenChangePlan`.
- Opens `CancelSubscriptionModal` through `onOpenCancel` for an active subscription.
- Exposes `onReactivate` while cancellation is pending.
- Opens the Stripe customer portal through `onOpenStripePortal` for payment methods and invoices.
- Shows loading and reactivation-in-progress states.

### `PlanChangeModal`

`Frontend/src/popup/components/billing/PlanChangeModal.tsx`

- Supports the paid tiers `starter`, `professional`, `premium`, and `enterprise`.
- Supports the canonical intervals `month` and `year`.
- Normalizes the current tier for comparison and prevents submission when neither tier nor interval changed.
- Calls `GET /api/billing/preview-proration` whenever the proposed selection changes.
- Displays the estimated amount due using the currency and amount returned by Stripe.
- Passes the returned `prorationDate` to the confirmation callback, which calls `POST /api/billing/change-plan` and refreshes billing status.

### `CancelSubscriptionModal`

`Frontend/src/popup/components/billing/CancelSubscriptionModal.tsx`

- Explains that paid features remain available until the current period end.
- Provides explicit keep-subscription and confirm-cancellation actions.
- Calls `POST /api/billing/cancel-subscription` through `SettingsView`.
- Represents an end-of-period cancellation flow; it does not currently collect a cancellation reason or offer immediate cancellation.

### `PaymentHistoryCard`

`Frontend/src/popup/components/billing/PaymentHistoryCard.tsx`

- Displays recent scan-pack purchases returned by `GET /api/checkout/scan-pack-purchases`.
- Shows scan quantity, localized purchase date, amount paid, and paid/refunded presentation.
- Provides loading and empty states.
- For Stripe-backed accounts, its optional **All invoices** action opens the hosted Stripe customer portal.
- Stripe invoice rows, hosted-invoice links, and receipt links are not returned by `GET /api/billing/status` and are not rendered directly by this component.

## 4. Client API contracts

The authenticated methods are defined in `Frontend/src/popup/lib/api.ts`.

| Client method | HTTP contract | Purpose |
| --- | --- | --- |
| `getBillingStatus(jwt)` | `GET /api/billing/status` | Returns tier, subscription status, period end, cancellation/payment flags, interval, and scan balances. |
| `previewProration(jwt, plan, interval)` | `GET /api/billing/preview-proration?plan=...&interval=...` | Returns a nested Stripe proration preview. |
| `changePlan(jwt, plan, interval, prorationDate?)` | `POST /api/billing/change-plan` | Applies a paid-tier or interval change using Stripe prorations. |
| `cancelSubscription(jwt)` | `POST /api/billing/cancel-subscription` | Schedules cancellation at the end of the billing period. |
| `reactivateSubscription(jwt)` | `POST /api/billing/reactivate-subscription` | Resumes automatic renewal for a pending cancellation. |

Related calls used by this UI are `createPortalSession(jwt)` for Stripe-hosted payment methods and invoices, and `getScanPackPurchases(jwt)` for the purchase-history card.

## 5. Contract and data standards

- Paid plan identifiers are normalized to `starter`, `professional`, `premium`, and `enterprise`; the backend rejects `free` as a plan-change target and directs that transition through cancellation.
- Billing intervals use `month` and `year`. The backend also accepts legacy interval spellings when parsing requests.
- Billing-cycle dates exposed to the frontend are ISO 8601 strings, including `current_period_end`, `currentPeriodEnd`, proration line periods, and `nextPaymentAttempt`.
- The proration response is nested under `{ status: 'success', data: ... }` and includes `prorationDate`, `amountDue`, `subtotal`, `total`, `currency`, `nextPaymentAttempt`, and line details.
- Stripe monetary values in proration responses are integer minor units. The modal divides `amountDue` by 100 for formatted display.
- `prorationDate` is a positive Unix timestamp in seconds and may be reused by `changePlan()`.

## 6. Security and access control

All calls require an authenticated JWT.

The authoritative authorization boundary is the backend:

- `GET /api/billing/status` permits an account owner or a user with role `ADMIN` and returns HTTP 403 otherwise.
- Proration preview and plan changes call `assertBillingAuthority` in `Backend/src/routes/billing.ts`.
- Cancellation and reactivation perform equivalent Owner/Admin checks directly in their route handlers.
- Backend authorization resolves mutations to the owner/team account rather than trusting a client-supplied account identifier.

`SettingsView.tsx` conditionally exposes the self-service card based on `subscriptionSource === 'stripe'`; it does not itself contain an Owner/Admin role guard. Therefore, frontend rendering is a usability boundary only. Backend checks remain mandatory and are the security control that prevents unauthorized billing reads or mutations.

## 7. Test coverage

`Frontend/src/popup/components/billing/__tests__/BillingPortal.test.tsx` contains six Vitest component tests using React DOM `act` and `createRoot`:

1. Renders an active subscription tier and its actions.
2. Renders pending cancellation and the reactivation action.
3. Invokes the plan-change trigger.
4. Renders cancellation details and invokes confirmation.
5. Renders scan-pack purchase data using the API response fields.
6. Renders the empty purchase-history state.

At the implementation baseline, the complete frontend suite contains 13 passing suites and 141 passing tests; the backend suite contains 33 passing suites and 201 passing tests.

## 8. Operational boundaries and follow-up

- Stripe invoice and receipt history remains delegated to the hosted customer portal.
- The cancellation UI does not yet collect churn reasons; that belongs with the subscription telemetry work planned in Deliverable 12.6.
- The frontend must not be treated as an authorization boundary. Any future billing endpoint must preserve authenticated server-side Owner/Admin enforcement.
