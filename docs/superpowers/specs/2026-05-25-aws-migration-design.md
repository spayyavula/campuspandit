# AWS Migration Design — CampusPandit Park-Mode Plan, AWS-Native

**Date:** 2026-05-25
**Status:** Draft, awaiting user review
**Supersedes (data layer + hosting only):** [2026-05-22-park-consumer-app-supabase-migration-design.md](./2026-05-22-park-consumer-app-supabase-migration-design.md)

## 1. Context

The 2026-05-22 spec parks the consumer app and migrates Azure Postgres → Supabase, ships a content layer + Pilot Application form + Plausible analytics, and runs a 3-month observe window (2026-05-21 → ~2026-08-21) on Azure Static Web Apps + Supabase. That spec's code lives in 15 commits on `observe-window-park` (draft PR #1, not yet merged).

The user has decided to consolidate on AWS with another project they run, and has $25k of AWS Activate credits in hand — so cost optimization is not a design driver. This spec re-targets the same park-mode plan to AWS-native services. The product behavior, observe-window stage gates, content layer, and analytics goals from the 2026-05-22 spec are unchanged. Only the hosting and data layer move; reliability and developer ergonomics win any close calls that the original Azure/Supabase plan resolved on cost grounds.

This spec is the same scope as the 2026-05-22 spec, on a different cloud — not a bigger project.

## 2. Goals and non-goals

### Goals

- Run the park-mode observe window on AWS instead of Azure SWA + Supabase
- Preserve the Stage 1 / Stage 2 observe-window design from the 2026-05-22 spec
- Stay well within the $25k AWS Activate credit envelope (target ≤ $100/mo steady-state; current burn expected at ~$70/mo)
- Zero-downtime cutover from Azure (DNS flip with rollback window)
- Reuse the 15 commits of content-layer work in draft PR #1 wherever possible

### Non-goals

