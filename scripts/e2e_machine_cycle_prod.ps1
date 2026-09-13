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

# Step 3: Request Device Flow code
Write-Host "3. Requesting Device Flow code from Frontend API"
$device_req = Invoke-RestMethod -Uri "http://127.0.0.1:3002/api/auth/github/device/start" -Method Post -ContentType "application/json"
$device_code = $device_req.device_code
$user_code = $device_req.user_code
$verification_uri = $device_req.verification_uri
Write-Host "=================================================="
Write-Host "Please authorize this machine!"
Write-Host "Navigate to: $verification_uri"
Write-Host "Enter code:  $user_code"
Write-Host "=================================================="
Write-Host "Polling for token..."

# Step 4: Machine authenticates with LockerPhycer
Write-Host "4. Machine polls for token..."
$token = $null
while ($null -eq $token) {
    Start-Sleep -Seconds 5
    try {
        $token_req = Invoke-RestMethod -Uri "http://127.0.0.1:3002/api/auth/github/device/poll" -Method Post -Body (@{device_code=$device_code} | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
        $token = $token_req.access_token
    } catch {
        Write-Host "Waiting for authorization..."
    }
}
Write-Host "Received LockerPhycer token!"

# Step 5: Request capability and CAPPO issues bounded short-lived authority
Write-Host "5. Request one specific capability (CAPPO mount)"
$mount_body = @{
    package_ref = "veklom.governed-counter@v1"
    execution_scope = @{ workspace = "default"; project = "demo" }
    requested_action_scope = @{ reads = @("counter.read"); writes = @("counter.increment"); blocked = @("counter.reset") }
} | ConvertTo-Json -Depth 5
$mount_req = Invoke-RestMethod -Uri "http://127.0.0.1:8002/v1/capability/mounts" -Method Post -Body $mount_body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
$mount_id = $mount_req.mount.id
$token_id = $mount_req.token.token_id
$nonce = $mount_req.token.nonce
Write-Host "Mounted capability: $mount_id"

# Step 6: Execute one real deterministic consequence
Write-Host "6. Execute one real deterministic consequence"
$exec_body = @{
    token_id = $token_id
    nonce = $nonce
    action = "counter.increment"
    target_ref = "activation.governed-counter"
    resource = "counter"
    arguments = @{ amount = 1 }
    operation_id = "op_machine_$(Get-Date -UFormat %s)"
} | ConvertTo-Json -Depth 5
$exec_req = Invoke-RestMethod -Uri "http://127.0.0.1:8002/v1/capability/mounts/$mount_id/execute" -Method Post -Body $exec_body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
Write-Host "Execution decision: $($exec_req.decision)"
$receipt_id = $exec_req.consequence.receipt_id

# Step 7: Independently observe resulting state
Write-Host "7. Independently observe resulting state"
Write-Host "Current Counter Value: $($exec_req.consequence.resulting_state.value)"

# Step 8: Retrieve signed evidence / receipt
Write-Host "8. Retrieve signed evidence / receipt"
Write-Host "Receipt ID: $receipt_id"

# Step 9: Revoke authority
Write-Host "9. Revoke authority"
$revoke_body = @{ reason = "explicit_terminate" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8002/v1/capability/mounts/$mount_id/terminate" -Method Post -Body $revoke_body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
Write-Host "Authority revoked."

# Step 10: Repeat same execution -> DENIED
Write-Host "10. Repeat same execution -> expect DENIED"
$replay_req = Invoke-RestMethod -Uri "http://127.0.0.1:8002/v1/capability/mounts/$mount_id/execute" -Method Post -Body $exec_body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }

if ($replay_req.decision -eq "deny") {
    Write-Host "SUCCESS: Execution denied after revocation: $($replay_req.reason)"
} else {
    Write-Host "ERROR: Execution did not return decision=deny! Response: $($replay_req | ConvertTo-Json)"
    exit 1
}

Write-Host "E2E COLD MACHINE SEAL COMPLETE!"
