# AWS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the CampusPandit park-mode plan (defined in `docs/superpowers/specs/2026-05-25-aws-migration-design.md`) from Azure SWA + Supabase to AWS-native services (Amplify Hosting + RDS Postgres Multi-AZ + API Gateway + Lambda + Cognito).

**Architecture:** Frontend on Amplify Hosting (CloudFront-backed). Five Python Lambdas behind an API Gateway HTTP API write/read to RDS Postgres Multi-AZ through RDS Proxy (IAM auth). Cognito user pool stubbed (magic-link auth only built if Stage 2 fires). Click-ops infra provisioning in Phase 1 captured in `infrastructure/AWS_SETUP.md`. Zero-downtime DNS cutover with a 7-day Azure rollback window.

**Tech Stack:** React 18 + Vite + TypeScript (frontend), Python 3.12 + psycopg + Pydantic (Lambdas), Postgres 16 on RDS, AWS Amplify, AWS API Gateway HTTP API, AWS Lambda, AWS RDS Proxy, AWS Secrets Manager, AWS SSM Parameter Store, AWS Backup, Route 53, ACM, GitHub Actions (for Amplify auto-deploy connection).

---

## Discovered call sites (informs Phase 4)

Confirmed Supabase usage in the **observe-mode code path** (the one being migrated):

| File | Line | Operation | Target table |
|------|------|-----------|--------------|
| `src/components/Ideas.tsx` | 31 | SELECT (published feature requests) | `feature_requests` |
| `src/components/Ideas.tsx` | 45 | INSERT | `feature_requests` |
| `src/components/PilotApplication.tsx` | 45 | INSERT | `pilot_applications` |
| `src/utils/supabaseObserve.ts` | — | client factory | n/a |

**Deviation from spec §2:** spec said 4 write Lambdas. Ideas.tsx also reads — so we add a 5th Lambda: `GET /feature-requests`. Total Lambdas: 5 (4 POST + 1 GET).

**Deviation from spec Phase 4 row "Remove dependency `@supabase/supabase-js`":** 18 legacy consumer-app files in `src/` still import the legacy `src/utils/supabase.ts` client. Removing the package would break TypeScript compilation across all parked routes. Keep `@supabase/supabase-js` installed — it tree-shakes out of the production bundle anyway, and full legacy cleanup is out of scope. Only `src/utils/supabaseObserve.ts` is deleted.

---

## File structure

### Created

| Path | Responsibility |
|------|----------------|
| `infrastructure/AWS_SETUP.md` | Step-by-step console runbook for Phase 1; pairs with this plan |
| `infrastructure/lambda/shared/db.py` | RDS Proxy IAM-auth psycopg connection helper |
| `infrastructure/lambda/shared/models.py` | Pydantic request/response models for all 5 endpoints |
| `infrastructure/lambda/pilot_application_write.py` | POST /pilot-applications handler |
| `infrastructure/lambda/feature_request_write.py` | POST /feature-requests handler |
| `infrastructure/lambda/feature_request_read.py` | GET /feature-requests handler (published, limit 10) |
| `infrastructure/lambda/engagement_signal_write.py` | POST /engagement-signals handler (table-only consumer; React caller is future) |
| `infrastructure/lambda/vote_write.py` | POST /votes handler (table-only consumer; React caller is future) |
| `infrastructure/lambda/requirements.txt` | Lambda layer deps: `psycopg[binary]`, `pydantic`, `boto3` |
| `infrastructure/lambda/Makefile` | `make layer`, `make package`, `make deploy` (zip + upload via aws-cli) |
| `infrastructure/lambda/tests/test_handlers.py` | pytest integration tests against a local Postgres (docker testcontainers) |
| `infrastructure/lambda/conftest.py` | pytest fixtures: spin up local Postgres, run admin DDL, yield connection |
| `infrastructure/sql/01_admin_tables.sql` | DDL for `feature_requests`, `engagement_signals`, `pilot_applications`, `feature_request_votes` |
| `infrastructure/sql/02_lambda_app_role.sql` | `lambda_app` role + `rds_iam` membership + INSERT/SELECT grants |
| `infrastructure/migration/dump_azure.sh` | One-shot pg_dump from Azure Postgres → file |
| `infrastructure/migration/restore_to_rds.sh` | One-shot pg_restore from file → RDS |
| `infrastructure/migration/verify_row_counts.sh` | Side-by-side row count comparison Azure vs RDS |
| `src/lib/api.ts` | Minimal `fetch` wrapper around `VITE_API_BASE_URL` |
| `amplify.yml` | Amplify Hosting build spec + customHeaders (CSP, X-Frame-Options, Referrer-Policy) |

### Modified

| Path | Change |
|------|--------|
| `src/components/Ideas.tsx` | Replace 2 `supabaseObserve.from(...)` calls with `api.get` / `api.post` |
| `src/components/PilotApplication.tsx` | Replace 1 `supabaseObserve.from(...)` call with `api.post` |
| `.env.example` | Add `VITE_API_BASE_URL`; keep `VITE_SUPABASE_OBSERVE_*` lines commented as "legacy" |
| `docs/superpowers/specs/2026-05-25-aws-migration-design.md` | One-line "Implementation plan: docs/superpowers/plans/2026-05-25-aws-migration.md" pointer |
| `README.md` | Update hosting section: "Hosted on AWS Amplify (was Azure SWA)" |
| `CONTEXT.md` | Update glossary entry for hosting + DB |

### Deleted

| Path | Why |
|------|-----|
| `src/utils/supabaseObserve.ts` | Replaced by `src/lib/api.ts` |
| `staticwebapp.config.json` | Azure SWA config; Amplify uses `amplify.yml` |
| `.github/workflows/azure-static-web-apps-ambitious-river-04fdcd510.yml` | Amplify auto-deploys from GitHub |
| `.github/workflows/azure-container-apps-backend.yml` | Backend is archived |
| `backend/` (on `aws-platform` branch only) | Preserved in `legacy/backend-archive` branch |

---

## Phase 0 — Prereqs (~2 hrs)

### Task 0.1: Confirm AWS account and create CI IAM user

**Files:**
- Create: `infrastructure/AWS_SETUP.md` (start the file; subsequent tasks append)

- [ ] **Step 1: Verify AWS CLI installed and credentials work for root account**

Run: `aws sts get-caller-identity`
Expected: JSON with `Account` and `Arn` showing the root identity. If unset, the user has not set up the AWS CLI — pause and have them run `aws configure` with root keys.

- [ ] **Step 2: Create IAM user `campuspandit-ci` in AWS Console**

In Console → IAM → Users → Create user:
- Username: `campuspandit-ci`
- Access type: programmatic only (no console password)
- Permissions: attach a custom policy `CampuspanditCIPolicy` with the JSON below (paste into the policy editor)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AmplifyAndS3Deploy",
      "Effect": "Allow",
      "Action": [
        "amplify:*",
        "s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LambdaUpdate",
      "Effect": "Allow",
      "Action": ["lambda:UpdateFunctionCode", "lambda:GetFunction", "lambda:PublishLayerVersion"],
      "Resource": "*"
    },
    {
      "Sid": "ReadSSMSecrets",
      "Effect": "Allow",
      "Action": ["ssm:GetParameter", "ssm:GetParameters"],
      "Resource": "*"
    }
  ]
}
```

Save the access key + secret. Verify with: `aws sts get-caller-identity --profile campuspandit-ci` (after configuring the profile via `aws configure --profile campuspandit-ci`).

- [ ] **Step 3: Save CI credentials to GitHub repo secrets**

Go to GitHub → repo `spayyavula/campuspandit` → Settings → Secrets and variables → Actions → New repository secret:
- `AWS_ACCESS_KEY_ID` = (the access key from step 2)
- `AWS_SECRET_ACCESS_KEY` = (the secret from step 2)
- `AWS_REGION` = `ap-south-1`

These are not needed until Amplify is connected in Phase 1, but setting them now keeps the credential flow in one phase.

- [ ] **Step 4: Initialize `infrastructure/AWS_SETUP.md`**

Create the file with this skeleton:

```markdown
# AWS Setup Runbook

Step-by-step click-ops record for provisioning CampusPandit's AWS infrastructure per `docs/superpowers/specs/2026-05-25-aws-migration-design.md`.

**Account:** <account-id>
**Region:** ap-south-1 (Mumbai)
**Cost target:** ≤ $100/mo steady-state (within $25k Activate credit envelope)
**Date provisioned:** YYYY-MM-DD

## Phase 0 — Prereqs

- [x] IAM user `campuspandit-ci` created with policy `CampuspanditCIPolicy`
- [x] Access key + secret saved to GitHub Actions secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)
- [ ] Billing alarm at $200/mo (Task 0.2)
- [ ] Workstation verification (Task 0.3)

## Phase 1 — Infra provisioning
<-- Tasks 1.x append here -->
```

- [ ] **Step 5: Commit**

```bash
git checkout -b aws-platform main
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): initialize AWS setup runbook"
```

---

### Task 0.2: Create CloudWatch billing alarm at $200/mo

**Files:** none in repo (console-only); document in `infrastructure/AWS_SETUP.md`

- [ ] **Step 1: Switch region to `us-east-1`**

CloudWatch billing metrics only exist in `us-east-1`. Top-right region selector → `US East (N. Virginia)`.

- [ ] **Step 2: Enable billing alerts (one-time per account)**

Go to Billing Dashboard → Billing Preferences → check **Receive Billing Alerts** → Save. Wait ~6 hours for the `EstimatedCharges` metric to start populating before testing the alarm in step 4.

- [ ] **Step 3: Create the alarm**

CloudWatch → Alarms → Create alarm:
- Metric: Billing → Total Estimated Charge → Currency `USD`
- Statistic: Maximum, Period: 6 hours
- Threshold: Static, Greater than `200`
- Notification: create new SNS topic `campuspandit-billing-alerts`, subscribe the user's email
- Alarm name: `campuspandit-monthly-bill-over-200`

- [ ] **Step 4: Confirm SNS subscription**

Check email inbox for the AWS SNS confirmation message and click the confirmation link. Verify in SNS console that the subscription state is `Confirmed`.

- [ ] **Step 5: Update runbook + commit**

Append to `infrastructure/AWS_SETUP.md` under Phase 0:

```markdown
- [x] Billing alarm `campuspandit-monthly-bill-over-200` in us-east-1 wired to SNS topic `campuspandit-billing-alerts`, subscription confirmed
```

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): wire \$200/mo CloudWatch billing alarm"
```

