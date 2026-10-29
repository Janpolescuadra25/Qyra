# Deliverable 12.7 Part 1: Multi-Region Database Replication

## Status

Implemented and verified on 2026-10-29. The replication foundation introduces regional read routing while preserving Qyra's existing primary-database write path.

## Architecture

- `Backend/src/lib/databaseReplication.ts` owns replica configuration, regional client selection, health state, and primary fallback.
- `Backend/src/lib/prisma.ts` preserves the shared primary `prisma` singleton and exports read/write routing helpers.
- `Backend/src/middleware/regionDetection.ts` derives the request region from supported headers.
- `Backend/src/routes/health.ts` exposes replication health and latency information.
- `Backend/src/lib/__tests__/database-replication.test.ts` verifies routing, failover, health checks, and write protection.

## Safety guarantees

All mutations remain on the primary PostgreSQL connection. Replica helpers reject write operations, and read failures fall back to the primary client. Replication is disabled unless explicitly enabled through configuration, so deployments without replicas preserve the existing single-primary behavior.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DATABASE_REPLICATION_ENABLED` | Enables regional read routing. |
| `DATABASE_DEFAULT_REGION` | Selects the fallback region. |
| `DATABASE_REPLICA_US_EAST_URL` | US East read-replica URL. |
| `DATABASE_REPLICA_US_WEST_URL` | US West read-replica URL. |
| `DATABASE_REPLICA_EU_WEST_URL` | EU West read-replica URL. |
| `DATABASE_REPLICA_AP_SOUTHEAST_URL` | Asia-Pacific read-replica URL. |

Credentials remain environment-only and must never be committed.
