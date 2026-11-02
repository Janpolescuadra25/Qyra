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
| **14.2 Stripe Live Mode Activation** | Live price IDs, production webhook validation, live subscription checkout verification | `Backend/`, `web/` | NOT STARTED |
| **14.3 QuickBooks Online Production OAuth** | Production app review verification, live company connection, sync audit | `Backend/` | NOT STARTED |
| **14.4 Browser Store Submission Tracking** | Chrome Web Store, Edge Add-ons, Mozilla AMO review status & compliance tracking | Store Dashboards | IN PROGRESS |
| **14.5 Production Security & Rate Limiting** | CORS origin locking, Express rate limiters, Helmet headers, reverse proxy security | `Backend/`, Nginx | NOT STARTED |
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
