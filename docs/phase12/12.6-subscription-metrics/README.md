# Deliverable 12.6: Advanced Subscription Metrics & MRR Churn Telemetry

## Status: COMPLETED / DONE
- **Phase**: 12 (Monetization & Billing Lifecycle)
- **Deliverable**: 12.6
- **Completion Date**: 2026-10-29
- **Commit Reference**: Deliverable 12.6 Final Consolidation

---

## 1. Overview & Architecture
Deliverable 12.6 introduces subscription telemetry and revenue analytics to Qyra. It captures granular lifecycle subscription transitions, maintains an immutable event ledger (`SubscriptionEvent`), and provides administrative analytics endpoints for Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), and Churn metrics across custom time windows.

```
+-----------------------------------------------------------------------------------------+
|                                    Telemetry Architecture                               |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [Stripe Webhooks]                                                                      |
|        │                                                                                |
|        ├──> customer.subscription.updated ──> recordSubscriptionEvent(UPGRADE/...)      |
|        ├──> customer.subscription.deleted ──> recordSubscriptionEvent(CANCEL)           |
|        ├──> invoice.payment_succeeded     ──> recordSubscriptionEvent(REACTIVATE/...)   |
|        └──> invoice.payment_failed        ──> recordSubscriptionEvent(CHURN)            |
|                                                                                         |
|  [User Actions (Frontend)]                                                              |
|        │                                                                                |
|        └──> CancelSubscriptionModal ──> POST /api/billing/cancel-subscription           |
|                                         (reason, feedback, cancelAtPeriodEnd)           |
|                                                                                         |
|  [Admin Endpoints]                                                                      |
|        │                                                                                |
|        ├──> GET /api/admin/metrics/subscriptions (MRR, ARR, active subscriber counts)   |
|        └──> GET /api/admin/metrics/churn         (user churn %, MRR churn %, breakdown) |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Database Schema & Data Models

### 2.1 SubscriptionEvent Model
An immutable audit log of all subscription transitions.
```prisma
model SubscriptionEvent {
  id           String   @id @default(uuid())
  userId       String
  eventType    String
  fromPlan     String?
  toPlan       String?
  fromInterval String?
  toInterval   String?
  mrrDelta     Float    @default(0)
  reason       String?
  feedback     String?
  createdAt    DateTime @default(now())
  user         User     @relation("UserSubscriptionEvents", fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
  @@map("subscription_events")
}
```

### 2.2 User Model Telemetry Fields
```prisma
model User {
  cancellationReason   String?
  cancellationFeedback String?
  subscriptionEvents   SubscriptionEvent[] @relation("UserSubscriptionEvents")
}
```

### 2.3 Subscription Event Type Contract
The implementation specifically uses:
```typescript
export type SubscriptionEventType = 'CANCEL' | 'REACTIVATE' | 'UPGRADE' | 'DOWNGRADE' | 'INTERVAL_CHANGE' | 'NEW_SUBSCRIPTION' | 'CHURN';
```

---

## 3. Telemetry Services (`Backend/src/services/subscriptionMetrics.ts`)
- `computePlanMRR(...)`: converts the canonical plan + interval to the correct monthly recurring revenue value.
- `recordSubscriptionEvent(...)`: persists immutable billing events while remaining non-blocking if telemetry storage fails.
- `getSubscriptionMetrics()`: aggregates MRR, ARR, active counts, scheduled cancellations, and plan distribution.
- `getChurnMetrics(days)`: calculates churn rate and reason breakdown across a bounded time window.

---

## 4. API Endpoints

### 4.1 Admin Endpoints (`Backend/src/routes/admin.ts`)
- `GET /api/admin/metrics/subscriptions`:
  - Returns current MRR, ARR, active subscriber count, scheduled cancellations, and plan distribution.
  - Protected by router middleware and `requireRole('OWNER', 'ADMIN')`.
- `GET /api/admin/metrics/churn`:
  - Returns total churn, churn rate, and cancellation reason breakdown for the requested window.
  - Protected by router middleware and `requireRole('OWNER', 'ADMIN')`.

### 4.2 Billing Cancellation (`Backend/src/routes/billing.ts`)
- `POST /api/billing/cancel-subscription` accepts:
  ```json
  {
    "reason": "too_expensive",
    "feedback": "Budget changed and I need a lower-cost plan."
  }
  ```
- Behavior:
  - Validates the reason against the canonical supported set.
  - Updates the team account with `cancelAtPeriodEnd: true` and stores the structured metadata.
  - Creates a `CANCEL` subscription event and computes the MRR delta.

---

## 5. Webhook Synchronization
Supported lifecycle events in `Backend/src/routes/webhooks.ts` include:
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.paid`

These updates keep the canonical local billing state synchronized with Stripe and record telemetry whenever a user upgrades, cancels, reactivates, or churns.

---

## 6. Frontend Integration
- `Frontend/src/popup/components/billing/CancelSubscriptionModal.tsx`
  - Presents standardized cancellation reasons with radio buttons.
  - Captures optional freeform feedback up to 500 characters.
- `Frontend/src/popup/lib/api.ts`
  - Exposes `cancelSubscription(token, data)` with structured reason and feedback payloads.
- `Frontend/src/popup/components/SettingsView.tsx`
  - Connects the billing flow to the backend cancellation route and refreshes subscription state after the lifecycle change.

---

## 7. Verification & Automated Tests
- Test file: `Backend/tests/billing-telemetry.test.ts`
- Validation coverage includes:
  * MRR and ARR calculations from canonical plan pricing.
  * Churn rate and reason-breakdown logic.
  * Structured cancellation payload capture and telemetry recording.
  * Admin metric response auth and aggregation paths.
- Mandatory validation command:
  ```bash
  cd Backend && npx jest --runInBand && npm run build
  ```
- Result: all backend test suites pass and the project compiles successfully.