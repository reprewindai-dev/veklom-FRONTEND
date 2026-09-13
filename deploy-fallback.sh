#!/bin/bash
set -e

TOKEN="${1:-$COOLIFY_API_TOKEN}"

if [ -z "$TOKEN" ] && [ -f .env ]; then
    TOKEN=$(grep '^COOLIFY_API_TOKEN=' .env | cut -d '=' -f2-)
fi

if [ -z "$TOKEN" ]; then
    echo "COOLIFY_API_TOKEN is required. Pass it as a parameter, set it as an environment variable, or place it in .env"
    exit 1
fi

UUID="m140xyp0jbx3g3rna626jd2r"
URL="http://5.78.135.11:8000/api/v1/deploy?uuid=$UUID&force=false"

echo "Triggering Coolify deployment for veklom-control-plane ($UUID)..."

curl -s -X GET "$URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/json"

echo ""
echo "Success! Deployment triggered."
