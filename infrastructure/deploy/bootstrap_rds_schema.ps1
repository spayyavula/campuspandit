<#
.SYNOPSIS
Bootstrap RDS schema: pgcrypto + 4 admin tables + lambda_app IAM role.

.DESCRIPTION
Connects to the freshly-provisioned RDS instance using master credentials from
Secrets Manager and applies the two SQL files under infrastructure/sql:
  - 01_admin_tables.sql (pgcrypto + pilot_applications, feature_requests,
    engagement_signals, feature_request_votes)
  - 02_lambda_app_role.sql (lambda_app user + IAM auth grant + table grants)

Uses the docker postgres:16 image for psql, so no local Postgres install is
needed. Adds a temporary security-group ingress (port 5432 from the local
public IP) for the duration of the script and removes it in a finally block.

Prerequisites:
  - Docker Desktop running
  - AWS CLI profile campuspandit-admin (or pass -ProfileName)
  - 03_rds.py up has been run (RDS endpoint + secret in SSM)

.PARAMETER ProfileName
AWS CLI profile. Default: campuspandit-admin.

.PARAMETER AwsRegion
AWS region for SSM/Secrets/EC2 calls. Default: ap-south-1.

.EXAMPLE
./bootstrap_rds_schema.ps1
#>
[CmdletBinding()]
param(
    [string]$ProfileName = "campuspandit-admin",
    [string]$AwsRegion   = "ap-south-1"
)

$ErrorActionPreference = "Stop"

$SqlDir = (Resolve-Path (Join-Path $PSScriptRoot "..\sql")).Path

function Get-PublicIp {
    return (Invoke-RestMethod -Uri "https://checkip.amazonaws.com").Trim()
}

function Get-RdsCreds {
    $endpoint  = aws ssm get-parameter --name "/campuspandit/deploy/rds/endpoint"   --region $AwsRegion --profile $ProfileName --query "Parameter.Value" --output text
    $secretArn = aws ssm get-parameter --name "/campuspandit/deploy/rds/secret_arn" --region $AwsRegion --profile $ProfileName --query "Parameter.Value" --output text
    $secretJson = aws secretsmanager get-secret-value --secret-id $secretArn --region $AwsRegion --profile $ProfileName --query "SecretString" --output text
    $secret = $secretJson | ConvertFrom-Json
    return @{
        Endpoint = $endpoint
        Username = $secret.username
        Password = $secret.password
        Dbname   = $secret.dbname
        Port     = "$($secret.port)"
    }
}

function Get-RdsSgId {
    return aws ssm get-parameter --name "/campuspandit/deploy/rds/security_group_id" --region $AwsRegion --profile $ProfileName --query "Parameter.Value" --output text
}

function Add-LocalIngress($sgId, $ip) {
    Write-Host "Adding temporary ingress: $sgId allow $ip/32 on 5432 ..."
    $out = aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 5432 --cidr "$ip/32" --region $AwsRegion --profile $ProfileName 2>&1
    if ($LASTEXITCODE -ne 0) {
        if ($out -match "InvalidPermission.Duplicate") {
            Write-Host "  Ingress rule already present - continuing."
        } else {
            throw "authorize-security-group-ingress failed: $out"
        }
    }
}

function Remove-LocalIngress($sgId, $ip) {
    Write-Host ""
    Write-Host "Removing temporary ingress: $sgId revoke $ip/32 on 5432 ..."
    $out = aws ec2 revoke-security-group-ingress --group-id $sgId --protocol tcp --port 5432 --cidr "$ip/32" --region $AwsRegion --profile $ProfileName 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Could not revoke ingress rule for $ip/32. Check the SG manually. Detail: $out"
    } else {
        Write-Host "  Removed."
    }
}

function Invoke-PsqlFile($creds, $sqlFile) {
    $sqlFileName = Split-Path $sqlFile -Leaf
    $sqlDirHost  = (Split-Path $sqlFile -Parent)
    Write-Host "Applying $sqlFileName ..."
    $connStr = "host=$($creds.Endpoint) port=$($creds.Port) user=$($creds.Username) dbname=$($creds.Dbname) sslmode=require"
    docker run --rm `
        -e PGPASSWORD="$($creds.Password)" `
        -v "${sqlDirHost}:/sql" `
        postgres:16 `
        psql $connStr -v ON_ERROR_STOP=1 -f "/sql/$sqlFileName"
    if ($LASTEXITCODE -ne 0) {
        throw "psql failed applying $sqlFileName"
    }
}

function Invoke-PsqlQuery($creds, $sql) {
    $connStr = "host=$($creds.Endpoint) port=$($creds.Port) user=$($creds.Username) dbname=$($creds.Dbname) sslmode=require"
    docker run --rm `
        -e PGPASSWORD="$($creds.Password)" `
        postgres:16 `
        psql $connStr -At -c $sql
}

# --- Main ---

$myIp  = Get-PublicIp
$sgId  = Get-RdsSgId
$creds = Get-RdsCreds

Write-Host "Local IP:     $myIp"
Write-Host "RDS endpoint: $($creds.Endpoint)"
Write-Host "RDS SG:       $sgId"
Write-Host "SQL dir:      $SqlDir"
Write-Host ""

try {
    Add-LocalIngress $sgId $myIp

    Invoke-PsqlFile $creds (Join-Path $SqlDir "01_admin_tables.sql")
    Invoke-PsqlFile $creds (Join-Path $SqlDir "02_lambda_app_role.sql")

    Write-Host ""
    Write-Host "=== Verification ===" -ForegroundColor Cyan
    $tables = Invoke-PsqlQuery $creds "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    Write-Host "Public tables on RDS:"
    $tables -split "`n" | Where-Object { $_ } | ForEach-Object { Write-Host "  - $_" }

    $expected = @("engagement_signals","feature_request_votes","feature_requests","pilot_applications")
    $tableList = ($tables -split "`n" | Where-Object { $_ })
    $missing = $expected | Where-Object { $_ -notin $tableList }
    if ($missing.Count -gt 0) {
        Write-Host "MISSING tables: $($missing -join ', ')" -ForegroundColor Red
        throw "Expected admin tables were not created."
    }

    $roleExists = Invoke-PsqlQuery $creds "SELECT 1 FROM pg_roles WHERE rolname='lambda_app'"
    if ($roleExists.Trim() -eq "1") {
        Write-Host "lambda_app role: PRESENT" -ForegroundColor Green
    } else {
        Write-Host "lambda_app role: MISSING" -ForegroundColor Red
        throw "lambda_app role was not created."
    }

    $pgcryptoExists = Invoke-PsqlQuery $creds "SELECT 1 FROM pg_extension WHERE extname='pgcrypto'"
    if ($pgcryptoExists.Trim() -eq "1") {
        Write-Host "pgcrypto extension: ENABLED" -ForegroundColor Green
    } else {
        Write-Host "pgcrypto extension: NOT ENABLED" -ForegroundColor Red
        throw "pgcrypto was not enabled."
    }

    Write-Host ""
    Write-Host "RDS schema bootstrap complete." -ForegroundColor Green
}
finally {
    Remove-LocalIngress $sgId $myIp
}
