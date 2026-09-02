describe("CAPPO URL aliases", () => {
  const originalBackendUrl = process.env.CAPPO_BACKEND_URL;
  const originalCappoUrl = process.env.CAPPO_URL;

  afterEach(() => {
    if (originalBackendUrl === undefined) delete process.env.CAPPO_BACKEND_URL;
    else process.env.CAPPO_BACKEND_URL = originalBackendUrl;

    if (originalCappoUrl === undefined) delete process.env.CAPPO_URL;
    else process.env.CAPPO_URL = originalCappoUrl;
  });

  it("uses CAPPO_URL when CAPPO_BACKEND_URL is unset", () => {
    delete process.env.CAPPO_BACKEND_URL;
    process.env.CAPPO_URL = "https://alias.test";

    let runtime: typeof import("@/lib/capi-runtime") | undefined;
    jest.isolateModules(() => {
      runtime = require("@/lib/capi-runtime") as typeof import("@/lib/capi-runtime");
    });

    expect(runtime?.CAPPO_BACKEND_URL).toBe("https://alias.test");
  });

  it("prefers CAPPO_BACKEND_URL when both aliases are set", () => {
    process.env.CAPPO_BACKEND_URL = "https://backend.test";
    process.env.CAPPO_URL = "https://alias.test";

    let runtime: typeof import("@/lib/capi-runtime") | undefined;
    jest.isolateModules(() => {
      runtime = require("@/lib/capi-runtime") as typeof import("@/lib/capi-runtime");
    });

    expect(runtime?.CAPPO_BACKEND_URL).toBe("https://backend.test");
  });
});
