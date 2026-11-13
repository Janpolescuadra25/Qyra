# Qyra master completion plan

## Product blueprint and Cypra execution guide — 14 November 2026

### Read this first

This section defines the intended finished product, its visible outputs, the business rules to decide, and the evidence needed to accept a release. The older 21 workstreams below remain the engineering checklist. Cypra uses this blueprint to explain the user outcome, Hydra to establish current repository and runtime facts, and Mantra to implement bounded tasks authorized by JP. JP decides commercial policy and live actions.

The current file contained the earlier October checklist when this revision began. This revision restores a self-contained planner handoff and adds product, accounting, UI and economic specifications. Earlier chat examples or unpublished plan versions cannot substitute for the file JP actually gives Cypra.

Source checkpoint for this revision is `0cccc24f7c5ead114155f2b947f5644dffbf119c` on `main`, matching the local origin/main reference. Existing dirty files included `.vscode/settings.json`, `Road_Map.md` and an untracked `docs/phase16/` directory. This revision changes this plan. It uses current source inspection and provider documentation for the design and economics discussion. Tests, production provider transactions and a fresh visual walkthrough were not performed during this document revision. Every future output below is a requirement or proposed example until its acceptance evidence is recorded.

The current roadmap still records remote activation as blocked after unsuccessful SSH authentication, with port 3005 health unverified. Source changes, repository documentation, operator access, deployment, store review and customer-visible behavior each require their own evidence. A fresh Hydra checkpoint supersedes this source checkpoint when work resumes.

**Current verification queue.** These are source/document observations at the checkpoint above, not newly reproduced production failures. The BP IDs identify this blueprint's starting questions and do not replace historical AST or QF IDs. Hydra should link matching records instead of creating duplicate fixes.

| ID / priority | Observed evidence and remaining question | Next proof / closure condition |
|---|---|---|
| BP-01 / P0 release evidence | `Road_Map.md` Phase 16 checks deployment and HTTP 200 complete while its status says SSH authentication failed. The untracked Phase 16 README also claims successful deployment | Preserve conflicting evidence, obtain authenticated deployed revision/process/health observations and determine actual status. Documentation cannot certify the host |
| BP-02 / P1 usage integrity | `Backend/src/routes/scans.ts` reads bonus balance then decrements separately; invoice/document routes call it before AI parsing. That helper does not consult remaining included allowance and those parse catch blocks do not restore the debit | Trace middleware, saved-scan counts, payer/allocations and all callers; reproduce last-credit concurrency and failed parse in isolated tests; decide the charging contract and verify atomic outcomes |
| BP-03 / P1 approval integrity | `Backend/src/lib/encryption.ts` defines approved payload as date and lines. `assertApprovedPayloadMatches` in `Backend/src/routes/quickbooks.ts` checks that form and returns early for no scan ID or approval hash | Trace independent role/approval checks and legacy callers; prove which records require approval, full contextual binding, no bypass through alternate paths and explicit legacy policy |
| BP-04 / P1 release reproducibility | `landing-page/` currently contains a README rather than a package/build project; `web/` contains exported HTML and `_next` assets. The README describes another `Backend/public` layout | Identify the deployed files and authoritative editable source/build/lock/config, reproduce the web output and trace it to the deployed candidate before redesigning or overwriting it |
| BP-05 / P1 commercial validation | Weekly allowances, annual discounts and 50 GiB for every tier are source-confirmed; actual Price resources, measured costs and live reconciliation are unverified | Complete B12–B13, reconcile actual mode/currency/prices and approve the cost/usage policy before broad paid advertising |
| BP-06 / P2 visible financial clarity | `JournalEntryPreview.tsx` uses dollar/en-US formatting and UTC date slicing; annual pricing emphasizes monthly equivalent | Verify supported currency/date semantics and show actual annual charge. Prioritize wrong financial/date output as P1 if reproduced |

**Repository starting map.** API source is `Backend/src/`, entry `Backend/src/index.ts`, schema `Backend/prisma/schema.prisma`, with scripts in `Backend/package.json` (`dev`: tsx watch, `build`: Prisma generate plus tsc, `start`: node dist/index.js, `test`: Jest). The port defaults to 3005; actual deployed port is still a runtime question. Extension source is `Frontend/src/`, manifests/build/package configuration are under `Frontend/`, and release ZIPs are in `Frontend/releases/`. `Frontend/package.json` defines TypeScript checks, Vitest and per-browser builds. Landing candidates are `web/`, `Backend/public/` and the documented `landing-page/` location; a directory name or exported HTML does not establish canonical editable source. Hydra records exact commands, lockfiles, runtime versions and results before Cypra relies on a build.

The blueprint takes precedence over conflicting historical instructions below. Preserve old evidence, but translate it into the current task board. An old unchecked requirement is a verification question, not proof that a newer implementation is missing. A previous checked phase is not proof that the requirement currently works.

### B01 — Product identity and the promise to a customer

**Qyra helps a business or accounting team turn supported POS reports and financial documents into reviewed, traceable transactions in the correct QuickBooks Online company.** Customers should spend less time retyping and investigating entries while retaining control of financial decisions.

The brand is **Made by Hayp Studios**. Link the studio name to `https://haypstudios.com/` in the intended public footer and product attribution. Use Qyra as the product name. JP supplies approved support and legal-operator details. Keep attribution consistent across the website, extension, email templates, support pages and store assets. An infrastructure hostname such as `vortex` is a separate technical identifier.

The first supported release completes the already advertised website, extension, source ingestion, mapping, review/approval, supported QBO entities, billing, history and recovery workflows. A standalone accounting ledger, payroll, tax-filing service, universal document parser or automatic posting without agreed controls is additional scope. Add a capability only when a named customer problem, expected output, costs and acceptance cases justify it.

The product must help a user answer these questions on any financial action.

1. Which business, location, QuickBooks company and currency am I working in?
2. What source document and values produced this proposed transaction?
3. Which fields did Qyra extract, normalize, map or change, and what needs my attention?
4. What exactly will be approved, posted, charged, changed or removed?
5. Has the action completed, or is it still processing, awaiting reconciliation or partly complete?
6. What safe action can I take next, and where can I find the result later?

### B02 — Judge the result through each user's role

| Persona | Real task and expected judgment | Acceptance evidence |
|---|---|---|
| Visitor and buyer | “I understand which sources and browsers work, what the service costs and how to try it.” | Accurate public copy, actual install destination, full annual commitment, supported-source list, legal/support links and accessible mobile navigation |
| First-time operator | “I can set up my first location and company and finish a sample without guessing the next step.” | Resumable setup from signup through verified connection, mapping, review and first confirmed result |
| Daily bookkeeper | “I can see the original, fix extraction errors and review all important accounting fields before sending.” | Source-to-field trace, preserved edits, deterministic mapping and correct totals under valid and malformed inputs |
| Accountant | “This entry reflects the business event in the right books, date, currency, account and amount without counting it twice.” | Accountant-approved fixtures, exact approved snapshot, QBO read-back, linked transaction balances and duplicate/recovery checks |
| Approver | “I can identify the submitter and source and know which exact version my approval covers.” | Server-owned approval record, correct authority, recorded version/context and invalidation on relevant change |
| Team administrator | “My users can access their locations and perform authorized tasks within the team's purchased limits.” | Real two-tenant/role tests, paginated location access, controlled allocations and private session switching |
| Payer | “The price, tax, renewal date, usage and consequences of cancellation are clear and agree with Stripe.” | Current matching quote, actual Price resource, signed payment reconciliation and accurate management UI |
| Support/operator | “I can explain and recover an interrupted operation using a reference without exposing financial documents or creating another entry.” | Correlation and operation IDs, minimal logs, controlled retry/reconciliation, useful alert and tested incident steps |

An attractive preview and a balanced journal are necessary observations, but each accountant also checks classification, company, source, dates, tax policy and duplicate recognition. Approval by one persona cannot waive a failed server permission, wrong amount or lost transaction. Keep a recorded reason for any legitimate business exception.

### B03 — First-release scope and shared business definitions

Create a scope record before implementing dependent behavior. Hydra reads actual capabilities and JP approves the intended supported set.

| Decision | Current clue | Required written rule |
|---|---|---|
| Sources and formats | Toast, Salido, Oracle and existing file/paste/parser flows | Supported report layouts, MIME/file types, count/size/page limits and clear refusal of unsupported input |
| Browsers | Build targets for Chrome, Edge, Firefox and Safari exist | Advertise each target only after install/update and critical journeys pass on it, plus Safari conversion/signing where required |
| Accounting entities | JE, Bill, VendorCredit, Cheque/Purchase and BillPayment paths exist | Accepted fields and provider mapping per entity, supported currencies and exceptions |
| Currency and dates | JE preview currently uses dollar/en-US formatting and ISO/UTC date slicing | Explicit transaction currency, scale and tenant business-date/timezone handling. Restrict unsupported currency combinations visibly |
| Included usage | PricingView advertises AI scans/wk and capacity/usage routes count weekly records | Define billable event, payer scope, week boundary/timezone, reset, reservation and failed/abandoned parse treatment |
| Bonus credits | One-time scan packs exist | Consumption order, expiry, transfer/allocation and refund/dispute policy |
| Approval policy | Source has role/permission checks and HMAC support | Which actions need approval, independence rule, every field covered, edit/reapproval and correction behavior |
| Storage and retention | All configured tiers currently have 50 GiB allowance | Billable object types, temporary upload cleanup, history visibility, audit retention and deletion/restore policy |
| Subscription policy | Monthly/annual and change/cancel routes exist | Immediate vs next-period changes, proration, grace, renewal, refunds and account recovery |

