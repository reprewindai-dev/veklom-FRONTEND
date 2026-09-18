import { runtimeDependencies } from "@/lib/runtime-dependencies";

describe("canonical runtime dependency projection", () => {
  it("projects the current Veklom spine and excludes retired architecture", () => {
    const dependencies = runtimeDependencies({
      BACKEND_URL: "http://retired-byos:8088",
      ABIDE_URL: "http://out-of-scope-abide:8000",
      CAPPO_BACKEND_URL: "http://cappo:8002",
      CAPI_URL: "http://capi:3003",
      PGL_URL: "http://gnomledger:8001",
      LOCKERPHYCER_URL: "http://lockerphycer:8092",
      VLINK_URL: "http://vlink:3000",
    });

    expect(dependencies).toEqual([
      { name: "cappo", url: "http://cappo:8002" },
      { name: "capi", url: "http://capi:3003" },
      { name: "gnomledger", url: "http://gnomledger:8001" },
      { name: "lockerphycer", url: "http://lockerphycer:8092" },
      { name: "vlink", url: "http://vlink:3000", healthPath: "/api/health" },
    ]);
  });

  it("preserves supported compatibility aliases without reviving BYOS", () => {
    expect(runtimeDependencies({
      CAPPO_URL: "http://cappo-alias:8002",
      INTERLINK_CAPI_URL: "http://capi-alias:3003",
      GNOMLEDGER_URL: "http://pgl-alias:8001",
    })).toEqual([
      { name: "cappo", url: "http://cappo-alias:8002" },
      { name: "capi", url: "http://capi-alias:3003" },
      { name: "gnomledger", url: "http://pgl-alias:8001" },
      { name: "lockerphycer", url: undefined },
      { name: "vlink", url: undefined, healthPath: "/api/health" },
    ]);
  });
});
