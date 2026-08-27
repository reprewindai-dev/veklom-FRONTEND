import {
  createGitHubOAuthState,
  githubOAuthStateMatches,
  parseGitHubOAuthState,
  safeGitHubReturnTo,
} from "../github-oauth-state";

describe("GitHub OAuth state boundary", () => {
  test("binds the complete return intent to the browser state value", () => {
    const expected = createGitHubOAuthState("/os?tab=proof");
    const parsed = parseGitHubOAuthState(expected);
    expect(parsed).not.toBeNull();

    const tampered = Buffer.from(
      JSON.stringify({
        nonce: parsed!.nonce,
        returnTo: "/os?tab=admin",
      }),
      "utf-8",
    ).toString("base64url");

    expect(githubOAuthStateMatches(expected, expected)).toBe(true);
    expect(githubOAuthStateMatches(expected, tampered)).toBe(false);
  });

  test("generates a fresh state value for each login attempt", () => {
    const first = createGitHubOAuthState("/os");
    const second = createGitHubOAuthState("/os");

    expect(first).not.toBe(second);
    expect(githubOAuthStateMatches(first, second)).toBe(false);
  });

  test.each([
    ["//evil.example/path", "/os"],
    ["/\\evil.example/path", "/os"],
    ["https://evil.example/path", "/os"],
    ["/os?tab=proof#latest", "/os?tab=proof#latest"],
  ])("constrains returnTo %s to %s", (input, expected) => {
    expect(safeGitHubReturnTo(input)).toBe(expected);
  });

  test("rejects missing or malformed state", () => {
    expect(parseGitHubOAuthState(null)).toBeNull();
    expect(parseGitHubOAuthState("not-base64-json")).toBeNull();
    expect(githubOAuthStateMatches(undefined, null)).toBe(false);
  });
});
