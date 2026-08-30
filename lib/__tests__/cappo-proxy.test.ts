/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

type ProxyModule = typeof import("@/app/api/[...proxy]/route");

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function cappoAssertion(): string {
  return `${base64url({ alg: "EdDSA", typ: "JWT" })}.${base64url({
    sub: "actor-test",
    workspace_id: "ws-test",
    exp: Math.floor(Date.now() / 1000) + 300,
  })}.test-signature`;
}

function activationExecBody() {
  return {
    prompt: "Activation governed write",
    action: "activation.marker.write",
    scope: {
      tools: ["activation.marker.write"],
      allowed_effects: ["activation.marker.write"],
    },
    capability_lease: {
      mount_id: "mnt_1",
      token_id: "tok_1",
      nonce: "nonce_1",
      execution_id: "exec_1",
    },
  };
}

function preparedExecution(body: Record<string, unknown>) {
  const preparedBody = JSON.stringify({
    ...body,
    workspace_id: "ws-test",
    pgl_id: "pgl-test",
  });
  return {
    targetUri: "https://cappo.test/v1/exec",
    body: preparedBody,
    headers: {
      "content-type": "application/json",
      "content-digest": "sha-256=:dGVzdA==:",
      "signature-input":
        'sig1=("@method" "@target-uri" "content-digest" "execution-context" "veklom-authority" "workload-identity" "workload-proof" "x-veklom-actor" "x-veklom-nonce");created=1700000000;keyid="capi-test"',
      signature: "sig1=:dGVzdC1zaWduYXR1cmU=:",
      "workload-identity": "wit-test",
      "execution-context": "ect-test",
      "workload-proof": "wpt-test",
      "veklom-authority": "authority-test",
      "x-veklom-actor": "actor-test",
      "x-veklom-nonce": "request-nonce-test",
    },
  };
}

