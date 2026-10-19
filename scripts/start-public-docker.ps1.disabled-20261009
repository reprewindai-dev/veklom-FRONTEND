$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Compose = Join-Path $Repo "docker-compose.public.yml"

$dockerReady = $false
for ($attempt = 1; $attempt -le 60; $attempt++) {
    docker info *> $null
    if ($LASTEXITCODE -eq 0) {
        $dockerReady = $true
        break
    }
    Start-Sleep -Seconds 3
}

if (-not $dockerReady) {
    throw "Docker engine did not become available."
}

Push-Location $Repo
try {
    docker compose -f $Compose up -d
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose up failed."
    }
} finally {
    Pop-Location
}
