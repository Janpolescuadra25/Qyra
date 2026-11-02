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
| **14.1 Production Telemetry & Sentry Integration** | Client & server error monitoring, performance tracing, sanitization of financial PII | `Frontend/`, `Backend/` | NOT STARTED |
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

## Phase 14.1: Production Telemetry & Sentry Profiling
- **Status:** COMPLETED
- **Backend:**
  - Error tracking and distributed tracing via `@sentry/node@11.4.0`.
  - Continuous CPU profiling enabled via `@sentry/profiling-node@11.4.0` using `nodeProfilingIntegration()`.
  - Profiling sample rates configured: `1.0` in development / test, `0.1` (10%) in production via `profileSessionSampleRate` mapped from `SENTRY_PROFILES_SAMPLE_RATE`.
  - Comprehensive, fail-closed PII sanitization in `beforeSend` redacts sensitive headers, query parameters, user identifiers, and extra metadata keys.
- **Frontend:**
  - Browser-side crash tracking with fail-closed PII sanitization via `@sentry/browser@11.4.0` in `Frontend/src/popup/App.tsx`.
