# Qyra master completion plan
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
CYPRA issues one HYDRA baseline audit covering current source/deployment, Stripe mode metadata, PM2 environment provenance, changed authorization/telemetry code and historical AST findings. Then issue the first bounded implementation prompt. Do not request secret values in the audit report.

