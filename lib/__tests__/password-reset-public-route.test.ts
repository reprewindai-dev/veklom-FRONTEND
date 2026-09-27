/**
 * @jest-environment node
 */
import { api } from "@/lib/api";

describe("password reset error handling", () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("keeps an expired reset link on the reset form so its error is visible", async () => {
    const location = {
      origin: "https://veklom.com",
      pathname: "/reset-password",
      protocol: "https:",
      href: "https://veklom.com/reset-password?token=expired",
    };
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location,
        localStorage: { getItem: () => null },
        dispatchEvent: jest.fn(),
      },
    });
    globalThis.fetch = jest.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: { code: 401, message: "Invalid or expired token" } }),
      { status: 401, headers: { "content-type": "application/json" } },
    ));

    await expect(api("/api/v1/auth/password-reset/confirm", {
      unauth: true,
      body: { token: "expired", new_password: "example-password" },
    })).rejects.toMatchObject({ status: 401, message: "Invalid or expired token" });

    expect(location.href).toBe("https://veklom.com/reset-password?token=expired");
  });
});
