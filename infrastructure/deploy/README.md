# CampusPandit AWS Deploy Scripts

Imperative boto3 scripts that provision all AWS infrastructure for the CampusPandit
park-mode observe window. Each script is idempotent — re-running is safe (checks
existing state, creates only if missing).

See `docs/superpowers/specs/2026-05-25-aws-migration-design.md` for the full architecture.

## Prerequisites

- Python 3.12+
- AWS account with `$25k` Activate credits applied
- AWS CLI installed and configured (`aws configure --profile campuspandit-ci`)
- Billing alerts enabled in AWS account root (Billing Dashboard → Billing Preferences → Receive Billing Alerts)
- A GitHub personal access token with `repo` scope (for Amplify GitHub connection)

## Setup

```bash
cd infrastructure/deploy
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

## Environment variables

Set these before running:

```bash
export AWS_REGION=ap-south-1
export AWS_PROFILE=campuspandit-ci

# Required for 02_billing_alarm.py
export BILLING_ALERT_EMAIL=you@example.com

# Required for 07_amplify.py
export GITHUB_TOKEN=ghp_...
```

On Windows PowerShell:

```powershell
$env:AWS_REGION = "ap-south-1"
$env:AWS_PROFILE = "campuspandit-ci"
$env:BILLING_ALERT_EMAIL = "you@example.com"
$env:GITHUB_TOKEN = "ghp_..."
```

## Provision everything

```bash
python deploy.py up
```

This runs all 11 scripts in dependency order:
`01_iam → 02_billing_alarm → 03_rds → 04_rds_proxy → 06_lambdas → 05_api_gateway → 07_amplify → 08_cognito → 09_route53 → 10_acm → 11_aws_backup`

Note: `06_lambdas` runs before `05_api_gateway` because API Gateway routes depend on Lambda ARNs.

## Run a subset of scripts

```bash
python deploy.py up --scripts 03_rds,04_rds_proxy
python deploy.py up --scripts 09_route53,10_acm
```

## Check current state

```bash
python deploy.py status
```

Prints all SSM parameters under `/campuspandit/deploy/*` as a table.

## Tear down

```bash
# Interactive confirmation (safe):
python teardown.py down

# Skip confirmation + skip RDS final snapshot (destructive):
python teardown.py down --force
```

**WARNING:** `--force` deletes RDS with no final snapshot. Only use after confirming
you have a recent AWS Backup recovery point or manual snapshot.

## Script reference

| Script | Provisions |
|--------|-----------|
| `01_iam.py` | CI IAM user + Lambda exec role + RDS Proxy role |
| `02_billing_alarm.py` | CloudWatch $200/mo billing alarm + SNS email |
| `03_rds.py` | Secrets Manager secret + RDS Postgres Multi-AZ + security group |
| `04_rds_proxy.py` | RDS Proxy (IAM auth) + proxy security group |
| `05_api_gateway.py` | HTTP API + 5 routes + CORS + Lambda integrations |
| `06_lambdas.py` | Lambda layer + 5 functions + VPC config + lambda security group |
| `07_amplify.py` | Amplify app + branch + env vars |
| `08_cognito.py` | Empty Cognito user pool + app client (Stage 2 stub) |
| `09_route53.py` | Route 53 hosted zone (no registrar NS flip yet) |
| `10_acm.py` | ACM cert + Route 53 DNS validation |
| `11_aws_backup.py` | Backup vault + daily-35 + monthly-glacier-365 plan |

## State sharing

Scripts share outputs via SSM Parameter Store under `/campuspandit/deploy/*`.
Use `python deploy.py status` to inspect all parameters.

## After provisioning

1. Check email and confirm the SNS billing alert subscription.
2. Note the Route 53 nameservers printed by `09_route53.py` — update your registrar
   in Phase 5 (after smoke test passes on the Amplify preview URL).
3. The `campuspandit-ci` access key is printed once during `01_iam.py up`.
   Copy it to GitHub Actions secrets immediately.
