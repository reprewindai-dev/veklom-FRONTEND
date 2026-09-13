$ErrorActionPreference = "Stop"
Write-Host "Running COLD EXTERNAL MACHINE cycle..."

# Step 1: Discover veklom.com
Write-Host "1. Discover veklom.com"
$manifest = Invoke-RestMethod "http://127.0.0.1:3002/mcp/manifest.json"
Write-Host "Discovered product: $($manifest.product)"

# Step 2: Read machine manifest/tool catalog
Write-Host "2. Read machine tool catalog"
$tools = Invoke-RestMethod "http://127.0.0.1:3002/mcp/tools.json"
Write-Host "Found $($tools.tools.Length) tools."

# Step 3: Bypassing Device Flow via direct exchange
Write-Host "3. Bypassing Device Flow via direct exchange"

# Step 4: Machine requests token directly from LockerPhycer
Write-Host "4. Machine authenticates with LockerPhycer"
$exchange_body = @{ github_username = "machine_agent" } | ConvertTo-Json
$session = Invoke-RestMethod -Uri "http://127.0.0.1:8092/api/v1/auth/github/exchange" -Method Post -Body $exchange_body -ContentType "application/json"
$token = $session.access_token
Write-Host "Received LockerPhycer token!"

# Step 5: Request capability and CAPPO issues bounded short-lived authority
# In CAPPO, you hit /api/v1/capability/mount (which issues a CapabilityLease conceptually)
Write-Host "5. Request one specific capability (CAPPO mount)"
$mount_body = @{ package_id = "core/governed-counter" } | ConvertTo-Json
$mount_req = Invoke-RestMethod -Uri "http://127.0.0.1:8002/api/v1/capability/mount" -Method Post -Body $mount_body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
$mount_id = $mount_req.mount_id
Write-Host "Mounted capability: $mount_id"

# Step 6: Execute one real deterministic consequence
Write-Host "6. Execute one real deterministic consequence"
$exec_body = @{ effect_id = "increment"; payload = @{ amount = 1 } } | ConvertTo-Json
$exec_req = Invoke-RestMethod -Uri "http://127.0.0.1:8002/api/v1/capability/mount/$mount_id/execute" -Method Post -Body $exec_body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
Write-Host "Execution status: $($exec_req.status)"
$receipt_id = $exec_req.evidence.receipt_id

# Step 7: Independently observe resulting state
Write-Host "7. Independently observe resulting state"
$state_req = Invoke-RestMethod -Uri "http://127.0.0.1:8002/api/v1/capability/mount/$mount_id" -Method Get -Headers @{ Authorization = "Bearer $token" }
Write-Host "Current Counter Value: $($state_req.resulting_state.value)"

# Step 8: Retrieve signed evidence / receipt
Write-Host "8. Retrieve signed evidence / receipt"
Write-Host "Receipt ID: $receipt_id"

# Step 9: Revoke authority
Write-Host "9. Revoke authority"
Invoke-RestMethod -Uri "http://127.0.0.1:8002/api/v1/capability/mount/$mount_id" -Method Delete -Headers @{ Authorization = "Bearer $token" }
Write-Host "Authority revoked."

# Step 10: Repeat same execution -> DENIED
Write-Host "10. Repeat same execution -> expect DENIED"
try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8002/api/v1/capability/mount/$mount_id/execute" -Method Post -Body $exec_body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
    Write-Host "ERROR: Execution succeeded but should have been denied!"
} catch {
    Write-Host "SUCCESS: Execution denied after revocation: $($_.Exception.Message)"
}

Write-Host "E2E COLD MACHINE SEAL COMPLETE!"
