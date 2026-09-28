$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Compose = Join-Path $Repo "docker-compose.public.yml"
$PreviousSourceCommit = $env:SOURCE_COMMIT_SHA
$PreviousImageId = $env:VEKLOM_RUNTIME_IMAGE_ID

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

try {
    $GitStatus = & git -C $Repo status --porcelain --untracked-files=all
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to inspect source-tree state."
    }
    if ($GitStatus) {
        throw "Refusing provenance build from a dirty source tree."
    }

    $SourceCommit = (& git -C $Repo rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $SourceCommit -notmatch '^[0-9a-f]{40}$') {
        throw "Unable to resolve the exact source commit."
    }
    $env:SOURCE_COMMIT_SHA = $SourceCommit

    Push-Location $Repo
    try {
        docker compose -f $Compose build frontend
        if ($LASTEXITCODE -ne 0) {
            throw "Public frontend image build failed."
        }

        $ImageId = (& docker image inspect veklom-frontend:main --format '{{.Id}}').Trim()
        if ($LASTEXITCODE -ne 0 -or $ImageId -notmatch '^sha256:[0-9a-f]{64}$') {
            throw "Unable to resolve the built frontend image ID."
        }
        $env:VEKLOM_RUNTIME_IMAGE_ID = $ImageId

        docker compose -f $Compose up -d --no-build
        if ($LASTEXITCODE -ne 0) {
            throw "Public stack start failed."
        }
    } finally {
        Pop-Location
    }
} finally {
    $env:SOURCE_COMMIT_SHA = $PreviousSourceCommit
    $env:VEKLOM_RUNTIME_IMAGE_ID = $PreviousImageId
}
