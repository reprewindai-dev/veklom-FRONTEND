$ErrorActionPreference = "Stop"

$canonical = Join-Path $PSScriptRoot "veklom-public-watchdog.ps1"
if (-not (Test-Path $canonical)) {
    throw "Canonical watchdog not found at $canonical"
}

Write-Host "Delegating to canonical Veklom public watchdog: $canonical"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $canonical
exit $LASTEXITCODE