---

### Task 0.3: Verify workstation can run all provisioning tools

- [ ] **Step 1: Check required CLI tools**

Run each, expect non-error output:
```bash
aws --version          # expect aws-cli/2.x
psql --version         # expect psql 14+
pg_dump --version
pg_restore --version
docker --version       # for Lambda local testing in Phase 4
node --version         # expect 20.x
```

Install anything missing before continuing. On Windows: `winget install` for each.

- [ ] **Step 2: Verify CI profile works**

Run: `aws sts get-caller-identity --profile campuspandit-ci`
Expected: JSON showing `Arn` ending in `:user/campuspandit-ci`.

- [ ] **Step 3: Record workstation public IP for Phase 1 RDS security group**

Run: `curl -s https://checkip.amazonaws.com`
Save the IP — needed in Task 1.2.

---

## Phase 1 — Infra provisioning (~half-day, click-ops)

All tasks document in `infrastructure/AWS_SETUP.md` immediately after each AWS action. The runbook is the deliverable, not just the cloud resources.

### Task 1.1: Region + default VPC

- [ ] **Step 1: Switch console region to `ap-south-1`**

Top-right → `Asia Pacific (Mumbai) ap-south-1`. All subsequent tasks operate in this region.

- [ ] **Step 2: Confirm default VPC exists**

VPC console → Your VPCs. Expect one VPC tagged "default" with three public subnets (one per AZ: `ap-south-1a`, `ap-south-1b`, `ap-south-1c`).

- [ ] **Step 3: Capture VPC + subnet IDs in runbook**

Append to `infrastructure/AWS_SETUP.md`:
```markdown
## Phase 1 — Infra provisioning

### 1.1 VPC

- Region: `ap-south-1`
- Default VPC ID: `vpc-XXXXXXXX`
- Subnets:
  - `subnet-XXXXa` (ap-south-1a)
  - `subnet-XXXXb` (ap-south-1b)
  - `subnet-XXXXc` (ap-south-1c)
```

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): record default VPC + subnets"
```

---

### Task 1.2: Provision RDS Postgres Multi-AZ

- [ ] **Step 1: Create Secrets Manager secret for DB master credentials**

Secrets Manager → Store a new secret:
- Type: Credentials for Amazon RDS database
- Username: `campuspandit_admin`
- Password: Generate (32 chars, exclude `"@/\\`)
- Database: leave blank (RDS link in next step)
- Secret name: `campuspandit/prod/db_master`
- Rotation: Disabled for now (enable in step 5 after RDS is linked)

- [ ] **Step 2: Provision the RDS instance**

RDS → Create database:
- Engine: PostgreSQL, Version 16.x latest minor
- Templates: Production
- Availability: **Multi-AZ DB instance**
- DB instance identifier: `campuspandit-prod`
- Credentials management: **Managed in AWS Secrets Manager** → select existing secret `campuspandit/prod/db_master`
- Instance class: `db.t4g.small`
- Storage: gp3, 20 GB, autoscale max 100 GB, encryption enabled (default KMS key)
- Connectivity: Default VPC, **Public access: Yes** (TEMPORARY — closed in Phase 3.5)
- VPC security group: **Create new**, name `rds-sg`, no preset inbound rule (rules added in step 4)
- Database authentication: **Password and IAM database authentication**
- Database port: 5432
- Initial database name: `campuspandit`
- Backup retention: 7 days
- Deletion protection: **Enabled**

Create. Wait ~10 minutes for status `Available`.

- [ ] **Step 3: Capture RDS endpoint**

RDS → Databases → `campuspandit-prod` → Connectivity & security. Copy the endpoint hostname.

- [ ] **Step 4: Edit `rds-sg` to allow the workstation IP on 5432**

EC2 → Security Groups → `rds-sg` → Inbound rules → Add rule:
- Type: PostgreSQL
- Source: My IP (or paste the IP from Task 0.3 step 3)
- Description: `temp-laptop-for-phase3-migration`

(Lambda + RDS Proxy rules come in Tasks 1.3 and 1.5.)

- [ ] **Step 5: Enable Secrets Manager rotation**

Secrets Manager → `campuspandit/prod/db_master` → Rotation → Edit → Enable rotation, schedule: every 30 days, rotation function: use the AWS-provided template `SecretsManagerRDSPostgreSQLRotationSingleUser` (creates Lambda automatically).

- [ ] **Step 6: Smoke-test psql connection**

```bash
PGPASSWORD="$(aws secretsmanager get-secret-value --secret-id campuspandit/prod/db_master --profile campuspandit-ci --query SecretString --output text | jq -r .password)" \
  psql -h campuspandit-prod.<unique>.ap-south-1.rds.amazonaws.com -U campuspandit_admin -d campuspandit -c "SELECT version();"
```

Expected: a row showing `PostgreSQL 16.x ...`.

- [ ] **Step 7: Update runbook + commit**

Append RDS endpoint, security group ID, and confirmation to `infrastructure/AWS_SETUP.md`.

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): provision RDS Postgres Multi-AZ + Secrets Manager"
```

---

### Task 1.3: Provision RDS Proxy with IAM auth

- [ ] **Step 1: Create proxy IAM role**

IAM → Roles → Create role:
- Trusted entity: AWS service → RDS
- Permissions: attach inline policy with the JSON below (replace `<secret-arn>`)
- Role name: `campuspandit-rds-proxy-role`

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
    "Resource": "<secret-arn-from-task-1.2>"
  }]
}
```

- [ ] **Step 2: Create security group `proxy-sg`**

EC2 → Security Groups → Create:
- Name: `proxy-sg`
- VPC: default
- Inbound: PostgreSQL 5432 from `lambda-sg` (will be created in Task 1.5 — for now, leave the inbound rule list empty and revisit in Task 1.5 step 2)
- Outbound: default (all)

- [ ] **Step 3: Create RDS Proxy**

RDS → Proxies → Create proxy:
- Proxy identifier: `campuspandit-proxy`
- Engine compatibility: PostgreSQL
- Target group: link to `campuspandit-prod` (Multi-AZ instance)
- Secrets Manager secret: `campuspandit/prod/db_master`
- IAM role: `campuspandit-rds-proxy-role`
- Require Transport Layer Security: **Yes**
- Subnets: select all 3 subnets in the default VPC
- VPC security group: `proxy-sg`
- Authentication → IAM: **Required**

Create. Wait ~5 minutes for status `Available`.

- [ ] **Step 4: Update `rds-sg` to allow `proxy-sg` ingress**

EC2 → Security Groups → `rds-sg` → Inbound rules → Add rule:
- Type: PostgreSQL
- Source: Custom → `proxy-sg`
- Description: `from-rds-proxy`

- [ ] **Step 5: Capture proxy endpoint + commit**

Append the proxy endpoint hostname to `infrastructure/AWS_SETUP.md`.

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): provision RDS Proxy with IAM auth"
```

---

### Task 1.4: Provision API Gateway HTTP API

- [ ] **Step 1: Create the API**

API Gateway → Create API → HTTP API → Build:
- API name: `campuspandit-observe`
- Integrations: skip (added per-route in Task 1.5)
- Routes: skip (added per-route in Task 1.5)
- Stage name: `$default`, auto-deploy: enabled

- [ ] **Step 2: Configure CORS**

After creation, API → CORS → Configure:
- Access-Control-Allow-Origin: `https://www.campuspandit.ai`, `https://main.<amplify-app-id>.amplifyapp.com` (the second value updates in Task 1.6 step 4)
- Access-Control-Allow-Methods: `GET`, `POST`, `OPTIONS`
- Access-Control-Allow-Headers: `Content-Type`
- Max age: `3600`

- [ ] **Step 3: Capture API ID + invoke URL + commit**

Append the invoke URL (e.g., `https://<api-id>.execute-api.ap-south-1.amazonaws.com`) to `infrastructure/AWS_SETUP.md`.

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): create API Gateway HTTP API + CORS"
```

---

### Task 1.5: Provision Lambda functions (skeletons + IAM)

The Lambda code itself ships in Phase 4; this task creates 5 empty handlers so the wiring is testable end-to-end before real logic lands.

- [ ] **Step 1: Create Lambda execution role**

IAM → Roles → Create role:
- Trusted entity: AWS service → Lambda
- Permissions: `AWSLambdaVPCAccessExecutionRole` (managed) + inline policy below
- Role name: `campuspandit-lambda-exec-role`

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["rds-db:connect"],
    "Resource": "arn:aws:rds-db:ap-south-1:<account-id>:dbuser:<rds-proxy-resource-id>/lambda_app"
  }]
}
```

Find `<rds-proxy-resource-id>` in RDS → Proxies → `campuspandit-proxy` → Resource ID at the bottom of the details page.

- [ ] **Step 2: Create security group `lambda-sg` and update `proxy-sg`**

EC2 → Security Groups → Create:
- Name: `lambda-sg`
- VPC: default
- Inbound: empty
- Outbound: PostgreSQL 5432 to `proxy-sg`

