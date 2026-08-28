$ErrorActionPreference = "SilentlyContinue"
$Repo = "C:\Users\antho\.windsurf\veklom-control-plane"
$LogDir = Join-Path $Repo "logs"

# Ensure logs directory exists
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Set-Location $Repo

# Find existing process on port 3002
$existing = netstat -ano | Select-String ":3002"
if ($existing) {
    foreach ($line in $existing) {
        if ($line -match "LISTENING") {
            $parts = ($line -split "\s+") | Where-Object { $_ }
            $pidToKill = $parts[-1]
            if ($pidToKill -match "^\d+$") {
                Write-Host "Killing stale process $pidToKill on port 3002"
                Stop-Process -Id ([int]$pidToKill) -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 1
            }
        }
    }
}

# Start the Next.js server directly
$env:PORT = "3002"
Write-Host "Starting Next.js on port 3002"
npx next start -H 0.0.0.0 -p 3002 *>> "$LogDir\veklom-next.log"
