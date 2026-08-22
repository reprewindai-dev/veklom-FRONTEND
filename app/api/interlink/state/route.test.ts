/** @jest-environment node */
import { GET } from "./route";

describe("Interlink live state", () => {
  afterEach(() => jest.restoreAllMocks());

  it("reads cAPI live state through the workspace server boundary", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "ok" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ role: "connection-layer", capabilities: ["routing"] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ openapi_servers: [], native_mcp_servers: [], total_tools: 0 }), { status: 200 }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchSpy.mock.calls.map(([url]) => String(url))).toEqual([
      "https://capi.veklom.com/health",
      "https://capi.veklom.com/protocol.json",
      "https://capi.veklom.com/api/mcp/servers",
    ]);
    expect(body.live).toBe(true);
    expect(body.total_tools).toBe(0);
    expect(body.proof).toBe("VERIFIED_LIVE");
  });
});