- Revive the FastAPI backend or the legacy consumer-app features
- Build the teacher-dashboard / multi-tenant B2B platform (out of scope per [[bandwidth-and-park]])
- Migrate non-Postgres data (there isn't any meaningful blob/object storage in use)
- Declarative IaC (Terraform/CDK) — see §3, decision D1. Imperative boto3 scripts are the chosen form of IaC; upgrading to a declarative tool is a future option if multi-environment management gets complex.
- Build Cognito magic-link end-to-end (deferred — see §3, decision D3)

## 3. Decisions

| ID | Decision | Choice |
|----|----------|--------|
| D1 | IaC vs click-ops for Phase 1 | **Imperative boto3 scripts** under `infrastructure/deploy/` — `python deploy.py up` provisions every resource; `python deploy.py down` tears down. Rejected click-ops (drift risk against the runbook) and CDK (heavier abstraction layer than a side bet warrants); imperative boto3 is the right granularity. Initial click-ops decision was cost-driven; $25k credits make the upfront tooling investment worth it for the reproducibility + dev/staging environment story. |
| D2 | DNS registrar / authoritative DNS | Move `campuspandit.ai` zone to Route 53. Keeps one console with the user's other AWS project; ACM DNS validation is automatic. |
| D3 | Cognito magic-link auth | Provision an empty user pool now; defer custom-auth Lambda triggers + SES sender until Stage 2 actually fires per the stage-gate rule. |
| D4 | Frontend hosting | Amplify Hosting (1:1 ergonomics with Azure SWA: Git-connected, auto-build, auto SSL, branch previews, custom headers). |
| D5 | Database | RDS Postgres `db.t4g.small`, **Multi-AZ**, encrypted, 7-day automated backups. Multi-AZ chosen over single-AZ now that $25k AWS startup credits cover the ~$25/mo delta — better reliability story for the B2B audience per [[b2b-pivot]]. Rejected Aurora Serverless v2 min=0 (cold-start UX bad for first-of-day form submitter); rejected DynamoDB (would lose the 6 saved SQL analytics queries). |
| D6 | API layer to replace Supabase auto-REST | 4 Lambda functions behind API Gateway HTTP API. **RDS Proxy** sits between Lambda and RDS: removes cold-connection latency from form submits, handles connection pooling, and provides IAM database authentication. Costs ~$15/mo, covered by credits. |
| D7 | Backups / snapshots | AWS Backup plan: daily 35-day retention + monthly copy to S3 Glacier Deep Archive (365-day retention). Replaces the Azure Blob `db-backups` design from 2026-05-22 §0.4. |
| D8 | Email | SES sandbox for the Cognito magic-link sender, only when D3 unblocks. Constant Contact remains the founder-update channel (manual workflow at `docs/superpowers/queries/constant-contact-sync.md` unchanged). |
| D9 | Analytics | Unchanged. Plausible cookieless, 4 custom goals from the 2026-05-22 spec. |
| D10 | Observability + cost guardrail | CloudWatch Logs (default), one CloudWatch billing alarm at **$200/mo** (high enough not to fire on the new upgraded baseline, low enough to catch genuine surprises before they eat credits). |
| D11 | Secrets / config | **Secrets Manager** for RDS master credentials (free automatic rotation via Lambda) + **SSM Parameter Store** for non-secret config (API URLs, Cognito pool ID). Injected into Lambda at deploy time and into Amplify at build. |
| D12 | Legacy backend code (`backend/` FastAPI) | Move to a `legacy/backend-archive` git branch, delete from `main`. Preserved in git history but not in working tree. |

## 4. Target architecture

```
                       Route 53 (campuspandit.ai zone)
                              |
                              v
           Amplify Hosting (CloudFront + S3, managed)
                              |
                              v
                       React PWA (built from main)
                              |
                  +-----------+-----------+
                  v                       v
            Plausible              API Gateway HTTP API
            (3rd-party)                    |
                                           v
                                    4 x Lambda (Python)
                                           |
                                           v
                                       RDS Proxy
                                  (IAM auth, pooling)
                                           |
                                           v
                                 RDS Postgres t4g.small
                                  (Multi-AZ, encrypted)
                                           |
                                           v
                              AWS Backup
                              - daily 35-day
                              - monthly -> Glacier 365-day

            Cognito User Pool (empty in Phase 1)
                + SES sandbox     <-- both wired only when Stage 2 fires

            CloudWatch Logs + 1 billing alarm ($200/mo)
            Secrets Manager (DB creds, auto-rotation)
            SSM Parameter Store (non-secret config)
```

### Component responsibilities

- **Amplify Hosting** — serves the React PWA; handles SPA fallback (404 → `/index.html`), custom headers (CSP + X-Frame-Options + Referrer-Policy, ported from `staticwebapp.config.json`), automatic SSL via ACM, GitHub-connected auto-deploy on push to `main`.
- **API Gateway HTTP API** — single API, 4 routes, JWT authorizer disabled in Phase 1 (forms are public, like the Supabase plan).
- **Lambda functions** — one per write endpoint: `POST /pilot-applications`, `POST /feature-requests`, `POST /engagement-signals`, `POST /votes`. Each ~30 lines of Python: Pydantic body validation, `psycopg` INSERT, return 201. Connects through RDS Proxy using IAM authentication (no static DB password in Lambda config). Shared layer for DB connection + Pydantic models.
- **RDS Proxy** — sits between Lambda and RDS. Manages a warm pool of Postgres connections (~10 by default), so Lambda invocations reuse connections instead of opening a fresh one on every cold start. IAM-authenticated, so Lambda's execution role is the credential — no DB password in code or env. Failover-aware: when Multi-AZ RDS swings to the standby, RDS Proxy reroutes transparently with no Lambda restart.
- **RDS Postgres** — single logical instance, 20 GB gp3 storage, Multi-AZ replication, deletion protection on, automated backups 7-day window (in addition to AWS Backup plan).
- **AWS Backup** — vault + plan + selection scoped to the RDS instance.
- **Cognito User Pool** — created empty in Phase 1; user pool ID stored in SSM but not consumed by the app. When Stage 2 fires, 3 custom-auth-trigger Lambdas + SES sender + React magic-link hooks land in a follow-up branch.
- **Route 53** — hosts `campuspandit.ai`; A/AAAA aliases for `www` → Amplify; ACM cert auto-validates.
- **CloudWatch** — default log groups for Lambda + Amplify build logs; 1 billing alarm.
- **SSM Parameter Store** — `/campuspandit/prod/db_url`, `/campuspandit/prod/api_base_url`, etc. SecureString for credentials.

### What is destroyed at the end of migration

- Azure Static Web App `ambitious-river-04fdcd510`
- Azure Container App `campuspandit-backend`
- Azure Container Registry
- Azure Postgres flexible-server (after RDS snapshot verified)
- Azure Blob container `db-backups` (after 30-day belt-and-suspenders period)
- GitHub Actions workflows `azure-static-web-apps-*.yml` and `azure-container-apps-backend.yml`
- `staticwebapp.config.json`
- `@supabase/supabase-js` dependency

### What stays unchanged

- Plausible analytics + the 4 custom goals
- Constant Contact manual-sync workflow
- The content layer in PR #1 (blog, materials, roadmap, ideas, apply, for-students routes — all the JSX/copy/SEO commits)
- The stage-gate rules at `docs/superpowers/queries/stage-gates.md`
- The 6 analytics SQL queries at `docs/superpowers/queries/engagement-signals.sql` (run against RDS via local `psql` over an IAM-authenticated session or temporary public-access window)
- The UTM convention at `docs/superpowers/queries/utm-convention.md`
- `CONTEXT.md`

## 5. Migration phases

Estimated ~1 week of focused work. Phases are sequential — do not parallelize phase 3 (data migration) and phase 4 (code rewrite) because the cutover smoke test in phase 5 needs both finished.

### Phase 0 — Prereqs (~2 hrs)

1. Confirm AWS account + region (recommend `ap-south-1` Mumbai — lowest latency for India coaching-center audience and required for ~SOC2-friendly story per [[b2b-pivot]]).
2. Create IAM user `campuspandit-ci` with programmatic access; attach narrow policy (Amplify deploy + Lambda update + S3 write to a specific bucket only). Save keys in GitHub repo secrets.
3. Create CloudWatch billing alarm at $200/mo on root account (email-only notification).
4. Verify the user can `aws sts get-caller-identity` from their laptop with the new keys.

### Phase 1 — Infra provisioning (~1-2 days to write scripts; ~30 min to run)

Imperative boto3 scripts under `infrastructure/deploy/`. Each script is idempotent (check-then-create) and uses SSM Parameter Store to share state between scripts. The orchestrator `deploy.py up` runs them in dependency order. `deploy.py down` is the inverse. Resource definitions follow:

1. **VPC** — accept the default VPC for the region; do not create a custom VPC for Phase 1.
2. **RDS** — `db.t4g.small`, 20 GB gp3, **Multi-AZ**, Postgres 16, deletion protection ON, automated backups 7-day. Public-access ON for Phase 3 only (laptop `pg_restore`); flipped OFF at end of Phase 3, never re-enabled. Master user `campuspandit_admin`, credentials stored in **Secrets Manager** secret `campuspandit/prod/db_master` with rotation enabled (30-day cycle). Lives in the default VPC's subnets; security group `rds-sg` allows port 5432 ingress only from `proxy-sg` (defined in step 3).
3. **RDS Proxy** — create proxy `campuspandit-proxy` in front of the RDS instance. Auth: IAM (no password). Security group `proxy-sg`: inbound 5432 from `lambda-sg`, outbound 5432 to `rds-sg`. Attached to the same VPC subnets as RDS. Idle connection timeout default. Reads master creds from the Secrets Manager secret in step 2 to manage its pool.
4. **API Gateway HTTP API** — create one API named `campuspandit-observe`. 4 routes, all POST, all anonymous. CORS: allow origin `https://www.campuspandit.ai` (+ Amplify preview URLs).
5. **Lambda** — 4 functions in Python 3.12, x86_64, 128 MB, 10s timeout. Shared Lambda layer containing `psycopg[binary]` + `pydantic`. Functions named `pilot-application-write`, `feature-request-write`, `engagement-signal-write`, `vote-write`. Attached to default VPC subnets with security group `lambda-sg` (no inbound; outbound 5432 to `proxy-sg`). IAM role: `AWSLambdaVPCAccessExecutionRole` + a custom inline policy granting `rds-db:connect` on the RDS Proxy resource ARN. Each function has env var `DATABASE_PROXY_HOST` (the proxy's endpoint) and `DATABASE_NAME`; connection uses `psycopg.connect(host=$HOST, user='lambda_app', password=<IAM token>, sslmode='require')` where the IAM token is generated at runtime via `boto3.client('rds').generate_db_auth_token()`.
6. **Amplify Hosting** — connect GitHub repo `spayyavula/campuspandit`, branch `main`, build command `npm ci && npm run build`, output dir `dist`. Add env var `VITE_API_BASE_URL` (pointing at the API Gateway invoke URL). Custom headers from §6.
7. **Cognito** — create empty user pool `campuspandit-users` in same region. Note the pool ID in SSM but don't wire it up.
8. **Route 53** — create hosted zone for `campuspandit.ai`. Do NOT change registrar nameservers yet (that's Phase 5). Pre-populate records: `campuspandit.ai` apex (placeholder), `www.campuspandit.ai` alias to Amplify CloudFront distribution.
9. **AWS Backup** — vault `campuspandit-prod`, plan `daily-35-monthly-glacier-365`, selection = the one RDS instance.
10. **ACM** — request a cert in `ap-south-1` for `www.campuspandit.ai` and `campuspandit.ai`. DNS-validate via Route 53 zone records (resolves immediately in same console).

### Phase 2 — Schema bring-up (~30 min)

1. From a laptop with temporary public-access ON, `psql` to the new RDS instance.
2. Run the 4 admin-table DDL blocks from the 2026-05-22 spec §5 Phase 1 (`feature_requests`, `engagement_signals`, `pilot_applications`, `feature_request_votes`).
3. Add a Postgres role `lambda_app` with INSERT-only privileges on these 4 tables, granted membership in the `rds_iam` role so Lambdas can authenticate via IAM tokens (no password). Lambdas connect as `lambda_app`, not master.

### Phase 3 — Legacy-data migration (~1-2 hrs)

1. From a workstation: `pg_dump --no-owner --no-acl --format=custom $AZURE_PG_URL > campuspandit-azure-$(date +%Y%m%d).dump`
2. Upload dump to an S3 bucket `campuspandit-db-migration` (lifecycle rule: delete after 30 days).
3. `pg_restore --no-owner --no-acl --dbname $RDS_URL campuspandit-azure-*.dump`
4. Verify row counts match Azure source for every table.
5. In the RDS console, flip public-access OFF. Confirm `psql` from the laptop now fails. (This is the close of the public-access window opened in Phase 1.)
6. Keep the Azure Postgres running and untouched until Phase 5 smoke test passes.

### Phase 4 — Code rewrite on a new branch (~2 days)

Branch: `aws-platform`. Cherry-pick the content-layer commits from `observe-window-park`, then apply the data-layer rewrite below.

| Change | Files |
|--------|-------|
| Delete Supabase client | `src/lib/supabase.ts` (if it exists yet — may only be in the unmerged PR #1) |
| New API client | `src/lib/api.ts` — minimal `fetch`-based POST wrapper with timeout + error handling, reads `import.meta.env.VITE_API_BASE_URL` |
| Rewrite 4 form submit handlers | The components behind `/apply`, `/ideas` form, vote button, and the engagement-signal beacon. Replace `supabase.from(...).insert(...)` with `api.post('/<endpoint>', body)`. |
| Remove dependency | `package.json` — drop `@supabase/supabase-js` |
| Rename env vars | `.env.example` — `VITE_SUPABASE_OBSERVE_URL` + `_ANON_KEY` → `VITE_API_BASE_URL` |
| Add Amplify build spec | `amplify.yml` at repo root (defines preBuild/build/cache phases for Amplify Hosting) |
| Port hosting config | Move CSP + security headers + SPA fallback + cache rules from `staticwebapp.config.json` into `amplify.yml` `customHeaders` + Amplify console redirect rules. Delete `staticwebapp.config.json`. |
| Archive backend | Create branch `legacy/backend-archive` from current `main` (preserves the FastAPI code intact for future reference). On `aws-platform`, `git rm -r backend/` so it no longer ships with the working tree. |
| Delete workflows | `.github/workflows/azure-static-web-apps-ambitious-river-04fdcd510.yml` and `.github/workflows/azure-container-apps-backend.yml` |
| Add boto3 deploy automation | New directory `infrastructure/deploy/` with `deploy.py`, `teardown.py`, 11 provisioning scripts, shared helpers (D1) |
| Mark 2026-05-22 spec superseded | One-line "Superseded by 2026-05-25-aws-migration-design.md for hosting + data layer" at the top |

PR #1 (`observe-window-park`) gets closed without merge after `aws-platform` ships; commits live forever in git history.

### Phase 5 — Cutover (~half-day)

1. 24 hr before cutover: lower TTL on `www.campuspandit.ai` to 60s on the current registrar.
2. Open PR for `aws-platform` → `main`. Self-review against the cross-branch checklist in `docs/superpowers/specs/2026-05-22-park-...md` (still valid). Merge.
3. Amplify auto-builds and deploys main to its default `https://main.<id>.amplifyapp.com` URL. Smoke test there first:
   - Walk every public route from the savepoint resume order (`/`, `/for-students`, `/blog`, `/materials`, `/roadmap`, `/ideas`, `/apply`, `/apply/thanks`).
   - Confirm `/auth` and `/coach` redirect to `/`.
   - Submit a test row to `/ideas` and one to `/apply`; verify rows appear in RDS via `psql`.
   - Verify all 4 Plausible custom events fire.
   - Delete the test rows from RDS.
4. Update registrar nameservers to point at the Route 53 hosted zone created in Phase 1.
5. Wait for DNS propagation (typically <10 min with 60s TTL). Smoke test again from `https://www.campuspandit.ai`.
6. Restore TTL to 3600s on the apex + www records.

### Phase 6 — Azure teardown (~1 hr, ≥7 days after cutover)

Hold for 7 days after Phase 5 to confirm no rollback needed. Then:

1. `az containerapp delete --name campuspandit-backend --resource-group campuspandit-rg`
2. `az postgres flexible-server delete --name <name> --resource-group campuspandit-rg --yes`
3. `az acr delete --name <acr-name> --yes`
4. Delete the Azure Static Web App resource in the portal.
5. Keep the Azure Blob `db-backups` container for 30 more days (belt-and-suspenders against an RDS-side surprise); then delete.
6. Cancel the Azure subscription if this is the only workload left in it; otherwise leave it.
7. Take a cost screenshot of the AWS bill 24 hrs after teardown for the baseline.

## 6. CSP + headers port

The current `staticwebapp.config.json` defines a `content-security-policy` that is permissive (`script-src 'self' 'unsafe-inline' 'unsafe-eval' https:`). The same policy moves verbatim into Amplify's `customHeaders` for backwards compatibility. A tightening pass is out-of-scope for this migration and goes on the [[landing-seo-followups]] list.

The `connect-src` directive currently is `'self' https: wss:` which already permits the new API Gateway endpoint — no policy edit needed for the data-layer swap.

## 7. Cost model

With $25k AWS Activate credits in play, cost is no longer the optimization target — reliability and developer ergonomics win the close calls. This table is for runway planning, not gating.

| Service | Phase 1 (idle, <1k visits/mo) | If traffic grows 100× (Stage 2 magic-link active, ~100k visits/mo) |
|---------|-------------------------------|---------------------------------------------------------------------|
| Amplify Hosting | ~$1 | ~$5-10 |
| RDS t4g.small Multi-AZ | ~$50 | ~$50 |
| RDS Proxy | ~$15 | ~$15 |
| Secrets Manager (1 secret) | ~$0.40 | ~$0.40 |
| API Gateway HTTP API | ~$0 | ~$1 |
| Lambda invokes | ~$0 | ~$0.20 |
| AWS Backup + Glacier | ~$1 | ~$1 |
| Route 53 hosted zone | $0.50 | $0.50 |
| CloudWatch logs + alarm | ~$0.50 | ~$2 |
| SES (Stage 2 only) | $0 | <$1 (62k free/mo) |
| Cognito (Stage 2 only) | $0 | $0 (50k MAU free) |
| **Total** | **~$70/mo** | **~$75-80/mo** |
| **Credit runway at Phase 1 burn** | **~30 years** ($25k / $70) | **~26 years** |

Azure baseline (from the 2026-05-22 spec): ~$50-80/mo. The migration is roughly cost-neutral after the Multi-AZ + RDS Proxy upgrades. The primary value is consolidation per [[b2b-pivot]] direction plus better reliability story; cost is a non-factor for the foreseeable future.

## 8. Rollback plan

A failure can be detected at three points:

- **During Phase 3 (data migration):** dump or restore fails. Fix the dump command on the workstation; Azure is untouched. Zero blast radius.
- **During Phase 5 (smoke test before DNS flip):** form submit fails, route 404s, header missing, etc. Fix on `aws-platform`, re-push, Amplify re-deploys, smoke test again. DNS hasn't moved; Azure SWA still serves production.
- **After DNS flip:** flip nameservers back at the registrar (the previous Azure-pointing values are recorded in the runbook before the cutover). Propagation ~10 min with the 60s TTL set in Phase 5 step 1. Azure SWA + Postgres are still alive because Phase 6 hasn't run yet.

The 7-day hold between Phase 5 and Phase 6 is the explicit rollback window. After Phase 6 step 4, rollback would require restoring from snapshot — at that point AWS is the source of truth.

## 9. Open risks

1. **RDS public-access window during Phase 3** — opened in Phase 1 step 2, closed at Phase 3 step 5. IP-restricted to the laptop's public IP via the RDS security group; master password is high-entropy and stored in SSM. Acceptable. Mitigation: schedule Phases 2-3 in one sitting so the window closes the same day Phase 1 opens it.
2. **Amplify build pulling puppeteer** — `npm run build` skips puppeteer (only `npm run build:seo` invokes prerender). Amplify build uses `build`, so puppeteer never runs in Amplify's environment. The prerender script becomes orphaned; OK per [[bandwidth-and-park]] (don't chase prerender perfection).
3. **DNS migration risk** — moving authoritative DNS to Route 53 means a registrar nameserver change. Pre-populating Route 53 with correct records before the flip (Phase 1 step 7) keeps the risk to a 10-min cutover window.
4. **Region choice `ap-south-1`** — if the user's other AWS project is in a different region, Route 53 latency-routing or cross-region resources may be desirable later. Decision deferred; Phase 1 picks `ap-south-1` based on audience latency.
5. **RDS Proxy in front of Multi-AZ RDS** — adds one more failure surface vs direct Lambda → RDS. Mitigated by: Proxy is AWS-managed (no ops), it's transparent to Lambda code (just a different hostname), and it strictly improves failover behavior (during an AZ swing, Proxy reroutes; direct connections would error). Net risk-reducing despite the extra component.

## 10. Success criteria

- Phase 5 smoke test passes end-to-end from `https://www.campuspandit.ai` after the DNS flip.
- All 4 Plausible custom goals fire on the AWS-hosted site.
- A test pilot application submitted via the form lands as a row in RDS within 2s.
- Steady-state monthly bill is ≤ $100 (well within the $25k AWS Activate runway — exceeding this would indicate a misconfiguration, not a real load problem).
- The 6 analytics SQL queries from `docs/superpowers/queries/engagement-signals.sql` run unchanged against RDS.
- Azure resources from §4 "destroyed at the end" are gone, confirmed by `az resource list --output table` returning empty for the relevant resource group.
- The savepoint stage-gate timeline (week-4 evaluation on 2026-06-19) is preserved — AWS migration does not reset the observe-window clock.

## 11. What this spec does NOT cover

- The Cognito magic-link flow (D3 deferred — separate follow-up spec if Stage 2 fires)
- Migration of the legacy consumer-app data beyond what the 4 admin tables need (most legacy tables are unused once the consumer app is parked; they migrate via `pg_restore` for completeness but no app reads them)
- Declarative IaC like Terraform/CDK (D1 chose imperative boto3 instead — sufficient for the side-bet scope; upgrade if/when multi-env management justifies it)
- Multi-region or cross-region DR (Multi-AZ RDS + AWS Backup is enough; cross-region is overkill for a side bet even with credit headroom)
- WAF / Shield / GuardDuty (revisit only if a B2B lead asks for it, per [[b2b-pivot]])
- Reviving the legacy SSE / real-time messaging backend on AWS (per D12 + §2 non-goals). If Stage 2 fires and the consumer app un-parks, a follow-up spec must pick: (a) compute host that supports long-lived streams — API Gateway HTTP + Lambda will not work; candidates are App Runner, ECS Fargate behind ALB, or Lambda Function URL response streaming (15-min cap, EventSource auto-reconnects); (b) notify path — `LISTEN/NOTIFY` requires a session-pinned Postgres connection that **bypasses RDS Proxy** (the proxy unpins on `LISTEN`), so either the listener connects directly to the RDS writer endpoint, or LISTEN/NOTIFY is replaced with SNS/EventBridge fan-out from the write Lambdas; (c) EventSource auth — the browser API cannot set custom headers, so use a signed cookie issued by Cognito rather than a query-param JWT. Client-side `src/hooks/useSSE.ts` and the `VITE_CONSUMER_APP_PARKED` short-circuit are preserved on `main` and ready to re-enable once a backend exists.

## 12. References

- 2026-05-22 spec: [`docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md`](./2026-05-22-park-consumer-app-supabase-migration-design.md)
- Stage gates: `docs/superpowers/queries/stage-gates.md`
- Domain glossary: `CONTEXT.md`
- Domain setup memory: [[domain-setup]]
- Bandwidth + park decision: [[bandwidth-and-park]]
- B2B pivot positioning: [[b2b-pivot]]
- Landing/SEO follow-ups: [[landing-seo-followups]]
- Savepoint to resume from: [[project-savepoint-2026-05-22]] (this spec supersedes the savepoint's resume order for hosting + data layer)
