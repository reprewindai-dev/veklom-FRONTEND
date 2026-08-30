import {
  discoverActivationPackage,
  executeActivationAllowed,
  inspectActivationEvidence,
  proveActivationDenial,
  requestActivationLease,
} from "@/lib/cos/activation";

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => JSON.stringify(body),
  } as Response;
}

const capability = {
  id: "outreach@v1",
  family: "outreach",
  title: "Governed Outreach",
  purpose: "Exercise a bounded capability",
  reads: ["contact.read"],
  writes: ["draft.write"],
  blocked: ["credential.export"],
};

describe("Activation v1 truthful transport", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("veklom.access_token", "session-token");
    global.fetch = jest.fn();
  });

  it("discovers a real backend package instead of creating a browser demo capability", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response([capability]));

    const selected = await discoverActivationPackage();

    expect(selected.id).toBe("outreach@v1");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost/api/cappo/v1/capability/packages",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("requests the exact bounded lease that will be exercised", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({
      decision: "allow",
      reason: "mounted",
      anchoring: { status: "confirmed", anchor_id: "anchor-mount" },
      mount: { id: "mount-1" },
      token: { token_id: "token-1", nonce: "nonce-1", mount_id: "mount-1" },
    }));

    const lease = await requestActivationLease(capability, "workspace-1", "activation-v1");

    expect(lease).toEqual(expect.objectContaining({
      mountId: "mount-1",
      tokenId: "token-1",
      nonce: "nonce-1",
      allowedAction: "contact.read",
      deniedAction: "credential.export",
      anchorId: "anchor-mount",
    }));
    const [, init] = (fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual(expect.objectContaining({
      package_ref: "outreach@v1",
      execution_scope: { workspace: "workspace-1", project: "activation-v1" },
      requested_action_scope: {
        reads: ["contact.read"],
        writes: [],
        blocked: ["credential.export"],
      },
    }));
  });

  it("accepts the challenge only when CAPPO itself returns a denial", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({
      decision: "deny",
      reason: "blocked_action",
      anchoring: { status: "confirmed", anchor_id: "anchor-deny" },
      mount_id: "mount-1",
      action: "credential.export",
    }));

    const denial = await proveActivationDenial({
      mountId: "mount-1",
      tokenId: "token-1",
      nonce: "nonce-1",
      packageRef: "outreach@v1",
      workspaceId: "workspace-1",
      projectId: "activation-v1",
      allowedAction: "contact.read",
      deniedAction: "credential.export",
    });

    expect(denial).toEqual(expect.objectContaining({
      decision: "deny",
      reason: "blocked_action",
      anchorId: "anchor-deny",
    }));
  });

  it("does not call an allowed execution verified unless CAPPO returns an execution id", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({
      response: "ok",
      run_id: "run-1",
      execution_id: "exec-1",
      capability_lease: { mount_id: "mount-1", decision: "allow", reason: "allowed" },
    }));

    const result = await executeActivationAllowed({
      mountId: "mount-1",
      tokenId: "token-1",
      nonce: "nonce-1",
      packageRef: "outreach@v1",
      workspaceId: "workspace-1",
      projectId: "activation-v1",
      allowedAction: "contact.read",
      deniedAction: "credential.export",
    });

    expect(result.executionId).toBe("exec-1");
    const [url, init] = (fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost/api/cappo/v1/exec");
    expect(JSON.parse(init.body)).toEqual(expect.objectContaining({
      action: "contact.read",
      workspace_id: "workspace-1",
      capability_lease: {
        mount_id: "mount-1",
        token_id: "token-1",
        nonce: "nonce-1",
      },
    }));
  });

  it("completes evidence inspection only from verified persisted execution evidence", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({
      execution_id: "exec-1",
      proof_state: "verified",
      verification_reasons: [],
      eee: { type: "veklom.eee.v1", execution_id: "exec-1" },
      pgl: {
        event_id: "event-1",
        event_hash: "hash-1",
        persisted: true,
        created_at: "2026-08-30T14:00:00Z",
      },
    }));

    const evidence = await inspectActivationEvidence({
      executionId: "exec-1",
      runId: "run-1",
      operation: "contact.read",
      response: { execution_id: "exec-1" },
    });

    expect(evidence.proof_state).toBe("verified");
    expect(evidence.pgl.persisted).toBe(true);
    expect(evidence.pgl.event_hash).toBe("hash-1");
  });
});
