import fs from "node:fs";
import path from "node:path";

const runtimeMapPath = path.join(
  process.cwd(),
  "docs",
  "design-brief",
  "07_DOMAIN_RUNTIME_MAP.md",
);

const readRuntimeMap = () => fs.readFileSync(runtimeMapPath, "utf8");

describe("foundation runtime map truth contract", () => {
  it("keeps reported ports explicit without promoting them to verified runtime state", () => {
    const source = readRuntimeMap();

    expect(source).toContain("| BYOS | `api.veklom.com` | 8088 | `NOT_VERIFIED` |");
    expect(source).toContain("| Control Plane | `governance.veklom.com`, `control.veklom.com` | 3002 | `NOT_VERIFIED` |");
    expect(source).toContain("| cAPI / Interlink | `capi.veklom.com`, `interlink.veklom.com` | 3003 | `NOT_VERIFIED` |");
    expect(source).toContain("| GPC / UACP V3 | `gpc.veklom.com`, `veklom.com/gpc` | 3010 | `NOT_VERIFIED` |");
    expect(source).toContain("| Gnomledger | `pgl.veklom.com` | 8001 | `NOT_VERIFIED` |");
    expect(source).toContain("| CAPPO | `cappo.veklom.com` | 8002 | `NOT_VERIFIED` |");
    expect(source).toContain("| Lockerphycer | `lockerphycer.veklom.com` | 8092 | `NOT_VERIFIED` |");
    expect(source).toContain("| Terminal | canonical Terminal public domain not established in this document | 80 | `NOT_VERIFIED` |");
    expect(source).toContain("## verified_runtime_state\n\nNone established by this document.");
  });

  it("does not publish forbidden ports or unsupported verification labels as canonical mappings", () => {
    const source = readRuntimeMap();

    expect(source).not.toContain("| 3000 |");
    expect(source).not.toContain("| 8000 |");
    expect(source).not.toContain("VERIFIED_LIVE");
    expect(source).not.toContain("health verified");
    expect(source).not.toContain("source-of-truth snapshot verified");
  });
});
