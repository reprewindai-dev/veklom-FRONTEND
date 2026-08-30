import {
  CAPPO_MACHINE_AUTHORITY_HEADERS,
  stripUntrustedMachineAuthority,
} from "@/lib/cappo-machine-authority-boundary";

describe("CAPPO proxy machine-authority boundary", () => {
  it("strips every browser-supplied CAPPO machine-authority header", () => {
    const headers = new Headers({
      authorization: "Bearer browser-session-token",
      "workload-identity": "caller-controlled-wit",
      "execution-context": "caller-controlled-ect",
      "workload-proof": "caller-controlled-wpt",
      "veklom-authority": "caller-controlled-authority",
      "content-type": "application/json",
    });

    const forwarded = stripUntrustedMachineAuthority(headers);

    for (const header of CAPPO_MACHINE_AUTHORITY_HEADERS) {
      expect(forwarded.has(header)).toBe(false);
    }
    // Authentication and ordinary transport metadata are a separate boundary;
    // this helper removes only machine-authority artifacts.
    expect(forwarded.get("authorization")).toBe("Bearer browser-session-token");
    expect(forwarded.get("content-type")).toBe("application/json");
  });

  it("is case-insensitive because the Headers contract normalizes names", () => {
    const headers = new Headers();
    headers.set("Workload-Identity", "forged");
    headers.set("Veklom-Authority", "forged");

    stripUntrustedMachineAuthority(headers);

    expect(headers.get("Workload-Identity")).toBeNull();
    expect(headers.get("Veklom-Authority")).toBeNull();
  });
});
