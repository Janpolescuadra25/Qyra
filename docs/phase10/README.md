# Phase 10: Wave 1 Production VPS Deployment & Health Verification

## Status
100% COMPLETED and VERIFIED (2026-10-24)
Reference Commit: `c6f9775` (`c6f97752fcbf9e8268a188aaea01ecdd7c58d888`)

---

## Overview & Architecture
Phase 10 successfully establishes the self-hosted production deployment of Qyra on Hetzner Cloud VPS `vortex` (`2.28.120.85`), replacing previous cloud platform hosting with an isolated multi-tenant architecture.

- **Target Server:** Hetzner Cloud VPS `vortex` (`2.28.120.85`), Ubuntu 24.04 LTS, OpenSSH 10.2p1
- **Process Management:** PM2 service `qyra-backend` running on internal loopback port `3005`
- **Reverse Proxy & SSL:** Nginx reverse proxy with automated Let's Encrypt TLS certificates
- **Live Domains:**
  * API Gateway: `https://api.qyra.space` (Proxy to `http://127.0.0.1:3005`)
  * Web Application & Landing: `https://qyra.space` (Static root `/var/www/qyra/web`)

---

## Implemented Features & Deployment Assets
| Component | Server / Repo Path | Configuration & Role | Status |
|---|---|---|---|
| **API Server Entrypoint** | `Backend/src/index.ts` | Configured default `PORT = 3005`, CORS origins `https://qyra.space` | VERIFIED |
| **Prisma ORM & DB** | `Backend/prisma/schema.prisma` | PostgreSQL datasource with Prisma Client v6.5.0 | VERIFIED |
| **Static Landing Assets** | `web/` -> `/var/www/qyra/web` | Public landing page served directly by Nginx | VERIFIED |
| **PM2 Process Service** | `/var/www/qyra/Backend/dist/index.js` | PM2 process `qyra-backend` (PID 3335114, online) | VERIFIED |
| **Nginx Reverse Proxy** | `/etc/nginx/sites-available/` | SSL termination and proxy pass to port 3005 | VERIFIED |
| **Remote Environment** | `/var/www/qyra/Backend/.env` | Managed on VPS with zero secret leakage | VERIFIED |

---

## Multi-Tenant Sibling Isolation Invariants
The deployment enforces strict isolation on Hetzner VPS `vortex` across all co-hosted applications:
1. **Portfolio (`johnpaulescuadra.com`):** Port 3000 (`jp-frontend`), Port 3001 (`jp-backend`) — untouched and verified online (HTTP 200).
2. **Hayp Studios (`haypstudios.com`):** Port 3003 (`hayp-frontend`) in `/var/www/hayp-studios` — untouched and verified online (HTTP 200).
3. **Qyra (`qyra.space` / `api.qyra.space`):** Port 3005 (`qyra-backend`) and static web root `/var/www/qyra/web` — online and verified.

---

## Verification & Health Check Results
- [x] Pre-flight Git SHA match on VPS: `c6f97752fcbf9e8268a188aaea01ecdd7c58d888`
- [x] Node.js dependencies installed via `npm ci` (clean install, zero audit blockers)
- [x] Prisma Client generated successfully via `npx prisma generate`
- [x] TypeScript build compiled with exit code 0 (`npm run build`)
- [x] Port 3005 listener active on loopback: `127.0.0.1:3005`
- [x] PM2 process `qyra-backend` status `online`, restart count 0
- [x] Public HTTPS endpoint reachable: `https://api.qyra.space/api/health` -> HTTP 200 OK
- [x] Public landing domain reachable: `https://qyra.space` -> HTTP 200 OK
- [x] Sibling applications (`haypstudios.com`, `johnpaulescuadra.com`) online and unaffected

---

## Remaining Work
None. Phase 10 Wave 1 production VPS deployment is 100% complete and fully verified.