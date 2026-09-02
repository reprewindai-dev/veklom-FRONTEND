$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ExitCode = 1

Push-Location $Repo
try {
    docker compose -f docker-compose.ci.yml run --rm --build gate
    $ExitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

exit $ExitCode
