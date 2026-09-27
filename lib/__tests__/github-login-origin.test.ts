import { safePublicOrigin } from "@/lib/auth-origin";

function headers(values: Record<string, string>) {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

describe("GitHub login origin", () => {
  it("never exposes the internal 0.0.0.0 bind address", () => {
    expect(safePublicOrigin(headers({ host: "localhost:3002" }))).toBe("http://localhost:3002");
  });

  it("honors the externally forwarded Veklom origin", () => {
    expect(
      safePublicOrigin(
        headers({
          host: "frontend:3002",
          "x-forwarded-host": "app.veklom.com",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe("https://app.veklom.com");
  });

  it("rejects an untrusted host header and falls back to configured origin", () => {
    const previous = process.env.PUBLIC_FRONTEND_URL;
    process.env.PUBLIC_FRONTEND_URL = "https://veklom.com";
    try {
      expect(safePublicOrigin(headers({ host: "attacker.example" }))).toBe("https://veklom.com");
    } finally {
      if (previous === undefined) delete process.env.PUBLIC_FRONTEND_URL;
      else process.env.PUBLIC_FRONTEND_URL = previous;
    }
  });
});
