# VPS Deployment Preparation (Phase F-10)
## Status: DONE (Completed: 2026-09-27)

### Overview
Prepared the Qyra extension and backend infrastructure for dedicated hosting on the vortex VPS (Slot #3 @ 2.28.120.85) behind an Nginx reverse proxy with SSL:
1. Updated Manifest V3 host permissions and CSP to enforce HTTPS-only endpoints:
   - https://api.qyra.io
   - https://*.vortexsdo.com
   - https://2.28.120.85
2. Migrated frontend API client configuration to Vite environment variables (import.meta.env.VITE_BACKEND_URL) with PROD fallback.
3. Updated backend CORS policy in Backend/src/index.ts to allow production VPS domains.
4. Added PM2 process configuration (Backend/ecosystem.config.js) for reliable 24/7 process execution on internal port 3005.
5. Added Nginx reverse-proxy configuration template (Backend/deploy/nginx-qyra.conf) with Let's Encrypt SSL and HSTS.
6. Added automated database migration startup script (npm run start:migrate).
7. Standardized Backend .env.example for Hetzner VPS environment.

### Security, Firewall & Secret Management
1. Firewall (UFW) Configuration on vortex VPS:
   ufw default deny incoming
   ufw default allow outgoing
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
2. Secrets Management:
   - Never commit production secrets (DATABASE_URL password, QB client secrets, JWT secrets) to Git.
   - Inject secrets directly into /var/www/qyra/Backend/.env on the VPS server with chmod 600 permissions.

### Production Deployment & SSL Instructions
On the vortex VPS (2.28.120.85):
1. Install PM2, Nginx, and Certbot:
   npm install -g pm2
   apt install nginx certbot python3-certbot-nginx -y
2. Prerequisite SSL Certificate Generation:
   certbot --nginx -d api.qyra.io -d qyra.vortexsdo.com
3. Copy Backend/deploy/nginx-qyra.conf to /etc/nginx/sites-available/qyra.
4. Enable site:
   ln -s /etc/nginx/sites-available/qyra /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
5. Deploy database migrations and start backend under PM2:
   cd /var/www/qyra/Backend
   npm run start:migrate
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup

### Post-Deployment Smoke Tests & Health Check
After deployment on the VPS:
1. curl -I https://api.qyra.io/health
2. Verify response includes HTTP 200 OK and Strict-Transport-Security header.

### Rollback Procedures
If production issues occur:
1. Revert Git release commit: git revert HEAD
2. Restart backend: pm2 restart qyra-backend
3. If database rollback is needed, run target down migration: npx prisma migrate resolve

### Deliverables Verified
- Frontend/manifest.json: HTTPS host permissions and CSP connect-src active
- Frontend/src/lib/config.ts: Vite PROD environment configuration active
- Frontend/.env.production: Configured for production HTTPS endpoint and preserved Stripe key
- Backend/src/index.ts: CORS whitelist updated for VPS domains
- Backend/ecosystem.config.js: PM2 ecosystem file created
- Backend/deploy/nginx-qyra.conf: Nginx reverse-proxy configuration template created with HSTS
- Backend/package.json: start:migrate script added
- Backend/dist/index.js: Backend built successfully for PM2
- qyra-extension.zip: Extension built and packaged for store upload

### STEP 10: Test, Build, Package, Verify and Commit
1. Run backend tests and compile backend TypeScript:
   cd "C:\Users\HomePC\Desktop\Qyra\Backend"
   npm test -- --runInBand
   npm run build

2. Verify backend build artifact:
   powershell -Command "Test-Path 'dist\index.js'"

3. Run frontend tests, build production bundle, and package extension:
   cd "C:\Users\HomePC\Desktop\Qyra\Frontend"
   npm test -- --run
   npm run build

4. Validate built manifest JSON:
   node -e "const fs = require('fs'); const m = JSON.parse(fs.readFileSync('dist/manifest.json')); console.log('Manifest JSON is valid. Host permissions count:', m.host_permissions.length);"

5. Package extension:
   npm run package

6. Smoke test build and package outputs:
   powershell -Command "Get-ChildItem -Path dist\manifest.json, qyra-extension.zip | Select-Object Name, Length, LastWriteTime"

7. Stage and commit:
   cd "C:\Users\HomePC\Desktop\Qyra"
   git add Frontend/manifest.json Frontend/src/lib/config.ts Frontend/.env.production Backend/src/index.ts Backend/ecosystem.config.js Backend/deploy/nginx-qyra.conf Backend/package.json Backend/.env.example docs/features/VPSDeploymentPrep_F-10/README.md
   git commit -m "build(vps): configure HTTPS endpoints, pm2 ecosystem, nginx vhost, cors, and migrations for vortex VPS"
   git log -1 --stat
