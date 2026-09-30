import {
  CONFIG_URL,
  EVENTS_URL,
  LINK_URL,
  __analyticsStateForTests,
  __resetAnalyticsForTests,
  flush,
  initAnalytics,
  linkSession,
  normalizePath,
  track,
  trackPage,
} from "../analytics/tracker";

type Call = { url: string; init?: RequestInit };

function mockFetch(configMode: "session" | "aggregate" = "session") {
  const calls: Call[] = [];
  const impl = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const body = String(url).startsWith(CONFIG_URL)
      ? { mode: configMode, reasons: [] }
      : String(url) === LINK_URL
        ? { linked: true, new: true }
        : { accepted: 1 };
    return { ok: true, status: 200, json: async () => body } as Response;
  });
  return { calls, impl: impl as unknown as typeof fetch };
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const eventBodies = (calls: Call[]) =>
  calls.filter((c) => c.url === EVENTS_URL).map((c) => JSON.parse(String(c.init?.body)));

function setNavigatorFlag(name: string, value: unknown) {
  Object.defineProperty(window.navigator, name, { value, configurable: true });
}

beforeEach(() => {
  __resetAnalyticsForTests();
  window.sessionStorage.clear();
  window.localStorage.clear();
  setNavigatorFlag("globalPrivacyControl", undefined);
  setNavigatorFlag("doNotTrack", null);
  Object.defineProperty(document, "referrer", { value: "https://news.ycombinator.com/item?id=1", configurable: true });
  window.history.replaceState({}, "", "/pricing?utm_source=hn&email=a@b.c");
});

afterEach(() => __resetAnalyticsForTests());

describe("first-party analytics tracker", () => {
  it("under Global Privacy Control sends only an aggregate page_view with no session id and stores nothing", async () => {
    setNavigatorFlag("globalPrivacyControl", true);
    const { calls, impl } = mockFetch();
    initAnalytics({ host: "veklom.com", fetchImpl: impl });
    trackPage("/pricing");
    track("cta_click", { cta: "start-free-vlink:hero" });
    track("signup_started");
    flush();
    await tick();

    expect(calls.some((c) => c.url.startsWith(CONFIG_URL))).toBe(false);
    const bodies = eventBodies(calls);
    expect(bodies).toHaveLength(1);
    expect(bodies[0].sid).toBeUndefined();
    expect(bodies[0].events).toEqual([{ name: "page_view", path: "/pricing", ts: expect.any(Number), props: {} }]);
    expect(window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe("");
    expect(await linkSession("token")).toBe(false);
    expect(calls.some((c) => c.url === LINK_URL)).toBe(false);
  });

  it("honours Do Not Track the same way", async () => {
    setNavigatorFlag("doNotTrack", "1");
    const { calls, impl } = mockFetch();
    initAnalytics({ host: "os", fetchImpl: impl });
    trackPage("/os");
    flush();
    const bodies = eventBodies(calls);
    expect(bodies[0].sid).toBeUndefined();
    expect(bodies[0].host).toBe("os");
    expect(__analyticsStateForTests()?.mode).toBe("aggregate");
  });

  it("treats a saved 'Essential only' choice as aggregate-only without asking the server", () => {
    window.localStorage.setItem("veklom_privacy_choices", JSON.stringify({ version: "2026-08-31.1", analytics: false }));
    const { calls, impl } = mockFetch();
    initAnalytics({ host: "veklom.com", fetchImpl: impl });
    expect(__analyticsStateForTests()?.mode).toBe("aggregate");
    expect(calls).toHaveLength(0);
  });

  it("goes aggregate when the server says prior consent is required", async () => {
    const { calls, impl } = mockFetch("aggregate");
    initAnalytics({ host: "veklom.com", fetchImpl: impl });
    trackPage("/");
    await tick();
    await tick();
    flush();
    expect(window.sessionStorage.getItem("veklom.analytics.sid")).toBeNull();
    expect(eventBodies(calls).every((b) => b.sid === undefined)).toBe(true);
  });

  it("in session mode sends a per-tab id, landing referrer domain and UTM tags, never the query string", async () => {
    const { calls, impl } = mockFetch("session");
    initAnalytics({ host: "veklom.com", fetchImpl: impl });
    trackPage("/pricing");
    await tick();
    await tick();
    track("cta_click", { cta: "start-free-trial" });
    flush();

    const sid = window.sessionStorage.getItem("veklom.analytics.sid");
    expect(sid).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
    const events = eventBodies(calls).flatMap((b) => {
      expect(b.sid).toBe(sid);
      return b.events;
    });
    const pv = events.find((e: { name: string }) => e.name === "page_view");
    expect(pv.path).toBe("/pricing");
    expect(pv.props).toEqual({ referrer_domain: "news.ycombinator.com", utm_source: "hn" });
    expect(JSON.stringify(events)).not.toContain("a@b.c");
    expect(events.some((e: { name: string }) => e.name === "cta_click")).toBe(true);
    expect(document.cookie).toBe("");

    expect(await linkSession("tok")).toBe(true);
    const link = calls.find((c) => c.url === LINK_URL);
    expect(JSON.parse(String(link?.init?.body)).sid).toBe(sid);
    expect(link?.init?.credentials).toBe("omit");
  });

  it("scrubs token-like and email path segments", () => {
    expect(normalizePath("/reset-password/eyJhbGciOiJIUzI1NiJ9abc123")).toBe("/reset-password/:id");
    expect(normalizePath("/pair/3f2a9c1e-1111-4222-8333-444455556666/x")).toBe("/pair/:id/x");
    expect(normalizePath("/u/ada@example.com")).toBe("/u/:id");
    expect(normalizePath("/acceptable-use/")).toBe("/acceptable-use/");
    expect(normalizePath("/login?returnTo=/os")).toBe("/login");
  });
});