Then go to `proxy-sg` → Inbound rules → Add: PostgreSQL 5432 from `lambda-sg`, description `from-lambda`.

- [ ] **Step 3: Create 5 placeholder Lambda functions**

For each name in this list — `pilot-application-write`, `feature-request-write`, `feature-request-read`, `engagement-signal-write`, `vote-write` — run:

```bash
aws lambda create-function \
  --function-name <name> \
  --runtime python3.12 \
  --architectures x86_64 \
  --role arn:aws:iam::<account-id>:role/campuspandit-lambda-exec-role \
  --handler index.lambda_handler \
  --zip-file fileb://<(echo 'def lambda_handler(event, context): return {"statusCode": 501, "body": "not implemented"}' | zip - -) \
  --timeout 10 --memory-size 128 \
  --vpc-config SubnetIds=subnet-XXXXa,subnet-XXXXb,subnet-XXXXc,SecurityGroupIds=sg-LAMBDA-SG \
  --profile campuspandit-ci --region ap-south-1
```

Replace `<account-id>`, the subnet IDs from Task 1.1, and the lambda-sg ID. Real code lands in Phase 4.

- [ ] **Step 4: Wire API Gateway routes to Lambdas**

API Gateway → `campuspandit-observe` → Routes → Create. For each row, create a route + Lambda integration:

| Method | Path | Integration target |
|--------|------|--------------------|
| POST | `/pilot-applications` | `pilot-application-write` |
| POST | `/feature-requests` | `feature-request-write` |
| GET | `/feature-requests` | `feature-request-read` |
| POST | `/engagement-signals` | `engagement-signal-write` |
| POST | `/votes` | `vote-write` |

After each, API Gateway prompts to add the resource-based policy on the Lambda — accept.

- [ ] **Step 5: Smoke-test one route returns 501**

```bash
curl -i -X POST "https://<api-id>.execute-api.ap-south-1.amazonaws.com/pilot-applications" \
  -H "Content-Type: application/json" -d '{}'
```

Expected: HTTP/2 501, body `not implemented`. (501 confirms the route → Lambda wiring works; the body confirms the placeholder code ran.)

- [ ] **Step 6: Update runbook + commit**

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): create 5 Lambda skeletons + API Gateway routes"
```

---

### Task 1.6: Connect Amplify Hosting

- [ ] **Step 1: Install AWS Amplify GitHub App on `spayyavula/campuspandit`**

Amplify → New app → Host web app → GitHub → Authorize. Grant access only to `spayyavula/campuspandit`.

- [ ] **Step 2: Configure Amplify app**

- App name: `campuspandit`
- Branch: `aws-platform` initially (will switch to `main` after Phase 5 merge)
- Framework auto-detected: Vite (or React)
- Build settings: leave at default; will be replaced by checked-in `amplify.yml` in Phase 4 Task 4.4
- Environment variables:
  - `VITE_API_BASE_URL` = invoke URL from Task 1.4 step 3
- Service role: create new

- [ ] **Step 3: Note the Amplify CloudFront distribution + default domain**

After creation, Amplify console → app → General → Production branch. Note the default URL `https://aws-platform.<app-id>.amplifyapp.com` — this will reroute after Phase 5's branch swap.

- [ ] **Step 4: Update API Gateway CORS to allow the Amplify URL**

Go back to API Gateway → `campuspandit-observe` → CORS → add `https://aws-platform.<app-id>.amplifyapp.com` to allowed origins.

- [ ] **Step 5: Verify Amplify build runs**

The first build kicks off automatically when the app is connected. Wait for it. If the branch `aws-platform` doesn't exist yet (it's created in Task 0.1 step 5 so it should), the build will fail with "no such branch" — push it now: `git push -u origin aws-platform`.

Expected first-build state: build runs, fails or succeeds depending on whether the data-layer rewrite from Phase 4 has landed. Either is fine at this point; Amplify is connected.

- [ ] **Step 6: Update runbook + commit**

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): connect Amplify Hosting to aws-platform branch"
```

---

### Task 1.7: Create empty Cognito user pool (stub for Stage 2)

- [ ] **Step 1: Create the user pool**

Cognito → User pools → Create user pool:
- Authentication providers: Cognito user pool
- Cognito-only login (no SAML, no federation)
- Sign-in: Email
- Password policy: Cognito defaults
- MFA: None
- Self-service sign-up: Allow
- Required attributes: email only
- User pool name: `campuspandit-users`
- App client: create one, name `campuspandit-web`, no client secret (SPA), enabled auth flow: `ALLOW_USER_SRP_AUTH`

- [ ] **Step 2: Save pool ID + client ID to SSM**

```bash
aws ssm put-parameter --name /campuspandit/prod/cognito_pool_id --value "ap-south-1_XXXXX" --type String --profile campuspandit-ci
aws ssm put-parameter --name /campuspandit/prod/cognito_client_id --value "XXXXX" --type String --profile campuspandit-ci
```

Not consumed by app code in Phase 1; consumed when Stage 2 fires.

- [ ] **Step 3: Update runbook + commit**

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): create empty Cognito user pool (Stage 2 stub)"
```

---

### Task 1.8: Create Route 53 hosted zone (no NS flip yet)

- [ ] **Step 1: Create the hosted zone**

Route 53 → Hosted zones → Create:
- Domain: `campuspandit.ai`
- Type: Public
- (Leave records empty for now)

- [ ] **Step 2: Capture the 4 Route 53 nameservers**

After creation, the zone shows 4 NS records like `ns-XXX.awsdns-XX.com`. Save these in the runbook — they're the registrar update target in Phase 5.

- [ ] **Step 3: Update runbook + commit**

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): create Route 53 hosted zone (NS flip deferred to Phase 5)"
```

---

### Task 1.9: Configure AWS Backup

- [ ] **Step 1: Create backup vault**

AWS Backup → Backup vaults → Create:
- Name: `campuspandit-prod`
- KMS key: default

- [ ] **Step 2: Create backup plan**

AWS Backup → Backup plans → Create:
- Plan name: `daily-35-monthly-glacier-365`
- Rule 1 (daily):
  - Name: `daily-35`, frequency: daily 02:00 UTC, lifecycle: delete after 35 days
  - Destination vault: `campuspandit-prod`
- Rule 2 (monthly to Glacier):
  - Name: `monthly-glacier-365`, frequency: monthly 1st of month 03:00 UTC, lifecycle: cold storage after 1 day, delete after 365 days
  - Destination vault: `campuspandit-prod`

- [ ] **Step 3: Assign resources**

In the plan → Resource assignments → Create:
- Name: `campuspandit-prod-rds`
- IAM role: AWS-managed `AWSBackupDefaultServiceRole`
- Resource selection: include specific resource → RDS DB → `campuspandit-prod`

- [ ] **Step 4: Update runbook + commit**

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): wire AWS Backup plan for RDS"
```

---

### Task 1.10: Request ACM certificate

- [ ] **Step 1: Request the certificate**

ACM (in **ap-south-1**) → Request a public certificate:
- Domain names: `www.campuspandit.ai`, `campuspandit.ai`
- Validation: DNS
- Key algorithm: RSA 2048

- [ ] **Step 2: Add the DNS validation records**

ACM cert detail page → for each domain, click "Create records in Route 53" (uses the hosted zone from Task 1.8). Records create automatically.

- [ ] **Step 3: Wait for `Issued` status**

Refresh the cert page until status shows `Issued`. Usually <5 minutes.

- [ ] **Step 4: Attach cert to Amplify custom domain**

Amplify → app → Hosting → Custom domains → Add domain `campuspandit.ai`:
- Select the Route 53 hosted zone
- Configure subdomains: `www` → `aws-platform` branch, root `campuspandit.ai` → 301 redirect to `https://www.campuspandit.ai`
- Amplify auto-validates via the existing ACM cert in the same region

Don't update the registrar nameservers yet — that's Phase 5. Amplify will show "Pending verification" until DNS resolves through Route 53, which only happens after the registrar flip.

- [ ] **Step 5: Update runbook + commit**

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): request ACM cert + bind Amplify custom domain"
```

End of Phase 1. The full AWS_SETUP.md should now be a coherent runbook another engineer could read to reproduce the environment.

---

## Phase 2 — Schema bring-up (~30 min)

### Task 2.1: Write the admin-table DDL

**Files:**
- Create: `infrastructure/sql/01_admin_tables.sql`

- [ ] **Step 1: Write the DDL file**

```sql
-- infrastructure/sql/01_admin_tables.sql
-- Source-of-truth schema for the 4 observe-window admin tables.
-- Matches the table contracts in docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md §5.

CREATE TABLE IF NOT EXISTS pilot_applications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  center_name     text NOT NULL,
  owner_name      text NOT NULL,
  location        text NOT NULL,
  students_count  integer NOT NULL CHECK (students_count BETWEEN 1 AND 100000),
  subjects_taught text[] NOT NULL,
  current_software       text,
  website_or_instagram   text,
  contact_email   text NOT NULL,
  contact_phone   text,
  message         text
);

CREATE TABLE IF NOT EXISTS feature_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  title           text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description     text CHECK (description IS NULL OR char_length(description) <= 2000),
  audience        text NOT NULL CHECK (audience IN ('coaching_center', 'prospective_cc_via_student', 'both')),
  submitter_email text,
  upvotes         integer NOT NULL DEFAULT 0,
  is_published    boolean NOT NULL DEFAULT false
);
CREATE INDEX idx_feature_requests_published_created
  ON feature_requests (is_published, created_at DESC) WHERE is_published;

CREATE TABLE IF NOT EXISTS engagement_signals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  signal_type text NOT NULL,
  url         text NOT NULL,
  session_hash text,
  payload     jsonb
);

