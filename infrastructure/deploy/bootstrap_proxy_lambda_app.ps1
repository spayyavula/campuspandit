<#
.SYNOPSIS
Add RDS Proxy auth for the lambda_app user (closes a gap in 04_rds_proxy.py).

.DESCRIPTION
The deploy chain creates the proxy with only the master user's secret in Auth[].
Lambdas connect AS lambda_app via IAM, but the proxy cannot relay that without
its own secret for lambda_app. This script:

  1. Generates a 32-hex random password for lambda_app
  2. ALTER USER lambda_app WITH PASSWORD '<pw>' on RDS (via temporary SG ingress
     + docker psql), preserving the rds_iam role grant
  3. Creates / updates Secrets Manager secret campuspandit/prod/lambda_app
  4. Modifies the proxy's Auth[] to include the new secret with IAMAuth=REQUIRED
  5. Waits for the proxy to return to 'available' state

The lambda_app password is opaque to the Lambda code: Lambdas authenticate to the
proxy with an IAM auth token; the proxy uses this secret to authenticate to RDS.

Prerequisites:
  - 03_rds.py, schema bootstrap, 04_rds_proxy.py all done
  - Docker Desktop running
  - VPN disconnected (or split-tunnel for AWS)
  - AWS profile campuspandit-admin

.EXAMPLE
./bootstrap_proxy_lambda_app.ps1
#>
[CmdletBinding()]
param(
    [string]$ProfileName = "campuspandit-admin",
    [string]$AwsRegion   = "ap-south-1"
)

$ErrorActionPreference = "Stop"

$SecretName = "campuspandit/prod/lambda_app"
$ProxyName  = "campuspandit-proxy"

function Get-PublicIp { (Invoke-RestMethod -Uri "https://checkip.amazonaws.com").Trim() }

function Get-RdsMasterCreds {
    $endpoint  = aws ssm get-parameter --name "/campuspandit/deploy/rds/endpoint"   --region $AwsRegion --profile $ProfileName --query "Parameter.Value" --output text
    $secretArn = aws ssm get-parameter --name "/campuspandit/deploy/rds/secret_arn" --region $AwsRegion --profile $ProfileName --query "Parameter.Value" --output text
    $json = aws secretsmanager get-secret-value --secret-id $secretArn --region $AwsRegion --profile $ProfileName --query "SecretString" --output text
    $secret = $json | ConvertFrom-Json
    return @{
        Endpoint = $endpoint
        Username = $secret.username
        Password = $secret.password
        Dbname   = $secret.dbname
        Port     = "$($secret.port)"
    }
}

function Get-RdsSgId {
    aws ssm get-parameter --name "/campuspandit/deploy/rds/security_group_id" --region $AwsRegion --profile $ProfileName --query "Parameter.Value" --output text
}

function New-HexPassword {
    $bytes = New-Object 'byte[]' 16
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [BitConverter]::ToString($bytes).Replace("-", "").ToLower()
}

function Add-LocalIngress($sgId, $ip) {
    $out = aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 5432 --cidr "$ip/32" --region $AwsRegion --profile $ProfileName 2>&1
    if ($LASTEXITCODE -ne 0 -and ($out -notmatch "InvalidPermission.Duplicate")) {
        throw "authorize-security-group-ingress failed: $out"
    }
}

function Remove-LocalIngress($sgId, $ip) {
    aws ec2 revoke-security-group-ingress --group-id $sgId --protocol tcp --port 5432 --cidr "$ip/32" --region $AwsRegion --profile $ProfileName 2>&1 | Out-Null
}

