/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/auth/github/callback/route";

describe("GitHub OAuth callback public origin", () => {
  it("does not redirect the browser to the private frontend container origin", async () => {
    const request = new NextRequest(
      "http://0.0.0.0:3002/api/auth/github/callback?code=sample-code&state=sample-state",
      { headers: { "x-forwarded-host": "0.0.0.0:3002", "x-forwarded-proto": "https" } },
    );

    const response = await GET(request);
    const location = new URL(response.headers.get("location")!);

    expect(location.origin).toBe("https://veklom.com");
    expect(location.pathname).toBe("/api/v1/auth/github/callback");
    expect(location.searchParams.get("code")).toBe("sample-code");
    expect(location.searchParams.get("state")).toBe("sample-state");
  });

  it("does not trust an arbitrary forwarded host", async () => {
    const request = new NextRequest(
      "https://internal-service:3002/api/auth/github/callback?error=access_denied",
      { headers: { "x-forwarded-host": "attacker.example" } },
    );

    const response = await GET(request);
    const location = new URL(response.headers.get("location")!);

    expect(location.origin).toBe("https://veklom.com");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("github_error")).toBe("access_denied");
  });

  it("preserves the local origin for local development", async () => {
    const request = new NextRequest("http://localhost:3002/api/auth/github/callback?error=access_denied");

    const response = await GET(request);

    expect(new URL(response.headers.get("location")!).origin).toBe("http://localhost:3002");
  });
});
