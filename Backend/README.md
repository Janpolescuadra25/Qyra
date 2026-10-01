# Qyra Backend
**Status: DONE (Verified October 2026)**

## Architecture & Structure
- Built with TypeScript, Express, and Prisma ORM.
- src/index.ts: Main server entry point.
- src/routes/: 24 API route definitions (including auth, quickbooks, scans, checkout, webhooks).
- src/services/: Business logic services (qb.service.ts, rules.engine.ts).
- src/middleware/: 9 specialized middleware modules (auth, permissions, audit, rate-limit, validate, etc.).
- prisma/schema.prisma: 20+ relational database models.

## Key Implementation Details
- Build script: npm run build runs prisma generate && tsc.
- QuickBooks integration: Full OAuth 2.0 and createBillPayment with CreateBillPaymentInput type safety.
- Authentication: JWT-based auth middleware protecting private endpoints.
- Tests: 157/157 unit/integration tests passing.

## Usage
- Development: npm run dev
- Build: npm run build
- Production: npm run start:migrate
- Tests: npm run test
