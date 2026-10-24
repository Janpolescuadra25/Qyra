# Qyra

> Seamless POS to QuickBooks sync, right from your browser.

Qyra is a Chrome extension that bridges point-of-sale systems with QuickBooks Online. Scan receipts, invoices, and spreadsheets — map them to the right QuickBooks fields using configurable templates — and sync transactions in seconds.

## Features

### Transaction Sync
- **5 transaction types**: Journal Entries, Bills, Vendor Credits, Cheques, and Bill Payments
- **Batch sync**: Sync multiple transactions at once with per-item error handling (synced / skipped / failed)
- **Duplicate detection**: Automatic dedup with configurable rules and force-sync override
- **Retry**: Retry failed syncs individually or in bulk from the sync log
- **Sync log**: Full history of all sync attempts with status tracking

### Scan and Capture
- **POS text**: Paste or scrape text output from POS terminal screens
- **Image OCR**: Upload receipt or invoice photos, parsed via Google Gemini AI
- **Excel import**: Upload .xlsx files with transaction data, auto-parsed into scan records

### Template System
- **Per-type templates**: Create export templates for each transaction type (Journal Entry, Bill, Vendor Credit, Cheque)
- **Column mapping**: Map POS data columns to QuickBooks fields with a visual mapping editor
- **Default values**: Set default vendor, account, department, payment terms, and more per template
- **Template wizard**: Create templates from a live scan preview
- **Active/inactive management**: Enable or disable templates without deleting them

### Product Intelligence
- **Fuzzy matching**: Automatically match product names using configurable rules (contains, starts with, exact, regex)
- **Auto-suggest mappings**: Product matches suggest column mappings with confidence scoring
- **Unmatched panel**: Review and manually handle unmatched products

### Team and Access
- **Role hierarchy**: Owner (full access) and Admin (location-scoped access)
- **Invite-based onboarding**: Send invite links to add team members without sharing passwords
- **Multi-location**: Each admin manages their assigned business locations
- **Email verification**: Verify email addresses during signup
- **Password reset**: Secure password reset flow via email

### Billing
- **Stripe integration**: Checkout sessions and webhook-powered event handling
- **Multiple plans**: Tiered pricing with configurable plan IDs

## Architecture

```
                    +-------------------+
                    |   Business POS  |
                    |                   |
                    |   Receipts        |
                    |   Invoices        |
                    |   Excel Exports   |
                    +--------+----------+
                             |
                             v
              +------------------------------+
              |    Qyra Chrome Extension     |
              |                              |
              |  Scan Modes:                 |
              |    - POS text scraping        |
              |    - Image OCR (Gemini AI)    |
              |    - Excel file upload        |
              |                              |
              |  Template Engine:            |
              |    - Column-to-field mapping  |
              |    - Default values per type  |
              |    - Active/inactive mgmt     |
              |                              |
              |  Sync Operations:            |
              |    - Single and batch sync    |
              |    - Duplicate detection      |
              |    - Retry failed items       |
              |    - Force-sync override      |
              +--------------+---------------+
                             |
                             v
              +------------------------------+
              |       Qyra Backend API       |
              |     (Express + Prisma)       |
              |                              |
              |  Transaction Types:          |
              |    Journal Entry | Bill      |
              |    Vendor Credit | Cheque    |
              |    Bill Payment              |
              |                              |
              |  Platform:                   |
              |    Team and location mgmt    |
              |    Stripe subscriptions      |
              |    Email verification        |
              |    Product matching (fuzzy)  |
              +--------------+---------------+
                             |
                             v
                   +------------------+
                   | QuickBooks Online |
                   +------------------+
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- A QuickBooks Online developer account (sandbox or production)
- A Google AI Studio API key (for image OCR)
- A Stripe account (for subscription billing)
- A Resend account (for transactional emails)
- Google Chrome (for loading the extension)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Janpolescuadra25/Qyra.git
cd Qyra
```

2. Install backend dependencies:
```bash
cd Backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../Frontend
npm install
```

4. Set up the database:
```bash
cd Backend
npx prisma migrate deploy
npx prisma db seed
```

5. Configure environment variables (see Environment Variables section below)

6. Start the backend:
```bash
cd Backend
npm run dev
```

7. Build and load the Chrome extension:
```bash
cd Frontend
npm run build
```
Then go to `chrome://extensions`, enable Developer Mode, and load the `Frontend/dist` directory as an unpacked extension.

## Environment Variables

Copy `.env.example` from `Backend/` and fill in the values.

