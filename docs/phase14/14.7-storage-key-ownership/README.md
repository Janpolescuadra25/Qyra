# STATUS: DONE (2026-11-11)

# Phase 14.7: Storage Key Ownership & Attachment Defense

## 1. Overview & Architectural Role
This deliverable implements server-side storage key ownership validation, directory traversal protection, and tenant upload isolation for all file attachments processed by Qyra's API.

It satisfies **Phase 14.7 (Storage Key Ownership)** and fulfills security mitigation **15.3 (Scan Attachment Ownership / QF11)**, preventing cross-tenant attachment ticket hijacking, unauthorized file enumeration, and path traversal attacks.

---

## 2. Core Protection Mechanisms

### 2.1 Directory Traversal & Format Defense (`isValidStorageKey`)
Implemented in `Backend/src/lib/validators.ts`:
- **Length Constraint:** Max 512 characters.
- **Character Whitelist:** Allowed characters strictly restricted to `[A-Za-z0-9._\-/]`.
- **Traversal Sequences:** Blocks `..` (parent traversal), leading `/` or `\` (absolute root paths), and `//` (double slash bypasses).
- **Enforcement:** Any format violation immediately aborts with HTTP 400 (`Invalid attachment storageKey format or unsafe path`).

### 2.2 Strict Tenant Path Prefix Whitelisting
Implemented in `Backend/src/routes/scans.ts`:
- **Owner Isolation:** Non-admin uploads must strictly begin with `scans/${ownerId}/` or `agreements/${ownerId}/`.
- **Admin Tenant Delegation:** If `adminId` is present on the authenticated session, keys with `scans/${adminId}/` and `agreements/${adminId}/` are allowed for team collaboration.
- **Test Mode Whitelist:** In `process.env.NODE_ENV === 'test'`, the prefix `tests/` is permitted for automated CI test fixtures.
- **Fail-Closed Rejection:** Any key outside the computed tenant prefix whitelist immediately aborts with HTTP 403 (`Invalid attachment storageKey: must belong to your tenant`).

### 2.3 Collision & Duplicate Defense
- Prior to scan record persistence, the database is queried via `prisma.attachment.findUnique({ where: { storageKey } })`.
- Collisions abort with HTTP 409 (`Storage key already in use`).

---

## 3. Test Suite Verification
Verified via `Backend/tests/storage-key-ownership.test.ts`:
1. `creates a scan with a valid attachment storageKey (200/201)`: PASS
2. `rejects duplicate attachment storageKey collisions with 409`: PASS
3. `rejects invalid traversal storageKey values with 400`: PASS
4. `blocks cross-tenant unattached upload ticket hijacking with 403`: PASS
5. `blocks cross-tenant attachment URL access with 404`: PASS

---

## 4. Status & Roadmap Verification
- **Status:** COMPLETED & VERIFIED (5/5 unit & integration tests passing)
- **Roadmap Anchor:** Phase 14.7 (Storage Key Ownership) & Phase 15.3 (QF11)