function Invoke-PsqlCommand($creds, $sql) {
    $connStr = "host=$($creds.Endpoint) port=$($creds.Port) user=$($creds.Username) dbname=$($creds.Dbname) sslmode=require"
    docker run --rm `
        -e PGPASSWORD="$($creds.Password)" `
        postgres:16 `
        psql $connStr -v ON_ERROR_STOP=1 -c $sql
    if ($LASTEXITCODE -ne 0) { throw "psql failed for SQL: $sql" }
}

# --- Main ---

Write-Host "=== 1. Generate lambda_app password ===" -ForegroundColor Cyan
$lambdaAppPw = New-HexPassword
Write-Host "Generated 32-hex-char password (not echoed)."

Write-Host ""
Write-Host "=== 2. Set password in RDS for lambda_app ===" -ForegroundColor Cyan
$myIp  = Get-PublicIp
$sgId  = Get-RdsSgId
$creds = Get-RdsMasterCreds
Write-Host "Local IP: $myIp"
try {
    Add-LocalIngress $sgId $myIp
    $sql = "ALTER USER lambda_app WITH PASSWORD '" + $lambdaAppPw.Replace("'", "''") + "'"
    Invoke-PsqlCommand $creds $sql
    Write-Host "ALTER USER applied. rds_iam grant preserved."
}
finally {
    Remove-LocalIngress $sgId $myIp
    Write-Host "SG ingress removed."
}

Write-Host ""
Write-Host "=== 3. Create/update Secrets Manager secret ===" -ForegroundColor Cyan
$secretValue = @{ username = "lambda_app"; password = $lambdaAppPw } | ConvertTo-Json -Compress

# Use a temp file to pass the secret to AWS CLI (avoids quote escaping on Windows).
# WriteAllText writes UTF-8 WITHOUT BOM; Set-Content -Encoding utf8 in PS 5.1 adds BOM,
# which AWS CLI then refuses to parse.
$tmpSecretFile = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tmpSecretFile, $secretValue)

try {
    # list-secrets always returns exit 0 and writes no stderr - safer than describe-secret in PS 5.1
    $listJson = aws secretsmanager list-secrets --filters "Key=name,Values=$SecretName" --region $AwsRegion --profile $ProfileName --output json
    $matched = ($listJson | ConvertFrom-Json).SecretList | Where-Object { $_.Name -eq $SecretName }
    if ($matched) {
        $existing = $matched[0].ARN
        Write-Host "Secret exists, updating value..."
        aws secretsmanager put-secret-value --secret-id $SecretName --secret-string "file://$tmpSecretFile" --region $AwsRegion --profile $ProfileName --query "ARN" --output text | Out-Null
        $secretArn = $existing
    } else {
        Write-Host "Creating secret $SecretName ..."
        $secretArn = aws secretsmanager create-secret --name $SecretName --secret-string "file://$tmpSecretFile" --region $AwsRegion --profile $ProfileName --query "ARN" --output text
        if ($LASTEXITCODE -ne 0) { throw "create-secret failed." }
    }
} finally {
    Remove-Item $tmpSecretFile -Force
}
Write-Host "Secret ARN: $secretArn"

# Record in SSM for traceability
aws ssm put-parameter --name "/campuspandit/deploy/rds/lambda_app_secret_arn" --value $secretArn --type String --overwrite --region $AwsRegion --profile $ProfileName --output text | Out-Null

Write-Host ""
Write-Host "=== 4. Add lambda_app to proxy Auth[] ===" -ForegroundColor Cyan
$proxyJson = aws rds describe-db-proxies --db-proxy-name $ProxyName --region $AwsRegion --profile $ProfileName --output json
$proxy = $proxyJson | ConvertFrom-Json
$auths = $proxy.DBProxies[0].Auth
$hasLambdaApp = $auths | Where-Object { $_.SecretArn -eq $secretArn }
if ($hasLambdaApp) {
    Write-Host "Proxy already has lambda_app auth entry - skipping modify."
} else {
    $newAuths = @()
    foreach ($a in $auths) {
        $newAuths += [ordered]@{
            AuthScheme = "SECRETS"
            SecretArn  = $a.SecretArn
            IAMAuth    = $a.IAMAuth
        }
    }
    $newAuths += [ordered]@{
        AuthScheme = "SECRETS"
        SecretArn  = $secretArn
        IAMAuth    = "REQUIRED"
    }
    $authJson = $newAuths | ConvertTo-Json -Depth 5 -Compress
    if ($newAuths.Count -eq 1) {
        $authJson = "[$authJson]"
    }

    $tmpAuthFile = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($tmpAuthFile, $authJson)
    try {
        aws rds modify-db-proxy --db-proxy-name $ProxyName --auth "file://$tmpAuthFile" --region $AwsRegion --profile $ProfileName --output text --query "DBProxy.DBProxyName" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "modify-db-proxy failed." }
    } finally {
        Remove-Item $tmpAuthFile -Force
    }
    Write-Host "Proxy modify-db-proxy submitted."
}

Write-Host ""
Write-Host "=== 5. Wait for proxy to be available ===" -ForegroundColor Cyan
$maxWait = 600
$start = Get-Date
while (((Get-Date) - $start).TotalSeconds -lt $maxWait) {
    $status = aws rds describe-db-proxies --db-proxy-name $ProxyName --region $AwsRegion --profile $ProfileName --query "DBProxies[0].Status" --output text
    Write-Host "Proxy status: $status"
    if ($status -eq "available") {
        Write-Host "Proxy is available." -ForegroundColor Green
        break
    }
    if ($status -in @("incompatible-network", "insufficient-resource-limits")) {
        throw "Proxy entered terminal state: $status"
    }
    Start-Sleep -Seconds 15
}

Write-Host ""
Write-Host "lambda_app proxy auth complete. Re-run the API smoke test." -ForegroundColor Green
