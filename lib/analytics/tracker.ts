/**
 * Veklom first-party funnel analytics: cookieless, anonymous, no third party.
 *
 * - No cookies are set or read. No fingerprinting: nothing about the device,
 *   screen, fonts or user agent is collected.
 * - Session mode: a random id created per browser tab and kept in
 *   sessionStorage (gone when the tab closes). Events carry the page path
 *   (no query string), the referring site's domain on landing, and UTM tags.
 * - Aggregate mode: no id is created or stored and only a page_view with the
 *   path is sent. Used when the browser sends Global Privacy Control or Do Not
 *   Track, when the visitor chose "Essential only", when the server says prior
 *   consent is required (EEA, UK, China) and none was given, or when the mode
 *   cannot be determined.
 * - After sign-in, linkSession() asks the backend to record one
 *   analytics_session_linked activation event for this tab's id.
 *
 * Kept in sync with VLink src/analytics/tracker.ts (same code).
 */

export type AnalyticsHost = "veklom.com" | "os" | "vlink";
export type AnalyticsEventName =
  | "page_view"
  | "cta_click"
  | "scroll_depth"
  | "signup_started"
  | "signup_submitted"
  | "github_signup_clicked"
  | "login_viewed"
  | "login_succeeded"
  | "vlink_connect_viewed"
  | "page_exit";

type Props = Record<string, string | number | boolean>;
type QueuedEvent = { name: AnalyticsEventName; path: string; ts: number; props: Props };
type Mode = "pending" | "session" | "aggregate";
type Consent = "granted" | "denied" | "unset";

export const EVENTS_URL = "/api/v1/analytics/events";
export const CONFIG_URL = "/api/v1/analytics/config";
export const LINK_URL = "/api/v1/analytics/link";
const SID_KEY = "veklom.analytics.sid";
const LANDED_KEY = "veklom.analytics.landed";
const LINKED_KEY = "veklom.analytics.linked";
const GITHUB_PENDING_KEY = "veklom.analytics.github_pending";
const PRIVACY_KEY = "veklom_privacy_choices";
const PRIVACY_EVENT = "veklom:privacy-changed";
const MAX_BATCH = 25;
const FLUSH_AT = 10;
const FLUSH_MS = 5000;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

type State = {
  host: AnalyticsHost;
  mode: Mode;
  consent: Consent;
  sid: string | null;
  queue: QueuedEvent[];
  timer: ReturnType<typeof setTimeout> | null;
  pages: number;
  path: string;
  depthSent: Set<number>;
  maxDepth: number;
  visibleMs: number;
  visibleSince: number | null;
  hidden: boolean;
  signupStartedOn: string | null;
  pendingLink: string | null;
  fetchImpl: typeof fetch;
};

let state: State | null = null;

// ---------------------------------------------------------------------------
// Privacy signals
// ---------------------------------------------------------------------------

export function browserOptOut(): boolean {
  if (typeof navigator === "undefined") return true;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const win = typeof window !== "undefined" ? (window as Window & { doNotTrack?: string }) : undefined;
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1" || nav.msDoNotTrack === "1" || win?.doNotTrack === "1";
}

function readConsent(): Consent {
  try {
    const raw = window.localStorage.getItem(PRIVACY_KEY);
    if (!raw) return "unset";
    const parsed = JSON.parse(raw) as { analytics?: boolean };
    return parsed.analytics === true ? "granted" : "denied";
  } catch {
    return "unset";
  }
}

