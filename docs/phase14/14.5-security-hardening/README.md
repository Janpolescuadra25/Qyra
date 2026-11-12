# STATUS: DONE (2026-11-12)

# Phase 14.5 Deliverable: Security Hardening & Tenant Isolation Architecture

---

## 1. Executive Summary
Phase 14.5 validates and documents multi-tenant boundary defense, router-level global authentication, role-based authorization, rate limiting, and attachment storage sanitization across the Qyra API.

---

## 2. Authentication & Middleware Architecture

### 2.1 Router-Level Global Authentication
Rather than relying on vulnerable per-route annotations, resource routers enforce security globally at mount time via Express middleware chaining:
```typescript
// Backend/src/routes/scans.ts (line 101)
router.use(authenticate, enforceEffectiveRole);
```
Every incoming request to `/api/scans/*`, `/api/locations/*`, `/api/templates/*`, `/api/mappings/*`, `/api/rules/*`, `/api/admin/*`, `/api/owner/*`, `/api/products/*`, and `/api/notifications/*` must present a cryptographically verified JWT token before route handlers execute.

### 2.2 Mount-Level Authentication in Server Entrypoint
Routers that handle analytics, data exports, and user presets are guarded at the mount point in `Backend/src/index.ts`:
```typescript
app.use('/api/analytics', authenticate, analyticsRouter);
app.use('/api/exports', authenticate, exportsRouter);
app.use('/api/presets', authenticate, presetsRouter);
```

---

## 3. Multi-Tenant Data Isolation

### 3.1 Location Filter Scoping
Multi-tenancy in Qyra is bounded by organization locations. All scan operations (`GET /recent`, `GET /:id`, `GET /:id/attachment-url`) query the `prisma.scanRecord` model through tenant-aware query filters:
```typescript
const filter = locationFilter(req.user!);
const scans = await prisma.scanRecord.findMany({
  where: {
    ...filter,
    // additional query parameters
  },
  take: 5,
  orderBy: { createdAt: 'desc' },
});
```
This guarantees that users can never retrieve, inspect, or sign attachments belonging to other organizations or locations.

### 3.2 Response Contracts & Endpoints
- **`GET /api/scans/recent`**: Returns `{ scans: recentScans }` (bounded to 5 recent records within the caller's tenant).
- **`GET /api/scans/:id`**: Returns the specific `scanRecord` matching caller's location filter or throws 404.
- **`GET /api/scans/:id/attachment-url`**: Generates pre-signed Cloudflare R2 download URL strictly scoped to verified tenant attachments.

### 3.3 Attachment Storage Traversal Protection
All attachment uploads and signed URL retrievals enforce path safety:
1. **Traversal Sanitization:** Storage keys are validated against path traversal (`isValidStorageKey()`) preventing directory escaping.
2. **Explicit Prefix Allowlist:** Keys must match explicit tenant prefixes (`scans/{ownerId}/...` or `agreements/{ownerId}/...`), preventing cross-tenant attachment hijacking.

---

## 4. Role-Based Access Control (RBAC) Matrix

| Endpoint Group | Allowed Roles | Enforcement Mechanism |
|---|---|---|
| `/api/owner/*` | `OWNER` | `requireRole('OWNER')` |
| `/api/admin/*` | `OWNER`, `ADMIN` | `requireRole('OWNER', 'ADMIN')` |
| `/api/rules/*`, `/api/templates/*` | `OWNER`, `ADMIN`, `MANAGER` | `requireRole('OWNER', 'ADMIN', 'MANAGER')` |
| `/api/scans/*` | Authenticated tenant users | `router.use(authenticate, enforceEffectiveRole)` + `locationFilter` |

---

## 5. Defense-in-Depth & Rate Limiting
Public endpoints that handle sensitive authentication and recovery flows are protected by dedicated rate limiters:
- **`authLimiter`**: Mitigates brute-force credential stuffing against `/api/auth/login`.
- **`passwordResetLimiter`**: Throttles password recovery requests to prevent email spamming.
- **`emailVerificationLimiter`**: Restricts OTP generation requests.

---

## 6. Verification Status
- **Backend TypeScript Compilation:** Clean (exit code 0).
- **Frontend TypeScript Compilation:** Clean (exit code 0).
- **Automated Security Suites:** 26/26 tests passing across `sentry-telemetry`, `webhooks`, and `storage-key-ownership`.