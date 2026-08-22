import { execFileSync } from "node:child_process";
import path from "node:path";

function readOutputMode(vercel: boolean): string {
  const configPath = path.resolve(process.cwd(), "next.config.mjs").replaceAll("\\", "/");
  const script = `
    process.env.NODE_ENV = "production";
    process.env.BACKEND_URL = "https://api.example";
    ${vercel ? 'process.env.VERCEL = "1";' : 'delete process.env.VERCEL;'}
    const { default: config } = await import("file:///${configPath}?mode=${vercel}");
    process.stdout.write(String(config.output ?? "platform-managed"));
  `;
  return execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
    encoding: "utf8",
  });
}

test("lets Vercel manage Next.js output tracing", () => {
  expect(readOutputMode(true)).toBe("platform-managed");
});

test("keeps standalone output for Docker and Coolify", () => {
  expect(readOutputMode(false)).toBe("standalone");
});
