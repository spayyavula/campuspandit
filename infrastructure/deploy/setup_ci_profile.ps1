<#
.SYNOPSIS
Set up the campuspandit-ci AWS CLI profile from ~/.campuspandit/ci_credentials.txt.

.DESCRIPTION
Reads credentials written by 01_iam.py up and creates/updates a named profile
(default "campuspandit-ci") with region ap-south-1 and json output. Verifies
with STS get-caller-identity. Idempotent — safe to re-run after key rotation.

Prerequisites:
  - AWS CLI installed
  - ~/.campuspandit/ci_credentials.txt exists (run 01_iam.py up first)

.PARAMETER ProfileName
AWS CLI profile name to create/update. Default: campuspandit-ci.

.PARAMETER Region
Default region for the profile. Default: ap-south-1.

.EXAMPLE
./setup_ci_profile.ps1
#>
[CmdletBinding()]
param(
    [string]$ProfileName = "campuspandit-ci",
    [string]$Region      = "ap-south-1"
)

$ErrorActionPreference = "Stop"

$credsPath = Join-Path $env:USERPROFILE ".campuspandit\ci_credentials.txt"
if (-not (Test-Path $credsPath)) {
    throw "Credentials file not found: $credsPath. Run 01_iam.py up first."
}

$creds = Get-Content $credsPath | ConvertFrom-StringData
if (-not $creds.AWS_ACCESS_KEY_ID -or -not $creds.AWS_SECRET_ACCESS_KEY) {
    throw "Malformed credentials file: missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY."
}

Write-Host "Configuring profile '$ProfileName' (region $Region)..."
aws configure set aws_access_key_id     $creds.AWS_ACCESS_KEY_ID     --profile $ProfileName
aws configure set aws_secret_access_key $creds.AWS_SECRET_ACCESS_KEY --profile $ProfileName
aws configure set region                $Region                       --profile $ProfileName
aws configure set output                json                           --profile $ProfileName

Write-Host ""
Write-Host "Verifying with STS get-caller-identity..." -ForegroundColor Green
aws sts get-caller-identity --profile $ProfileName
if ($LASTEXITCODE -ne 0) { throw "STS verify failed for profile '$ProfileName'." }

Write-Host ""
Write-Host "Profile '$ProfileName' ready." -ForegroundColor Green
Write-Host "Use it via:  aws <cmd> --profile $ProfileName" -ForegroundColor Cyan
Write-Host "  or set:    `$env:AWS_PROFILE = '$ProfileName'" -ForegroundColor Cyan
