$ErrorActionPreference = "Stop"
$Base = if ($env:VEKLOM_BASE_URL) { $env:VEKLOM_BASE_URL.TrimEnd('/') } else { "https://veklom.com" }
$startedAt = (Get-Date).ToUniversalTime().ToString("o")
$proof = [ordered]@{
    version = "machine-onboarding-e2e.v1"
    base_url = $Base
    started_at = $startedAt
    stages = @()
    result = "INDETERMINATE"
}

function Add-Stage([string]$name, [string]$status, [hashtable]$evidence = @{}) {
    $proof.stages += [ordered]@{
        name = $name
        status = $status
        at = (Get-Date).ToUniversalTime().ToString("o")
        evidence = $evidence
    }
    Write-Host ("[{0}] {1}" -f $status, $name)
}

function Fail-Proof([string]$stage, [string]$message) {
    Add-Stage $stage "FAIL" @{ error = $message }
    $proof.result = "INVALID"
    $proof.completed_at = (Get-Date).ToUniversalTime().ToString("o")
    $proof | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 "machine-e2e-proof.json"
    throw "$stage : $message"
}

try {
    Write-Host "=== VEKLOM COLD EXTERNAL MACHINE ONBOARDING ==="

    # 1. Machine discovery. These are public contract surfaces only; reachability
    # is not counted as execution proof.
    $manifest = Invoke-RestMethod "$Base/mcp/manifest.json"
    $tools = Invoke-RestMethod "$Base/mcp/tools.json"
    $contract = Invoke-RestMethod "$Base/machine/contract.json"
    $x402 = Invoke-RestMethod "$Base/.well-known/x402.json"
    Add-Stage "discovery" "PASS" @{
        product = $manifest.product
        tool_count = @($tools.tools).Count
        contract_version = $contract.version
        commerce_protocol = $contract.commerce.protocol
        x402_reachable = ($null -ne $x402)
    }

    # 2. GitHub Device Flow. This is the only interactive boundary: the human
    # authorizes the machine on GitHub, then the machine resumes autonomously.
    $device = Invoke-RestMethod -Uri "$Base/api/auth/github/device/start" -Method Post -ContentType "application/json"
    if (-not $device.device_code -or -not $device.user_code -or -not $device.verification_uri) {
        Fail-Proof "device_flow_start" "Device Flow did not return device_code, user_code, and verification_uri"
    }
    Add-Stage "device_flow_start" "PASS" @{ verification_uri = $device.verification_uri; user_code = $device.user_code }
    Write-Host "AUTHORIZE MACHINE: $($device.verification_uri) code $($device.user_code)"

    $interval = if ($device.interval) { [int]$device.interval } else { 5 }
    $token = $null
    $deadline = (Get-Date).AddMinutes(15)
    while (-not $token -and (Get-Date) -lt $deadline) {
        Start-Sleep -Seconds $interval
        try {
            $poll = Invoke-RestMethod -Uri "$Base/api/auth/github/device/poll" -Method Post -Body (@{ device_code = $device.device_code } | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
            $token = $poll.access_token
        } catch {
            $statusCode = $null
            try { $statusCode = $_.Exception.Response.StatusCode.value__ } catch {}
            if ($statusCode -eq 202) { continue }
            if ($statusCode -eq 429) { $interval += 5; continue }
            if ($statusCode -eq 403) { Fail-Proof "device_flow_poll" "Human denied GitHub Device Flow" }
            Fail-Proof "device_flow_poll" ("Device Flow poll failed with HTTP {0}: {1}" -f $statusCode, $_.Exception.Message)
        }
    }
    if (-not $token) { Fail-Proof "device_flow_poll" "Timed out waiting for GitHub Device Flow authorization" }
    Add-Stage "device_flow_poll" "PASS" @{ session_granted = $true }

    $auth = @{ Authorization = "Bearer $token" }

    # 3. Prove the bearer resolves to a LockerPhycer identity. Do not use the
    # Veklom-ID cookie card here: machine auth must resolve from the same bearer.
    $identity = Invoke-RestMethod -Uri "$Base/api/v1/auth/me" -Method Get -Headers $auth
    if (-not $identity.id -or -not $identity.email) {
        Fail-Proof "lockerphycer_identity" "Bearer did not resolve to a canonical LockerPhycer user"
    }
    Add-Stage "lockerphycer_identity" "PASS" @{
        user_id = $identity.id
        status = $identity.status
        role = $identity.role
    }

    # 4. Establish a workspace and rotate the session onto the concrete workspace
    # identity. This changes identity context only; it does not grant CAPPO authority.
    $machineName = if ($identity.username) { $identity.username } else { "machine" }
    $safeSlug = (($machineName.ToLower() -replace '[^a-z0-9-]', '-') -replace '-+', '-').Trim('-')
    if (-not $safeSlug) { $safeSlug = "machine" }
    $workspaceBody = @{
        name = "Machine $machineName"
        slug = "machine-$safeSlug"
    } | ConvertTo-Json
    $workspace = Invoke-RestMethod -Uri "$Base/api/v1/workspace/" -Method Post -Body $workspaceBody -ContentType "application/json" -Headers $auth
    if (-not $workspace.id -or -not $workspace.access_token) {
        Fail-Proof "workspace_binding" "Workspace creation did not return a workspace-bound access token"
    }
    $token = $workspace.access_token
    $auth = @{ Authorization = "Bearer $token" }
    Add-Stage "workspace_binding" "PASS" @{
        workspace_id = $workspace.id
        existing = [bool]$workspace.existing
        tier = $workspace.tier
        session_rotated = $true
    }

    # 5. Mount a bounded capability. Scope is deliberately narrow: one safe read
    # plus one explicitly blocked action. The workspace must match the token claim.
    $mountBody = @{
        package_ref = "veklom.governed-counter@v1"
        execution_scope = @{ workspace = $workspace.id; project = "machine-onboarding" }
        requested_action_scope = @{
            reads = @("counter.read")
            writes = @()
            blocked = @("counter.reset")
        }
        role = "ephemeral_executor"
        policy = @{}
        ttl_seconds = 300
    } | ConvertTo-Json -Depth 8
    $mount = Invoke-RestMethod -Uri "$Base/api/cappo/v1/capability/mounts" -Method Post -Body $mountBody -ContentType "application/json" -Headers $auth
    if ($mount.decision -ne "allow" -or -not $mount.mount.id -or -not $mount.token.token_id -or -not $mount.token.nonce) {
        Fail-Proof "capability_mount" ("CAPPO did not issue a bounded mount: {0}" -f ($mount | ConvertTo-Json -Compress -Depth 6))
    }
    $mountId = $mount.mount.id
    $tokenId = $mount.token.token_id
    $nonce = $mount.token.nonce
    Add-Stage "capability_mount" "PASS" @{
        mount_id = $mountId
        package_ref = "veklom.governed-counter@v1"
        workspace_id = $workspace.id
    }

    # 6. Negative proof first. CAPPO itself must reject the blocked action.
    $denyBody = @{
        token_id = $tokenId
        nonce = $nonce
        action = "counter.reset"
    } | ConvertTo-Json
    $denied = Invoke-RestMethod -Uri "$Base/api/cappo/v1/capability/mounts/$mountId/actions" -Method Post -Body $denyBody -ContentType "application/json" -Headers $auth
    if ($denied.decision -ne "deny") {
        Fail-Proof "blocked_action" "CAPPO failed to deny counter.reset"
    }
    Add-Stage "blocked_action" "PASS" @{ decision = $denied.decision; reason = $denied.reason; action = $denied.action }

    # 7. Execute one safe allowed consequence through the canonical /v1/exec path.
    $execBody = @{
        prompt = "Machine onboarding governed counter read"
        action = "counter.read"
        directive = "ALLOW"
        workspace_id = $workspace.id
        scope = @{
            tools = @("counter.read")
            allowed_effects = @("counter.read")
        }
        capability_lease = @{
            mount_id = $mountId
            token_id = $tokenId
            nonce = $nonce
        }
    } | ConvertTo-Json -Depth 8
    $execution = Invoke-RestMethod -Uri "$Base/api/cappo/v1/exec" -Method Post -Body $execBody -ContentType "application/json" -Headers $auth
    if (-not $execution.execution_id) {
        Fail-Proof "governed_execution" "CAPPO returned no execution_id"
    }
    $executionId = $execution.execution_id
    Add-Stage "governed_execution" "PASS" @{ execution_id = $executionId; run_id = $execution.run_id; operation = "counter.read" }

    # 8. First Proof = persisted evidence for the exact execution. A 2xx execution
    # response is insufficient. The PGL record must be persisted and hash-addressed.
    $evidence = Invoke-RestMethod -Uri "$Base/api/cappo/v1/executions/$executionId/evidence" -Method Get -Headers $auth
    $acceptedProofState = @("verified", "verified_with_unresolved_refs") -contains $evidence.proof_state
    if ($evidence.execution_id -ne $executionId) {
        Fail-Proof "persisted_pgl_evidence" "Evidence execution_id does not match the executed consequence"
    }
    if (-not $acceptedProofState) {
        Fail-Proof "persisted_pgl_evidence" ("Evidence proof_state is not verified: {0}" -f $evidence.proof_state)
    }
    if ($evidence.pgl.persisted -ne $true -or -not $evidence.pgl.event_hash) {
        Fail-Proof "persisted_pgl_evidence" "PGL did not return persisted=true with a non-empty event_hash"
    }
    Add-Stage "persisted_pgl_evidence" "PASS" @{
        execution_id = $evidence.execution_id
        proof_state = $evidence.proof_state
        pgl_event_id = $evidence.pgl.event_id
        pgl_event_hash = $evidence.pgl.event_hash
        persisted = $true
    }

    # 9. A terminated mount must lose authority immediately. Use a fresh mount so
    # this check is independent of any single-use behavior from the first proof.
    $mount2 = Invoke-RestMethod -Uri "$Base/api/cappo/v1/capability/mounts" -Method Post -Body $mountBody -ContentType "application/json" -Headers $auth
    if ($mount2.decision -ne "allow") { Fail-Proof "termination_setup" "CAPPO did not issue the second mount" }
    $mount2Id = $mount2.mount.id
    $terminateBody = @{ reason = "machine_onboarding_e2e" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$Base/api/cappo/v1/capability/mounts/$mount2Id/terminate" -Method Post -Body $terminateBody -ContentType "application/json" -Headers $auth | Out-Null

    $postTerminateBody = @{
        token_id = $mount2.token.token_id
        nonce = $mount2.token.nonce
        action = "counter.read"
        target_ref = "activation.governed-counter"
        resource = "counter"
        arguments = @{}
        operation_id = "op_machine_termination_$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
    } | ConvertTo-Json -Depth 8
    $postTerminate = Invoke-RestMethod -Uri "$Base/api/cappo/v1/capability/mounts/$mount2Id/execute" -Method Post -Body $postTerminateBody -ContentType "application/json" -Headers $auth
    if ($postTerminate.decision -ne "deny") {
        Fail-Proof "post_termination_denial" "Terminated mount was still executable"
    }
    Add-Stage "post_termination_denial" "PASS" @{ mount_id = $mount2Id; decision = $postTerminate.decision; reason = $postTerminate.reason }

    $proof.result = "VALID"
    $proof.workspace_id = $workspace.id
    $proof.execution_id = $executionId
    $proof.pgl_event_hash = $evidence.pgl.event_hash
    $proof.completed_at = (Get-Date).ToUniversalTime().ToString("o")
    $proof | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 "machine-e2e-proof.json"
    Write-Host "=== VEKLOM MACHINE ONBOARDING SEAL: VALID ==="
    Write-Host "Proof written to machine-e2e-proof.json"
} catch {
    if ($proof.result -eq "INDETERMINATE") {
        $proof.result = "INVALID"
        Add-Stage "unhandled_error" "FAIL" @{ error = $_.Exception.Message }
        $proof.completed_at = (Get-Date).ToUniversalTime().ToString("o")
        $proof | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 "machine-e2e-proof.json"
    }
    Write-Error $_
    exit 1
}