describe("CAPPO proxy boundary", () => {
  let proxyModule: ProxyModule;
  const originalBackendUrl = process.env.CAPPO_BACKEND_URL;
  const originalCapiBackendUrl = process.env.CAPI_BACKEND_URL;
  const originalInternalKey = process.env.CAPPO_INTERNAL_EXEC_KEY;

  beforeAll(() => {
    process.env.CAPPO_BACKEND_URL = "https://cappo.test";
    process.env.CAPI_BACKEND_URL = "https://capi.test";
    process.env.CAPPO_INTERNAL_EXEC_KEY = "test-internal-key";
    jest.isolateModules(() => {
      proxyModule = require("@/app/api/[...proxy]/route") as ProxyModule;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalBackendUrl === undefined) delete process.env.CAPPO_BACKEND_URL;
    else process.env.CAPPO_BACKEND_URL = originalBackendUrl;
    if (originalCapiBackendUrl === undefined) delete process.env.CAPI_BACKEND_URL;
    else process.env.CAPI_BACKEND_URL = originalCapiBackendUrl;
    if (originalInternalKey === undefined) delete process.env.CAPPO_INTERNAL_EXEC_KEY;
    else process.env.CAPPO_INTERNAL_EXEC_KEY = originalInternalKey;
  });

  it("refuses an unlisted CAPPO path without contacting an upstream", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/not-allowlisted", {
      method: "GET",
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps an invalid BYOS session to 401 without contacting CAPPO", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid token" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/runs", {
      method: "GET",
      headers: {
        authorization: "Bearer byos-session-token",
        cookie: "veklom.session=present",
      },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(401);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://api.veklom.com/api/v1/auth/cappo-token");
  });

  it("maps a missing workspace to 403 without contacting CAPPO", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: { error: "WORKSPACE_CONTEXT_MISSING" } }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/runs", {
      method: "GET",
      headers: { authorization: "Bearer byos-session-token" },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      detail: { error: "WORKSPACE_CONTEXT_MISSING" },
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("exchanges browser identity, prepares signed execution server-side, then forwards to CAPPO", async () => {
    const assertion = cappoAssertion();
    const browserBody = activationExecBody();
    const prepared = preparedExecution(browserBody);
    const fetchSpy = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: assertion }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(prepared), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "payment-required" }), {
          status: 402,
          headers: { "content-type": "application/json" },
        }),
      );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/exec", {
      method: "POST",
      headers: {
        authorization: "Bearer byos-session-token",
        cookie: "veklom.session=present",
        "x-api-key": "browser-key-must-not-forward",
        "content-type": "application/json",
      },
      body: JSON.stringify(browserBody),
    });

    const response = await proxyModule.POST(request);

    expect(response.status).toBe(402);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://api.veklom.com/api/v1/auth/cappo-token");
    expect(fetchSpy.mock.calls[1]?.[0]).toBe("https://capi.test/api/internal/cappo/prepare");
    expect(fetchSpy.mock.calls[2]?.[0]).toBe("https://cappo.test/v1/exec");

    const prepareInit = fetchSpy.mock.calls[1]?.[1];
    const prepareHeaders = new Headers(prepareInit?.headers);
    expect(prepareHeaders.get("x-cappo-internal-key")).toBe("test-internal-key");
    expect(prepareHeaders.get("authorization")).toBeNull();
    expect(JSON.parse(String(prepareInit?.body))).toEqual({
      body: browserBody,
      executionId: "exec_1",
      workspaceId: "ws-test",
      actorId: "actor-test",
    });

    const upstreamInit = fetchSpy.mock.calls[2]?.[1];
    const upstreamHeaders = new Headers(upstreamInit?.headers);
    expect(upstreamInit?.body).toBe(prepared.body);
    expect(upstreamHeaders.get("x-api-key")).toBeNull();
    expect(upstreamHeaders.get("cookie")).toBeNull();
    expect(upstreamHeaders.get("authorization")).toBe(`Bearer ${assertion}`);
    expect(upstreamHeaders.get("content-digest")).toBe(prepared.headers["content-digest"]);
    expect(upstreamHeaders.get("signature-input")).toBe(prepared.headers["signature-input"]);
    expect(upstreamHeaders.get("signature")).toBe(prepared.headers.signature);
    expect(upstreamHeaders.get("workload-identity")).toBe("wit-test");
    expect(upstreamHeaders.get("execution-context")).toBe("ect-test");
    expect(upstreamHeaders.get("workload-proof")).toBe("wpt-test");
    expect(upstreamHeaders.get("veklom-authority")).toBe("authority-test");
  });

  it("proxies the authenticated agents collection through CAPPO", async () => {
    const assertion = cappoAssertion();
    const fetchSpy = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: assertion }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ agents: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    const request = new NextRequest("https://control.veklom.com/api/cappo/api/v1/agents", {
      method: "GET",
      headers: {
        authorization: "Bearer byos-session-token",
        cookie: "veklom.session=present",
      },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://api.veklom.com/api/v1/auth/cappo-token");
    const exchangeHeaders = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers);
    expect(exchangeHeaders.get("authorization")).toBe("Bearer byos-session-token");
    expect(exchangeHeaders.get("cookie")).toBe("veklom.session=present");
    expect(fetchSpy.mock.calls[1]?.[0]).toBe("https://cappo.test/api/v1/agents");
    const upstreamHeaders = new Headers(fetchSpy.mock.calls[1]?.[1]?.headers);
    expect(upstreamHeaders.get("x-api-key")).toBeNull();
    expect(upstreamHeaders.get("x-workspace-id")).toBeNull();
    expect(upstreamHeaders.get("x-veklom-requester-id")).toBeNull();
    expect(upstreamHeaders.get("authorization")).toBe(`Bearer ${assertion}`);
    expect(upstreamHeaders.get("cookie")).toBeNull();
  });

  it("fails closed when the BYOS assertion exchange is unavailable", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "unavailable" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/runs", {
      method: "GET",
      headers: { authorization: "Bearer byos-session-token" },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "CAPPO_ASSERTION_UNAVAILABLE" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("forwards public CAPPO discovery paths without credentials", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ x402Version: 1 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new NextRequest("https://control.veklom.com/api/cappo/.well-known/x402", {
      method: "GET",
      headers: {
        authorization: "Bearer browser-session",
        cookie: "session=present",
        "x-api-key": "browser-key",
      },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const upstreamHeaders = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers);
    expect(upstreamHeaders.get("authorization")).toBeNull();
    expect(upstreamHeaders.get("cookie")).toBeNull();
    expect(upstreamHeaders.get("x-api-key")).toBeNull();
  });

  it("keeps public VNP metrics credential-free", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ proofState: "measured" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/vnp/metrics", {
      method: "GET",
      headers: {
        authorization: "Bearer browser-session",
        cookie: "session=present",
        "x-workspace-id": "client-controlled-workspace",
      },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://cappo.test/v1/vnp/metrics");
    const upstreamHeaders = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers);
    expect(upstreamHeaders.get("authorization")).toBeNull();
    expect(upstreamHeaders.get("cookie")).toBeNull();
    expect(upstreamHeaders.get("x-workspace-id")).toBeNull();
    expect(upstreamHeaders.get("x-api-key")).toBeNull();
  });

  it("passes CAPPO payment responses through unchanged after signed preparation", async () => {
    const assertion = cappoAssertion();
    const browserBody = activationExecBody();
    const prepared = preparedExecution(browserBody);
    const paymentBody = JSON.stringify({ x402Version: 1, accepts: [] });
    const fetchSpy = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: assertion }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(prepared), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(paymentBody, {
          status: 402,
          headers: { "content-type": "application/json", "x-payment-required": "true" },
        }),
      );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/exec", {
      method: "POST",
      headers: { authorization: "Bearer byos-session-token" },
      body: JSON.stringify(browserBody),
    });

    const response = await proxyModule.POST(request);

    expect(response.status).toBe(402);
    expect(await response.json()).toEqual(JSON.parse(paymentBody));
    expect(response.headers.get("x-payment-required")).toBe("true");
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
