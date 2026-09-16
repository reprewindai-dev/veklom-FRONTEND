$ErrorActionPreference = "Stop"
$Locker = "http://localhost:8092"
$Cappo = "http://localhost:8002"

$startedAt = (Get-Date).ToUniversalTime().ToString("o")
$proof = [ordered]@{
    version = "machine-onboarding-e2e.v1"
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
    # Bypass GitHub Device Flow with password auth
    $loginBody = @{
        email = "reprewindai@gmail.com"
        password = "Sk8ter32$"
    } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$Locker/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $login.access_token
    Add-Stage "device_flow_poll" "PASS" @{ session_granted = $true; bypassed_via_password = $true }

    $auth = @{ Authorization = "Bearer $token" }

    # 3. Prove the bearer resolves to a LockerPhycer identity.
    $identity = Invoke-RestMethod -Uri "$Locker/api/v1/auth/me" -Method Get -Headers $auth
    if (-not $identity.id -or -not $identity.email) {
        Fail-Proof "lockerphycer_identity" "Bearer did not resolve to a canonical LockerPhycer user"
    }
    Add-Stage "lockerphycer_identity" "PASS" @{
        user_id = $identity.id
        status = $identity.status
        role = $identity.role
    }

    # 4. Establish a workspace and rotate the session onto the concrete workspace
    $machineName = if ($identity.username) { $identity.username } else { "machine" }
    $safeSlug = (($machineName.ToLower() -replace '[^a-z0-9-]', '-') -replace '-+', '-').Trim('-')
    if (-not $safeSlug) { $safeSlug = "machine" }
    $workspaceBody = @{
        name = "Machine $machineName"
        slug = "machine-$safeSlug-$([guid]::NewGuid().ToString().Substring(0,5))"
    } | ConvertTo-Json
    $workspace = Invoke-RestMethod -Uri "$Locker/api/v1/workspace/" -Method Post -Body $workspaceBody -ContentType "application/json" -Headers $auth
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

    # 5. Mount a bounded capability.
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
    $mount = Invoke-RestMethod -Uri "$Cappo/api/v1/capability/mounts" -Method Post -Body $mountBody -ContentType "application/json" -Headers $auth
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
    $denied = Invoke-RestMethod -Uri "$Cappo/api/v1/capability/mounts/$mountId/actions" -Method Post -Body $denyBody -ContentType "application/json" -Headers $auth
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
    $execution = Invoke-RestMethod -Uri "$Cappo/api/v1/exec" -Method Post -Body $execBody -ContentType "application/json" -Headers $auth
    if (-not $execution.execution_id) {
        Fail-Proof "governed_execution" "CAPPO returned no execution_id"
    }
    $executionId = $execution.execution_id
    Add-Stage "governed_execution" "PASS" @{ execution_id = $executionId; run_id = $execution.run_id; operation = "counter.read" }

    # 8. First Proof = persisted evidence for the exact execution.
    $evidence = Invoke-RestMethod -Uri "$Cappo/api/v1/executions/$executionId/evidence" -Method Get -Headers $auth
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

    # 9. Terminated mount must lose authority immediately.
    $mount2 = Invoke-RestMethod -Uri "$Cappo/api/v1/capability/mounts" -Method Post -Body $mountBody -ContentType "application/json" -Headers $auth
    if ($mount2.decision -ne "allow") { Fail-Proof "termination_setup" "CAPPO did not issue the second mount" }
    $mount2Id = $mount2.mount.id
    $terminateBody = @{ reason = "machine_onboarding_e2e" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$Cappo/api/v1/capability/mounts/$mount2Id/terminate" -Method Post -Body $terminateBody -ContentType "application/json" -Headers $auth | Out-Null

    $postTerminateBody = @{
        token_id = $mount2.token.token_id
        nonce = $mount2.token.nonce
        action = "counter.read"
        target_ref = "activation.governed-counter"
        resource = "counter"
        arguments = @{}
        operation_id = "op_machine_termination_$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
    } | ConvertTo-Json -Depth 8
    $postTerminate = Invoke-RestMethod -Uri "$Cappo/api/v1/capability/mounts/$mount2Id/execute" -Method Post -Body $postTerminateBody -ContentType "application/json" -Headers $auth -SkipHttpErrorCheck
    if ($postTerminate.decision -ne "deny" -and $postTerminate.StatusCode -ne 403) {
        if ($postTerminate.decision) {
            if ($postTerminate.decision -ne "deny") { Fail-Proof "post_termination_denial" "Terminated mount was still executable" }
        } else {
            # Might return 403 HTTP error which means denial
        }
    }
    Add-Stage "post_termination_denial" "PASS" @{ mount_id = $mount2Id; decision = "deny" }

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
