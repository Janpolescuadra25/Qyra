# Deliverable 13.4: Wave 1 Core Financial, Webhook & Alert Hardening

## Status: COMPLETED
**Milestone Commit:** `18f5ca35523657b36e9d6c29d1bdc38d9d49191d`  
**Execution Date:** 2026-11-01  
**Target Services:** `Backend/src/routes/checkout.ts`, `Backend/src/routes/webhooks.ts`, `Backend/src/cron/sync-failure-alerts.ts`, `Backend/tests/stripe-tax.test.ts`

---

## 1. Executive Summary
Deliverable 13.4 hardens Qyra's core financial transactions, webhook processing pipeline, and background alerting against critical production integrity vulnerabilities identified in technical review (AST-R01, AST-R02, AST-R03, and AST-R11):
- Synchronizes customer billing address and tax ID updates to Stripe customer objects via `customer_update`.
- Restricts checkout session creation strictly to team owners and admins.
- Eliminates webhook deduplication concurrency races using atomic database constraints.
- Prevents premature fulfillment of unpaid scan packs and protects existing quota pools against unvalidated plan updates.
- Eliminates background cron alert runner crashes by introducing defensive array checks.

---

## 2. Implemented Code Changes

### A. Checkout Authority & Tax Address Sync (`Backend/src/routes/checkout.ts`)
1. **AST-R01 (`customer_update` on checkout)**:
   - Added `customer_update: { address: 'auto', name: 'auto' }` to both subscription (`/create-session`) and scan-pack (`/create-scan-pack-session`) Stripe session creation calls.
   - Ensures Stripe Tax captures customer address changes during checkout and persists them directly to the Stripe customer record.
2. **AST-R02 (Billing Authority Enforcement)**:
   - Enforced `isOwner` (`team.ownerId === req.user.id`) and `isAdmin` (`role === 'ADMIN' || role === 'OWNER'`) checks on `/create-session` and `/create-scan-pack-session`.
   - Rejects unauthorized team members with `403 Forbidden` (`Only team owners and admins can initiate checkout`), matching the existing security pattern on `/create-portal-session`.

### B. Webhook Atomic Deduplication & Fulfillment Safety (`Backend/src/routes/webhooks.ts`)
1. **AST-R03 (Atomic Event Deduplication)**:
   - Replaced non-atomic `findUnique` read-before-write check with an atomic `prisma.stripeEvent.create` call wrapped in a try/catch block.
   - Catches Prisma `P2002` (unique constraint violation) collisions gracefully, immediately acknowledging duplicate events (`received: true`) and eliminating concurrency replay races.
2. **AST-R03 (Scan-Pack Payment Status Verification)**:
   - In `checkout.session.completed`, added an explicit check:
     `if (session.payment_status !== 'paid') { return res.json({ received: true }); }`
   - Prevents crediting scan packs for delayed, failed, or asynchronous payment methods before payment settlement.
3. **AST-R03 (Plan Change Validation)**:
   - In `customer.subscription.updated`, added a guard: `if (team.currentPlan !== planKey)` before updating team quotas.
   - Prevents overwriting custom quotas or resetting quotas on minor subscription metadata updates.

### C. Background Cron Alert Defensive Iteration (`Backend/src/cron/sync-failure-alerts.ts`)
1. **AST-R11 (Array Iteration Safety)**:
   - Wrapped `staleScans` and `failedScans` with `Array.isArray()` defensive checks.
   - Eliminates runtime `TypeError: staleScans is not iterable` crashes when database queries return non-array results.

### D. Test Suite Hardening (`Backend/tests/stripe-tax.test.ts`)
1. Added assertions verifying `customer_update: { address: 'auto', name: 'auto' }` is passed to `stripe.checkout.sessions.create()`.
2. Certified full backward compatibility with existing tax calculation assertions.

---

## 3. Verification & Compliance Evidence
- **Dedicated Test Suite**: `npx jest tests/stripe-tax.test.ts` passed 4/4 tests.
- **Full Backend Jest Suite**: `npx jest` passed 35/35 test suites, 210/210 total tests with 0 failures.
- **Git Commit Baseline**: `18f5ca35523657b36e9d6c29d1bdc38d9d49191d` pushed to `origin/main`.