CREATE TABLE IF NOT EXISTS feature_request_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  feature_request_id uuid NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  voter_email text NOT NULL,
  UNIQUE (feature_request_id, voter_email)
);
```

- [ ] **Step 2: Apply against RDS**

```bash
PGPASSWORD="$(aws secretsmanager get-secret-value --secret-id campuspandit/prod/db_master --profile campuspandit-ci --query SecretString --output text | jq -r .password)" \
  psql -h <rds-endpoint> -U campuspandit_admin -d campuspandit -f infrastructure/sql/01_admin_tables.sql
```

Expected: `CREATE TABLE` × 4, `CREATE INDEX` × 1, no errors.

- [ ] **Step 3: Verify**

```bash
PGPASSWORD=... psql -h <rds-endpoint> -U campuspandit_admin -d campuspandit -c "\dt"
```

Expected: 4 tables listed.

- [ ] **Step 4: Commit**

```bash
git add infrastructure/sql/01_admin_tables.sql
git commit -m "feat(db): admin-table DDL for observe-window endpoints"
```

---

### Task 2.2: Create `lambda_app` role with IAM auth

**Files:**
- Create: `infrastructure/sql/02_lambda_app_role.sql`

- [ ] **Step 1: Write the role DDL**

```sql
-- infrastructure/sql/02_lambda_app_role.sql
-- Database role for Lambda functions. Uses IAM authentication (no password).

CREATE USER lambda_app;
GRANT rds_iam TO lambda_app;

-- INSERT-only on the write-path tables
GRANT INSERT ON pilot_applications TO lambda_app;
GRANT INSERT ON feature_requests TO lambda_app;
GRANT INSERT ON engagement_signals TO lambda_app;
GRANT INSERT ON feature_request_votes TO lambda_app;

-- SELECT only what the GET /feature-requests endpoint needs
GRANT SELECT ON feature_requests TO lambda_app;
```

- [ ] **Step 2: Apply against RDS**

```bash
PGPASSWORD=... psql -h <rds-endpoint> -U campuspandit_admin -d campuspandit -f infrastructure/sql/02_lambda_app_role.sql
```

Expected: `CREATE ROLE`, `GRANT` × 5 (rds_iam + 4 grants), `GRANT` (the SELECT).

- [ ] **Step 3: Verify role**

```bash
PGPASSWORD=... psql -h <rds-endpoint> -U campuspandit_admin -d campuspandit -c "\du lambda_app"
```

Expected: shows `lambda_app` with member-of `{rds_iam}`.

- [ ] **Step 4: Commit**

```bash
git add infrastructure/sql/02_lambda_app_role.sql
git commit -m "feat(db): lambda_app role with IAM auth + minimal grants"
```

---

## Phase 3 — Legacy-data migration (~1-2 hrs)

### Task 3.1: Write the dump script

**Files:**
- Create: `infrastructure/migration/dump_azure.sh`

- [ ] **Step 1: Write the script**

```bash
#!/usr/bin/env bash
# infrastructure/migration/dump_azure.sh
# Dump Azure Postgres to a local custom-format file.
# Required env: AZURE_PG_URL (full postgres://user:pass@host:port/db)
set -euo pipefail
: "${AZURE_PG_URL:?AZURE_PG_URL must be set}"
out="campuspandit-azure-$(date +%Y%m%d-%H%M%S).dump"
pg_dump --no-owner --no-acl --format=custom --file="${out}" "${AZURE_PG_URL}"
echo "Wrote ${out} ($(du -h "${out}" | cut -f1))"
```

- [ ] **Step 2: Run it**

```bash
export AZURE_PG_URL="postgres://<azure-user>:<azure-pw>@campuspandit-postgres.postgres.database.azure.com:5432/postgres"
chmod +x infrastructure/migration/dump_azure.sh
infrastructure/migration/dump_azure.sh
```

Expected: dump file written, size printed.

- [ ] **Step 3: Commit (after redacting any credentials)**

```bash
git add infrastructure/migration/dump_azure.sh
git commit -m "feat(migration): pg_dump script for Azure source"
```

The `.dump` file itself is gitignored (next task adds it to `.gitignore`).

---

### Task 3.2: Upload dump to S3

- [ ] **Step 1: Create the migration bucket**

```bash
aws s3 mb s3://campuspandit-db-migration --profile campuspandit-ci --region ap-south-1
aws s3api put-bucket-versioning --bucket campuspandit-db-migration --versioning-configuration Status=Enabled --profile campuspandit-ci
aws s3api put-bucket-lifecycle-configuration --bucket campuspandit-db-migration --profile campuspandit-ci --lifecycle-configuration '{
  "Rules": [{
    "ID": "expire-after-30d",
    "Status": "Enabled",
    "Filter": {"Prefix": ""},
    "Expiration": {"Days": 30}
  }]
}'
```

- [ ] **Step 2: Upload the dump**

```bash
aws s3 cp campuspandit-azure-*.dump s3://campuspandit-db-migration/ --profile campuspandit-ci
```

Expected: upload completes; verify with `aws s3 ls s3://campuspandit-db-migration/`.

- [ ] **Step 3: Add to gitignore + commit**

Append to `.gitignore`:
```
# Database dump artifacts
campuspandit-azure-*.dump
```

```bash
git add .gitignore
git commit -m "chore: ignore Azure pg_dump artifacts"
```

---

### Task 3.3: Restore to RDS

**Files:**
- Create: `infrastructure/migration/restore_to_rds.sh`

- [ ] **Step 1: Write the script**

```bash
#!/usr/bin/env bash
# infrastructure/migration/restore_to_rds.sh
# Restore the Azure dump to RDS. Required env: RDS_URL, DUMP_FILE
set -euo pipefail
: "${RDS_URL:?RDS_URL must be set}"
: "${DUMP_FILE:?DUMP_FILE must be set}"
pg_restore --no-owner --no-acl --dbname="${RDS_URL}" --verbose "${DUMP_FILE}"
```

- [ ] **Step 2: Run it**

```bash
export RDS_URL="postgres://campuspandit_admin:$(aws secretsmanager get-secret-value --secret-id campuspandit/prod/db_master --profile campuspandit-ci --query SecretString --output text | jq -r .password)@<rds-endpoint>:5432/campuspandit"
export DUMP_FILE=$(ls -1t campuspandit-azure-*.dump | head -1)
chmod +x infrastructure/migration/restore_to_rds.sh
infrastructure/migration/restore_to_rds.sh
```

Expected: `pg_restore: processing data for table` × N lines, no `ERROR:` lines (warnings about ownership are OK because of `--no-owner`).

- [ ] **Step 3: Commit**

```bash
git add infrastructure/migration/restore_to_rds.sh
git commit -m "feat(migration): pg_restore script for RDS target"
```

---

### Task 3.4: Verify row counts side-by-side

**Files:**
- Create: `infrastructure/migration/verify_row_counts.sh`

- [ ] **Step 1: Write the script**

```bash
#!/usr/bin/env bash
# infrastructure/migration/verify_row_counts.sh
# Compare row counts between Azure and RDS for every public-schema table.
# Required env: AZURE_PG_URL, RDS_URL
set -euo pipefail
: "${AZURE_PG_URL:?AZURE_PG_URL must be set}"
: "${RDS_URL:?RDS_URL must be set}"

tables=$(psql "${AZURE_PG_URL}" -At -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")

printf "%-40s %12s %12s %s\n" "TABLE" "AZURE" "RDS" "MATCH?"
fail=0
for t in $tables; do
  az=$(psql "${AZURE_PG_URL}" -At -c "SELECT count(*) FROM public.\"${t}\"")
  rds=$(psql "${RDS_URL}" -At -c "SELECT count(*) FROM public.\"${t}\"")
  if [ "$az" = "$rds" ]; then
    mark="OK"
  else
    mark="MISMATCH"
    fail=1
  fi
  printf "%-40s %12s %12s %s\n" "$t" "$az" "$rds" "$mark"
done
exit $fail
```

- [ ] **Step 2: Run it**

```bash
chmod +x infrastructure/migration/verify_row_counts.sh
infrastructure/migration/verify_row_counts.sh
```

Expected: every row prints `OK`. If any row shows `MISMATCH`, do not proceed — investigate the dump/restore.

- [ ] **Step 3: Commit**

```bash
git add infrastructure/migration/verify_row_counts.sh
git commit -m "feat(migration): row-count verifier between Azure and RDS"
```

---

### Task 3.5: Flip RDS public-access OFF

- [ ] **Step 1: Update RDS instance**

RDS console → `campuspandit-prod` → Modify → Connectivity → Public access: **No** → Apply immediately. Wait ~3 minutes for status `Available`.

- [ ] **Step 2: Remove the laptop-IP inbound rule**

EC2 → Security Groups → `rds-sg` → Inbound rules → Delete the rule with description `temp-laptop-for-phase3-migration`. The remaining rule (PostgreSQL from `proxy-sg`) stays.

- [ ] **Step 3: Verify the lockdown**

```bash
PGCONNECT_TIMEOUT=5 PGPASSWORD=... psql -h <rds-endpoint> -U campuspandit_admin -d campuspandit -c "SELECT 1;" 2>&1 | head -3
```

Expected: timeout or connection-refused (NOT a successful row). RDS is now only reachable through RDS Proxy from inside the VPC.

- [ ] **Step 4: Update runbook + commit**

