#!/usr/bin/env pwsh
# =============================================================================
# VEKLOM RING DEPLOY — One build, all services, own hardware + Cloudflare
# =============================================================================
# Deploy stack:
#   GnomLedger   → localhost:8001  (PGL / evidence ledger)
#   CAPPO        → localhost:8002  (consequence authority)
#   cAPI         → localhost:3003  (governed connection fabric)
#   LockerPhycer → localhost:8092  (identity / auth)
#   Frontend     → localhost:3037  (Capability OS UI)
#
# Cloudflare tunnels expose these to the public domain.
# No CI/CD. No Vercel. No Coolify. No Hetzner.
# =============================================================================

param(
    [string[]]$Services = @("all"),
    [switch]$Pull,
    [switch]$NoCache,
    [switch]$Down
)

$REPO_ROOT = "C:\Users\antho\.windsurf"

$SERVICE_MAP = @{
    "gnomledger"   = @{ Path = "$REPO_ROOT\gnomledger";             Port = 8001; Name = "GnomLedger (PGL)" }
    "cappo"        = @{ Path = "$REPO_ROOT\cappo-backend";          Port = 8002; Name = "CAPPO" }
    "capi"         = @{ Path = "$REPO_ROOT\cAPI";                   Port = 3003; Name = "cAPI" }
    "lockerphycer" = @{ Path = "$REPO_ROOT\lockerphycer";           Port = 8092; Name = "LockerPhycer" }
    "frontend"     = @{ Path = "$REPO_ROOT\veklom-control-plane";   Port = 3037; Name = "Frontend (Capability OS)" }
}

$BUILD_ORDER = @("gnomledger", "cappo", "capi", "lockerphycer", "frontend")

function Write-Step([string]$msg) {
    Write-Host ""
    Write-Host "━━━ $msg" -ForegroundColor Cyan
}

function Test-Health([string]$service, [int]$port) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            Write-Host "  ✅ $service healthy on :$port" -ForegroundColor Green
            return $true
        }
    } catch {}
    Write-Host "  ❌ $service not responding on :$port" -ForegroundColor Red
    return $false
}

# ─── DOWN ────────────────────────────────────────────────────────────────────
if ($Down) {
    Write-Step "TEARING DOWN ALL SERVICES"
    foreach ($svc in $BUILD_ORDER) {
        $cfg = $SERVICE_MAP[$svc]
        Write-Host "  Stopping $($cfg.Name)..." -ForegroundColor Yellow
        Push-Location $cfg.Path
        docker compose down 2>&1 | Out-Null
        Pop-Location
    }
    Write-Host "`n✅ All services stopped." -ForegroundColor Green
    exit 0
}

# ─── TARGET SELECTION ────────────────────────────────────────────────────────
$targets = if ($Services -contains "all") { $BUILD_ORDER } else { $Services }

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║       VEKLOM RING DEPLOY                 ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host "  Targets: $($targets -join ', ')"
Write-Host "  Pull latest: $Pull"
Write-Host "  No cache:    $NoCache"

# ─── PULL LATEST CODE ────────────────────────────────────────────────────────
if ($Pull) {
    Write-Step "PULLING LATEST FROM GIT"
    foreach ($svc in $targets) {
        $cfg = $SERVICE_MAP[$svc]
        Write-Host "  git pull → $($cfg.Name)" -ForegroundColor DarkCyan
        Push-Location $cfg.Path
        git pull --rebase 2>&1 | Tail -1
        Pop-Location
    }
}

# ─── BUILD + START ───────────────────────────────────────────────────────────
Write-Step "BUILDING AND STARTING SERVICES"

foreach ($svc in $targets) {
    $cfg = $SERVICE_MAP[$svc]
    Write-Host ""
    Write-Host "  Building $($cfg.Name)..." -ForegroundColor Yellow

    Push-Location $cfg.Path

    $buildArgs = @("compose", "build")
    if ($NoCache) { $buildArgs += "--no-cache" }

    $upArgs = @("compose", "up", "-d", "--remove-orphans")

    # Use docker-compose.public.yml for frontend
    if ($svc -eq "frontend") {
        $buildArgs += @("-f", "docker-compose.public.yml")
        $upArgs    += @("-f", "docker-compose.public.yml")
    }

    docker @buildArgs 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "    $_" }
    docker @upArgs   2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "    $_" }

    Pop-Location
}

# ─── HEALTH CHECK ────────────────────────────────────────────────────────────
Write-Step "HEALTH CHECKS (waiting 8s for containers to settle)"
Start-Sleep -Seconds 8

$allHealthy = $true
foreach ($svc in $targets) {
    $cfg = $SERVICE_MAP[$svc]
    $ok = Test-Health $svc $cfg.Port
    if (-not $ok) { $allHealthy = $false }
}

# ─── SUMMARY ────────────────────────────────────────────────────────────────
Write-Host ""
if ($allHealthy) {
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅  ALL SERVICES HEALTHY                ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
} else {
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ⚠️   SOME SERVICES FAILED — CHECK ABOVE ║" -ForegroundColor Red
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Red
}

Write-Host ""
Write-Host "  Service map:"
Write-Host "    GnomLedger (PGL)    → http://localhost:8001"
Write-Host "    CAPPO               → http://localhost:8002"
Write-Host "    cAPI                → http://localhost:3003"
Write-Host "    LockerPhycer        → http://localhost:8092"
Write-Host "    Frontend (COS)      → http://localhost:3037"
Write-Host ""
Write-Host "  Cloudflare tunnels expose these on veklom.com"
Write-Host ""