Use one glossary in the UI, contracts and tests. A **document** is source evidence. An **extraction attempt** is work performed by the parser/AI. A **draft** is an editable proposed result. An **approved version** is the exact reviewed financial snapshot. A **posting intent** is one desired accounting entry in one company. An **operation** tracks delivery/reconciliation of that intent. An **attachment delivery** is a separate file effect. A **usage charge** is the policy-defined debit. One retry cannot silently become a new document charge or new posting intent.

### B04 — The normal workflow and the durable output of each step

| Step | User action | Visible response | Durable result and acceptance |
|---|---|---|---|
| 1 Discover | Read product/pricing and choose install | Relevant browser availability, clear primary action, full billing disclosure | Actual candidate/store destination identified, accessible pages and working legal links |
| 2 Establish identity | Register, verify email, sign in | Field errors are actionable, verification can be resent, valid account reaches setup | Account/session has correct status and authority, reset/verification replay is handled |
| 3 Choose context | Create/select location and connect QBO | Shows location, company and environment with next setup step | Server-confirmed token exchange and realm, correctly scoped references, stale references invalidated on company change |
| 4 Configure | Select template, accounts and mapping rules | Shows unresolved requirements and mapping preview | Versioned, tenant-scoped deterministic configuration, safe cancel/import/export |
| 5 Capture | Capture a supported tab or upload/paste | Each document has progress and validation, original remains available | Tenant-owned source/upload, bounded work, usage reservation under policy and recoverable draft |
| 6 Review | Check extracted values and edit | Original beside fields, source/normalized/mapped values, date/currency/accounts and totals | Valid canonical proposal, provenance of edits and no provider write yet |
| 7 Approve | Submit and approve by authorized person | Exact version, actor and time, relevant warnings resolved | Atomic approval of context and payload. Later relevant edits require the defined new approval |
| 8 Deliver | Send approved transaction | Per-item queued/processing result and operation reference | One durable intent/claim, provider result or explicit uncertainty, no duplicate from repeat click |
| 9 Finish files | Attach intended source documents | Entry status and each file's status shown separately | Confirmed provider entity plus recorded file delivery, recoverable partial attachment outcome |
| 10 Reconcile | Open history/export/provider record | Company, source, amount, date, actor, reference and status agree | Read-back matches approved snapshot and expected accounting effect, history remains traceable |
| 11 Manage | Change users/limits/plan or cancel | Authorized controls, correct quote, confirmation and renewal/cancellation state | Provider, entitlement, allocations and UI converge through failure/replay/restart |

A screen or route is accepted only when its normal entry point reaches the intended persisted and provider outcome. Verify that old records and alternative single/batch/retry entry points preserve the same rules.

### B05 — Proposed screen layouts and visible results

These are behavioral wireframes. Fit the existing component system and retain working controls. Responsive layout may stack columns while keeping context, source evidence and next action understandable.

```text
WORKSPACE HEADER
Qyra                                  Account menu / Help
Team [A]  Location [Main]  QBO [Verified company]  Currency [USD]
Dashboard | Scan | Map | Review | Sync history | Settings
Additional sections appear according to server-backed permissions

DASHBOARD
Next step [Connect QuickBooks / Finish mappings / Review 3 documents]
Needs review [3]  In progress [1]  Posted [12]  Needs attention [1]
Usage [42 of 50 this week]  Bonus [100]  Reset [date + timezone]
Recent activity [document, company, amount, date, outcome, action]
```

```text
DOCUMENT REVIEW
Document [POS close]   Business date [2026-11-14]   [Source available]
Location [Main]        QBO company [Sandbox A]     Currency [USD]

Original source / preview       Extracted and mapped fields
[readable pages or text]        Source value -> Normalized -> Account
                               Sales 1000.00 -> 1000.00 -> Sales
                               Tax     80.00 ->   80.00 -> Tax payable
                               [Unresolved field and how to correct it]

Financial lines [account, description, debit, credit, class/customer]
Debit [1200.00]  Credit [1200.00]  Difference [0.00]
Review warnings [none / explicit items]
[Save draft] [Submit for approval]
Approval [required / policy-defined authorized self-managed path]
```

```text
REVIEW QUEUE
Filter [location] [type] [status] [business date]  Search [reference]
Document | Submitter | Source date | Currency/total | Version | Action
[Open reviewed version]
Approval panel [source, normalized lines, changes, company and scope]
[Reject with reason] [Approve this version]
```

```text
POSTING RESULT
Document [POS close]   Operation [reference]
QuickBooks company [Verified company]  Entity [JournalEntry reference]
Accounting entry       Confirmed
Source document        Attached
Supporting file        Needs attention  [Retry this attachment]
[View history] [Open QuickBooks record, where supported]
```

```text
UNCERTAIN PROVIDER RESPONSE
Checking whether QuickBooks received this entry
Operation [reference]  Last checked [time]
Your reviewed values are retained
[Refresh status] [Contact support with reference]
Reconciliation resolves the remote outcome before another write
```

```text
BILLING CONFIRMATION — example only after USD Prices are verified
Professional Annual
USD 31/month equivalent, charged USD 372 per year
Due now [current quote amount]   Tax [actual tax or calculated at Checkout]
Next renewal [verified date]     Included usage [250 per defined week]
Bonus credits [policy]           Cancellation [effective date/policy]
[Continue to secure payment] [Cancel]
```

Avoid a full-screen empty loading view with no recovery. Each major view supports initial, loading, empty, valid, invalid, denied, failed, canceled, processing, success, stale-response, reopened and interrupted states. Test all applicable states even when the same dialog/select primitive is reused across screens.

### B06 — Response language and control behavior

| Event | Example response | Allowed next action and retained state |
|---|---|---|
| Missing account mapping | “Choose an expense account for line 3.” | Focus the field, retain draft and original, block submission/posting until resolved |
| Unbalanced JE | “Debits and credits differ by USD 0.01. Review the highlighted lines.” | Show both totals and difference, no financial write |
| Extraction uncertainty | “Review the amount for line 3 against the original.” | Highlight source/field, permit correction, avoid uncalibrated confidence percentages |
| Unsupported file | “This file type is unsupported. Choose one of [actual supported types].” | Replace input, disclose any charge policy before costly work |
| Approval changed | “This version changed after approval. Submit it for review again.” | Preserve changed draft and previous audit record, block old approval |
| Permission denied | “Your role cannot approve this document. Ask an authorized approver.” | Show permitted navigation, server enforces the same restriction |
| Expired QBO consent | “Reconnect QuickBooks to continue with [company].” | Preserve work, require verified reconnection and current references |
| Duplicate posting intent | “This entry is already posted. View its result.” | Return recorded reference, avoid new remote write |
| Provider timeout | “We are checking the result in QuickBooks.” | Persist uncertain state, refresh/reconcile, keep repeat action from creating a second intent |
| Attachment failure | “The entry is posted. One file still needs attention.” | Retry the file independently, preserve confirmed accounting outcome |
| Payment return before webhook | “Payment confirmation is pending. We will refresh your plan.” | Poll bounded server state or offer refresh/support, entitlement remains server-authoritative |
| Expired login | “Sign in to continue.” | Apply secure draft policy, clear foreign-session data, safely resume authorized work |
| Quota reached | “Your weekly included allowance is used. [Explain bonus option or reset time].” | Show actual remaining bonus/reset/payer option under approved rules, no negative credit |
| Cleanup/delete request | “This removes [specific visible items]. [Explain retained accounting audit and provider effect].” | Confirm where needed, state separately whether a QBO correction is required |

Inputs need labels, format hints and nearby errors. Submit buttons show progress and prevent concurrent duplicate submission. Destructive actions identify exactly what they affect. Dialogs move focus in, trap it, support safe Escape/cancel and return focus. Errors persist long enough to act on. Loading/empty/status messages have accessible semantics and sufficient contrast. Long document names, more than a page of locations and 200% zoom must remain usable.

### B07 — Accountant acceptance fixtures

Hydra and an accounting reviewer use synthetic fixtures with an agreed accounting policy. The labels below map to actual authorized sandbox accounts. Record business date as a calendar date in the intended company, transaction currency and supported precision. Match every important provider field to the approved proposal.

**POS combined-close fixture** assumes the sales have not already been booked elsewhere. Source totals are sales 1,000.00, sales tax collected 80.00, tips payable 120.00, processor fee 35.00 and net bank deposit 1,165.00, all in fixture currency USD.

| Account | Debit | Credit | Economic reason |
|---|---:|---:|---|
| Bank | 1,165.00 | | Net deposit |
| Processor fees | 35.00 | | Fee expense |
| Sales revenue | | 1,000.00 | Sales recognized once |
| Sales tax payable | | 80.00 | Collected liability under fixture policy |
| Tips payable | | 120.00 | Amount owed under fixture policy |
| Total | 1,200.00 | 1,200.00 | Balance with correct classification |

