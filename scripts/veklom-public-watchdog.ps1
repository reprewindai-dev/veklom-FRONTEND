$ErrorActionPreference = "SilentlyContinue"
$Repo = "C:\Users\antho\.windsurf\veklom-control-plane"
$LogFile = Join-Path $Repo "logs\veklom-public-watchdog.log"

function Log-Msg($msg) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    "$timestamp - $msg" | Out-File -FilePath $LogFile -Append
    Write-Host "$timestamp - $msg"
}

Log-Msg "Starting Veklom public watchdog..."

while ($true) {
    Start-Sleep -Seconds 60
    
    # 1. Check local Next.js origin
    $localOk = $false
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:3002/" -UseBasicParsing -TimeoutSec 10
        if ($res.StatusCode -eq 200) { $localOk = $true }
    } catch {
        # Failed
    }

    # 2. Check public Cloudflare endpoint
    $publicOk = $false
    try {
        $res = Invoke-WebRequest -Uri "https://veklom.com/" -UseBasicParsing -TimeoutSec 10
        if ($res.StatusCode -eq 200) { $publicOk = $true }
    } catch {
        # Failed
    }

    if (-not $localOk) {
        Log-Msg "Local origin localhost:3002 is DOWN. Restarting Next.js production server..."
        Start-Process -FilePath "powershell.exe" -ArgumentList "-WindowStyle Hidden -File $Repo\scripts\start-veklom-next.ps1"
        Log-Msg "Restarted Next.js. Status -> Local: DOWN, Public: $publicOk"
        Start-Sleep -Seconds 10
    }
    elseif ($localOk -and -not $publicOk) {
        Log-Msg "Public origin veklom.com is DOWN (502). Restarting cloudflared..."
        Stop-Process -Name "cloudflared" -Force
        Start-Sleep -Seconds 2
        Start-Process -FilePath "C:\Program Files (x86)\cloudflared\cloudflared.exe" -ArgumentList "tunnel --config C:\Users\antho\.cloudflared\config.yml run veklom-local-edge" -WindowStyle Hidden
        Log-Msg "Restarted cloudflared. Status -> Local: UP, Public: DOWN"
    } else {
        Log-Msg "Health check passed. Local: UP, Public: UP"
    }
}
