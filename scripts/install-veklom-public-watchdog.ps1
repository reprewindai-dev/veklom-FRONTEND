$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Watchdog = Join-Path $PSScriptRoot "veklom-public-watchdog.ps1"
$TaskName = "Veklom Public Watchdog"

if (-not (Test-Path $Watchdog)) {
    throw "Watchdog not found at $Watchdog"
}

$action = New-ScheduledTaskAction \
    -Execute "powershell.exe" \
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Watchdog`""

$triggers = @(
    New-ScheduledTaskTrigger -AtLogOn,
    New-ScheduledTaskTrigger -AtStartup
)

$settings = New-ScheduledTaskSettingsSet \
    -AllowStartIfOnBatteries \
    -DontStopIfGoingOnBatteries \
    -StartWhenAvailable \
    -RestartCount 999 \
    -RestartInterval (New-TimeSpan -Minutes 1) \
    -ExecutionTimeLimit (New-TimeSpan -Days 3650)

try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask \
        -TaskName $TaskName \
        -Action $action \
        -Trigger $triggers \
        -Settings $settings \
        -Description "Keeps the Veklom local frontend and Cloudflare transport healthy without killing unrelated Node processes." \
        -RunLevel Highest | Out-Null

    Start-ScheduledTask -TaskName $TaskName
    Write-Host "Installed and started '$TaskName'."
    Write-Host "Repository: $Repo"
    Write-Host "Watchdog:   $Watchdog"
} catch {
    Write-Host "Could not install the startup task with elevated privileges."
    Write-Host "Run PowerShell as Administrator and execute:"
    Write-Host "  & `"$PSCommandPath`""
    throw
}