function session(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function newSid(): string | null {
  const bytes = new Uint8Array(16);
  if (typeof crypto === "undefined" || !crypto.getRandomValues) return null;
  crypto.getRandomValues(bytes);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function ensureSid(): string | null {
  const store = session();
  if (!store) return null;
  try {
    const existing = store.getItem(SID_KEY);
    if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
    const sid = newSid();
    if (sid) store.setItem(SID_KEY, sid);
    return sid;
  } catch {
    return null;
  }
}

function forgetSession() {
  const store = session();
  try {
    for (const k of [SID_KEY, LANDED_KEY, LINKED_KEY, GITHUB_PENDING_KEY]) store?.removeItem(k);
  } catch {
    /* storage unavailable */
  }
}

function setMode(mode: Mode) {
  if (!state) return;
  state.mode = mode;
  if (mode === "session") {
    state.sid = ensureSid();
    if (!state.sid) state.mode = "aggregate";
  } else if (mode === "aggregate") {
    state.sid = null;
    forgetSession();
  }
  if (state.mode === "session" && state.pendingLink) {
    const token = state.pendingLink;
    state.pendingLink = null;
    void linkSession(token);
  }
  if (state.mode !== "pending") scheduleFlush(0);
}

// ---------------------------------------------------------------------------
// Queue and transport
// ---------------------------------------------------------------------------

export function normalizePath(pathname: string): string {
  const path = (pathname || "/").split("?")[0].split("#")[0];
  return path
    .split("/")
    .map((seg) =>
      seg && (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg) ||
        (/\d/.test(seg) && /^[A-Za-z0-9_.~-]{16,}$/.test(seg)) || /^\d{4,}$/.test(seg) || seg.includes("@"))
        ? ":id"
        : seg,
    )
    .join("/")
    .slice(0, 512) || "/";
}

function currentPath(): string {
  return normalizePath(typeof window !== "undefined" ? window.location.pathname : "/");
}

function buildBodies(events: QueuedEvent[]): string[] {
  if (!state) return [];
  const aggregate = state.mode !== "session" || !state.sid;
  const list = aggregate
    ? events.filter((e) => e.name === "page_view").map((e) => ({ name: e.name, path: e.path, ts: e.ts, props: {} }))
    : events;
  const bodies: string[] = [];
  for (let i = 0; i < list.length; i += MAX_BATCH) {
    const chunk = list.slice(i, i + MAX_BATCH);
    const body: Record<string, unknown> = { v: 1, host: state.host, consent: state.consent, events: chunk };
    if (!aggregate) body.sid = state.sid;
    bodies.push(JSON.stringify(body));
  }
  return bodies;
}

function send(body: string, beacon: boolean) {
  if (!state) return;
  if (beacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      if (navigator.sendBeacon(EVENTS_URL, new Blob([body], { type: "text/plain;charset=UTF-8" }))) return;
    } catch {
      /* fall through to fetch */
    }
  }
  try {
    void state
      .fetchImpl(EVENTS_URL, {
        method: "POST",
        body,
        keepalive: true,
        credentials: "omit",
        headers: { "content-type": "text/plain;charset=UTF-8" },
      })
      .catch(() => undefined);
  } catch {
    /* analytics must never break the page */
  }
}

export function flush(beacon = false) {
  if (!state || state.queue.length === 0) return;
  if (state.mode === "pending") {
    if (!beacon) return;
    state.mode = "aggregate"; // leaving before the mode was known: send the safe form
  }
  const events = state.queue.splice(0, state.queue.length);
  for (const body of buildBodies(events)) send(body, beacon);
}

function scheduleFlush(delay = FLUSH_MS) {
  if (!state) return;
  if (state.timer) clearTimeout(state.timer);
  state.timer = setTimeout(() => {
    if (state) state.timer = null;
    flush(false);
  }, delay);
}

export function track(name: AnalyticsEventName, props: Props = {}, path?: string) {
  if (!state) return;
  if (state.mode === "aggregate" && name !== "page_view") return;
  state.queue.push({ name, path: path ? normalizePath(path) : currentPath(), ts: Date.now(), props });
  if (state.queue.length >= FLUSH_AT) scheduleFlush(0);
  else if (!state.timer) scheduleFlush();
}

// ---------------------------------------------------------------------------
// Page views, scroll depth, exit
// ---------------------------------------------------------------------------