Append a "Phase 3 complete" section to `infrastructure/AWS_SETUP.md`.

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): close RDS public-access window post-migration"
```

End of Phase 3. Azure Postgres remains untouched and intact for rollback.

---

## Phase 4 — Code rewrite (~2 days)

All tasks in this phase happen on the `aws-platform` branch already created in Task 0.1 step 5.

### Task 4.1: Create `legacy/backend-archive` branch

- [ ] **Step 1: Branch the current `main` to preserve backend**

```bash
git checkout main
git checkout -b legacy/backend-archive
git push -u origin legacy/backend-archive
git checkout aws-platform
```

This branch is the canonical reference for the FastAPI code. It never receives further commits; consumers find it via `git checkout legacy/backend-archive`.

- [ ] **Step 2: Delete backend/ from aws-platform**

```bash
git rm -r backend/
git rm .github/workflows/azure-container-apps-backend.yml
git commit -m "chore: archive FastAPI backend to legacy/backend-archive branch"
```

---

### Task 4.2: Cherry-pick content-layer commits from `observe-window-park`

The 17 commits on `observe-window-park` decompose into "content layer" (keep) and "data layer wired to Supabase" (rewrite). From the `git log --oneline observe-window-park ^main` output captured during planning:

**Cherry-pick these (content + park-mode mechanics, no Supabase dependency):**
- `787280cb feat(routes): park /auth and all legacy protected routes`
- `80998b92 feat(sse): defensive short-circuit when consumer app is parked`
- `7c311b5b fix(routes): hoist ParkedRoute to module scope`
- `b43cd082 feat(landing): strip Log in + route Apply CTAs to /apply form`
- `2c189f2e feat(landing-students): reframe as meta lead-gen, replace /auth CTAs`
- `454064d1 feat(blog): listing + detail pages with markdown content`
- `aaeee3f3 feat(landing): nav links + soften Branded App / Center Dashboard claims`
- `6879e6a1 feat(landing-students): add Blog/Materials/Roadmap/Ideas to nav`
- `d8472474 build(seo): robots.txt allows new public routes, disallows parked ones`
- `23c0035b docs(seo): UTM convention for social posts`
- `ec8ba16b docs(readme): add pilot-status pointer to spec and CONTEXT.md`
- `95342289 build(seo): extend prerender to all new public routes`

**Cherry-pick with conflicts expected (need rewrite in later tasks):**
- `3a2065cd feat(content): Materials, Roadmap, Ideas pages + supabaseObserve client` — brings Ideas.tsx + supabaseObserve.ts; Ideas.tsx gets rewritten in Task 4.6, supabaseObserve.ts gets deleted in Task 4.7
- `cfdf32ba feat(apply): Founding 10 pilot application form + thanks page` — brings PilotApplication.tsx; rewritten in Task 4.5
- `5e3741b3 feat(analytics): wire Plausible cookieless analytics` — Plausible is unaffected by the AWS migration

- [ ] **Step 1: Cherry-pick in chronological order**

```bash
git cherry-pick 787280cb 80998b92 7c311b5b b43cd082 2c189f2e \
                454064d1 aaeee3f3 6879e6a1 3a2065cd cfdf32ba \
                5e3741b3 d8472474 23c0035b ec8ba16b 95342289
```

If any conflict surfaces (likely on README.md or App.tsx for routing), resolve by keeping the content-layer changes; the supabaseObserve usage gets cleaned up in Tasks 4.5-4.7.

- [ ] **Step 2: Verify build still passes after cherry-pick**

```bash
npm run build
```

Expected: build succeeds. Supabase env vars will be absent, producing a console warning at runtime but not a build error.

- [ ] **Step 3: Push the cherry-picks**

```bash
git push origin aws-platform
```

---

### Task 4.3: Write the API client `src/lib/api.ts`

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: Write the client**

```typescript
// src/lib/api.ts
// Minimal fetch wrapper for the campuspandit-observe API Gateway.
// Throws on non-2xx so call sites use try/catch.

const base = import.meta.env.VITE_API_BASE_URL;
if (!base) {
  console.warn('[api] VITE_API_BASE_URL is not set — API calls will fail.');
}

export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`API ${status}: ${body}`);
  }
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const url = `${base}${path}`;
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new ApiError(res.status, text);
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
};
```

- [ ] **Step 2: Add env var to `.env.example`**

Append to `.env.example`:

```
# campuspandit-observe API Gateway invoke URL
VITE_API_BASE_URL=https://<api-id>.execute-api.ap-south-1.amazonaws.com

# Legacy Supabase observe vars (no longer used; safe to remove from .env)
# VITE_SUPABASE_OBSERVE_URL=
# VITE_SUPABASE_OBSERVE_ANON_KEY=
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts .env.example
git commit -m "feat(api): minimal fetch client for campuspandit-observe API"
```

---

### Task 4.4: Write `amplify.yml` and delete `staticwebapp.config.json`

**Files:**
- Create: `amplify.yml`
- Delete: `staticwebapp.config.json`

- [ ] **Step 1: Write amplify.yml**

```yaml
# amplify.yml — Amplify Hosting build spec
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
customHeaders:
  - pattern: '**/*'
    headers:
      - key: 'Content-Security-Policy'
        value: "default-src 'self' https: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-src 'self' https:; media-src 'self' blob: https: data:;"
      - key: 'X-Content-Type-Options'
        value: 'nosniff'
      - key: 'X-Frame-Options'
        value: 'DENY'
      - key: 'Referrer-Policy'
        value: 'strict-origin-when-cross-origin'
```

- [ ] **Step 2: Delete Azure SWA config and workflow**

```bash
git rm staticwebapp.config.json
git rm .github/workflows/azure-static-web-apps-ambitious-river-04fdcd510.yml
```

- [ ] **Step 3: Configure Amplify redirect for SPA fallback**

Amplify console → app → Hosting → Rewrites and redirects → Add rule:
- Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json|webmanifest)$)([^.]+$)/>`
- Target: `/index.html`
- Type: 200 (Rewrite)

(This replicates `navigationFallback` from the deleted `staticwebapp.config.json`.)

- [ ] **Step 4: Commit**

```bash
git add amplify.yml
git commit -m "feat(hosting): Amplify build spec + custom headers; drop Azure SWA config"
```

---

### Task 4.5: Rewrite `PilotApplication.tsx` to use the API client

**Files:**
- Modify: `src/components/PilotApplication.tsx`

- [ ] **Step 1: Replace the import and the insert call**

Change line 3 from:
```typescript
import { supabaseObserve } from '../utils/supabaseObserve';
```
to:
```typescript
import { api, ApiError } from '../lib/api';
```

Change lines 45-58 from:
```typescript
const { error: insertError } = await supabaseObserve
  .from('pilot_applications')
  .insert({
    center_name: form.center_name.trim(),
    owner_name: form.owner_name.trim(),
    location: form.location.trim(),
    students_count: studentsCount,
    subjects_taught: subjects,
    current_software: form.current_software.trim() || null,
    website_or_instagram: form.website_or_instagram.trim() || null,
    contact_email: form.contact_email.trim(),
    contact_phone: form.contact_phone.trim() || null,
    message: form.message.trim() || null,
  });
```
to:
```typescript
let insertError: { message: string } | null = null;
try {
  await api.post('/pilot-applications', {
    center_name: form.center_name.trim(),
    owner_name: form.owner_name.trim(),
    location: form.location.trim(),
    students_count: studentsCount,
    subjects_taught: subjects,
    current_software: form.current_software.trim() || null,
    website_or_instagram: form.website_or_instagram.trim() || null,
    contact_email: form.contact_email.trim(),
    contact_phone: form.contact_phone.trim() || null,
    message: form.message.trim() || null,
  });
} catch (e) {
  insertError = { message: e instanceof ApiError ? e.body : (e as Error).message };
}
```

Lines 62-64 (`if (insertError) { ... }`) continue to work unchanged.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PilotApplication.tsx
git commit -m "refactor(apply): pilot application form posts to /pilot-applications"
```

---

### Task 4.6: Rewrite `Ideas.tsx` to use the API client (SELECT + INSERT)

**Files:**
- Modify: `src/components/Ideas.tsx`

- [ ] **Step 1: Replace the import**

Change line 3 from:
```typescript
import { supabaseObserve } from '../utils/supabaseObserve';
```
to:
```typescript
import { api, ApiError } from '../lib/api';
```

- [ ] **Step 2: Replace `loadPublished` (lines 30-39)**

```typescript
async function loadPublished() {
  try {
    const data = await api.get<Idea[]>('/feature-requests');
    setPublished(data);
  } catch (e) {
    console.error('Failed to load published ideas:', e);
  }
}
```

- [ ] **Step 3: Replace the insert in `handleSubmit` (lines 45-57)**

Change:
```typescript
const { error: insertError } = await supabaseObserve
  .from('feature_requests')
  .insert({
    title: title.trim(),
    description: description.trim() || null,
    audience,
    submitter_email: email.trim() || null,
  });
setSubmitting(false);
if (insertError) {
  setError(insertError.message);
  return;
}
```
to:
```typescript
try {
  await api.post('/feature-requests', {
    title: title.trim(),
    description: description.trim() || null,
    audience,
    submitter_email: email.trim() || null,
  });
} catch (e) {
  setSubmitting(false);
  setError(e instanceof ApiError ? e.body : (e as Error).message);
  return;
}
setSubmitting(false);
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Ideas.tsx
git commit -m "refactor(ideas): feature-requests load + submit via /feature-requests"
```

---

### Task 4.7: Delete `supabaseObserve.ts`

**Files:**
- Delete: `src/utils/supabaseObserve.ts`

- [ ] **Step 1: Confirm no remaining references**

```bash
grep -r "supabaseObserve" src/
```

Expected: no output. If anything matches, fix it before proceeding.

- [ ] **Step 2: Delete the file**

```bash
git rm src/utils/supabaseObserve.ts
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: delete supabaseObserve client (replaced by src/lib/api.ts)"
```

---

### Task 4.8: Write the Lambda shared layer

**Files:**
- Create: `infrastructure/lambda/shared/db.py`
- Create: `infrastructure/lambda/shared/__init__.py` (empty)
- Create: `infrastructure/lambda/shared/models.py`
- Create: `infrastructure/lambda/requirements.txt`

- [ ] **Step 1: Write `db.py`**

```python
# infrastructure/lambda/shared/db.py
"""IAM-authenticated psycopg connection to RDS Proxy."""
import os
import psycopg
import boto3

