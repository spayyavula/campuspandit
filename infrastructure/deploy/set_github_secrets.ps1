<#
.SYNOPSIS
Push the campuspandit-ci AWS credentials into the GitHub repo's Actions secrets.

.DESCRIPTION
Reads ~/.campuspandit/ci_credentials.txt (written by 01_iam.py up) and uploads
AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to GitHub Actions via `gh secret set`.
Values are piped via stdin so they never appear in shell history.

Prerequisites:
  - gh CLI authenticated with `repo` scope (gh auth login)
  - ~/.campuspandit/ci_credentials.txt exists (run 01_iam.py up first)
  - Run from the campuspandit repo root, OR pass -Repo owner/name

.PARAMETER Repo
GitHub repo in owner/name form. If omitted, gh uses the remote of the cwd.

.PARAMETER IncludeRegion
Also set AWS_REGION=ap-south-1 as a repo secret. Off by default since the
region is non-sensitive and is usually hardcoded in workflow files.

.PARAMETER DeleteCredentialsFile
After a successful upload, delete the local credentials file. Off by default.

.EXAMPLE
./set_github_secrets.ps1

.EXAMPLE
./set_github_secrets.ps1 -Repo spayyavula/campuspandit -IncludeRegion -DeleteCredentialsFile
#>
[CmdletBinding()]
param(
    [string]$Repo = "",
    [switch]$IncludeRegion,
    [switch]$DeleteCredentialsFile
)

$ErrorActionPreference = "Stop"

$credsPath = Join-Path $env:USERPROFILE ".campuspandit\ci_credentials.txt"
if (-not (Test-Path $credsPath)) {
    throw "Credentials file not found: $credsPath. Run 01_iam.py up first."
}

gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "gh CLI is not authenticated. Run: gh auth login --scopes repo"
}

$creds = Get-Content $credsPath | ConvertFrom-StringData
if (-not $creds.AWS_ACCESS_KEY_ID -or -not $creds.AWS_SECRET_ACCESS_KEY) {
    throw "Malformed credentials file: missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY."
}

$repoArgs = if ($Repo) { @("--repo", $Repo) } else { @() }

function Set-RepoSecret([string]$Name, [string]$Value) {
    Write-Host "Setting $Name..."
    $Value | gh secret set $Name @repoArgs
    if ($LASTEXITCODE -ne 0) { throw "Failed to set $Name." }
}

Set-RepoSecret "AWS_ACCESS_KEY_ID"     $creds.AWS_ACCESS_KEY_ID
Set-RepoSecret "AWS_SECRET_ACCESS_KEY" $creds.AWS_SECRET_ACCESS_KEY
if ($IncludeRegion) {
    Set-RepoSecret "AWS_REGION" "ap-south-1"
}

Write-Host ""
Write-Host "Current repo secrets:" -ForegroundColor Green
gh secret list @repoArgs

if ($DeleteCredentialsFile) {
    Remove-Item $credsPath -Force
    Write-Host ""
    Write-Host "Deleted $credsPath" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Credentials file kept at $credsPath." -ForegroundColor Yellow
    Write-Host "Delete it manually once you've confirmed CI can authenticate." -ForegroundColor Yellow
}
