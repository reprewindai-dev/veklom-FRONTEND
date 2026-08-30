import {
  executeGovernedConsequence,
  fetchExecutionEvidence,
  fetchExecutionMeasurement,
} from "@/lib/cos/verticalSlice";

const response = (body: unknown) => ({
  ok: true,
  status: 200,
  statusText: "OK",
  headers: new Headers({ "content-type": "application/json" }),
  text: async () => JSON.stringify(body),
}) as Response;

describe("Capability OS truthful vertical-slice transport", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("veklom.access_token", "real-session-token");
    global.fetch = jest.fn().mockResolvedValue(response({ status: "accepted" }));
  });

  it("executes through the canonical same-origin CAPPO boundary with session auth", async () => {
    await executeGovernedConsequence({
      capabilityLease: { mountId: "mount-1", tokenId: "token-1", nonce: "nonce-1" },
      operation: "repository.write",
      prompt: "write proof.txt to owner/repo at refs/heads/main",
      targetPrecondition: {
        targetId: "repo:owner/repo@main",
        expectedStateHash: "sha256:head",
        observedStateHash: "sha256:head",
        observedAt: "2026-08-22T12:00:00.000Z",
        signature: "observer-signature",
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost/api/cappo/v1/exec",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer real-session-token",
        }),
      }),
    );
    const [, init] = (fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual(expect.objectContaining({
      action: "repository.write",
      capability_lease: {
        mount_id: "mount-1",
        token_id: "token-1",
        nonce: "nonce-1",
      },
      target_precondition: expect.objectContaining({
        target_id: "repo:owner/repo@main",
        expected_state_hash: "sha256:head",
        observed_state_hash: "sha256:head",
      }),
    }));
  });

  it("retrieves linked evidence without a fallback API key", async () => {
    await fetchExecutionEvidence("exec-1");

    const [url, init] = (fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost/api/cappo/v1/executions/exec-1/evidence");
    expect(init.headers.Authorization).toBe("Bearer real-session-token");
    expect(init.headers["X-API-Key"]).toBeUndefined();
    expect(JSON.stringify(init)).not.toContain("byos_test_key");
  });

  it("retrieves measurement for the exact execution", async () => {
    await fetchExecutionMeasurement("exec-1");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost/api/cappo/v1/executions/exec-1/measurements",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("keeps the x402 intervention enabled for governed execution", async () => {
    await executeGovernedConsequence({
      capabilityLease: { mountId: "mount-1", tokenId: "token-1", nonce: "nonce-1" },
      operation: "llm.exec",
      prompt: "prove payment handling",
    });
    const [, init] = (fetch as jest.Mock).mock.calls[0];
    expect(init).not.toHaveProperty("handlePaymentRequired", false);
  });
});