function externalReferrerDomain(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (!host || host === window.location.hostname || host === "veklom.com" || host.endsWith(".veklom.com")) return undefined;
    return host.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function trackPage(pathname?: string) {
  if (!state) return;
  const path = normalizePath(pathname ?? window.location.pathname);
  state.path = path;
  state.pages += 1;
  state.depthSent = new Set();
  state.maxDepth = 0;
  const props: Props = {};
  const store = session();
  let landed = false;
  try {
    landed = store?.getItem(LANDED_KEY) === "1";
  } catch {
    landed = false;
  }
  if (!landed && state.pages === 1) {
    const ref = externalReferrerDomain();
    if (ref) props.referrer_domain = ref;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) props[k] = v.slice(0, 100);
    }
  } catch {
    /* ignore */
  }
  track("page_view", props, path);
  if (state.mode === "session") {
    try {
      store?.setItem(LANDED_KEY, "1");
    } catch {
      /* ignore */
    }
  }
  if (path === "/login" || path === "/login/") track("login_viewed", {}, path);
  measureScroll();
}

function measureScroll() {
  if (!state || typeof document === "undefined") return;
  const doc = document.documentElement;
  const scrollable = Math.max(doc.scrollHeight, document.body?.scrollHeight || 0);
  const seen = window.scrollY + window.innerHeight;
  const pct = scrollable > 0 ? Math.min(100, Math.round((seen / scrollable) * 100)) : 100;
  state.maxDepth = Math.max(state.maxDepth, pct);
  for (const mark of [50, 90]) {
    if (pct >= mark && !state.depthSent.has(mark) && scrollable > window.innerHeight * 1.2) {
      state.depthSent.add(mark);
      track("scroll_depth", { depth: mark });
    }
  }
}

function onHidden() {
  if (!state) return;
  if (state.hidden) {
    // pagehide right after visibilitychange: the exit is already queued or sent.
    flush(true);
    return;
  }
  state.hidden = true;
  if (state.visibleSince !== null) {
    state.visibleMs += Date.now() - state.visibleSince;
    state.visibleSince = null;
  }
  if (state.mode === "session") {
    track("page_exit", {
      engaged_s: Math.min(86_400, Math.round(state.visibleMs / 1000)),
      depth: state.maxDepth,
      pages: state.pages,
    });
  }
  flush(true);
}

// ---------------------------------------------------------------------------
// Interaction hooks: data attributes, no per-component wiring
// ---------------------------------------------------------------------------

function onClick(event: MouseEvent) {
  const target = event.target as Element | null;
  if (!target || typeof target.closest !== "function") return;
  const cta = target.closest<HTMLElement>("[data-analytics-cta]");
  if (cta) {
    const name = (cta.getAttribute("data-analytics-cta") || "").trim().toLowerCase();
    const href = cta.getAttribute("href");
    const props: Props = { cta: name };
    if (href && href.startsWith("/")) props.href = normalizePath(href);
    track("cta_click", props);
    if (name === "login-github") markGithubPending();
    return;
  }
  const navLink = target.closest<HTMLAnchorElement>("[data-analytics-nav] a[href]");
  if (navLink) {
    const href = navLink.getAttribute("href") || "";
    if (href.startsWith("/")) track("cta_click", { cta: `nav:${normalizePath(href)}`.slice(0, 64), href: normalizePath(href) });
  }
}

function onFocusIn(event: FocusEvent) {
  if (!state) return;
  const target = event.target as Element | null;
  if (!target || typeof target.closest !== "function") return;
  if (target.closest('[data-analytics-form="signup"]') && state.signupStartedOn !== state.path) {
    state.signupStartedOn = state.path;
    track("signup_started");
  }
}

