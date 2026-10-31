# Deliverable 12.7 Part 2: Localized Stripe Tax Integration

## Status

**DONE — IMPLEMENTED 2026-10-31**

The code integration is complete and passed the backend build and automated test suite. Production sign-off remains contingent on Stripe Dashboard configuration and regional checkout verification in the applicable Stripe mode.

## Implementation

- **Stripe Automatic Tax:** Both subscription and scan-pack Checkout sessions send `automatic_tax: { enabled: true }`.
- **Tax ID Collection:** Both Checkout sessions send `tax_id_collection: { enabled: true }` to collect eligible business tax identifiers for Stripe's VAT/GST workflows.
- **Source:** `Backend/src/routes/checkout.ts`
  - Subscription Checkout session: lines 144–145 at implementation time.
  - Scan-pack one-time Checkout session: lines 208–209 at implementation time.
- **Automated verification:** The backend Prisma/TypeScript build passed, and the full backend Jest suite passed 34 suites and 206 tests in-band on 2026-10-31.

## Production Requirements

Before enabling production traffic, configure and verify the following separately in Stripe test mode and live mode:

1. Add every required tax registration in Stripe Dashboard under Tax.
2. Assign the appropriate Stripe product tax code to every subscription and scan-pack product or price.
3. Ensure Checkout can determine the customer's location from an accepted billing or shipping address.
4. Test representative customer locations, currencies, taxable and non-taxable outcomes, and valid/invalid business tax IDs.
5. Confirm invoices, receipts, refunds, credit notes, reporting, filing, and remittance procedures with the business's tax adviser.

## Architecture Notes

- Stripe Checkout calculates and itemizes tax using Stripe Tax after the account, products, registrations, and customer location are configured.
- Qyra does not maintain a local tax-rate table for these Checkout flows.
- Tax ID Collection captures identifiers for Stripe validation and tax treatment. Collection alone does not guarantee exemption or reverse-charge treatment; the result depends on the identifier, customer location, transaction, registrations, and Stripe configuration.
- Test-mode verification does not configure or prove the equivalent live-mode setup.

## Verification Checklist

- [x] Automatic Tax enabled in both Checkout-session creation paths.
- [x] Tax ID Collection enabled in both Checkout-session creation paths.
- [x] Backend build passed.
- [x] Backend automated test suite passed.
- [ ] Stripe test-mode registrations and product tax codes verified.
- [ ] Regional test matrix completed and evidence retained.
- [ ] Live-mode registrations, product tax codes, and webhook behavior verified before production sign-off.
