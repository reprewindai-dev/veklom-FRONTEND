$ErrorActionPreference = "Stop"
Write-Host "Running COLD EXTERNAL MACHINE cycle..."

# Step 1: Discover veklom.com
Write-Host "1. Discover veklom.com"
$manifest = Invoke-RestMethod "https://veklom.com/mcp/manifest.json"
Write-Host "Discovered product: $($manifest.product)"

# Step 2: Read machine manifest/tool catalog
Write-Host "2. Read machine tool catalog"
$tools = Invoke-RestMethod "https://veklom.com/mcp/tools.json"
Write-Host "Found $($tools.tools.Length) tools."

# Step 3: Request Device Flow code
Write-Host "3. Requesting Device Flow code from Frontend API"
$device_req = Invoke-RestMethod -Uri "https://veklom.com/api/auth/github/device/start" -Method Post -ContentType "application/json"
$device_code = $device_req.device_code
$user_code = $device_req.user_code
$verification_uri = $device_req.verification_uri
$interval = $device_req.interval
if ($null -eq $interval) { $interval = 5 }

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
    Start-Sleep -Seconds $interval
    try {
        $token_req = Invoke-RestMethod -Uri "https://veklom.com/api/auth/github/device/poll" -Method Post -Body (@{device_code=$device_code} | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
        $token = $token_req.access_token
    } catch {
        $err_resp = $_.Exception.Response
        if ($err_resp.StatusCode.value__ -eq 202) {
            Write-Host "Authorization pending... waiting."
        } elseif ($err_resp.StatusCode.value__ -eq 400) {
            $err_stream = $err_resp.GetResponseStream()
            $err_body = (New-Object System.IO.StreamReader($err_stream)).ReadToEnd() | ConvertFrom-Json
            if ($err_body.error -eq "authorization_pending") {
                Write-Host "Authorization pending... waiting."
            } elseif ($err_body.error -eq "slow_down") {
                $interval += 5
                Write-Host "Slowing down. New interval: $interval"
            } else {
                Write-Host "FATAL DEVICE FLOW ERROR: $($err_body.error)"
                exit 1
            }
        } elseif ($err_resp.StatusCode.value__ -eq 429) { $interval += 5; Write-Host "Slowing down. New interval: $interval" } elseif ($err_resp.StatusCode.value__ -eq 403) {
            Write-Host "FATAL: Access Denied by user."
            exit 1
        } else {
            Write-Host "FATAL HTTP ERROR: $($err_resp.StatusCode.value__)"
            exit 1
        }
    }
}
Write-Host "Received LockerPhycer token!"

# Step 5: Mount A
Write-Host "5. Mount A: Mount capability"
$mount_body = @{
    package_ref = "veklom.governed-counter@v1"
    execution_scope = @{ workspace = "default"; project = "demo" }
    requested_action_scope = @{ reads = @("counter.read"); writes = @("counter.increment"); blocked = @("counter.reset") }
} | ConvertTo-Json -Depth 5
$mount_a = Invoke-RestMethod -Uri "https://veklom.com/api/cappo/v1/capability/mounts" -Method Post -Body $mount_body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
$mount_id_a = $mount_a.mount.id
$token_id_a = $mount_a.token.token_id
$nonce_a = $mount_a.token.nonce
Write-Host "Mounted A: $mount_id_a"

# Execute Mount A
Write-Host "6. Mount A: Execute increment"
$exec_body_a = @{
    token_id = $token_id_a
    nonce = $nonce_a
    action = "counter.increment"
    target_ref = "activation.governed-counter"
    resource = "counter"
    arguments = @{ amount = 1 }
    operation_id = "op_machine_$(Get-Date -UFormat %s)_A"
} | ConvertTo-Json -Depth 5
$exec_req_a = Invoke-RestMethod -Uri "https://veklom.com/api/cappo/v1/capability/mounts/$mount_id_a/execute" -Method Post -Body $exec_body_a -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }

if ($exec_req_a.decision -ne "allow") {
    Write-Host "FATAL: Expected allow for Mount A execute, got $($exec_req_a.decision)"
    exit 1
}
Write-Host "Execution A decision: allow"
$state_a = $exec_req_a.consequence.resulting_state.value
Write-Host "State A after execute: $state_a"

# Replay Mount A
Write-Host "7. Mount A: Replay identical operation"
$replay_req_a = Invoke-RestMethod -Uri "https://veklom.com/api/cappo/v1/capability/mounts/$mount_id_a/execute" -Method Post -Body $exec_body_a -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
if ($replay_req_a.decision -ne "deny") {
    Write-Host "FATAL: Expected deny for Mount A replay, got $($replay_req_a.decision)"
    exit 1
}
$state_a_replay = $replay_req_a.consequence.resulting_state.value
if ($null -ne $state_a_replay -and $state_a_replay -ne $state_a) {
    Write-Host "FATAL: State mutated during denied replay! state_a=$state_a, state_a_replay=$state_a_replay" `n    Write-Host ($replay_req_a | ConvertTo-Json -Depth 5)
    exit 1
}
Write-Host "SUCCESS: Replay denied and state unchanged ($state_a_replay)."

# Mount B
Write-Host "8. Mount B: Fresh mount"
$mount_b = Invoke-RestMethod -Uri "https://veklom.com/api/cappo/v1/capability/mounts" -Method Post -Body $mount_body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
$mount_id_b = $mount_b.mount.id
$token_id_b = $mount_b.token.token_id
$nonce_b = $mount_b.token.nonce
Write-Host "Mounted B: $mount_id_b"

# Terminate Mount B
Write-Host "9. Mount B: Explicit terminate"
$revoke_body = @{ reason = "explicit_terminate" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://veklom.com/api/cappo/v1/capability/mounts/$mount_id_b/terminate" -Method Post -Body $revoke_body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
Write-Host "Mount B terminated."

# Attempt Execute Mount B
Write-Host "10. Mount B: Attempt execute after terminate"
$exec_body_b = @{
    token_id = $token_id_b
    nonce = $nonce_b
    action = "counter.increment"
    target_ref = "activation.governed-counter"
    resource = "counter"
    arguments = @{ amount = 1 }
    operation_id = "op_machine_$(Get-Date -UFormat %s)_B"
} | ConvertTo-Json -Depth 5
$exec_req_b = Invoke-RestMethod -Uri "https://veklom.com/api/cappo/v1/capability/mounts/$mount_id_b/execute" -Method Post -Body $exec_body_b -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }

if ($exec_req_b.decision -eq "deny" -and $exec_req_b.reason -match "terminated") {
    Write-Host "SUCCESS: Execution on terminated mount B was denied: $($exec_req_b.reason)"
} else {
    Write-Host "FATAL: Expected deny with termination reason for Mount B. Got: $($exec_req_b | ConvertTo-Json)"
    exit 1
}

Write-Host "E2E COLD MACHINE SEAL COMPLETE!"





