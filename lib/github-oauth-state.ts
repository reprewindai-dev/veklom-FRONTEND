import { randomBytes, timingSafeEqual } from "crypto";

export type GitHubOAuthState = {
  nonce: string;
  returnTo: string;
};

export function safeGitHubReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/os";
  }

  try {
    const base = new URL("https://veklom.invalid");
    const resolved = new URL(value, base);
    if (resolved.origin !== base.origin) return "/os";
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return "/os";
  }
}

export function createGitHubOAuthState(returnToValue: unknown): string {
  const payload: GitHubOAuthState = {
    nonce: randomBytes(32).toString("base64url"),
    returnTo: safeGitHubReturnTo(returnToValue),
  };
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

export function parseGitHubOAuthState(value: string | null): GitHubOAuthState | null {
  if (!value) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf-8"),
    ) as Record<string, unknown>;
    if (typeof decoded.nonce !== "string" || decoded.nonce.length === 0) {
      return null;
    }
    return {
      nonce: decoded.nonce,
      returnTo: safeGitHubReturnTo(decoded.returnTo),
    };
  } catch {
    return null;
  }
}

export function githubOAuthStateMatches(
  expected: string | undefined,
  actual: string | null,
): boolean {
  if (!expected || !actual) return false;
  const left = Buffer.from(expected, "utf-8");
  const right = Buffer.from(actual, "utf-8");
  return left.length === right.length && timingSafeEqual(left, right);
}
