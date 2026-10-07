import {
  inspectActivationEvidence,
  ActivationUnavailableError,
  type ActivationAllowedExecution,
} from "@/lib/cos/activation";
import type { GovernedConsequenceResponse } from "@/lib/cos/verticalSlice";

const response = (body: unknown) => ({
  ok: true,
  status: 200,
  statusText: "OK",
  headers: new Headers({ "content-type": "application/json" }),
  text: async () => JSON.stringify(body),
}) as Response;

function execution(pgl: GovernedConsequenceResponse["pgl"]): ActivationAllowedExecution {
  return {
    executionId: "exec-1",
    runId: "run-1",
    operation: "repo.read",
    response: { execution_id: "exec-1", run_id: "run-1", pgl },
  };
}

describe("inspectActivationEvidence sources evidence from the PGL ledger", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("veklom.access_token", "real-session-token");
  });

  it("surfaces the persisted PGL ledger event as the execution evidence", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      response({
        event_id: "evt_post_1",
        event_type: "post_execution_attestation",
        event_hash: "pgl_hash_abc",
        prev_event_hash: "pgl_hash_prev",
        created_at: "2026-10-07T00:00:00Z",
        persisted: true,
        details: { schema_version: "pgl.post_execution_attestation.v1", run_id: "run-1" },
      }),
    );

    const evidence = await inspectActivationEvidence(
      execution({ post_execution_certificate_id: "evt_post_1", persisted: true }),
    );

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost/api/pgl/ledger/events/evt_post_1",
      expect.objectContaining({ method: "GET" }),
    );
    expect(evidence.execution_id).toBe("exec-1");
    expect(evidence.proof_state).toBe("verified_with_unresolved_refs");
    expect(evidence.pgl.persisted).toBe(true);
    expect(evidence.pgl.event_hash).toBe("pgl_hash_abc");
    expect(evidence.pgl.previous_event_hash).toBe("pgl_hash_prev");
    expect(evidence.eee).toMatchObject({ schema_version: "pgl.post_execution_attestation.v1" });
  });

  it("prefers the post attestation, then the capi seal, over the pre authorization", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      response({ event_id: "x", event_hash: "h", persisted: true, created_at: "t", details: {} }),
    );

    await inspectActivationEvidence(
      execution({ capi_evidence_event_id: "evt_seal", pre_execution_certificate_id: "evt_pre" }),
    );

    expect((fetch as jest.Mock).mock.calls[0][0]).toBe(
      "http://localhost/api/pgl/ledger/events/evt_seal",
    );
  });

  it("stops honestly (no 404 fetch) when CAPPO recorded no PGL event id", async () => {
    global.fetch = jest.fn();

    await expect(inspectActivationEvidence(execution(undefined))).rejects.toBeInstanceOf(
      ActivationUnavailableError,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("stops honestly when the ledger returns no persisted event", async () => {
    global.fetch = jest.fn().mockResolvedValue(response({ event_id: "x", persisted: false }));

    await expect(
      inspectActivationEvidence(execution({ post_execution_certificate_id: "evt_post_1" })),
    ).rejects.toBeInstanceOf(ActivationUnavailableError);
  });
});
