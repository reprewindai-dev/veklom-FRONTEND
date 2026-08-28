$ErrorActionPreference = "SilentlyContinue"
$logFile = "$PSScriptRoot\..\logs\veklom-public-watchdog.log"

function Log-Msg($msg) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    "$timestamp - $msg" | Out-File -FilePath $logFile -Append
    Write-Host "$timestamp - $msg"
}

Log-Msg "Starting Veklom public watchdog..."

# Prevent Sleep
# Using PowerShell to send F15 key every 4 minutes (240s) prevents sleep without admin privileges
$wsh = New-Object -ComObject WScript.Shell

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

    if (-not $localOk) {
        Log-Msg "Local origin localhost:3002 is DOWN. Restarting Next.js production server..."
        Stop-Process -Name "node" -Force
        Start-Sleep -Seconds 2
        # Start detached Next.js server
        Start-Process -FilePath "npx" -ArgumentList "next start -H 0.0.0.0 -p 3002" -WindowStyle Hidden -WorkingDirectory "$PSScriptRoot\.."
        Log-Msg "Restarted Next.js."
        Start-Sleep -Seconds 10 # Wait for it to boot before checking tunnel
    }

    # 2. Check public Cloudflare endpoint
    $publicOk = $false
    try {
        $res = Invoke-WebRequest -Uri "https://veklom.com/" -UseBasicParsing -TimeoutSec 10
        if ($res.StatusCode -eq 200) { $publicOk = $true }
    } catch {
        # Failed
    }

    if (-not $publicOk) {
        Log-Msg "Public origin veklom.com is DOWN (502). Restarting cloudflared tunnel..."
        Stop-Process -Name "cloudflared" -Force
        Start-Sleep -Seconds 2
        Start-Process -FilePath "C:\Program Files (x86)\cloudflared\cloudflared.exe" -ArgumentList "tunnel --config C:\Users\antho\.cloudflared\config.yml run veklom-local-edge" -WindowStyle Hidden
        Log-Msg "Restarted cloudflared."
    }

    # Anti-sleep jitter (send F15)
    $wsh.SendKeys("{F15}")
}
