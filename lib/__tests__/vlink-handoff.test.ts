import { buildHandoffRequest } from "@/lib/cos/vlink-handoff";

describe("VLink handoff request", () => {
  it("builds the same-origin URL, enrollment authorization, and scoped body", () => {
    const request = buildHandoffRequest(
      {
        mountId: "mnt_1",
        tokenId: "tok_1",
        nonce: "nonce_1",
        holderCredential: "vlm_mnt_1.secret",
        packageRef: "veklom.governed-counter@v1",
        workspace: "default",
        project: "sandbox",
        targetRef: "activation.governed-counter",
        expiresAt: "2026-09-14T00:00:00Z",
        grants: {
          reads: ["counter.read"],
          writes: ["counter.increment", "counter.read"],
          blocked: ["counter.reset"],
        },
      },
      "vlink_1",
      "vle_x",
    );

    expect(request.url).toBe("/vlink/connect/api/v1/vlinks/vlink_1/leases");
    expect(request.init).toEqual(expect.objectContaining({
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer vle_x",
      },
    }));
    expect(JSON.parse(String(request.init.body))).toEqual({
      mountId: "mnt_1",
      tokenId: "tok_1",
      nonce: "nonce_1",
      holderCredential: "vlm_mnt_1.secret",
      packageRef: "veklom.governed-counter@v1",
      workspace: "default",
      project: "sandbox",
      targetRef: "activation.governed-counter",
      allowedActions: ["counter.read", "counter.increment"],
      blockedActions: ["counter.reset"],
      expiresAt: "2026-09-14T00:00:00Z",
    });
    expect(request.init.headers).not.toHaveProperty("X-API-Key");
  });
});
