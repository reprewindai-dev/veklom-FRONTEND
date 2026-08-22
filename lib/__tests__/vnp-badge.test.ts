import { TextDecoder, TextEncoder } from "util";
import { ReadableStream, TransformStream, WritableStream } from "stream/web";

let getBadge: typeof import("@/app/api/vnp/badge/[apiId]/route").GET;

beforeAll(async () => {
  Object.assign(globalThis, {
    ReadableStream,
    TransformStream,
    WritableStream,
    TextDecoder,
    TextEncoder,
  });
  const {
    Headers: EdgeHeaders,
    Request: EdgeRequest,
    Response: EdgeResponse,
  } = await import("next/dist/compiled/@edge-runtime/primitives/fetch");
  Object.assign(globalThis, {
    Headers: EdgeHeaders,
    Request: EdgeRequest,
    Response: EdgeResponse,
  });
  ({ GET: getBadge } = await import("@/app/api/vnp/badge/[apiId]/route"));
});

describe("VNP badge proof boundary", () => {
  it.each([0, 3, 25])("renders Needs proof for %i aggregate samples", async (sampleCount) => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify([{ id: "provider-a", name: "Provider A", sampleCount }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    global.fetch = fetchMock;

    const response = await getBadge(new Request("http://localhost/api/vnp/badge/provider-a"), {
      params: Promise.resolve({ apiId: "provider-a" }),
    });
    const svg = await response.text();

    expect(response.headers.get("X-VNP-Score")).toBe("Needs proof");
    expect(svg).toContain("NEEDS PROOF");
    expect(svg).toContain("Needs proof");
    expect(svg).not.toMatch(/GOLD|SILVER|BRONZE|Score [0-9]/);
    expect(svg).toContain('stroke-dasharray="0 50.3"');

    console.log(`sampleCount=${sampleCount}: X-VNP-Score=Needs proof; badge=NEEDS PROOF; arc=0`);
  });
});
