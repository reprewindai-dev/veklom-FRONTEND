import fs from "node:fs";
import path from "node:path";

import { canonicalBackends } from "../canonical-backends";

describe("canonical backend source truth", () => {
  const originalLockerphycerUrl = process.env.LOCKERPHYCER_URL;

  afterEach(() => {
    if (originalLockerphycerUrl === undefined) {
      delete process.env.LOCKERPHYCER_URL;
    } else {
      process.env.LOCKERPHYCER_URL = originalLockerphycerUrl;
    }
  });

  it("keeps uacpv3 canonical for GPC and does not invent a Lockerphycer runtime", () => {
    delete process.env.LOCKERPHYCER_URL;

    const backends = canonicalBackends();
    const gpc = backends.find((backend) => backend.id === "gpc");
    const lockerphycer = backends.find((backend) => backend.id === "lockerphycer");

    expect(gpc).toMatchObject({
      repo: "uacpv3",
      role: "sovereign-control-plane",
      baseUrl: "https://gpc.veklom.com",
    });
    expect(lockerphycer?.baseUrl).toBe("");
  });

  it("forbids legacy Lockerphycer port and verified-by-probe language", () => {
    const proxySource = fs.readFileSync(
      path.join(process.cwd(), "app/api/[...proxy]/route.ts"),
      "utf8",
    );
    const statusSource = fs.readFileSync(
      path.join(process.cwd(), "app/api/control-node/canonical-backends/route.ts"),
      "utf8",
    );

    expect(proxySource).not.toContain("lockerphycer-api:8000");
    expect(proxySource).not.toContain("process.env.SECRET_KEY || process.env.LOCKERPHYCER_SECRET_KEY");
    expect(proxySource).not.toContain('details: message');
    expect(statusSource).toContain('state_basis:"HTTP_PROBE_ONLY"');
    expect(statusSource).toContain('verification_state:"NOT_VERIFIED"');
    expect(statusSource).not.toContain('"health verified"');
    expect(statusSource).not.toContain('"workspace overview verified"');
    expect(statusSource).not.toContain('"source-of-truth snapshot verified"');
  });
});
