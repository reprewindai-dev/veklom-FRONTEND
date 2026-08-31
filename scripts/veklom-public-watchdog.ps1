$ErrorActionPreference = "SilentlyContinue"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$LogDir = Join-Path $Repo "logs"
$LogFile = Join-Path $LogDir "veklom-public-watchdog.log"
$HealthUrl = "http://127.0.0.1:3002/api/health"
$PublicUrl = "https://veklom.com/api/health"
$TunnelName = "veklom-local-edge"
$TunnelConfigCandidates = @(
    "C:\ProgramData\Veklom\cloudflared\config.yml",
    (Join-Path $env:USERPROFILE ".cloudflared\config.yml")
)

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log-Msg([string]$Message) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    "$timestamp - $Message" | Out-File -FilePath $LogFile -Append
    Write-Host "$timestamp - $Message"
}

function Test-Http200([string]$Url) {
    try {
        $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        return $res.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Find-Cloudflared {
    $cmd = Get-Command cloudflared.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $candidates = @(
        "C:\Program Files (x86)\cloudflared\cloudflared.exe",
        "C:\Program Files\cloudflared\cloudflared.exe"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}

function Find-TunnelConfig {
    foreach ($candidate in $TunnelConfigCandidates) {
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}

function Restart-LocalFrontend {
    Log-Msg "Local frontend health probe failed. Restarting only the managed port-3002 frontend."
    $startScript = Join-Path $PSScriptRoot "start-veklom-next.ps1"
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $startScript
    ) -WindowStyle Hidden | Out-Null

    for ($attempt = 1; $attempt -le 6; $attempt++) {
        Start-Sleep -Seconds 5
        if (Test-Http200 $HealthUrl) {
            Log-Msg "Local frontend recovered on attempt $attempt."
            return $true
        }
    }

    Log-Msg "Local frontend did not recover after restart attempts. Check logs\veklom-next.stderr.log."
    return $false
}

function Restart-Cloudflared {
    $cloudflared = Find-Cloudflared
    if (-not $cloudflared) {
        Log-Msg "cloudflared executable not found; cannot restart tunnel."
        return $false
    }

    $tunnelConfig = Find-TunnelConfig
    if (-not $tunnelConfig) {
        Log-Msg "Cloudflare tunnel config not found in canonical locations."
        return $false
    }

    Log-Msg "Local frontend is healthy but public domain is not. Restarting only cloudflared."
    Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Start-Process -FilePath $cloudflared -ArgumentList @(
        "tunnel",
        "--config", $tunnelConfig,
        "run", $TunnelName
    ) -WindowStyle Hidden | Out-Null

    for ($attempt = 1; $attempt -le 6; $attempt++) {
        Start-Sleep -Seconds 5
        if (Test-Http200 $PublicUrl) {
            Log-Msg "Cloudflare public route recovered on attempt $attempt."
            return $true
        }
    }

    Log-Msg "Public route did not recover after cloudflared restart."
    return $false
}

Log-Msg "Starting sovereign Veklom public watchdog from $Repo"

while ($true) {
    $localOk = Test-Http200 $HealthUrl
    $publicOk = Test-Http200 $PublicUrl

    if (-not $localOk) {
        $localOk = Restart-LocalFrontend
    }

    if ($localOk -and -not $publicOk) {
        $publicOk = Restart-Cloudflared
    }

    Log-Msg "Health -> local=$localOk public=$publicOk"
    Start-Sleep -Seconds 60
}
