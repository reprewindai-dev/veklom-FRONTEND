/**
 * @jest-environment node
 */

// The deployment sets CAPI_URL (compose + Dockerfile). If the runtime ignores it,
// server-side cAPI calls fall through to the public hostname: traffic leaves the
// private network, and a staging stack silently talks to production cAPI.
describe("CAPI_RUNTIME_URL resolution", () => {
  const keys = ["CAPI_BACKEND_URL", "CAPI_URL", "INTERLINK_CAPI_URL"] as const;
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));

  afterEach(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  function resolve(env: Partial<Record<(typeof keys)[number], string>>): string {
    for (const k of keys) delete process.env[k];
    Object.assign(process.env, env);
    let url = "";
    jest.isolateModules(() => {
      url = (require("@/lib/capi-runtime") as typeof import("@/lib/capi-runtime")).CAPI_RUNTIME_URL;
    });
    return url;
  }

  it("uses the deployment's CAPI_URL when CAPI_BACKEND_URL is unset", () => {
    expect(resolve({ CAPI_URL: "http://capi:3003" })).toBe("http://capi:3003");
  });

  it("prefers an explicit CAPI_BACKEND_URL", () => {
    expect(resolve({ CAPI_BACKEND_URL: "http://capi-internal:3003", CAPI_URL: "http://capi:3003" })).toBe(
      "http://capi-internal:3003",
    );
  });

  it("only falls back to the public hostname when nothing is configured", () => {
    expect(resolve({})).toBe("https://capi.veklom.com");
  });
});
