$ErrorActionPreference = "SilentlyContinue"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Compose = Join-Path $Repo "docker-compose.public.yml"
$LogDir = Join-Path $Repo "logs"
$LogFile = Join-Path $LogDir "docker-public-watchdog.log"
$PublicHealth = "https://veklom.com/api/health"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log-Msg([string]$Message) {
    $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    "$ts - $Message" | Out-File -FilePath $LogFile -Append
}

function Docker-Ready {
    docker info *> $null
    return $LASTEXITCODE -eq 0
}

function Container-State([string]$Name) {
    $raw = docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $Name 2>$null
    if ($LASTEXITCODE -ne 0) { return "missing|missing" }
    return $raw.Trim()
}

function Public-Healthy {
    try {
        $res = Invoke-WebRequest -Uri $PublicHealth -UseBasicParsing -TimeoutSec 12
        return $res.StatusCode -eq 200
    } catch {
        return $false
    }
}

Log-Msg "Starting Docker public-site watchdog."

while ($true) {
    if (-not (Docker-Ready)) {
        Log-Msg "Docker engine unavailable."
        Start-Sleep -Seconds 30
        continue
    }

    $frontend = Container-State "veklom-frontend"
    $tunnel = Container-State "veklom-cloudflared"

    if ($frontend -notmatch '^running\|healthy$') {
        Log-Msg "Frontend state=$frontend. Recovering stack."
        Push-Location $Repo
        docker compose -f $Compose up -d *> $null
        Pop-Location
        Start-Sleep -Seconds 15
        $frontend = Container-State "veklom-frontend"
    }

    if ($tunnel -notmatch '^running\|') {
        Log-Msg "Tunnel state=$tunnel. Recovering tunnel."
        Push-Location $Repo
        docker compose -f $Compose up -d cloudflared *> $null
        Pop-Location
        Start-Sleep -Seconds 10
        $tunnel = Container-State "veklom-cloudflared"
    }

    $publicOk = Public-Healthy
    if (-not $publicOk -and $frontend -match '^running\|healthy$') {
        Log-Msg "Public route unhealthy while frontend is healthy. Restarting cloudflared container only."
        docker restart veklom-cloudflared *> $null
        Start-Sleep -Seconds 12
        $publicOk = Public-Healthy
    }

    Log-Msg "Health -> frontend=$frontend tunnel=$tunnel public=$publicOk"
    Start-Sleep -Seconds 60
}