Changing the fee to 34.99 fails balance validation. Changing location/company/account/date after approval fails version validation. An equal debit/credit pair in unrelated accounts still fails accountant review. If another system already records the sales, use a separately approved clearing-account settlement fixture to avoid recognizing revenue twice. Merchant tax in these books and Stripe Tax on Qyra fees are different business events.

| Entity family | Positive fixture | Negative and read-back checks |
|---|---|---|
| JournalEntry | POS example and a supported adjustment fixture | Balance, posting sides, active accounts, dimensions, date, currency, duplicate intent and unsupported rounding/currency |
| Bill | Authorized vendor, 250.00 total, agreed due date and expense/item lines | Correct vendor/company/AP, customer/class/project fields where supported, invoice number, inactive refs, closed date and linked remaining balance |
| VendorCredit | 20.00 credit under the same vendor and valid accounts | Sign semantics, available credit, same vendor/company, repeat application and history |
| BillPayment | 250.00 bill less supported 20.00 credit and 80.00 cash leaves 150.00 | Verify actual QBO linking/credit semantics, stale/overpaid balance, correct bank, and concurrent payment handling |
| Cheque/Purchase | 80.00 approved bank payment with valid payee and line allocation | Payee/company/bank, line sum vs total, dimensions, check number and duplicate handling |

For each fixture an accountant should be able to trace source → extraction → correction → mapping → proposal → approval → provider ID → linked record/history. Record why each exception is permitted. Editing a completed external transaction must use an authorized correction/reversal flow or clearly direct the user to the supported provider workflow, with reconciliation back to Qyra.

### B08 — Financial state, attachment state and usage state

Use independent state dimensions so the UI cannot confuse a successful accounting post with an incomplete file transfer. The exact enum names and schema are implementation decisions to review against existing records.

```text
Review        draft -> needs_review -> submitted -> approved
                         ^               |            |
                         |---- rejected--|            | relevant edit
                         |-----------------------------|

Accounting    not_sent -> queued -> processing -> confirmed
                                     |              |
                                     v              v
                              reconcile_required   correction workflow
                                     |
                          confirmed or safe_retry/failed

Attachment    not_requested | queued -> sending -> attached
                                         |
                                      retryable/failed

Usage         available -> reserved -> committed
                              |
                           released under agreed failure/cancel policy
```

Define allowed transitions, authorized actors and persisted facts for each edge. Show the source and last known provider outcome after restart. A remote timeout is an uncertain result until reconciled. A partial batch preserves each item's outcome. A failed attachment cannot turn a confirmed accounting result into an instruction to repost it.

Approval must bind all accounting-relevant normalized fields, company/tenant/location, entity type, currency/date, mapped references and intended source version. HMAC comparison of only date and lines cannot by itself prove the other contextual fields are covered. Hydra checks the actual caller and snapshot construction before closing this requirement. Existing immutable evidence remains available after an authorized new revision.

### B09 — Example validation and recovery logic

These examples express acceptance rules. They do not prescribe a replacement architecture or assert that the source implements them. Currency scale, normalization, server-owned references and error contracts must be verified first.

```ts
// Concept example for a currency-normalized JE validator.
// Convert source decimals using the approved currency scale before this call.
type NormalizedLine = {
  accountId: string;
  side: 'debit' | 'credit';
  amountMinor: number;
};

function assertBalanced(lines: NormalizedLine[]): void {
  if (lines.length < 2) throw new Error('At least two lines are required');
  let debits = 0;
  let credits = 0;
  for (const line of lines) {
    if (!line.accountId || !Number.isSafeInteger(line.amountMinor)
        || line.amountMinor <= 0 || !['debit', 'credit'].includes(line.side)) {
      throw new Error('Line requires an account, posting side and valid amount');
    }
    if (line.side === 'debit') debits += line.amountMinor;
    else credits += line.amountMinor;
    if (!Number.isSafeInteger(debits) || !Number.isSafeInteger(credits)) {
      throw new Error('Transaction total exceeds the supported range');
    }
  }
  if (debits !== credits) throw new Error('Debits and credits must balance');
}
// Server authorization, reference validation and business meaning are also required.
```

```text
authorize actor for tenant, location, company and action
load canonical approved snapshot and verify its complete version/context
validate current supported entity schema and accounting invariants
atomically find/create the durable operation for this posting intent

same intent + conflicting payload -> reject or require approved correction
already confirmed -> return recorded provider reference and file states
in progress -> return current state
uncertain remote result -> reconcile before permitting another write

claim operation durably, commit claim, perform provider call
use verified provider idempotency/request identity where supported
record confirmed provider ID and queue independent file work durably
on ambiguous outcome -> persist reconciliation requirement
recovery reconciles existing remote effect before replay
```

Test simultaneous single/batch/manual/worker requests, crash before local completion, provider acceptance followed by timeout, late worker completion and attachment outage. A local mutex/lease can coordinate workers but cannot establish whether a remote write already committed. Require the same intended accounting result after recovery, with auditable IDs and no repeated credit charge. Use stable-intent semantics across retries and edited versions rather than generating a new identity to bypass a duplicate check.

### B10 — Small-component coverage and integration proof

Hydra inventories actual components, routes, jobs and messages in the current revision. For each discovered item record its caller, purpose, input/output contract, authority, persisted/external effect, states exercised, evidence and task owner. Cover every supported screen, route and posting entity before release. Shared tests cover shared mechanics, and each caller also needs an integration check that it supplies the correct data and scope.

| Coverage group | Surfaces to inventory and verify |
|---|---|
| Public | Intro, menu, hero, features, video/captions, pricing switch, FAQ/help, install CTA, footer, metadata, 404, privacy/terms/support and billing/reset/verification deep links |
| Identity | Login/signup, verification/resend, reset/change password, session expiry/logout, account switch, disabled/grace states and invitation acceptance |
| Workspace | App shell, navigation, welcome/splash/onboarding, location selector/search/pagination, dashboard summaries and company connection |
| Organization | Team/client/admin/user/location views, invitation, approval, permissions, capacity allocation, access revocation and audit |
| Ingestion | UploadZone, ScanView/ScanContext, current-tab POS scanners, paste/file/image/XLSX paths, queue/progress, parser errors and draft persistence |
| Configuration | TemplateWizard, template lifecycle, MappingView filters/table/edit, presets/import/export, payee/product/value mappings, catalog/rules and inactive provider references |
| Accounting | JE/Bill/VendorCredit/Check previews, BillPayment, review/approved queues, PreSyncChecklist, single/batch sync, manual and scheduled retry |
| Evidence | Source viewer, download access, per-file attachment delivery, history/audit, date/search/page filters, analytics/export totals and retention |
| Commercial | PricingView, Settings billing, subscription/quote/cancel/payment-history components, checkout/portal returns, usage/bonus/trial/grace |
| Shared UI | Buttons/labels/inputs, selects/date picker, tabs/tables, badges/status, loading/empty/error/toast, confirmation/dialog focus, ErrorBoundary and HelpPanel |
| Platform | Auth/RBAC/tenant middleware, validation, Prisma/migrations, object store/encryption, provider clients, jobs, telemetry, CORS/proxy/rate limits and health |
| Release | Editable landing source, builds/locks/manifests/packages, browser install/update, privacy/store graphics, PM2/Nginx/env/backup/restore and alerts |

Test web layouts at 360/390/768/1280/1920px and the supported extension window sizes, 200% zoom, long names, empty/large lists and keyboard navigation. Agree device/network/data-size budgets before performance sign-off. Capture actual screenshots for every important screen/state, with role, revision, viewport and fixture. A text wireframe is a desired output, while a rendered screenshot plus behavior trace verifies the actual output.

### B11 — Acceptance journeys from first visit through commercial use

| Journey ID | Required path | Essential exception cases |
|---|---|---|
| J01 | Visitor → supported store → install → first open | Intro failure/reduced motion, mobile menu, unavailable store, fresh install/update and denied permissions |
| J02 | Register → verify → login → reset/change/logout | Expired/replayed links, concurrent reset, disabled account, session invalidation and wrong-user cache |
| J03 | Team/location → invite → allocation → role actions | Two tenants, every actual role, page-two location, changed permissions and stale requests |
| J04 | Connect QBO → company confirmation → references | Denied/closed consent, state replay, wrong company, expired/rotated token, concurrent refresh and worker restart |
| J05 | Each advertised source → extraction → draft | Unsupported/malformed/large files, uncertain fields, failed/abandoned AI work, mixed batch and popup reopen |
| J06 | Template/mapping/preset/rule → deterministic preview | Ambiguity, invalid regex/expression, import conflicts, inactive/foreign refs and company switch |
| J07 | Review → submit → approve exact version | Self/foreign approval, edit/context change after approval, reject/resubmit and races |
| J08 | Approved entity → one provider result → read-back | Every entity, double-click, concurrent paths, timeout-after-acceptance, crash and unsupported currency/date |
| J09 | Posted entity → per-file attachment completion | Foreign/forged/expired/reused upload, partial file failure, retry without financial repost |
| J10 | Pricing → quote → checkout → entitlement → plan management | Correct annual total/tax/currency, decline/authentication, duplicates/order/crash, renewal/cancel/refund/dispute |
| J11 | Usage reservation → charge/release → reset/allocation | Parallel final credit, included vs bonus, unsaved parse, retries, timezone/reset boundary and retention effects |
| J12 | History/dashboard → export → reconcile → help | Tenant filters, large pages, date boundaries, formula-safe CSV, correct totals and useful safe correlation |
| J13 | Clean candidate → deploy → alert → restore/rollback | Exact revision/config, TLS/proxy/port, provider outage, failed migration, data restore and external side-effect reconciliation |
| J14 | All supported UI states and user judgments | Label/focus/keyboard/contrast/zoom, feedback/cancel, preserved input, clear status and correct next action |

