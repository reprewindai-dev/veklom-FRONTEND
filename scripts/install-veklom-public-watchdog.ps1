$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Watchdog = Join-Path $PSScriptRoot "veklom-public-watchdog.ps1"
$TaskName = "Veklom Public Watchdog"

if (-not (Test-Path $Watchdog)) {
    throw "Watchdog not found at $Watchdog"
}

$actionArgs = @{
    Execute = "powershell.exe"
    Argument = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Watchdog`""
}
$action = New-ScheduledTaskAction @actionArgs

$triggers = @(
    (New-ScheduledTaskTrigger -AtLogOn),
    (New-ScheduledTaskTrigger -AtStartup)
)

$settingsArgs = @{
    AllowStartIfOnBatteries = $true
    DontStopIfGoingOnBatteries = $true
    StartWhenAvailable = $true
    RestartCount = 999
    RestartInterval = (New-TimeSpan -Minutes 1)
    ExecutionTimeLimit = (New-TimeSpan -Days 3650)
}
$settings = New-ScheduledTaskSettingsSet @settingsArgs

try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

    $registerArgs = @{
        TaskName = $TaskName
        Action = $action
        Trigger = $triggers
        Settings = $settings
        Description = "Keeps the Veklom local frontend and Cloudflare transport healthy without killing unrelated Node processes."
        RunLevel = "Highest"
    }
    Register-ScheduledTask @registerArgs | Out-Null

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
