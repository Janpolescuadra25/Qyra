# STATUS: BLOCKED — RECONCILIATION PENDING (2026-11-14)

# Phase 16.1 Deliverable: Hetzner VPS `vortex` Commercial Deployment

---

## 1. Execution & Live Inspection Summary
Phase 16 pull-only deployment of current `main` (`ff452e3b+`) to Hetzner VPS `vortex` (`2.28.120.85`) remains **BLOCKED** pending remote working-tree and Nginx/static-root reconciliation (`BP-01` / `BP-04`), although the prior production service is live.

- **Pre-deployment gate failure (`0cccc24f` / `ff452e3b`):** `git status` on `/var/www/qyra` reported uncommitted deletions under `web/*` (`D web/*`, leaving only `.gitignore`), blocking `git merge --ff-only`.
- **Read-only SSH diagnostic probes completed (2026-11-14):** Verified why `https://qyra.space/` remains live despite `D web/*` and surfaced runtime configuration drift between docs and `vortex`.

---

## 2. Verified Live Runtime & Blocker Evidence (2026-11-14 Probes)
- **Host Target:** Hetzner VPS `vortex` (`2.28.120.85`, `/var/www/qyra`).
- **Remote Git HEAD:** `0cccc24f7c5ead114155f2b947f5644dffbf119c` (`## main...origin/main`, `1` commit `ff452e3` behind local/origin `main`), dirty with `D web/*`.
- **Live Listening Process & Port:** `qyra-backend` (`PM2 id 6`, `PID 695538`, `Backend/dist/` compiled `Nov 12 19:22`) is listening on **`*:10000`** (`ss -tlnp`), **NOT** the code fallback port `3005` (`Backend/src/index.ts:52`, `127.0.0.1:3005/health` refused connection).
- **Verified Local & Public Health:**
  - `http://127.0.0.1:10000/health` returns `HTTP/1.1 200 OK` (`{"status":"ok","service":"qyra-backend",...}`).
  - `http://127.0.0.1:10000/api/health` returns `HTTP/1.1 404 Not Found` (`healthRouter` only registers `/api/health/db-replication` in `Backend/src/routes/health.ts:6`).
  - `https://qyra.space/` returns `HTTP/2 200` (`text/html`, `91,879` bytes).
- **Nginx & Static Serving (`BP-04`):** `/etc/nginx/sites-enabled/qyra.space` (`qyra.space`, `www.qyra.space`; `api.qyra.space` absent in `sites-available` and `sites-enabled`) proxies **both** `location /api/` and `location /` to `http://127.0.0.1:10000`. Express serves static assets from `/var/www/qyra/Backend/public/` (`Backend/src/index.ts:137`), which is intact on disk (`108` files locally), while `/var/www/qyra/web/` is unused by Nginx.
- **Nginx CSP Drift Identified:** `/etc/nginx/sites-enabled/qyra.space` runs `proxy_hide_header Content-Security-Policy` and injects a restrictive `connect-src 'self'` policy overriding Express's Helmet CSP (`Backend/src/index.ts:118–130`).
- **Sibling Processes Untouched:** `jp-frontend` (`3000`), `jp-backend` (`3001`), `vortex-frontend` (`3002`), and `hayp-frontend` (`3003`) remained online and undisturbed.

---

## 3. Prerequisites to Unblock Phase 16
1. **[DONE — 2026-11-14 Read-Only Probes]** Inspect `/var/www/qyra` git working tree (`D web/*`), `Backend/public/`, PM2 socket port (`10000`), and `/etc/nginx/sites-enabled/qyra.space` without disturbing `qyra.space` or sibling apps.
2. **[PENDING — `BP-01` / `BP-04`]** Determine canonical repo handling of `web/` vs `Backend/public/` locally first, then execute a reviewed clean-tree reconciliation on `/var/www/qyra` without overwriting `Backend/public/` or breaking `qyra.space`.
3. **[PENDING — Nginx / Config Alignment]** Align documented/configured port expectations (`10000` live vs `3005` default), `15.2` production CORS gating, and Nginx `Content-Security-Policy` (`connect-src`) requirements.
4. **[PENDING — Certified Pull & Verification]** Re-run the certified pull-only deployment (`git merge --ff-only`, `Backend` TypeScript build, `pm2 reload qyra-backend`), and verify `HTTP 200` on `/health` and `https://qyra.space/` plus sibling uptime before marking `STATUS: DONE`.