Each journey must identify the source revision, dirty changes, exact artifact, environment, actor/fixture, expected/observed result, command or observation, verifier and date. Unknown cases remain visible. Old successful tests belong to the version and environment in which they ran.

### B12 — Pricing logic and customer value

Source values checked in `Backend/src/lib/stripe.ts` for this revision are below. `Frontend/src/popup/components/PricingView.tsx` currently advertises weekly scans; `Backend/src/routes/checkout.ts` and `Backend/src/middleware/capacity.ts` use weekly counts. All annual totals are monthly-equivalent price multiplied by 12. Currency must be verified against the actual Price/account and displayed explicitly. Numbers use USD as an illustrative model currency.

| Plan | Monthly charge | Annual charge | Weekly scans | Users / locations | Annual discount vs 12 monthly charges |
|---|---:|---:|---:|---|---:|
| Free | 0 | 0 | 7 | 1 / 1 | N/A |
| Starter | 19 | 180 | 50 | 2 / 5 | 21.05% |
| Professional | 39 | 372 | 250 | 5 / 20 | 20.51% |
| Premium | 79 | 756 | 1,250 | 12 / 75 | 20.25% |
| Enterprise | 149 | 1,428 | 5,000 | 20 / 250 | 20.13% |

Scan packs are 100 for 19, 250 for 39 and 500 for 69, or 0.190/0.156/0.138 revenue per bonus scan before costs. Weekly included scans, pack credits and storage are different limits and need different labels. The current source note about old Stripe pack prices calls for a private resource comparison, not an assumption about the live charge.

The progression gives more capacity and access at each tier, but it also discounts per-scan revenue substantially. At full use a subscription is often far cheaper per scan than a pack. Explain the pack as a temporary overflow purchase and show a better upgrade option when relevant. Test the cost of upgrading a managed account and prorations before recommending that action in the UI.

Use customer value evidence to validate price. Example only, if a customer processes 200 documents/month and measured net time saving is three minutes per document after review/corrections, that saves ten hours. At their stated labor cost of 20/hour the time value is 200/month. Deduct subscription, onboarding effort and any support work outside that measurement before calling it positive ROI. Count review/correction time once. Saved labor capacity is potential value; actual cash savings or additional work depend on how the customer uses it. Ask pilots for measured time and error outcomes, not a general opinion that the screen looks good.

Existing limits require workload checks. Assuming one report per location each day and one billable credit per report, a 250-location daily close uses 1,750 documents/week before invoices and other entities. That fits a 5,000 weekly count in volume but may exceed support or provider concurrency budgets. Multiple files/pages, reprocessing and the final credit definition can change it. All tiers currently grant 50 GiB, including Free. A recurring cost remains for stored documents even when new scans stop. JP should approve an affordable free-tier subsidy and explicit file/retention limits after measuring the storage and abuse envelope.

### B13 — Establish profitability with actual costs and a stress model

**Current conclusion is profitability unverified.** The weekly allowance makes a high-tier margin test necessary before committing to broad advertising or long-lived annual offers. Actual measured provider use, support, fees and customer retention determine the result.

Using 52 entitlement weeks as a normalized planning year, the revenue at full allowance is as follows. Calendar/reset implementations can grant partial weeks or 53 boundaries, so the commercial guarantee must be reconciled to the exact implementation and tested separately.

| Plan | Included scans per normalized year | Monthly-equivalent scans at full use | Revenue per scan on monthly plan | Revenue per scan on annual plan |
|---|---:|---:|---:|---:|
| Starter | 2,600 | 216.67 | 0.087692 | 0.069231 |
| Professional | 13,000 | 1,083.33 | 0.036000 | 0.028615 |
| Premium | 65,000 | 5,416.67 | 0.014585 | 0.011631 |
| Enterprise | 260,000 | 21,666.67 | 0.006877 | 0.005492 |

Enterprise annual receives only 1,428 for 260,000 included scans in this normalized full-use model. At a hypothetical AI/processing cost of 0.005 per completed billable scan, including all attempts, that costs 1,300 and leaves 128 before payment, support, storage and other delivery costs. At 0.01 it costs 2,600 and is already 1,172 below revenue before those other costs. These are sensitivity examples, not measured Gemini costs.

Define all inputs in one currency and one time period.

```text
R = service revenue after discounts/refunds, excluding collected sales tax
Fpay = actual processor, Billing, Tax, FX, dispute and other payment costs
N = committed billable documents in the same period
C_AI = actual total AI/parse cost of all attempts in the same period
c = C_AI / N, defined only when N > 0
H = other customer delivery costs, including support and storage/operations
Service contribution = R - Fpay - C_AI - H
Service contribution margin = Service contribution / R, when R > 0

Company operating result = sum(service contributions) - remaining fixed overhead
Break-even payer count = remaining fixed overhead / positive weighted contribution
Maximum c at target margin m = (R*(1-m) - Fpay - H) / N
Forecast C_AI as N*c only when that estimate includes all period attempts
Minimum price excluding tax, if fees = r*price + fixed_fee
    = (N*c + H + fixed_fee) / (1-r-m), only when denominator is positive
```

Include each cost once. If H includes an allocated fixed infrastructure cost, do not subtract the same cost again from company overhead. Payment fees may apply to charged tax or gross amounts even though R excludes tax. For real decisions use the actual invoice/processor fee basis. Annual cash arrives upfront while service obligations continue. Discounted annual revenue is recognized over the service period for this planning model. Refund exposure, taxes, working capital and the organization's accounting treatment need separate records.

If N is zero, c is undefined. Record total processing cost directly and subtract that amount instead of multiplying zero by an estimated c. Free/abandoned-only accounts can generate real costs with no committed documents or revenue. For a common-document model, include those costs in a clearly defined cohort allocation and retain their separate source totals.

**Illustrative annual scenario** assumes a fictional 4% payment cost plus 0.30 per annual charge. It assumes other annual delivery costs of 24 per Starter or 240 per Enterprise. These are invented sensitivity inputs for calculation practice. They are not Stripe quotes or current Qyra expenses.

| Scenario | Revenue | Payment model | AI/parse cost | Other delivery cost | Service contribution | Margin |
|---|---:|---:|---:|---:|---:|---:|
| Starter full 2,600 scans, c=0.005 | 180.00 | 7.50 | 13.00 | 24.00 | 135.50 | 75.28% |
| Enterprise full 260,000 scans, c=0.002 | 1,428.00 | 57.42 | 520.00 | 240.00 | 610.58 | 42.76% |
| Enterprise full 260,000 scans, c=0.005 | 1,428.00 | 57.42 | 1,300.00 | 240.00 | -169.42 | -11.86% |
| Free account, zero successful documents, failed-attempt cost 0.50 | 0.00 | 0.00 | 0.50 | 1.00 illustrative | -1.50 | Undefined: revenue is zero |

If JP selects a 70% service-contribution target for illustration, the same annual scenario permits c of about 0.008654 for Starter and only 0.000504 for Enterprise at full quota. A target margin is a business decision. The spreadsheet/model must also show average usage, 25/50/100% utilization, p95 expensive inputs, one extra parsing attempt, 53 reset boundaries where possible, 10x free-user load, support spikes, refund/dispute and provider-price changes.

Measure c by actual model/version and text/image/document size. Count input, output and any separately billed reasoning/cache/tool usage under the provider's applicable contract. Include repeated failed attempts and pre-save work in cost even when policy releases the customer's credit. Do not use a free-tier developer allowance to justify production profitability or omit support labor. Current source references gemini-2.5-flash, so use its current paid rates and measured usage metadata for the account actually used.

Cloudflare's R2 Standard pricing page checked on 14 November 2026 quotes USD 0.015 per GB-month plus operation charges, with listed Internet egress terms. A 50 GiB entitlement needs unit conversion and actual average stored bytes/retention to model cost. Free allowances apply at their stated account scope and cannot be multiplied by every customer. Other hosting, transfer, retrieval, logging, backup and operational costs must be priced from the services actually used. [R2 pricing](https://developers.cloudflare.com/r2/pricing/)

