/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("workspace cAPI execution boundary", () => {
  const originalKey = process.env.CAPI_API_KEY;

  beforeAll(() => {
    process.env.CAPI_API_KEY = "server-capi-key";
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(() => {
    if (originalKey === undefined) delete process.env.CAPI_API_KEY;
    else process.env.CAPI_API_KEY = originalKey;
  });

  it("derives requester context from BYOS and never manufactures authority metrics", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "user-1",
        workspace_id: "workspace-1",
        role: "member",
      }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ run_id: "run-1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }));

    const response = await POST(new NextRequest("https://app.veklom.com/api/v1/capi/execute", {
      method: "POST",
      headers: {
        authorization: "Bearer workspace-session",
        "content-type": "application/json",
        "x-user-role": "admin",
        "x-user-credits": "999999",
        "x-agent-confidence": "1.0",
      },
      body: JSON.stringify({
        agent_id: "agent-1",
        capability_id: "capability-1",
        action: "inspect",
        workspace_id: "spoofed-workspace",
      }),
    }));

    expect(response.status).toBe(200);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://api.veklom.com/api/v1/auth/me");
    const upstream = fetchSpy.mock.calls[1];
    const headers = new Headers(upstream?.[1]?.headers);
    expect(headers.get("x-workspace-id")).toBe("workspace-1");
    expect(headers.get("x-veklom-requester-id")).toBe("user-1");
    expect(headers.get("x-user-role")).toBe("member");
    expect(headers.get("x-user-credits")).toBeNull();
    expect(headers.get("x-agent-confidence")).toBeNull();
    expect(JSON.parse(String(upstream?.[1]?.body)).input.workspace_id).toBe("workspace-1");
  });
});
