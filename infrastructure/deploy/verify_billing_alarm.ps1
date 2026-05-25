<#
.SYNOPSIS
Verify the $200/mo billing alarm is fully wired and able to fire.

.DESCRIPTION
Three checks against the billing-alarm stack provisioned by 02_billing_alarm.py:
  1. CloudWatch alarm exists and reports OK (vs INSUFFICIENT_DATA).
  2. SNS email subscription is confirmed (vs PendingConfirmation).
  3. AWS/Billing/EstimatedCharges metric is publishing - the actual proof
     that "Receive Billing Alerts" is enabled at the account root.

Note: After enabling Receive Billing Alerts, AWS can take up to ~24 hours to
publish the first EstimatedCharges data point. INSUFFICIENT_DATA + missing
metric immediately after enabling does NOT mean the toggle failed - re-run
this script in a few hours.

.PARAMETER ProfileName
AWS CLI profile to use. Default: campuspandit-admin.

.EXAMPLE
./verify_billing_alarm.ps1
#>
[CmdletBinding()]
param(
    [string]$ProfileName = "campuspandit-admin"
)

$ErrorActionPreference = "Stop"

$AlarmName     = "campuspandit-monthly-bill-over-200"
$SsmParamName  = "/campuspandit/deploy/billing/sns_topic_arn"
$SsmRegion     = "ap-south-1"
$BillingRegion = "us-east-1"

function Write-Pass([string]$msg) { Write-Host "[PASS] $msg" -ForegroundColor Green }
function Write-Pend([string]$msg) { Write-Host "[WAIT] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

$overallPass = $true

Write-Host ""
Write-Host "=== 1. CloudWatch alarm state ===" -ForegroundColor Cyan
$alarmJson = aws cloudwatch describe-alarms `
    --alarm-names $AlarmName `
    --region $BillingRegion --profile $ProfileName `
    --output json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Could not query alarm: $alarmJson"
    $overallPass = $false
} else {
    $alarms = ($alarmJson | ConvertFrom-Json).MetricAlarms
    if (-not $alarms -or $alarms.Count -eq 0) {
        Write-Fail "Alarm '$AlarmName' does not exist. Re-run 02_billing_alarm.py up."
        $overallPass = $false
    } else {
        $state  = $alarms[0].StateValue
        $reason = $alarms[0].StateReason
        switch ($state) {
            "OK"                { Write-Pass "Alarm state: OK (armed, metric flowing)" }
            "INSUFFICIENT_DATA" { Write-Pend "Alarm state: INSUFFICIENT_DATA - metric not yet publishing. Reason: $reason" }
            "ALARM"             { Write-Fail "Alarm state: ALARM - current month spend over threshold. Reason: $reason"; $overallPass = $false }
            default             { Write-Fail "Alarm state: $state. Reason: $reason"; $overallPass = $false }
        }
    }
}

Write-Host ""
Write-Host "=== 2. SNS email subscription ===" -ForegroundColor Cyan
$topicArn = aws ssm get-parameter `
    --name $SsmParamName `
    --region $SsmRegion --profile $ProfileName `
    --query "Parameter.Value" --output text 2>&1
if ($LASTEXITCODE -ne 0 -or -not $topicArn -or $topicArn -eq "None") {
    Write-Fail "SSM param $SsmParamName not found in $SsmRegion. Was 02_billing_alarm.py up run?"
    $overallPass = $false
} else {
    $subsJson = aws sns list-subscriptions-by-topic `
        --topic-arn $topicArn `
        --region $BillingRegion --profile $ProfileName `
        --output json 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Could not list subscriptions: $subsJson"
        $overallPass = $false
    } else {
        $subs = ($subsJson | ConvertFrom-Json).Subscriptions
        if (-not $subs -or $subs.Count -eq 0) {
            Write-Fail "No subscriptions on topic. Re-run 02_billing_alarm.py up."
            $overallPass = $false
        } else {
            $confirmed = $subs | Where-Object { $_.SubscriptionArn -notin @("PendingConfirmation", "Deleted") }
            $pending   = $subs | Where-Object { $_.SubscriptionArn -eq "PendingConfirmation" }
            foreach ($s in $confirmed) {
                $endpoint = $s.Endpoint
                $protocol = $s.Protocol
                Write-Pass "Subscription confirmed: $endpoint [$protocol]"
            }
            foreach ($s in $pending) {
                $endpoint = $s.Endpoint
                Write-Pend "Subscription pending: $endpoint - click the Confirm subscription link from no-reply@sns.amazonaws.com"
                $overallPass = $false
            }
        }
    }
}

Write-Host ""
Write-Host "=== 3. AWS/Billing/EstimatedCharges metric publishing ===" -ForegroundColor Cyan
$metricsJson = aws cloudwatch list-metrics `
    --namespace "AWS/Billing" `
    --metric-name "EstimatedCharges" `
    --region $BillingRegion --profile $ProfileName `
    --output json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Could not list metrics: $metricsJson"
    $overallPass = $false
} else {
    $metrics = ($metricsJson | ConvertFrom-Json).Metrics
    if (-not $metrics -or $metrics.Count -eq 0) {
        Write-Pend "No EstimatedCharges metric yet. Either Receive Billing Alerts is OFF at the account root, OR it was just enabled and AWS has not published the first data point yet (can take up to 24h). Re-run this verify in a few hours."
        $overallPass = $false
    } else {
        $dimCount = $metrics.Count
        Write-Pass "EstimatedCharges metric is publishing - $dimCount dimension combinations"
        $startTime = (Get-Date).ToUniversalTime().AddHours(-24).ToString("yyyy-MM-ddTHH:mm:ssZ")
        $endTime   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        $stats = aws cloudwatch get-metric-statistics `
            --namespace "AWS/Billing" `
            --metric-name "EstimatedCharges" `
            --dimensions "Name=Currency,Value=USD" `
            --start-time $startTime `
            --end-time   $endTime `
            --period 21600 --statistics Maximum `
            --region $BillingRegion --profile $ProfileName `
            --output json 2>&1
        if ($LASTEXITCODE -eq 0) {
            $points = ($stats | ConvertFrom-Json).Datapoints | Sort-Object Timestamp -Descending
            if ($points -and $points.Count -gt 0) {
                $maxVal = $points[0].Maximum
                $ts     = $points[0].Timestamp
                Write-Host "       Latest data point: USD $maxVal at $ts" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""
if ($overallPass) {
    Write-Host "All checks passed. Billing alarm is fully armed." -ForegroundColor Green
    exit 0
} else {
    Write-Host "One or more checks pending or failed. See lines above." -ForegroundColor Yellow
    exit 1
}
