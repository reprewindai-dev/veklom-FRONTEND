import { NextRequest } from "next/server";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("CAPPO proxy machine-authority boundary", () => {
  const originalCappoUrl = process.env.CAPPO_BACKEND_URL;
  const originalBackendUrl = process.env.VBB_BACKEND_URL;

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    if (originalCappoUrl === undefined) delete process.env.CAPPO_BACKEND_URL;
    else process.env.CAPPO_BACKEND_URL = originalCappoUrl;
    if (originalBackendUrl === undefined) delete process.env.VBB_BACKEND_URL;
    else process.env.VBB_BACKEND_URL = originalBackendUrl;
  });

  it("strips browser-supplied WID and authority headers before forwarding to CAPPO", async () => {
    process.env.CAPPO_BACKEND_URL = "https://cappo.test";
    process.env.VBB_BACKEND_URL = "https://byos.test";

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "workspace-bound-jwt" }))
      .mockResolvedValueOnce(jsonResponse({ error: "WID_REQUIRED" }, 403));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/[...proxy]/route");
    const request = new NextRequest("http://localhost/api/cappo/v1/exec", {
      method: "POST",
      headers: {
        cookie: "veklom-session=test",
        "content-type": "application/json",
        "Workload-Identity": "caller-controlled-wit",
        "Execution-Context": "caller-controlled-ect",
        "Workload-Proof": "caller-controlled-wpt",
        "Veklom-Authority": "caller-controlled-authority",
      },
      body: JSON.stringify({ prompt: "attempt consequence" }),
    });

    await POST(request);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [target, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(target).toBe("https://cappo.test/v1/exec");
    const forwarded = new Headers(init.headers);
    expect(forwarded.get("authorization")).toBe("Bearer workspace-bound-jwt");
    expect(forwarded.has("workload-identity")).toBe(false);
    expect(forwarded.has("execution-context")).toBe(false);
    expect(forwarded.has("workload-proof")).toBe(false);
    expect(forwarded.has("veklom-authority")).toBe(false);
  });
});