### QuickBooks
| Variable | Description |
|----------|-------------|
| `QB_CLIENT_ID` | QuickBooks app client ID |
| `QB_CLIENT_SECRET` | QuickBooks app client secret |
| `QB_REDIRECT_URI` | OAuth callback URL |
| `QB_ENVIRONMENT` | `sandbox` or `production` |

### Database and Auth
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `ENCRYPTION_KEY` | Encryption key for QB OAuth tokens |

### Application
| Variable | Description |
|----------|-------------|
| `APP_URL` | Backend base URL (for email links and redirects) |
| `FRONTEND_URL` | Frontend URL (CORS allowed origin) |
| `ALLOWED_EXTENSION_ID` | Chrome extension ID for auth |
| `GEMINI_API_KEY` | Google Gemini API key (OCR) |
| `RESEND_API_KEY` | Resend API key (emails) |
| `RESEND_FROM_ADDRESS` | Sender email address |
| `PORT` | Backend port (default: 5000) |

### Stripe
| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_*_PRICE_ID` | Price IDs for each plan tier (4 plans) |

### Initial Seed
| Variable | Description |
|----------|-------------|
| `OWNER_EMAIL` | Initial owner account email |
| `OWNER_PASSWORD` | Initial owner account password |
| `OWNER_NAME` | Initial owner display name |

## Project Structure

```
Qyra/
├── Backend/
│   ├── src/
│   │   ├── routes/            # API route handlers (auth, owner, admin, scans, quickbooks, etc.)
│   │   ├── lib/               # Shared utilities (errors, prisma client, email, encryption, stripe)
│   │   ├── middleware/        # Auth, rate limiting, role validation, audit logging
│   │   ├── services/          # Business logic (QuickBooks service, etc.)
│   │   └── utils/             # Helper functions (invite utils, etc.)
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (User, Location, ScanRecord, SyncLog, Template, etc.)
│   │   └── migrations/        # Database migrations (52 migrations)
│   ├── tests/                 # Backend tests
│   └── .env.example           # Environment variable template
├── Frontend/
│   ├── src/
│   │   ├── popup/             # Extension popup UI
│   │   │   ├── components/    # React components (SyncView, MappingView, ScanView, etc.)
│   │   │   ├── lib/           # Utilities (API client, payload builders, mapping utils)
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── contexts/      # React contexts (QuickBooks connection, etc.)
│   │   ├── types/             # TypeScript type definitions (index.ts, qb.ts)
│   │   └── background/        # Service worker
│   └── dist/                  # Built extension (loaded in Chrome)
├── docs/                      # Documentation
└── render.yaml                # Root Render config
```

## Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma (PostgreSQL)
- **QuickBooks**: Intuit QuickBooks Node.js SDK
- **AI / OCR**: Google Generative AI (Gemini)
- **Payments**: Stripe
- **Email**: Resend
- **Excel**: xlsx (SheetJS)
- **Validation**: Zod
- **Security**: Helmet, express-rate-limit, bcryptjs
- **File Upload**: Multer
- **Math**: mathjs

### Frontend (Chrome Extension)
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: esbuild
- **Testing**: Vitest

## Deployment

Qyra is configured for deployment on [Render.com](https://render.com):

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the environment variables listed above in the Render dashboard
4. The `render.yaml` configuration handles build commands, start commands, and environment variable keys

The backend automatically runs `prisma migrate deploy` on each deploy to keep the database schema in sync.

### Deployment Details

### Infrastructure
- **Backend API**: Render.com
- **Frontend / Landing Page**: Render.com
- **Database**: Neon (PostgreSQL)

### Landing Page
The landing page is a static HTML file located at `Backend/public/landing/index.html`. It is served by the backend Express server and deployed to Render.com as part of the backend deployment.

## License

Private repository. All rights reserved.

## Master completion plan

See [Qyra master plan](docs/Qyra_plan.md) for feature coverage, remaining verification, release gates and the CYPRA/HYDRA/MANTRA workflow. Historical deployment and completion statements above must be reconciled with the actual release; they are not current launch certification.

## JP guide: private environment files and VPS / PM2 updates

**Recommended:** keep editable credentials in private, Git-ignored files and transfer them separately over SSH. Git pull never transfers ignored files. Existing Backend/.env and Frontend/.env have been preserved; no credentials were copied from the VPS or printed by this documentation task.

Use Backend/.env for local development. If JP wants a local production copy, use Backend/.env.production.local (create privately, not by copying secrets into chat). This filename is a storage convention: the current application does not automatically load it. On the VPS the runtime file is .env in the verified backend working directory because src/index.ts imports dotenv/config.

Frontend/.env contains public build configuration only: API origin and public telemetry configuration if enabled. Every value bundled into the extension or website is accessible to users. Never put Stripe secret keys, database passwords, JWT/encryption keys or storage secrets there.

### 1. Verify Git protection before entering credentials

From the repository root in PowerShell:

```powershell
git check-ignore -v Backend/.env Backend/.env.production.local Frontend/.env
git ls-files -- Backend/.env Backend/.env.production.local Frontend/.env
```

The first command should show ignore rules; the second must return no files. Root .gitignore currently ignores .env* except the two example filenames. Examples must contain placeholders only. Never use git add -f on a secret file. If a secret was previously committed, ignoring it is insufficient: stop, rotate the exposed credential and plan history cleanup. Keep private files out of screenshots, support bundles and public cloud folders; use protected disk storage and a password manager/encrypted backup.

### 2. Decide test versus live before editing

For Stripe experimentation use sandbox/test credentials, prices, webhook secret and customer data belonging to the same environment. Live API credentials can perform real actions even on an experimental app. Verify mode/account in Stripe and with safe runtime metadata; do not share keys to prove mode. QBO environment is a separate setting and must also be verified.

Changing credentials is not just replacing text: changing encryption keys can make saved QBO tokens unreadable; JWT rotation can invalidate sessions; changing database URLs can point at different data. Plan those changes individually. Adding a variable does nothing unless code reads it.

### 3. Transfer and install the production file

First confirm the actual SSH host/user, backend directory and PM2 daemon user. Do not infer them from historical paths in this README. Use the same OS user that manages the intended PM2 process. Avoid root where a dedicated service account is available.

From PowerShell, after replacing placeholders with verified non-secret connection metadata:

```powershell
$QyraRemote = 'SERVICE_USER@VERIFIED_HOST'
$QyraBackendPath = '/verified/path/to/Qyra/Backend'
scp .\Backend\.env.production.local "${QyraRemote}:${QyraBackendPath}/.env.next"
```

Pre-create/restrict the remote directory and use a restrictive transfer account umask (077); ensure the staged file is private immediately. Use an SFTP client instead if easier, with the same permissions. Never transfer to a web-served directory. Do not bypass SSH host-key verification.

On the VPS, in the verified backend directory, use a private terminal/editor to validate names and syntax without displaying values in shared output. Back up the current .env into a protected directory outside public assets with a unique timestamp and mode 600. Set .env.next ownership to the runtime user, chmod 600, then rename .env.next to .env on the same filesystem for atomic replacement. Do not overwrite an existing rollback copy. Do not source .env as a shell script: dotenv syntax is data, and shell evaluation can execute content.

### 4. Refresh PM2 and understand precedence

Current Backend/ecosystem.config.js defines qyra-backend, dist/index.js, one instance, NODE_ENV=production and PORT=3005. It has no explicit cwd; start it from the verified Backend directory. Confirm these details match the actual VPS before running commands.

For a file-only configuration setup, with no overlapping secret values inherited from PM2 or the shell:

```bash
cd /verified/path/to/Qyra/Backend
pm2 restart ecosystem.config.js --only qyra-backend --update-env
```

A process restart loads .env again. **However, dotenv normally preserves existing process environment values.** PM2-cached or shell-exported secrets can override the new file. --update-env does not guarantee removal of omitted old keys. PORT/NODE_ENV in the ecosystem file also take precedence. Editing .env.production.local locally does not update a running server automatically.

If stale values or removed variables persist, establish a file-only source of truth in a maintenance window: record the intended process settings, remove conflicting exports/config entries, and recreate only qyra-backend from its ecosystem definition under a clean service-user environment. Deleting/recreating the PM2 entry causes downtime and must be explicitly scoped; never run pm2 delete all. Do not improvise this step on a shared VPS. A later implementation task should add explicit cwd and validated environment loading to make provenance deterministic.

After success, pm2 save persists process definitions for resurrection. PM2 dump files may themselves contain inherited secrets, so protect the PM2 home/backups; saving is not a secret-management solution.

### 5. Verify, rollback and remove old credentials

Check process status, local health/readiness, external API TLS, safe logs and one scoped application smoke test. Report only presence, selected mode, release/config revision and success/failure. Do not paste pm2 env, raw .env, process environments or unredacted logs into chat. Confirm additions AND removals took effect; health alone cannot prove the correct Stripe mode.

If validation fails, restore the private previous file atomically and restart the intended process, then verify again. Rotated/revoked credentials may make rollback impossible: retain a provider-specific rotation/recovery plan. Delete obsolete private copies according to your retention policy after stability is established.

Do not revoke a working key before testing its replacement unless responding to an active exposure. Reconcile both local and server copies after every change so neither silently overwrites the other later. Record the change without secret values.

These are operating instructions, not actions performed by Astra. No server credentials or PM2 configuration were modified.


