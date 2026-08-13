param (
    [string]$Token = $env:COOLIFY_API_TOKEN
)

if (-not $Token) {
    if (Test-Path ".env") {
        # Try to load from .env
        Get-Content .env | Where-Object { $_ -match "^COOLIFY_API_TOKEN=(.*)" } | ForEach-Object {
            $Token = $matches[1]
        }
    }
}

if (-not $Token) {
    Write-Error "COOLIFY_API_TOKEN is required. Pass it as a parameter, set it as an environment variable, or place it in .env"
    exit 1
}

$Uuid = "m140xyp0jbx3g3rna626jd2r"
$Url = "http://5.78.135.11:8000/api/v1/deploy?uuid=$Uuid&force=false"

Write-Host "Triggering Coolify deployment for veklom-control-plane ($Uuid)..."

$Headers = @{
    "Authorization" = "Bearer $Token"
}

try {
    $Response = Invoke-RestMethod -Uri $Url -Method Get -Headers $Headers
    Write-Host "Success! Deployment triggered."
    $Response | Format-List
} catch {
    Write-Error "Deployment failed to trigger. $_"
    exit 1
}