function markGithubPending() {
  if (!state || state.mode !== "session") return;
  try {
    session()?.setItem(GITHUB_PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Signup page: "Sign up with GitHub" pressed. Marks this tab for a GitHub login_succeeded on return. */
export function trackGithubSignupClicked(accepted: boolean) {
  track("github_signup_clicked", { accepted });
  if (accepted) markGithubPending();
}

/** Call once a signed-in profile is known in this tab (covers the GitHub return trip). */
export function noteSignedIn(token: string | null) {
  if (!state) return;
  let githubPending = false;
  try {
    githubPending = session()?.getItem(GITHUB_PENDING_KEY) === "1";
    if (githubPending) session()?.removeItem(GITHUB_PENDING_KEY);
  } catch {
    githubPending = false;
  }
  if (githubPending) track("login_succeeded", { method: "github" });
  if (token) void linkSession(token);
}

/** Password sign-in succeeded in this tab. */
export function trackLoginSucceeded(method: "password" | "github", token: string | null) {
  track("login_succeeded", { method });
  if (token) void linkSession(token);
}

/** Link this tab's anonymous id to the signed-in workspace, once per tab. */
export async function linkSession(token: string): Promise<boolean> {
  if (!state || !token) return false;
  if (state.mode === "pending") {
    state.pendingLink = token;
    return false;
  }
  if (state.mode !== "session" || !state.sid) return false;
  const store = session();
  try {
    if (store?.getItem(LINKED_KEY) === state.sid) return true;
  } catch {
    return false;
  }
  try {
    const res = await state.fetchImpl(LINK_URL, {
      method: "POST",
      credentials: "omit",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ sid: state.sid, consent: state.consent }),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { linked?: boolean };
    if (body.linked) store?.setItem(LINKED_KEY, state.sid);
    return body.linked === true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function onPrivacyChanged() {
  if (!state) return;
  state.consent = readConsent();
  if (browserOptOut() || state.consent === "denied") setMode("aggregate");
  else void resolveMode();
}

async function resolveMode() {
  if (!state) return;
  try {
    const res = await state.fetchImpl(`${CONFIG_URL}?consent=${state.consent}`, {
      credentials: "omit",
      cache: "no-store",
    });
    const body = res.ok ? ((await res.json()) as { mode?: string }) : null;
    setMode(body?.mode === "session" ? "session" : "aggregate");
  } catch {
    setMode("aggregate");
  }
}

export function initAnalytics(opts: { host: AnalyticsHost; fetchImpl?: typeof fetch }): boolean {
  if (typeof window === "undefined") return false;
  if (state) return false;
  state = {
    host: opts.host,
    mode: "pending",
    consent: readConsent(),
    sid: null,
    queue: [],
    timer: null,
    pages: 0,
    path: currentPath(),
    depthSent: new Set(),
    maxDepth: 0,
    visibleMs: 0,
    visibleSince: document.visibilityState === "visible" ? Date.now() : null,
    hidden: document.visibilityState === "hidden",
    signupStartedOn: null,
    pendingLink: null,
    fetchImpl: opts.fetchImpl ?? window.fetch.bind(window),
  };
  if (browserOptOut() || state.consent === "denied") setMode("aggregate");
  else void resolveMode();

  let scrollQueued = false;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollQueued) return;
      scrollQueued = true;
      window.requestAnimationFrame(() => {
        scrollQueued = false;
        measureScroll();
      });
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", () => {
    if (!state) return;
    if (document.visibilityState === "hidden") onHidden();
    else {
      state.hidden = false;
      if (state.visibleSince === null) state.visibleSince = Date.now();
    }
  });
  window.addEventListener("pagehide", () => onHidden());
  document.addEventListener("click", onClick, { capture: true });
  document.addEventListener("focusin", onFocusIn);
  window.addEventListener(PRIVACY_EVENT, onPrivacyChanged);
  return true;
}

/** Test hook. */
export function __resetAnalyticsForTests() {
  if (state?.timer) clearTimeout(state.timer);
  state = null;
}

export function __analyticsStateForTests() {
  return state ? { mode: state.mode, sid: state.sid, queued: state.queue.length } : null;
}
