import { api, ApiError } from "../api";

function mockResponse(body: string, status: number): Response {
  return {
    body: null,
    headers: { get: (name: string) => name.toLowerCase() === "content-type" ? "application/json" : null },
    ok: status >= 200 && status < 300,
    status,
    statusText: "Not Found",
    text: async () => body,
  } as Response;
}

describe("VNP measurement absence contract", () => {
  beforeEach(() => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    delete (global as { fetch?: typeof fetch }).fetch;
    jest.restoreAllMocks();
  });

  it("surfaces missing measurements instead of swallowing a 404", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockResponse(JSON.stringify({ detail: "measurement not found" }), 404),
    );

    const error = await api("/api/cappo/v1/executions/exec-1/measurements", {
      unauth: true,
    }).catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, kind: "http" });
  });
});
