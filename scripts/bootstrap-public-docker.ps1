$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Runtime = Join-Path $Repo ".veklom\runtime\cloudflared"
$GeneratedConfig = Join-Path $Runtime "config.yml"
$GeneratedCredentials = Join-Path $Runtime "credentials.json"
$Compose = Join-Path $Repo "docker-compose.public.yml"
$TunnelId = "0061f2f2-3eaf-4fb6-add3-5916f8cc651c"

New-Item -ItemType Directory -Force -Path $Runtime | Out-Null

$configCandidates = @(
    (Join-Path $env:USERPROFILE ".cloudflared\config.yml"),
    "C:\ProgramData\Veklom\cloudflared\config.yml"
)
$SourceConfig = $configCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $SourceConfig) {
    throw "Existing Cloudflare tunnel config.yml was not found. Refusing to invent ingress rules."
}

$existing = Get-Content $SourceConfig -Raw
$credentialMatch = [regex]::Match($existing, '(?mi)^\s*credentials-file:\s*(.+?)\s*$')
$SourceCredentials = $null
if ($credentialMatch.Success) {
    $candidate = $credentialMatch.Groups[1].Value.Trim().Trim('"').Trim("'")
    if (Test-Path $candidate) { $SourceCredentials = $candidate }
}

if (-not $SourceCredentials) {
    $fallback = Join-Path $env:USERPROFILE ".cloudflared\$TunnelId.json"
    if (Test-Path $fallback) { $SourceCredentials = $fallback }
}

if (-not $SourceCredentials) {
    throw "Cloudflare tunnel credential file was not found."
}

Copy-Item $SourceCredentials $GeneratedCredentials -Force

# Preserve the existing ingress map. Only translate host-local services into Docker network addresses.
$generated = $existing
$generated = [regex]::Replace(
    $generated,
    '(?mi)^\s*credentials-file:\s*.+$',
    'credentials-file: /etc/cloudflared/credentials.json'
)
$generated = $generated -replace 'http://(?:127\.0\.0\.1|localhost):3002', 'http://frontend:3002'
$generated = $generated -replace 'http://(?:127\.0\.0\.1|localhost):', 'http://host.docker.internal:'

# The public frontend hostnames must terminate at the Docker-managed frontend.
$lines = $generated -split "`r?`n"
$publicHosts = @('veklom.com', 'www.veklom.com', 'app.veklom.com')
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*-\s*hostname:\s*["'']?([^"'']+)["'']?\s*$') {
        $hostname = $Matches[1].Trim()
        if ($publicHosts -contains $hostname) {
            for ($j = $i + 1; $j -lt [Math]::Min($i + 8, $lines.Count); $j++) {
                if ($lines[$j] -match '^\s*-\s*hostname:' -or $lines[$j] -match '^\s*-\s*service:') { break }
                if ($lines[$j] -match '^(\s*)service:\s*.+$') {
                    $indent = $Matches[1]
                    $lines[$j] = "${indent}service: http://frontend:3002"
                    break
                }
            }
        }
    }
}
$generated = $lines -join "`r`n"
Set-Content -Path $GeneratedConfig -Value $generated -Encoding utf8

# Validate the generated config using the same cloudflared image that will run it.
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    $desktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $desktop) {
        Start-Process -FilePath $desktop | Out-Null
    }
    $ready = $false
    for ($attempt = 1; $attempt -le 60; $attempt++) {
        Start-Sleep -Seconds 3
        docker info *> $null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    }
    if (-not $ready) { throw "Docker Desktop did not become available." }
}

Push-Location $Repo
try {
    docker run --rm `
        -v "${GeneratedConfig}:/etc/cloudflared/config.yml:ro" `
        -v "${GeneratedCredentials}:/etc/cloudflared/credentials.json:ro" `
        cloudflare/cloudflared:latest `
        tunnel --config /etc/cloudflared/config.yml ingress validate
    if ($LASTEXITCODE -ne 0) { throw "Generated Cloudflare ingress config failed validation." }

    docker compose -f $Compose up -d --build --remove-orphans
    if ($LASTEXITCODE -ne 0) { throw "Docker public stack failed to start." }
} finally {
    Pop-Location
}

$healthy = $false
for ($attempt = 1; $attempt -le 18; $attempt++) {
    Start-Sleep -Seconds 5
    try {
        $local = Invoke-WebRequest -Uri "http://127.0.0.1:3002/api/health" -UseBasicParsing -TimeoutSec 8
        if ($local.StatusCode -eq 200) { $healthy = $true; break }
    } catch { }
}
if (-not $healthy) {
    docker logs --tail 100 veklom-frontend
    throw "Veklom frontend container did not become healthy."
}

# Install current-user logon recovery. Failure here does not invalidate the already-running Docker stack.
try {
    $startScript = Join-Path $PSScriptRoot "start-public-docker.ps1"
    $watchdogScript = Join-Path $PSScriptRoot "docker-public-watchdog.ps1"
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

    $startAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startScript`""
    $startTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    Register-ScheduledTask -TaskName "VeklomPublicDockerStart" -Action $startAction -Trigger $startTrigger -Settings $settings -Force | Out-Null

    $watchAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$watchdogScript`""
    $watchTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    Register-ScheduledTask -TaskName "VeklomPublicDockerWatchdog" -Action $watchAction -Trigger $watchTrigger -Settings $settings -Force | Out-Null

    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        '-NoProfile', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', $watchdogScript
    ) -WindowStyle Hidden | Out-Null
} catch {
    Write-Warning "Docker stack is running, but logon watchdog registration failed: $($_.Exception.Message)"
}

try {
    $public = Invoke-WebRequest -Uri "https://veklom.com/api/health" -UseBasicParsing -TimeoutSec 20
    Write-Host "VEKLOM PUBLIC HEALTH HTTP $($public.StatusCode)"
} catch {
    Write-Warning "Local Docker frontend is healthy, but the public Cloudflare route has not recovered yet. Inspect: docker logs veklom-cloudflared"
}

Write-Host "Docker public stack is active."
docker compose -f $Compose ps