Stripe pricing is country/product dependent and the opened general page localized to Spain. JP's merchant country, card mix, currency, Billing/Tax products and contract were not supplied. Use the relevant account's actual fees rather than copying a US or localized headline rate. Gemini prices vary by model and usage mode. Retain the date and assumptions beside every cost input. [Stripe pricing](https://stripe.com/pricing), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)

**Commercial decision gate** — Cypra requests measured costs before recommending a change. If a tier fails the agreed full-use/stress margin, propose separately a lower included allowance, higher price, priced overage, bounded processing work per credit, reduced support/storage entitlement, or a combination. Show customer impact and preservation of existing paid commitments. JP approves a versioned price/entitlement policy, future effective date and communication before Mantra changes Prices or limits. Do not silently replace weekly promises with monthly limits. A business/accounting or financial adviser should review actual financial/tax obligations when needed.

### B14 — Product acceptance scorecard

User judgment contains both observable correctness and subjective usability. Preserve both in the evidence. Require explicit pass/fail cases for critical invariants and a separate scored pilot review. A positive average score cannot override a failed money, tenant, approval or recovery invariant.

| Dimension | Observable pass requirement | Pilot question and evidence |
|---|---|---|
| Accounting correctness | Approved source-to-provider fields/totals/company agree for every supported entity fixture | “Can you explain each posted line and its source?” Accountant walkthrough with discrepancy list |
| Reliability | Retries/crashes/concurrency preserve one intended accounting result and no lost entitlement | “Can you recover without entering it again?” Recorded injected failures and sandbox read-back |
| Privacy/authority | Wrong actor/tenant/context is refused before effect, private drafts stay private | “Does switching accounts reveal anything from the prior account?” Two-tenant exercise |
| Usability | A new target user completes the agreed first task with bounded assistance, useful errors and discoverable next action | Measure completion rate, time, errors, assistance, abandoned actions and participant feedback |
| Accessibility | Required tasks complete by keyboard and supported assistive technology, focus/labels/status correct | Keyboard/screen-reader session plus scanner findings and remediation |
| Commercial trust | Public price, quote, actual charge, allowance, renewal and cancellation agree | Ask payer to explain the commitment before paying, compare invoice and actual entitlement |
| Operational readiness | Operator can identify release, receive alert, restore safely and reconcile external effects | Timed incident/restore/rollback exercise and report |

For subjective questions use 1–5 anchored ratings with reasons, such as 1 unable to finish, 3 finishes with assistance, 5 finishes independently and can explain the outcome. Define targets with JP before pilots, including acceptable setup/time-to-first-value, daily task completion and support response. A small proposed pilot of five target users, including an operator, an accountant/approver and a payer, is a learning exercise rather than statistical proof. Record the product version and observed tasks. Correct serious usability failures before public expansion.

Example pilot acceptance targets for JP to accept or revise: at least four of five participants finish a supported first task without moderator intervention after setup; all five identify the intended company, annual commitment and final posting state correctly; the accountant finds zero unexplained differences in the agreed source-to-provider fixtures; keyboard users can finish every critical action without a pointer. Record completion time from a defined start/end and investigate every abandonment. These are proposed learning targets, not current achievements or a substitute for the mandatory integrity tests. Choose explicit performance, recovery, uptime and support-response budgets before broad launch, with measurement method and accountable owner.

### B15 — Future outputs and finishable expansion

| Horizon | User problem and expected output | Prerequisites and release decision |
|---|---|---|
| Initial release, required | Reliable supported capture → reviewed/approved posting → confirmed history/files, accurate billing and recovery | Complete B04/B11 journeys and the engineering workstreams for the supported scope |
| After stable pilot | Repeated setup costs time → guided reusable mappings with deterministic preview and import/export | Current mappings stable, version/tenant checks, measured setup time reduction |
| After stable pilot | Operators overlook recoverable work → actionable reconciliation/exception queue and safe bounded automation | Durable intent/approval, correct retries, alerting and no duplicate effects proved |
| Demand-driven | Large firms need more sources/formats/currencies → explicitly supported parser/schema/currency behavior | Real reference fixtures, provider support, accounting sign-off, cost envelope and updated disclosures |
| Demand-driven | Users work across devices → authenticated server-owned draft/queue handoff | Tenant isolation, conflict/version policy, secure storage, refresh/offline behavior and explicit customer need |
| Optional scale | Regional latency/availability → measured read routing and recovery | Actual need, provisioned topology, read-only privileges, lag/failover/consistency and operational cost |

The roadmap currently uses “14.8 Storage Sync” for multi-device work, while previous work used 14.8 for atomic scan save and attachment failure isolation. Cypra must give each outcome a distinct task record and implementation evidence before assigning completion. A reused phase label cannot establish either capability. Earlier QF findings should be revalidated at their actual paths and closed individually.

Every proposed future feature needs a named persona/problem, current behavior, desired visible output, durable contract, failure/recovery cases, security/cost consequences, dependencies, benefit metric and JP release approval. Complete the initial supported product before treating a later horizon as a prerequisite to finishing it.

### B16 — Implementation packages and release gates

Use the older workstreams as detailed checklists. Build a current task board with IDs, evidence dates and dependencies. Existing code may satisfy a requirement. Hydra should verify that before issuing a replacement implementation.

| Package | Work and proof | Depends on | Gate |
|---|---|---|---|
| PK0 Truth and containment | Current source/artifact/deployed revision, dirty work, actual provider modes, current blocked access and initial supported scope | JP/Hydra checkpoint | G0 approved scope and trusted baseline |
| PK1 Ownership and identity | Server upload ownership and metadata, atomic save, tenant/session isolation, roles, reset/session and safe telemetry | PK0 | G1 denied cases have zero unauthorized effect |
| PK2 Accounting contract | Full approved payload/context, shared single/batch/retry validation, reference/amount/date/currency fixtures | PK1 and JP accounting policy | G2 approved version equals resulting entity |
| PK3 Delivery and recovery | Durable intent/claim, provider idempotency/reconciliation, shared retry worker, independent attachments and safe retention | PK2 | G3 repeats, timeouts and restarts produce one intended effect |
| PK4 Commercial contract | Weekly usage ledger, packs/allocations, quote/cancel, webhook processing/recovery, provider-schema periods | JP usage policy, PK1 and PK0 provider setup | G4 invoice/entitlement/usage agree through failure and replay |
| PK5 Product experience | Canonical editable landing, full component inventory, pagination, labels/focus/error states, Hayp branding, actual pricing disclosure | Relevant PK1–PK4 rules | G5 all B11 user journeys and visible states pass on installed candidates |
| PK6 Commercial proof | Actual costs, target margin, price resource consistency, legal/support/retention and pilot outcomes | PK4–PK5 | G6 pricing/capacity and supported promises approved |
| PK7 Operations and launch | Clean locked build, migrations, deployment/readiness, alert, rollback/restore, exact packages and real store status | PK0–PK6 | G7 named candidate/environment receives JP/Hydra release approval |

Gates refer to this blueprint. If an earlier report uses a differently numbered gate, record its definition alongside the ID. PK identifies an implementation package; P0/P1/P2/P3 identify severity. Public expansion requires closing exposed P0/P1 findings for enabled features and verifying provider/environment work. Unknown external evidence stays open with an owner. Cosmetic documentation completion cannot advance a functional gate.

### B17 — External Cypra operating instructions and copy-ready prompts

Cypra can execute this plan through JP's message relay. Local paths identify where Hydra should inspect. If Cypra has a connector, first confirm its actual repository/revision/authorized actions. Cypra owns planning and evidence interpretation, Hydra owns read-only verification, Mantra implements scoped JP-authorized tasks, and JP owns product policy and private/live access.

1. Read B01–B16 and the latest checkpoint. Select the next exposed, unverified dependency and state the user's expected result in one sentence.
2. Ask Hydra for the relevant source, current Git/dirty state, normal call path and a safe reproduction. Ask for the smallest evidence packet that answers the question.
3. Classify evidence as source-inspected, local automated, isolated DB/store, provider sandbox, installed browser/visual or deployed operational. Assign implementation and evidence statuses separately.
4. For a demonstrated gap, send Mantra a task with an exact file scope, compatibility/migration constraints, acceptance cases, tests and recovery. Resolve overlap with dirty work first.
5. Send the resulting revision and cases back to Hydra for independent verification. Keep failed and unverified cases open and address the next failure or missing prerequisite.
6. Update the checkpoint and board, preserving historical IDs/evidence and newer fixes. Select one next action. If a provider check is blocked, work another independent safe task while JP supplies access or evidence.

```text
FOR HYDRA — [task ID] / [journey ID]
User outcome [what a person should complete or observe]
Baseline [latest branch/SHA and relevant local changes, if known]
Starting points [actual files/routes/components, verify current callers]
Fixture [synthetic actor, tenant, company, data and authorized environment]
Steps [normal action plus invalid/denied/failure/retry case]
Expected [visible response, persisted state and provider effect]

Inspect the current implementation and report each case as PASS, FAIL or
UNKNOWN with source and evidence layer. Run only the authorized safe
reproduction. Give command/exit/counts when executed. Explain the smallest
missing prerequisite and proposed bounded correction for any proven gap.
Return redacted snippets and results. Keep credentials and customer data local.
```

```text
FOR MANTRA — [task ID] after Hydra evidence [reference]
JP-authorized scope [work/environment]
Baseline and allowed dirty paths [exact current values]
Observed defect and required user outcome [one bounded problem]
Allowed files [Hydra-confirmed exact paths and needed generated output]
Dependencies and decisions [policy, contracts, old-record compatibility]

Acceptance
A [positive visible and durable outcome]
B [invalid or unauthorized action has defined refusal and no unsafe effect]
C [repeat/concurrent/restart/partial-failure recovery]
D [existing callers and legacy records continue according to contract]

Implement the bounded fix and run the specified focused regression plus
affected suites/typecheck/build. Report changed files, actual results,
failed/skipped cases, migration/rollback and remaining limits. Flag material
baseline/scope drift before touching overlapping work. Commit, push,
migration, deployment and live-provider actions need JP's explicit scope.
```

```text
FOR HYDRA — independent closure of [task ID]
Inspect the resulting revision and diff. Check normal entry points and
alternate callers. Re-run the original failure, positive and required
negative/recovery cases in their authorized environments. Report individual
outcomes with evidence, scope compliance and remaining unknowns. Mark the
task VERIFIED only for the named revision and evidence layers actually run.
```

Worked first task for this revision could be the commercial economics packet. Ask Hydra to confirm the advertised weekly quota and actual usage/debit paths, request JP's approved cost metadata, then calculate B13 scenarios. It can proceed while SSH access remains blocked. Source changes for financial/ownership/recovery gaps follow their higher-priority reproduced risk. Do not wait for live credentials to inspect and test local correctness safely.

**Worked usage task BP-02 / J11 — proposed policy example, awaiting JP approval.** A useful default proposal is one charge for one successfully completed, policy-defined document extraction; spend included allowance before bonus, reserve atomically before expensive work, release on specified failed/canceled outcomes, and reuse the charge identity on transport retries. Decide whether native POS capture, document pages, deliberate re-extraction, unsaved successful results and changed input count separately. Define reservation expiry and late completion so recovery cannot release a unit while later work also consumes it. This proposal does not describe today's behavior or authorize changing an existing customer's contract.

Ask Hydra first to trace `requireCapacity('scan')` → `deductBonusScan` → Gemini calls → response → scan save/usage count → billing UI. Include payer/admin allocations and alternative parse/tab paths. Use synthetic data and mocked AI/storage for the first reproduction. A shared database or provider sandbox needs its own approved test scope. Record today's actual result before changing it.

| Case under that proposed policy | Fixture and action | Required eventual result |
|---|---|---|
| U01 included first | 49/50 used, bonus 2; one successful document | Included 50/50, bonus 2; one charge linked to the document |
| U02 concurrent last included unit | 49/50 used, bonus 0; two distinct simultaneous requests | At most one gets a committed included unit; the other receives the agreed refusal/queue behavior; no negative balance |
| U03 transport repeat | Resend U01 with the same authenticated request identity | Same document/charge result; no second provider work unless safe recovery requires it, with costs still recorded |
| U04 parser failure | Reserve final unit, force extraction failure before success | Recoverable error and preserved safe input; reservation released under policy, no committed charge |
| U05 bonus final unit | Included exhausted, bonus 1; two distinct simultaneous requests | At most one committed bonus charge, bonus never negative, other request has a clear refusal |
| U06 mixed batch | One successful document and one failure | Per-document outcomes; exactly the successful billable unit commits under policy; no whole-batch double charge |
| U07 reset boundary | Start before reset, finish after; repeat request | One charge in its explicitly chosen period; no stale-period grant, duplicate charge or permanent reservation |
| U08 restart/late work | Crash after reservation or provider success; resume/reconcile | Recover defined state and charge once, or release safely; expired claim and late worker cannot both finalize |

Cypra then issues one bounded implementation task only for reproduced gaps. Acceptance includes visible usage, server ledger/counters, parser calls, payer scope and restart behavior. Before the task closes, Hydra must compare website/extension language with the tested charging rule. A statement such as “tests pass” without these named cases is insufficient.

### B18 — Checkpoint, decision log and definition of finished

```text
Plan date / product candidate [date, revision, artifact and approved scope]
Repository state [branch, HEAD, affected dirty changes]
Current package / gate [ID and precise remaining condition]
Task [ID, persona, journey, owner, implementation status]
Expected user output [visible response and durable result]
Evidence [case, expected/actual, command or observation, exit/outcome,
          environment, verifier, timestamp and redacted reference]
JP decisions [policy, affected customers, date and effective version]
Open/failed/blocked cases [prerequisite, responsible person and next check]
Next single action [who receives which request and what to return]
```

Statuses are OPEN, READY, IN PROGRESS, IMPLEMENTED, VERIFIED for named evidence layers, BLOCKED with a specific prerequisite, or DEFERRED with accepted impact/owner/date. A new revision requires affected-case regression checks. A fixed implementation can retain open live verification. Keep one current checkpoint near the top when Cypra hands off to a fresh conversation. Archive historical checkpoints below it.

For final judgment, require all approved B11 journeys to pass, every discovered critical component to have evidence, the financial and ownership invariants to hold under concurrency/failure, current prices/costs to pass JP's commercial gate, an actual customer to understand the visible output, and operations to demonstrate deployment/alerts/restore/recovery. Record unresolved P2 exceptions with mitigation and owner. Remove unsupported capabilities from the release promise when explicitly deferred. Store submission, review approval, public availability and an installed working product are recorded separately.

**Cypra's final release packet** contains the approved scope, candidate/source/lock/config/ZIP fingerprints, deployment/provider mode metadata, per-journey evidence and screenshots, accountant-reviewed fixture read-backs, commercial cost model/decision, policies/branding/support, remaining exceptions, operational owners and JP/Hydra sign-off. A reasonable user and accountant can follow the packet from their intended task to its real outcome. There is no defensible blanket percentage based on completed phase labels.

---

## Preserved engineering workstreams — original planning baseline

The following October text is retained for coverage and historical traceability. Its source descriptions and task-specific change statements refer to that earlier revision. Use the current checkpoint and blueprint above for present scope and facts; revalidate every older implementation statement.

Prepared 18 October 2026. Baseline: 15061fc4a417fe516c9cb1ae9b30da5bb4da24a9 plus existing uncommitted backend changes. Owner: JP; planning: CYPRA; verification: HYDRA; execution: MANTRA.

## Purpose and completion standard
This is the master backlog for finishing the existing website, extension and backend. It is not certification that the product is finished or a promise of zero bugs. Every advertised capability must have a tested user journey, defined failures and recovery, and evidence tied to the release. Existing implementation should be repaired and verified before adding scope.

The earlier Astra report in docs/Astra/Recommendation.md supplies detailed historical findings AST-01–28. Revalidate them against current code: landing source now exists again; billing and telemetry have local changes; earlier test counts and live failures are historical until rerun. Road_Map.md completion labels alone do not close this plan.

Only this plan and README documentation are changed by this task. Actual credentials, applications, databases, PM2 and VPS configuration are not changed.

## How to operate this plan
Each numbered workstream below starts OPEN / NEEDS VERIFICATION. CYPRA maintains individual task records with ID, owner, priority, dependencies, current commit, expected result, actual result and evidence. Split workstreams into bounded implementation prompts. Keep one active prompt in the established CYPRA → HYDRA review → MANTRA execution → HYDRA verification loop.
Statuses: OPEN, IN PROGRESS, BLOCKED with reason, IMPLEMENTED awaiting verification, VERIFIED, or DEFERRED with owner/date/mitigation. Do not equate implementation with deployment or external approval.

P0: immediate availability or unsafe environment blocker. P1: security, money/data integrity or core journey. P2: quality/reliability. P3: later expansion. No blanket percentage: report verified requirements divided by applicable requirements, with blockers separately visible.

## 01 — Establish release and environment truth (P0)
- Inventory root and nested landing repository commits, dirty files, gitlinks, remote URLs and reproducible checkout procedure.
- Resolve the canonical landing source/build/deploy destination; documentation currently contains competing historical deployment descriptions.
- Record API/site domains, DNS A/AAAA, TLS SAN/chain/renewal, reverse proxy, ports, PM2 user/name/cwd, database, bucket and provider environments.
- Check website rendered behavior and API health using normal TLS validation. HTTP 200 alone is insufficient.
- Record extension version, ZIP hash, compiled API origin, manifest permissions and exact store artifact.
- Separate development, staging/sandbox and production data/credentials. Do not run experiments against real customer accounts.
Acceptance: a release can be traced from clean source to built artifact to deployed runtime; public entry points function and rollback target is identified.

## 02 — Credentials and Stripe mode safety (P0/P1)
JP may maintain editable real credentials in Git-ignored local files. Keep Backend/.env for local development and Backend/.env.production.local for a private production copy, if desired. The latter is a proposed file, not created or populated here. Frontend files contain public build configuration only. Use README instructions; do not put secrets in tracked examples, scripts, logs, prompts or bundles.
- Verify ignored AND untracked status before entering production values. Ignore rules do not remove a previously tracked secret.
- Transfer production values through authenticated SSH/SFTP, independently of git pull. Restrict permissions, maintain a private rollback copy, install atomically and restart only the intended process.
- Document dotenv/PM2 precedence. Inherited environment wins by default; --update-env alone is not proof obsolete PM2 values were removed.
- Validate required variable names and modes without returning values. Record operator, date and configuration revision, not secret contents.
- Review JWT rotation/session invalidation, encryption-key migration for stored QBO tokens, database credentials, email/OCR/storage keys and webhook-secret rotation separately.
- Verify actual VPS Stripe account and key mode before any checkout experiment. A real account can issue test credentials; a live secret authorizes live operations. Hosting on a production VPS does not make Stripe sandbox, and selecting sandbox in the dashboard does not change server keys.
- Add a fail-closed server billing mode guard; match key mode, prices, customers, webhook endpoint/signing secret and signed event.livemode. Mode flags described here are requirements, not existing configuration.
- Keep sandbox customers/events/credits separate from production; disable experimental checkout when mode cannot be established. Never test with real card details in live mode.
Acceptance: safe metadata proves intended mode; mismatch tests fail before creating a session or granting entitlement; production cutover has explicit JP authorization and separate evidence.
Reference: [Stripe testing](https://docs.stripe.com/testing), [API authentication](https://docs.stripe.com/api/authentication).

## 03 — Marketing website and introduction (P0/P2)
Cover navbar, mobile menu, intro, hero, platform support, features, workflow explanation, story, advertising video, pricing, FAQ/help, CTA and footer.
- Intro is optional, skippable by real button/keyboard, reduced-motion aware, bounded in duration and unable to hide content permanently.
- All hooks execute consistently; refresh, repeat visits, storage failure and interrupted animation work; body scrolling is restored on every exit.
- Navigation anchors account for sticky headers; focused controls remain visible. No horizontal overflow, overlapping CTA, clipped dialog or inaccessible mobile menu.
- One clear primary CTA; actual store availability and supported platforms are truthful. Unsupported platforms receive clear expectations.
- Pricing monthly/annual amounts, billed total, currency, taxes if applicable, limits and renewal/cancellation terms agree with backend.
- Video has poster, controls, captions/transcript where appropriate and no forced audio; lazy-load heavy media.
- Privacy, terms, support, verification/reset and billing-return pages work directly and after refresh. Unknown routes return useful 404.
- Title/description, canonical URLs, social preview, sitemap/robots and favicon match production; staging is not indexed.
Acceptance: first/repeat visits, navigation, pricing and CTA pass on desktop/mobile with no runtime errors; content remains usable when optional animation fails.

## 04 — Shared visual system and accessibility (P2)
Create a component inventory covering buttons, icons, typography, spacing, colors, cards, badges, inputs, selects, date pickers, tables, tabs, dropdowns, modals, toast, loading skeleton, empty state and error panel.
- Define consistent size/spacing tokens and clear primary/secondary/destructive actions.
- Dialogs have accessible names, focus entry/trap/return and safe cancellation. Errors appear beside fields with summary where useful.
- Labels, keyboard navigation, visible focus, screen-reader status announcements, contrast and non-color status cues are verified.
- Preserve form data on recoverable failures; disable duplicate actions while showing progress; never use infinite spinners.
- Test landing widths 360/390/768/1280/1920; extension default 950×750, 800×600 and resized windows; 200% zoom and long text.
- Screenshot each meaningful authenticated screen and state; review alignment, wrapping, dropdown edges and scroll behavior against approved design.
Target WCAG 2.2 AA with automated and manual checks; do not claim conformance from a scanner alone. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## 05 — Identity, roles and tenant boundaries (P1)
Cover registration, verification/resend, login, password reset/change, logout, session expiry, account disable/reactivation, owner/admin requests, invites, teams and locations.
- Establish one authoritative capability matrix for OWNER, ADMIN, MANAGER, ACCOUNTANT, STAFF and VIEWER; reconcile frontend/backend defaults and null/partial overrides.
- Distinguish platform owner, tenant payer, team administrator, approver and accounting operator. Test direct API calls, not just hidden buttons.
- Scope every read/write/export/clone/retry/attachment to the actual tenant relationship.
- Reset tokens are single-use atomically; credential changes revoke old sessions as designed.
- Invites expire, cannot be replayed or moved between tenants, and cannot elevate privileges; reject unsafe last-admin removal.
- Account switching clears or namespaces scans, selections, provider caches and pending requests.
Acceptance: two-tenant and every-role negative tests pass; old sessions and stale background requests cannot reveal another user's data.

## 06 — Onboarding, teams and location management (P1/P2)
Provide a guided path: verify account → establish team/location → connect QBO company → choose template → map → review sample → first successful sync.
- Persist progress without forcing repeated welcome overlays; explain prerequisites and empty states.
- Location lists/search work beyond one page; switching locations resets incompatible selections.
- Location edits/deletes define treatment of templates, historical scans, mappings and provider references.
- Admin approval, user status, plan ownership and team transfer have auditable outcomes.
Acceptance: a new user completes a synthetic first transaction without hidden setup knowledge; canceled onboarding can resume.

## 07 — Ingestion and scan lifecycle (P1)
Cover Toast, Salido, Oracle, text paste, current-tab capture, images/OCR, supported documents, XLSX and all advertised file formats.
- Fixture each supported report layout and 12-column fixed-format parser; detect layout drift rather than silently posting guessed fields.
- Align frontend/server formats, file-size/count limits and archive expansion constraints; either support legacy XLS correctly or reject it clearly.
- Validate MIME/content; reject corrupt, oversized, encrypted or unsupported input with actionable errors.
- Batch items have independent progress/status, cancellation, retry and resume behavior. Closing popup or suspending worker cannot leave permanent busy state.
- Preserve original evidence and extracted values; uncertain OCR requires review. AI suggestions never bypass validation/approval.
- Reject malicious document instructions and formula input as data; bound regex/expression evaluation and OCR cost.
Acceptance: known input fixtures yield expected fields/totals; mixed batches retain successful items and expose individual failures.

## 08 — Templates, mappings, catalog and rules (P1/P2)
Cover TemplateWizard, template activation/defaults, MappingView, PresetManager, product catalog, product/payee/value mappings, fuzzy matches, conditions, priorities and defaults.
- Use explicit create/update/persisted DTOs; pass typecheck without invented IDs or any casts masking contract mismatch.
- Built-in presets are immutable where intended; custom presets and clone/export/import enforce tenant ownership.
- Preview imports and conflicts; version exported format; reject malformed/unbounded data.
- Explain matching priority and conflicts; deterministic precedence and tie behavior; preview rule effects before saving.
- Test exact/contains/starts-with/regex, empty input, special characters, locale and duplicate product names.
- Provider account/class/vendor/customer references are realm-aware, refreshed and checked for inactivity.
- Draft edits survive safe navigation; unsaved-change confirmation is consistent.
Acceptance: mapping export/import round trip retains conditions and precision; same input/rules produce the same reviewed result.

## 09 — Accounting correctness and review (P1)
Cover JournalEntryPreview, BillPreviewForm, VendorCreditPreviewForm, CheckPreviewForm and BillPaymentView.
- Journal entries balance; define rounding precision/tolerance and use appropriate decimal arithmetic.
- Bills preserve vendor, expense/item lines, customer/project, class, tax, terms and due date.
- Vendor credits have correct signs/accounts and application semantics.
- Cheques preserve bank account, payee, line/customer dimensions and document identity.
- Bill payments link correct open bills/credits; handle partial payment, stale balances and concurrency.
- Test tips, fees, discounts, refunds, negative/zero values, duplicate document numbers, tax-inclusive/exclusive totals and business timezone boundaries.
- Single, batch and retry paths use the same validators and builders. Approval binds to a payload version; editing invalidates prior approval.
- Unsupported currency/accounting combinations are blocked with explanation until supported.
Acceptance: expected accounting fixtures match QBO sandbox entities field-for-field, not merely HTTP success.

## 10 — QBO connection and durable sync (P1)
- Exact callback origin/path and server-confirmed token exchange determine connection success; code+realmId alone is insufficient.
- Handle expired consent, token refresh races, revoked access, denied consent, closed tabs and MV3 suspension.
- Show company identity/environment before posting; reconnecting a different realm invalidates incompatible cached references.
- One durable operation ID per intended transaction, reused across retries; atomic unique claim and provider idempotency where supported.
- Distinguish queued, processing, posted, finalization pending, attachment pending, failed and uncertain outcome.
- On ambiguous timeout reconcile before retry; database failure after provider acceptance must not recreate the transaction.
- Explicit, authorized duplicate override with audit trail.
Acceptance: double-click, two workers, manual/automatic race, restart and timeout-after-acceptance each yield one intended accounting transaction.

## 11 — Retry, scheduling and notifications (P1/P2)
Build on existing jobs: retry-queue, sync-failure-alerts, trial-warnings, quota-alerts, scan-cleanup and timebomb/account-expiry behavior.
- Durable lease/claim, bounded concurrency, retry classification, backoff/jitter, attempt limit and dead-letter resolution.
- Recheck actor/account/approval/realm before a delayed write.
- Multi-instance scheduling does not duplicate email, credit reset or external write.
- Define expiry warning, grace period and access behavior; destructive cleanup respects retention/legal constraints.
- Preferences, cooldowns, recipient selection, delivery failures and restart behavior are tested.
- Notification email contains minimal data and safe links; opt-out applies to optional messages without disabling necessary security notices.
Acceptance: fake-clock and restart tests demonstrate one scheduled effect; alerts reach the correct team without spamming.

## 12 — Billing and entitlement lifecycle (P1)
Cover subscription checkout, scan packs, portal, trial, plan upgrade/downgrade, renewal, cancellation, failed payment, recovery, refund/dispute and billing return pages.
- Billing authority enforced on all billing endpoints; local portal guard changes require regression review.
- Server chooses allowlisted prices and quantities; clients cannot grant plan/credits.
- Pin Stripe API/webhook versions; current SDK item-level periods and invoice relationships are handled explicitly.
- Verify raw signature before processing; bounded invalid-event logging.
- Atomic event claim and entitlement updates; duplicate, concurrent and out-of-order events converge correctly.
- Return-page success is informational; signed server events/reconciliation establish entitlement.
- Define prorations, cancellation effective time, refunds/scan-pack credit reversals and expired-plan recovery; JP approves business rules.
Acceptance: realistic signed sandbox fixtures cover the complete lifecycle, with no epoch dates, double credits or stale-event reactivation.

## 13 — Usage, storage and data lifecycle (P1)
- One ledger/reservation for included scans, bonus credits and costly parse attempts; explicit refund/cancel policy and time boundary.
- Concurrency cannot overdraw; unsaved parses and alternate endpoints cannot bypass capacity.
- Server-owned upload tickets enforce tenant, size/type, purpose and expiration; known foreign keys cannot be rebound.
- Cleanup temporary/orphaned objects; retry failed deletion; reconcile database and object inventory.
- Define retention/deletion/export for documents, scans, financial history, webhook/log data and backups.
Acceptance: failed/canceled/retried operations have correct usage; object access and deletion are isolated; accounting evidence is retained according to policy.

## 14 — History, dashboards and exports (P2)
Cover user/admin dashboards, sync history, scan history, activity/audit, QBO data and retry status.
- Metrics have explicit actor/team/location scope and real units; stored bytes are not scan counts.
- Date filters combine lower/upper bounds correctly; timezone boundaries match display/export.
- Pagination, search, sorting and empty/large data states are complete; stale requests cannot overwrite a new filter.
- CSV neutralizes formula-leading untrusted text and streams/bounds large exports.
- Audit includes who/what/when/outcome/correlation, without credentials or excessive document data.
Acceptance: UI, export and expected database totals reconcile for multiple tenants and boundary dates.

## 15 — Backend, database and security foundations (P1)
- Validate input and output contracts; consistent structured errors, correlation IDs and safe messages.
- Authorization independent of CORS; narrow origins/extension identities; validate proxy trust and rate-limit behavior.
- Review CSP by route/runtime; avoid blanket unsafe-eval as a substitute for fixing deployment.
- Timeouts, body limits, query limits, pagination, query indexes and connection pool bounds.
- Review migration deployment/rollback compatibility, constraints, cascading deletes, transactional claims and recovery.
- Secret scanning for working tree/history/artifacts; triage dependency advisories by reachability and fixed versions.
- Runtime least privilege, TLS, upload/download protection and provider token encryption/key migration.
Acceptance: adversarial tenant/role tests, malformed inputs and concurrency invariants pass; no untriaged critical/high reachable issue.

## 16 — Monitoring, performance and support (P1/P2)
- Shared telemetry allowlist; redact nested fields, query strings, mixed-case headers and breadcrumbs; sanitizer failure drops unsafe events.
- Synthetic alert validates receipt, release ID and correlation without real sensitive data.
- Monitor availability, TLS expiry, failed/uncertain writes, retry age, webhook lag, quota anomalies, DB/disk and provider failures.
- Establish measured budgets: proposed landing LCP ≤2.5s, CLS ≤0.1, INP ≤200ms where field data exists; use lab checks before traffic and agree API p95 budgets excluding external processing.
- Lazy-load video/charts, cache immutable assets, compress media, paginate data and avoid unnecessary polling.
- Support workflow includes event ID, incident owner, severity, customer communications and recovery/runbooks.
Acceptance: degraded services produce usable errors and actionable alerts; measured budgets have explicit test device/network/data size.

## 17 — Packaging, deployment, store and recovery (P1)
- Clean locked installs → typecheck → tests → builds → artifact inspection → staged journeys → independent release decision.
- Production build validates API origin and public-only config; no secret files or development endpoints in ZIP/static assets.
- Preserve legal, reset/verification and billing-return files during landing deployment.
- Stage release directory/artifact, validate, activate and retain rollback; identify migration compatibility before switching.
- Backups encrypted/access-controlled; restore into isolation and measure RPO/RTO. Reconcile external writes after restore.
- Verify actual Chrome Web Store listing, ID, permissions, privacy declarations, screenshots and submitted version/hash; installed-old versus updated extension compatibility.
Acceptance: fresh installation and upgrade work; one rollback and one restore drill succeed; production smoke tests identify exact release.

## 18 — Coverage and test matrix
For every capability above test success, invalid input, denied permission, loading, empty data, provider failure, retry, cancellation and recovery as applicable.
Fixtures: two tenants; every role; expired/disabled accounts; more than one page of locations; each source and transaction type; large/long/unicode input; timezone/rounding boundaries.
Layers: pure unit tests; contract tests against real schemas; database integration with real isolation; browser/extension journeys; sandbox provider tests; visual/accessibility checks; isolated load tests; deployment smoke.
Mocks cannot certify actual provider contracts or tenant isolation. Keep test/live accounts separate. Current test counts must be rerun and attached to a commit; historical passes are not current sign-off.

Required journeys:
1. Visitor → pricing/legal → store → install → signup/verification.
2. Login → onboarding → location → QBO → template/mapping → sample review.
3. Each source → each supported transaction path → approval → posting → history.
4. Batch partial failure → retry/reconciliation → attachment completion.
5. Invite/team/role change → direct API authorization → logout/account switch.
6. Trial/subscription/scan pack → webhook → allowance → failure/cancel/recovery.
7. Expiry/reset/revocation → safe return; interrupted scan → resume.
8. Export/report → matching totals; deletion/retention → auditable outcome.
9. Clean deploy → health/alerts → rollback; backup → restore.
10. Environment mismatch → operation rejected without financial side effects.

## 19 — Prior audit traceability
Every historical finding remains tracked until HYDRA records current disposition:
| Audit IDs | Workstreams |
|---|---|
| AST-01–05 | 01,03,08,17 |
| AST-06–10 | 05,08,12,13 |
| AST-11–12 | 09–11 |
| AST-13–16 | 12–13 |
| AST-17–18 | 14 |
| AST-19–22 | 04,07,09–10 |
| AST-23–24 | 02,15,20 |
| AST-25–28 | 01,15–17,21 |

## 20 — Legal, disclosure and scope decisions
Inventory actual recipients: QBO, Gemini, Stripe, email, object storage and telemetry. Align policy/store/onboarding with actual data categories, purposes, retention and deletion. JP/business owner reviews terms, cancellation/refund rules and operator details; engineering tests links/workflows, not legal compliance.
Decisions needed before affected implementation: billing sandbox versus live; payer authority; included/bonus usage order; failed-parse charge policy; retention; approval roles; supported currencies/locales; refund/proration policy; recovery targets. Record decisions, don't silently guess.
F-12 multi-currency, new providers and large rewrites are later scope unless required by existing advertised promises. Do not expand scope indefinitely to avoid finishing the current product.

## 21 — Execution waves and final release gate
1. Baseline/environment safety and credential runbook (01–02).
2. Public entry, source/build integrity and critical authorization (03,05,17).
3. Accounting, connection, idempotency and retry correctness (09–11).
4. Billing/usage/storage and provider contracts (12–13).
5. Remaining onboarding, ingestion, mapping, reports and UI (04,06–08,14).
6. Security/operational evidence and release candidate journeys (15–20).
Refactoring happens behind regression tests, not as a prerequisite to every small fix.

Release only when: no open P0/P1 affecting enabled functionality; all advertised journeys pass; role/tenant and concurrency tests pass; typecheck/build pass; no exposed secrets; mode proven; restore/rollback and alerts proven; policies/listing match behavior; known limitations disclosed; exact artifact approved by HYDRA and JP.
A P2 deferral needs mitigation, owner and date. Missing evidence remains NOT VERIFIED. Retest affected paths after each change.

## Task record template
ID / title:
Priority / affected workstream:
Current evidence and baseline:
Objective and explicit non-goals:
Dependencies / JP decisions:
Files and behavior affected:
Acceptance cases, including failure/recovery:
Execution and rollback scope:
MANTRA report:
HYDRA independent verification:
Artifact/environment/date:
Status / remaining risks:

## Immediate next action
CYPRA follows B17 using the latest checkpoint and BP verification queue. Start with a read-only Hydra baseline for changed source/deployment truth, provider mode metadata and relevant unresolved AST/QF findings. Select the next proven high-risk dependency, obtain missing policy decisions, then issue one bounded implementation prompt. Independent local work such as the B13 cost model can proceed while remote proof is blocked. Do not request secret values in the audit report.

