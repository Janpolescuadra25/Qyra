# Phase 14.3: QuickBooks Online Production OAuth

## 1. Overview
This deliverable implements Intuit QuickBooks Online production OAuth 2.0 authentication, company data synchronization, and token lifecycle management with concurrency protection.

## 2. Technical Architecture & Implementation
- **Service Implementation**: `Backend/src/services/qb.service.ts` (line 7)
- **Token Refresh Deduplication**: Implements an in-memory `pendingRefreshes` Map ensuring concurrent API requests hitting expired access tokens do not initiate redundant refresh requests against Intuit's token endpoint.
- **Cryptographic Approval Binding**: Enforces strict organization binding between authorized Intuit realm IDs and user records.
- **Production Parameter Registry**:
  - Environment: `production`
  - Client ID: `ABnJGWv9uA34NkQf17It4i15yM82XWVPSIePLe0XRhv9llLnms`
  - Redirect URI: `https://qyra.space/api/quickbooks/callback`
  - Authorization Endpoint: `https://appcenter.intuit.com/connect/oauth2`
  - Token Endpoint: `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer`
  - API Base URL: `https://quickbooks.api.intuit.com/v3/company`

## 3. Deployment & Verification Checklist
1. Production client credentials reside exclusively in `/var/www/qyra/Backend/.env` on VPS `vortex`.
2. Execute automated test suite: `npx jest src/tests/quickbooks-oauth.test.ts` (6/6 tests passing).
3. Validate OAuth callback handshake via browser flow on `https://qyra.space`.
4. Confirm automatic token rotation updates PostgreSQL database records with new refresh tokens.

## 4. Security & Data Integrity Invariants
- Client secrets are never checked into version control or logged in application logs.
- Refresh tokens are encrypted at rest using AES-256-GCM.
- In-flight refresh storms are deduplicated at the service tier.