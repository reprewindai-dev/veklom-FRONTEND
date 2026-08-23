import { api, ApiError, getToken, getTransportState } from '../api';

function mockResponse(body: string, status: number, contentType: string): Response {
  return {
    body: null,
    headers: { get: (name: string) => name.toLowerCase() === "content-type" ? contentType : null },
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    text: async () => body,
  } as Response;
}

describe('getToken (browser environment)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should return null when no tokens are in localStorage', () => {
    expect(getToken()).toBeNull();
  });

  it('should return token from veklom.access_token', () => {
    window.localStorage.setItem('veklom.access_token', 'test-token-1');
    expect(getToken()).toBe('test-token-1');
  });

  it('should return token from veklom_token if veklom.access_token is not present', () => {
    window.localStorage.setItem('veklom_token', 'test-token-2');
    expect(getToken()).toBe('test-token-2');
  });

  it('should prefer veklom.access_token over veklom_token', () => {
    window.localStorage.setItem('veklom_token', 'test-token-2');
    window.localStorage.setItem('veklom.access_token', 'test-token-1');

    expect(getToken()).toBe('test-token-1');
  });
});

describe("api transport failures", () => {
  beforeEach(() => {
    window.localStorage.setItem("veklom.access_token", "test-transport-token");
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    delete (global as { fetch?: typeof fetch }).fetch;
    jest.restoreAllMocks();
  });

  it("classifies non-2xx responses as HTTP failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockResponse(JSON.stringify({ error: "missing" }), 404, "application/json"),
    );

    const error = await api("/missing", { unauth: true }).catch((caught) => caught);
    expect(error).toMatchObject({
      kind: "http",
      status: 404,
    });
    expect(error).toBeInstanceOf(ApiError);
    expect(getTransportState(error)).toBe("UNAVAILABLE");
  });

  it("rejects HTML when JSON is expected", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockResponse("<html><body>login</body></html>", 200, "text/html"),
    );

    await expect(api("/redirected-login", { unauth: true })).rejects.toMatchObject({
      kind: "html",
      status: 200,
    });
  });

  it("rejects invalid successful JSON payloads", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockResponse("not-json", 200, "application/json"),
    );

    const error = await api("/invalid-json", { unauth: true }).catch((caught) => caught);
    expect(error).toMatchObject({ kind: "invalid_json", status: 200 });
    expect(getTransportState(error)).toBe("FAILED");
  });

  it("classifies network failures without returning empty data", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await api("/offline", { unauth: true }).catch((caught) => caught);
    expect(error).toMatchObject({ kind: "network" });
    expect(getTransportState(error)).toBe("UNKNOWN");
  });

  it("classifies an unresolved server-side base URL as configuration", async () => {
    await expect(api("/without-base-url", { baseUrl: "not-a-url", unauth: true })).rejects.toMatchObject({
      kind: "configuration",
    });
  });
});