_RDS_CLIENT = boto3.client("rds")

def connect():
    host = os.environ["DATABASE_PROXY_HOST"]
    db = os.environ["DATABASE_NAME"]
    region = os.environ.get("AWS_REGION", "ap-south-1")
    token = _RDS_CLIENT.generate_db_auth_token(
        DBHostname=host, Port=5432, DBUsername="lambda_app", Region=region
    )
    return psycopg.connect(
        host=host, port=5432, dbname=db, user="lambda_app",
        password=token, sslmode="require",
    )
```

- [ ] **Step 2: Write `models.py`**

```python
# infrastructure/lambda/shared/models.py
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, conlist

class PilotApplicationIn(BaseModel):
    center_name: str = Field(min_length=1, max_length=200)
    owner_name: str = Field(min_length=1, max_length=200)
    location: str = Field(min_length=1, max_length=200)
    students_count: int = Field(ge=1, le=100_000)
    subjects_taught: conlist(str, min_length=1, max_length=20)
    current_software: str | None = None
    website_or_instagram: str | None = None
    contact_email: EmailStr
    contact_phone: str | None = None
    message: str | None = Field(default=None, max_length=4000)

Audience = Literal["coaching_center", "prospective_cc_via_student", "both"]

class FeatureRequestIn(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    audience: Audience
    submitter_email: EmailStr | None = None

class FeatureRequestOut(BaseModel):
    id: str
    title: str
    description: str | None
    audience: str
    upvotes: int
    created_at: str

class EngagementSignalIn(BaseModel):
    signal_type: str = Field(max_length=64)
    url: str = Field(max_length=2000)
    session_hash: str | None = None
    payload: dict | None = None

class VoteIn(BaseModel):
    feature_request_id: str
    voter_email: EmailStr
```

- [ ] **Step 3: Write `requirements.txt`**

```
psycopg[binary]==3.2.*
pydantic[email]==2.*
boto3
```

- [ ] **Step 4: Commit**

```bash
git add infrastructure/lambda/shared infrastructure/lambda/requirements.txt
git commit -m "feat(lambda): shared db + Pydantic models for 5 endpoints"
```

---

### Task 4.9: Write the 5 Lambda handlers

**Files:**
- Create: `infrastructure/lambda/pilot_application_write.py`
- Create: `infrastructure/lambda/feature_request_write.py`
- Create: `infrastructure/lambda/feature_request_read.py`
- Create: `infrastructure/lambda/engagement_signal_write.py`
- Create: `infrastructure/lambda/vote_write.py`

Each handler is ~25 lines. All share the same response shape: 201 for writes, 200 for reads, 400 for validation, 500 for unhandled.

- [ ] **Step 1: Write `pilot_application_write.py`**

```python
# infrastructure/lambda/pilot_application_write.py
import json
from pydantic import ValidationError
from shared.db import connect
from shared.models import PilotApplicationIn

def lambda_handler(event, _ctx):
    try:
        payload = PilotApplicationIn.model_validate_json(event.get("body") or "{}")
    except ValidationError as e:
        return {"statusCode": 400, "body": e.json()}
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO pilot_applications
               (center_name, owner_name, location, students_count, subjects_taught,
                current_software, website_or_instagram, contact_email, contact_phone, message)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (payload.center_name, payload.owner_name, payload.location,
             payload.students_count, payload.subjects_taught, payload.current_software,
             payload.website_or_instagram, payload.contact_email, payload.contact_phone,
             payload.message),
        )
        row_id = cur.fetchone()[0]
        conn.commit()
    return {"statusCode": 201, "body": json.dumps({"id": str(row_id)})}
```

- [ ] **Step 2: Write `feature_request_write.py`**

```python
# infrastructure/lambda/feature_request_write.py
import json
from pydantic import ValidationError
from shared.db import connect
from shared.models import FeatureRequestIn

def lambda_handler(event, _ctx):
    try:
        payload = FeatureRequestIn.model_validate_json(event.get("body") or "{}")
    except ValidationError as e:
        return {"statusCode": 400, "body": e.json()}
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO feature_requests (title, description, audience, submitter_email)
               VALUES (%s, %s, %s, %s) RETURNING id""",
            (payload.title, payload.description, payload.audience, payload.submitter_email),
        )
        row_id = cur.fetchone()[0]
        conn.commit()
    return {"statusCode": 201, "body": json.dumps({"id": str(row_id)})}
```

- [ ] **Step 3: Write `feature_request_read.py`**

```python
# infrastructure/lambda/feature_request_read.py
import json
from shared.db import connect

def lambda_handler(_event, _ctx):
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """SELECT id, title, description, audience, upvotes, created_at
               FROM feature_requests
               WHERE is_published = true
               ORDER BY created_at DESC
               LIMIT 10"""
        )
        rows = [
            {"id": str(r[0]), "title": r[1], "description": r[2],
             "audience": r[3], "upvotes": r[4], "created_at": r[5].isoformat()}
            for r in cur.fetchall()
        ]
    return {"statusCode": 200, "body": json.dumps(rows)}
```

- [ ] **Step 4: Write `engagement_signal_write.py`**

```python
# infrastructure/lambda/engagement_signal_write.py
import json
from pydantic import ValidationError
from shared.db import connect
from shared.models import EngagementSignalIn

def lambda_handler(event, _ctx):
    try:
        payload = EngagementSignalIn.model_validate_json(event.get("body") or "{}")
    except ValidationError as e:
        return {"statusCode": 400, "body": e.json()}
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO engagement_signals (signal_type, url, session_hash, payload)
               VALUES (%s, %s, %s, %s) RETURNING id""",
            (payload.signal_type, payload.url, payload.session_hash,
             json.dumps(payload.payload) if payload.payload else None),
        )
        row_id = cur.fetchone()[0]
        conn.commit()
    return {"statusCode": 201, "body": json.dumps({"id": str(row_id)})}
```

- [ ] **Step 5: Write `vote_write.py`**

```python
# infrastructure/lambda/vote_write.py
import json
from pydantic import ValidationError
from psycopg.errors import UniqueViolation
from shared.db import connect
from shared.models import VoteIn

def lambda_handler(event, _ctx):
    try:
        payload = VoteIn.model_validate_json(event.get("body") or "{}")
    except ValidationError as e:
        return {"statusCode": 400, "body": e.json()}
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute(
                """INSERT INTO feature_request_votes (feature_request_id, voter_email)
                   VALUES (%s, %s) RETURNING id""",
                (payload.feature_request_id, payload.voter_email),
            )
            row_id = cur.fetchone()[0]
            conn.commit()
    except UniqueViolation:
        return {"statusCode": 409, "body": json.dumps({"error": "already_voted"})}
    return {"statusCode": 201, "body": json.dumps({"id": str(row_id)})}
