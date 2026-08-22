/** @jest-environment node */
import { GET } from "./route";

describe("Nexus state aggregator", () => {
  afterEach(() => jest.restoreAllMocks());

  it("uses canonical BYOS routes and reports no proof when evidence counts are zero", async () => {
    const responses: Record<string, unknown> = {
      "/api/v1/vnp/metrics": {
        active_apis: 0,
        total_physical_measurements: 0,
        signed_probe_events: 0,
        blockAnchored: 0,
      },
      "/api/v1/vnp/beacon": { routes: [] },
      "/api/v1/vnp/directory/realtime": { apis: [] },
      "/api/v1/x402/staking/state": { providers: [], protocolStats: {} },
    };
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const pathname = new URL(String(input)).pathname;
      return new Response(JSON.stringify(responses[pathname]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchSpy.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual(Object.keys(responses));
    expect(body.proof.state).toBe("none");
    expect(body.proof.probes).toHaveLength(4);
    expect(body.proof.probes.every((probe: { state: string }) => probe.state === "needs_proof")).toBe(true);
    expect(body.cards).toEqual([]);
    expect(body.nodes).toEqual([]);
  });
});
