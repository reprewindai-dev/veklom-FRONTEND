/**
 * @jest-environment node
 */
import fs from "node:fs";
import { x25519 } from "@noble/curves/ed25519";
import { openSealedCredential, sealCredential, type FabricCredential } from "@/lib/fabric-seal";

const cred: FabricCredential = { holder: "vlm_mnt_x.secret", token_id: "tok_1", nonce: "n_1", mount_id: "mnt_x", job_id: "job-1" };
const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64");

describe("sealing a workload credential to its machine", () => {
  const workerPriv = x25519.utils.randomPrivateKey();
  const workerPub = b64(x25519.getPublicKey(workerPriv));

  it("opens only with the chosen machine's key, for this job", () => {
    const sealed = sealCredential(workerPub, "job-1", cred);
    expect(openSealedCredential(workerPriv, "job-1", sealed)).toEqual(cred);
    expect(() => openSealedCredential(workerPriv, "job-2", sealed)).toThrow();            // bound to the job id
    expect(() => openSealedCredential(x25519.utils.randomPrivateKey(), "job-1", sealed)).toThrow(); // another machine
  });

  it("never carries the credential in clear and differs on every seal", () => {
    const a = sealCredential(workerPub, "job-1", cred);
    const b = sealCredential(workerPub, "job-1", cred);
    expect(a).not.toEqual(b);
    expect(Buffer.from(a, "base64").toString()).not.toContain("vlm_mnt_x.secret");
    expect(Object.keys(JSON.parse(Buffer.from(a, "base64").toString())).sort()).toEqual(["ct", "epk", "nonce"]);
  });

  it("refuses a key that is not an X25519 public key", () => {
    expect(() => sealCredential(b64(new Uint8Array(31)), "job-1", cred)).toThrow();
  });

  // Interop with the real worker (own-your-cloud/worker/worker.py unseal): run with
  // FABRIC_INTEROP_PUB=<worker X_PUB> FABRIC_INTEROP_OUT=<file>; the worker then opens the file.
  const interopPub = process.env.FABRIC_INTEROP_PUB;
  (interopPub ? it : it.skip)("writes a credential sealed to a real worker key", () => {
    fs.writeFileSync(process.env.FABRIC_INTEROP_OUT as string, sealCredential(interopPub as string, "job-interop", { ...cred, job_id: "job-interop" }));
  });
});