```

- [ ] **Step 6: Commit**

```bash
git add infrastructure/lambda/*.py
git commit -m "feat(lambda): 5 endpoint handlers (4 POST + 1 GET)"
```

---

### Task 4.10: Write Lambda integration tests with local Postgres

**Files:**
- Create: `infrastructure/lambda/conftest.py`
- Create: `infrastructure/lambda/tests/__init__.py` (empty)
- Create: `infrastructure/lambda/tests/test_handlers.py`
- Create: `infrastructure/lambda/pytest.ini`

- [ ] **Step 1: Write `pytest.ini`**

```ini
# infrastructure/lambda/pytest.ini
[pytest]
testpaths = tests
pythonpath = .
```

- [ ] **Step 2: Write `conftest.py`**

```python
# infrastructure/lambda/conftest.py
"""Spin up a local Postgres via docker for each test session."""
import os
import subprocess
import time
import pytest
import psycopg

CONTAINER = "campuspandit-test-pg"
PORT = "55432"
DB = "campuspandit_test"

@pytest.fixture(scope="session", autouse=True)
def postgres():
    subprocess.run(["docker", "rm", "-f", CONTAINER], capture_output=True)
    subprocess.run([
        "docker", "run", "-d", "--name", CONTAINER,
        "-e", "POSTGRES_PASSWORD=test", "-e", f"POSTGRES_DB={DB}",
        "-p", f"{PORT}:5432", "postgres:16-alpine",
    ], check=True)
    # Wait for readiness
    url = f"postgres://postgres:test@localhost:{PORT}/{DB}"
    for _ in range(30):
        try:
            with psycopg.connect(url): break
        except psycopg.OperationalError:
            time.sleep(1)
    else:
        raise RuntimeError("Postgres failed to start within 30s")
    # Apply DDL
    with psycopg.connect(url) as conn, conn.cursor() as cur:
        with open("../sql/01_admin_tables.sql") as f:
            cur.execute(f.read())
        conn.commit()
    # Stub the IAM-auth db.connect() to use the local container
    os.environ["DATABASE_PROXY_HOST"] = "localhost"
    os.environ["DATABASE_NAME"] = DB
    yield url
    subprocess.run(["docker", "rm", "-f", CONTAINER], capture_output=True)

@pytest.fixture
def patched_connect(monkeypatch, postgres):
    """Override the IAM token path; use postgres user with the test password."""
    from shared import db as db_module
    def fake_connect():
        return psycopg.connect(postgres)
    monkeypatch.setattr(db_module, "connect", fake_connect)
    # Also patch the import in each handler module
    for mod in ["pilot_application_write", "feature_request_write",
                "feature_request_read", "engagement_signal_write", "vote_write"]:
        import importlib
        m = importlib.import_module(mod)
        monkeypatch.setattr(m, "connect", fake_connect)
```

- [ ] **Step 3: Write `tests/test_handlers.py`**

```python
# infrastructure/lambda/tests/test_handlers.py
import json
import pytest
import pilot_application_write
import feature_request_write
import feature_request_read
import engagement_signal_write
import vote_write

def _event(body: dict) -> dict:
    return {"body": json.dumps(body)}

def test_pilot_application_happy_path(patched_connect):
    res = pilot_application_write.lambda_handler(_event({
        "center_name": "Pinnacle JEE", "owner_name": "Asha",
        "location": "Pune", "students_count": 120,
        "subjects_taught": ["Physics", "Math"],
        "contact_email": "asha@example.com",
    }), None)
    assert res["statusCode"] == 201
    assert "id" in json.loads(res["body"])

def test_pilot_application_bad_email(patched_connect):
    res = pilot_application_write.lambda_handler(_event({
        "center_name": "X", "owner_name": "Y", "location": "Z",
        "students_count": 10, "subjects_taught": ["Physics"],
        "contact_email": "not-an-email",
    }), None)
    assert res["statusCode"] == 400

def test_feature_request_write_and_read(patched_connect, postgres):
    # Write
    w = feature_request_write.lambda_handler(_event({
        "title": "Email digest on Mondays",
        "description": "Weekly summary for owners",
        "audience": "coaching_center",
    }), None)
    assert w["statusCode"] == 201

    # Mark it published so the read endpoint surfaces it
    import psycopg
    with psycopg.connect(postgres) as conn, conn.cursor() as cur:
        cur.execute("UPDATE feature_requests SET is_published = true")
        conn.commit()

    r = feature_request_read.lambda_handler({}, None)
    assert r["statusCode"] == 200
    body = json.loads(r["body"])
    assert len(body) == 1
    assert body[0]["title"] == "Email digest on Mondays"

def test_engagement_signal_write(patched_connect):
    res = engagement_signal_write.lambda_handler(_event({
        "signal_type": "scroll_depth_75",
        "url": "https://www.campuspandit.ai/for-students",
        "payload": {"depth": 0.75},
    }), None)
    assert res["statusCode"] == 201

def test_vote_double_vote_returns_409(patched_connect, postgres):
    # Need a feature_request to vote on
    import psycopg
    with psycopg.connect(postgres) as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO feature_requests (title, audience) VALUES ('Test', 'both') RETURNING id"
        )
        fr_id = cur.fetchone()[0]
        conn.commit()
    body = {"feature_request_id": str(fr_id), "voter_email": "v@example.com"}
    first = vote_write.lambda_handler(_event(body), None)
    assert first["statusCode"] == 201
    second = vote_write.lambda_handler(_event(body), None)
    assert second["statusCode"] == 409
```

- [ ] **Step 4: Run the tests**

```bash
cd infrastructure/lambda
pip install -r requirements.txt pytest
pytest -v
```

Expected: 6 tests pass (`test_pilot_application_happy_path`, `test_pilot_application_bad_email`, `test_feature_request_write_and_read`, `test_engagement_signal_write`, `test_vote_double_vote_returns_409`).

- [ ] **Step 5: Commit**

```bash
cd ../..
git add infrastructure/lambda/conftest.py infrastructure/lambda/tests/ infrastructure/lambda/pytest.ini
git commit -m "test(lambda): integration tests against local Postgres for 5 handlers"
```

---

### Task 4.11: Package and deploy Lambdas

**Files:**
- Create: `infrastructure/lambda/Makefile`

- [ ] **Step 1: Write the Makefile**

```makefile
# infrastructure/lambda/Makefile
.PHONY: layer package deploy clean

LAYER := campuspandit-lambda-layer
REGION := ap-south-1
PROFILE := campuspandit-ci
HANDLERS := pilot_application_write feature_request_write feature_request_read engagement_signal_write vote_write

layer:
	rm -rf build/layer && mkdir -p build/layer/python
	pip install -r requirements.txt -t build/layer/python
	cd build/layer && zip -r ../layer.zip python
	aws lambda publish-layer-version \
		--layer-name $(LAYER) \
		--zip-file fileb://build/layer.zip \
		--compatible-runtimes python3.12 \
		--compatible-architectures x86_64 \
		--region $(REGION) --profile $(PROFILE)

package:
	rm -rf build/handlers && mkdir -p build/handlers
	for h in $(HANDLERS); do \
		cd build/handlers && mkdir -p $$h && cd $$h && \
		cp ../../../$$h.py index.py && \
		cp -r ../../../shared shared && \
		zip -r ../$$h.zip . && cd ../../..; \
	done

deploy: package
	for h in $(HANDLERS); do \
		FN=$$(echo $$h | tr _ -); \
		aws lambda update-function-code \
			--function-name $$FN \
			--zip-file fileb://build/handlers/$$h.zip \
			--region $(REGION) --profile $(PROFILE); \
	done

clean:
	rm -rf build
```

- [ ] **Step 2: Build and publish the layer**

```bash
cd infrastructure/lambda
make layer
```

Expected: `LayerVersionArn` printed.

- [ ] **Step 3: Attach the layer to each Lambda**

For each function name (5 of them), in Lambda console → function → Code → Layers → Add a layer → Custom layers → `campuspandit-lambda-layer`. Or via CLI:

```bash
LAYER_ARN=arn:aws:lambda:ap-south-1:<account-id>:layer:campuspandit-lambda-layer:1
for FN in pilot-application-write feature-request-write feature-request-read engagement-signal-write vote-write; do
  aws lambda update-function-configuration --function-name $FN --layers $LAYER_ARN --profile campuspandit-ci --region ap-south-1
done
```

- [ ] **Step 4: Set env vars on each function**

```bash
for FN in pilot-application-write feature-request-write feature-request-read engagement-signal-write vote-write; do
  aws lambda update-function-configuration --function-name $FN \
    --environment "Variables={DATABASE_PROXY_HOST=<rds-proxy-endpoint>,DATABASE_NAME=campuspandit}" \
    --profile campuspandit-ci --region ap-south-1
done
```

- [ ] **Step 5: Deploy the handler code**

```bash
make deploy
```

Expected: 5 `LastUpdateStatus: Successful` outputs.

- [ ] **Step 6: Smoke-test one endpoint end-to-end**

```bash
curl -i -X POST "https://<api-id>.execute-api.ap-south-1.amazonaws.com/feature-requests" \
  -H "Content-Type: application/json" \
  -d '{"title":"smoke-test idea","audience":"both"}'
```

Expected: HTTP/2 201, body `{"id":"<uuid>"}`.

Verify it landed in RDS — temporarily allow your IP again on `rds-sg` for 5 minutes if needed, OR use the RDS Query Editor in the AWS Console:
```sql
SELECT id, title, created_at FROM feature_requests ORDER BY created_at DESC LIMIT 5;
```

Then DELETE the smoke-test row:
```sql
DELETE FROM feature_requests WHERE title = 'smoke-test idea';
```

- [ ] **Step 7: Commit**

```bash
cd ../..
git add infrastructure/lambda/Makefile
git commit -m "feat(lambda): Makefile for layer + handler deploy"
```

---

## Phase 5 — Cutover (~half-day)

### Task 5.1: Lower TTL on www.campuspandit.ai (24h before cutover)

- [ ] **Step 1: At the CURRENT registrar (not Route 53 yet)**

Find where DNS is currently authoritative. Per `[[domain-setup]]` memory, the `.ai` registrar holds it. Open registrar admin → DNS records for `campuspandit.ai` → set TTL to 60s on:
- A/AAAA record for `www`
- A/AAAA record for apex (if present)

Save. This is a no-op against current routing but allows fast propagation when records change in Task 5.5.

- [ ] **Step 2: Confirm TTL is in effect**

```bash
dig +short www.campuspandit.ai
dig +short -t SOA campuspandit.ai
```

Wait at least the OLD TTL (often 3600s) for the new TTL to propagate to public resolvers.

---

### Task 5.2: Open PR `aws-platform` → `main`

- [ ] **Step 1: Push and open PR**

```bash
git push origin aws-platform
gh pr create --base main --head aws-platform \
  --title "AWS migration: Amplify + RDS + Lambda" \
  --body "$(cat <<'EOF'
## Summary
- Migrates frontend from Azure SWA to Amplify Hosting
- Replaces Supabase observe-mode client with 5 Lambdas (4 POST + 1 GET) behind API Gateway
- RDS Postgres Multi-AZ + RDS Proxy with IAM auth as the new data store
- Archives FastAPI backend to `legacy/backend-archive` branch
- Per spec: docs/superpowers/specs/2026-05-25-aws-migration-design.md
- Per plan: docs/superpowers/plans/2026-05-25-aws-migration.md

## Cutover state
- All AWS infra provisioned and verified (Phase 1)
- RDS schema + lambda_app role applied (Phase 2)
- Legacy data restored from Azure pg_dump, row counts verified (Phase 3)
- Lambda integration tests passing locally (Task 4.10)
- One smoke-test row inserted via API Gateway → RDS and deleted (Task 4.11 step 6)

## Pre-merge checklist
- [ ] Amplify build on `aws-platform` branch is green
- [ ] All 5 API Gateway routes return expected status from curl smoke
- [ ] DNS TTL lowered to 60s on registrar (Task 5.1)
- [ ] Plausible script still loads (no CSP regression from amplify.yml)

## Post-merge
- [ ] Branch swap: Amplify production branch → `main`
- [ ] DNS registrar nameservers updated to Route 53 (Task 5.5)
- [ ] Phase 5 smoke test from www.campuspandit.ai (Task 5.6)

## Rollback
- 7-day window before Phase 6 Azure teardown
- Revert by flipping registrar NS back to current values (saved in infrastructure/AWS_SETUP.md before the change in Task 5.5)
EOF
)"
```

- [ ] **Step 2: Wait for Amplify preview build to succeed**

Amplify automatically builds the PR's source branch. Check Amplify console → app → `aws-platform` branch → latest build is `Succeeded`. If failed, fix the issue and push again.

- [ ] **Step 3: Self-review the diff once more**

Use the cross-branch review checklist from the 2026-05-22 spec — same logic still applies. Fix anything that surfaces.

- [ ] **Step 4: Merge**

```bash
gh pr merge --merge --delete-branch=false
```

Don't delete the branch yet — Amplify is still pointing at it until Task 5.3.

---

### Task 5.3: Switch Amplify production branch to `main`

- [ ] **Step 1: In Amplify console**

App → General → Production branch → Edit → select `main`. Save.

Amplify auto-triggers a build on `main`. Wait for it to succeed.

- [ ] **Step 2: Confirm the new production URL works**

```bash
curl -I https://main.<app-id>.amplifyapp.com
```

Expected: HTTP/2 200, `content-type: text/html`.

---

### Task 5.4: Pre-DNS smoke test on Amplify default URL

This is the last chance to catch a problem before the public URL flips. Be thorough.

- [ ] **Step 1: Walk every public route in incognito**

Open in private browsing:
- `https://main.<app-id>.amplifyapp.com/`
- `/for-students`
- `/blog`
- `/materials`
- `/roadmap`
- `/ideas`
- `/apply`
- `/apply/thanks`

For each: page loads, no console errors, content renders.

- [ ] **Step 2: Confirm parked routes redirect**

`/auth` and `/coach` should redirect to `/`.

- [ ] **Step 3: Submit a real test pilot application via `/apply`**

Fill the form with realistic but flagged values (center name "AWS Migration Smoke Test"). Submit. Expect redirect to `/apply/thanks`.

- [ ] **Step 4: Submit a test feature request via `/ideas`**

Title "AWS Migration Smoke Test". Submit. Expect the "Thanks" message.

- [ ] **Step 5: Verify both rows in RDS**

Through AWS Console → RDS Query Editor (connect using Secrets Manager creds):
```sql
SELECT id, center_name FROM pilot_applications WHERE center_name = 'AWS Migration Smoke Test';
SELECT id, title FROM feature_requests WHERE title = 'AWS Migration Smoke Test';
```

Both rows should appear.

- [ ] **Step 6: Verify Plausible events**

Open Plausible dashboard. Confirm at least one pageview for `main.<app-id>.amplifyapp.com` (or whatever Plausible domain config you've set — adjust beforehand if Plausible only accepts `campuspandit.ai`).

If Plausible is gated to `campuspandit.ai`, the events won't show until after DNS flips. That's expected — don't gate on this in step 6, gate on the post-DNS smoke in Task 5.6 step 4.

- [ ] **Step 7: Delete test rows**

```sql
DELETE FROM pilot_applications WHERE center_name = 'AWS Migration Smoke Test';
DELETE FROM feature_requests WHERE title = 'AWS Migration Smoke Test';
```

---

### Task 5.5: Update registrar nameservers to Route 53

- [ ] **Step 1: Save current registrar NS values to runbook**

Before changing anything, record the current NS values from the registrar admin:
```markdown
## Phase 5 — DNS cutover

**Pre-cutover registrar NS values (rollback target):**
- ns1.example.com
- ns2.example.com
(record actual values here)
```

```bash
git add infrastructure/AWS_SETUP.md
git commit -m "chore(infra): record pre-cutover registrar NS for rollback"
git push origin main
```

- [ ] **Step 2: Update registrar NS to Route 53's 4 NS values**

At the `.ai` registrar admin → DNS / nameservers → replace existing NS records with the 4 Route 53 NS values captured in Task 1.8 step 2.

Save. Registrar may say "propagation can take up to 48 hours" — with TTL 60s set in Task 5.1, public propagation is usually under 10 minutes.

- [ ] **Step 3: Poll for propagation**

```bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  echo "Attempt $i:" && dig +short -t NS campuspandit.ai && sleep 30
done
```

Expected: eventually shows the Route 53 NS values.

---

### Task 5.6: Post-DNS smoke test from `www.campuspandit.ai`

- [ ] **Step 1: Confirm Amplify's "Custom domain verification" status**

Amplify console → app → Hosting → Custom domains → `campuspandit.ai` should now show "Available" (was "Pending verification" pre-cutover).

- [ ] **Step 2: Repeat Task 5.4 walk from the public URL**

Same 8 routes, but against `https://www.campuspandit.ai`. Same 2 form submits + verify in RDS + delete.

- [ ] **Step 3: Confirm HTTPS cert is the ACM cert**

```bash
curl -vI https://www.campuspandit.ai 2>&1 | grep -E 'subject|issuer'
```

Expected: subject `CN=www.campuspandit.ai`, issuer Amazon.

- [ ] **Step 4: Confirm Plausible events fire**

Plausible dashboard → should show pageviews for `www.campuspandit.ai` from the smoke walk + the test form submits as the custom goal `pilot_application_submitted` and `feature_request_submitted`.

If goals don't appear, check Plausible domain config and the `connect-src` directive in `amplify.yml` allows `plausible.io`.

---

### Task 5.7: Restore TTL

- [ ] **Step 1: At the registrar (NS records are now Route 53's)**

Apex + www records are now in Route 53, not the registrar. There's nothing to restore at the registrar.

In Route 53 → hosted zone → records, set TTL on the Amplify alias records to 3600s (it defaults to 300s or 60s after creation).

Done. Phase 5 complete. **Begin the 7-day rollback hold.**

---

## Phase 6 — Azure teardown (~1 hr, ≥7 days after Phase 5)

Hold for 7 days minimum after Task 5.6. During the hold:
- Monitor CloudWatch RDS dashboard for connection errors, CPU spikes, replication lag
- Monitor Amplify build history for unexpected failures
- Monitor Plausible for sudden traffic drops (would indicate DNS misroute somewhere)

After 7 clean days, run teardown.

### Task 6.1: Delete Azure Container App

- [ ] **Step 1: Confirm replicas are 0**

```bash
az containerapp show --name campuspandit-backend --resource-group campuspandit-rg --query properties.template.scale -o table
```

Expected: min/max are 0 already (per the original park plan) or `null` if never reached.

- [ ] **Step 2: Delete**

```bash
az containerapp delete --name campuspandit-backend --resource-group campuspandit-rg --yes
```

---

### Task 6.2: Delete Azure Postgres flexible-server

- [ ] **Step 1: Final snapshot (sanity)**

```bash
az postgres flexible-server backup create --name campuspandit-postgres --resource-group campuspandit-rg --backup-name pre-deletion-$(date +%Y%m%d)
```

This snapshot lives in Azure's automated backup vault for the retention window (typically 7-35 days depending on config).

- [ ] **Step 2: Delete**

```bash
az postgres flexible-server delete --name campuspandit-postgres --resource-group campuspandit-rg --yes
```

---

### Task 6.3: Delete Azure Container Registry

- [ ] **Step 1: Delete**

```bash
az acr delete --name <acr-name> --yes
```

(Find the ACR name with `az acr list --resource-group campuspandit-rg -o table`.)

---

### Task 6.4: Delete Azure Static Web App

- [ ] **Step 1: Delete**

```bash
az staticwebapp delete --name ambitious-river-04fdcd510 --resource-group campuspandit-rg --yes
```

---

### Task 6.5: Cost screenshot baseline

- [ ] **Step 1: Take an AWS Cost Explorer screenshot**

AWS Console → Cost Management → Cost Explorer → set view to "Last 7 days, daily, grouped by service". Save the screenshot to `docs/superpowers/specs/2026-05-25-cost-after.png`.

```bash
git add docs/superpowers/specs/2026-05-25-cost-after.png
git commit -m "docs(spec): AWS cost baseline screenshot post-cutover"
```

- [ ] **Step 2: Update CONTEXT.md**

Append to the glossary:

```markdown
- **Hosting:** AWS Amplify Hosting in ap-south-1 (was Azure Static Web Apps until 2026-05-25)
- **Database:** RDS Postgres Multi-AZ via RDS Proxy with IAM auth (was Azure Postgres + Supabase observe plan)
- **Lambdas:** 5 functions behind API Gateway HTTP API for the observe-window endpoints
```

```bash
git add CONTEXT.md
git commit -m "docs(context): update hosting + db entries post-AWS-migration"
```

---

## Self-review notes

Done after writing the plan:

1. **Spec coverage:** Every section in the spec maps to a task — §3 decisions D1-D12 are each implemented in a phase task (D1 click-ops → AWS_SETUP.md throughout Phase 1; D2 Route 53 → Tasks 1.8 + 5.5; D3 Cognito stub → Task 1.7; D4 Amplify → Task 1.6 + 4.4; D5 RDS Multi-AZ → Task 1.2; D6 RDS Proxy + Lambda → Tasks 1.3-1.5; D7 AWS Backup → Task 1.9; D8 SES deferred; D9 Plausible → unchanged; D10 billing alarm → Task 0.2; D11 Secrets Manager → Task 1.2; D12 backend archive → Task 4.1).
2. **Placeholder scan:** No "TBD" or "implement later". Specific commands and code in every step.
3. **Type consistency:** Lambda handler names use snake_case in files (`pilot_application_write.py`) and kebab-case in AWS function names (`pilot-application-write`). The Makefile `tr _ -` handles the conversion. Consistent throughout.
4. **Sequence dependencies clear:** Phase 1 → Phase 2 → Phase 3 sequential. Phase 4 can start in parallel with Phase 1.5 once the Lambda skeletons exist. Phase 5 needs Phase 4 done. Phase 6 needs Phase 5 + 7 days.
