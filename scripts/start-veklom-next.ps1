$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$LogDir = Join-Path $Repo "logs"
$StdoutLog = Join-Path $LogDir "veklom-next.stdout.log"
$StderrLog = Join-Path $LogDir "veklom-next.stderr.log"
$PidFile = Join-Path $LogDir "veklom-next.pid"
$Port = 3002

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Set-Location $Repo

function Get-PortListenerPid {
    try {
        $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1
        if ($listener) { return [int]$listener.OwningProcess }
    } catch {
        $line = netstat -ano | Select-String ":$Port" | Where-Object { $_ -match "LISTENING" } | Select-Object -First 1
        if ($line) {
            $parts = ($line -split "\s+") | Where-Object { $_ }
            if ($parts[-1] -match "^\d+$") { return [int]$parts[-1] }
        }
    }
    return $null
}

$existingPid = Get-PortListenerPid
if ($existingPid) {
    Write-Host "Stopping only the process listening on port $Port (PID $existingPid)."
    Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

if (-not (Test-Path (Join-Path $Repo ".next\BUILD_ID"))) {
    Write-Host "No production .next build found. Building before restart..."
    if (-not (Test-Path (Join-Path $Repo "node_modules"))) {
        & npm.cmd ci --legacy-peer-deps
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
    }
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw "Next.js production build failed with exit code $LASTEXITCODE" }
}

Write-Host "Starting Veklom Next.js on port $Port from $Repo"
$process = Start-Process \
    -FilePath "npx.cmd" \
    -ArgumentList @("next", "start", "-H", "0.0.0.0", "-p", "$Port") \
    -WorkingDirectory $Repo \
    -WindowStyle Hidden \
    -RedirectStandardOutput $StdoutLog \
    -RedirectStandardError $StderrLog \
    -PassThru

$process.Id | Set-Content -Path $PidFile -Encoding ascii
Write-Host "Started managed Veklom frontend PID $($process.Id)."
