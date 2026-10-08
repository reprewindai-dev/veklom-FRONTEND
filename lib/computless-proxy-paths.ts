/**
 * Private Cloud (COMPUTLESS owned-compute fabric) routes reachable through the OS proxy.
 * Only these are forwarded; everything else under /api/computless is refused.
 *
 * Two kinds of caller:
 * - The fabric owner (a listed owner account) uses the single-owner routes. Owner-only
 *   routes carry the fabric owner token, attached server-side only.
 * - Every other signed-in account is a customer: its calls go to that account's own
 *   workspace (/api/fabric/t/*) with the service token and the workspace LockerPhycer
 *   resolved for the session. A customer never reaches the owner's machines or jobs.
 */
export type ComputlessAuth = "none" | "owner" | "service";

export interface ComputlessRoute {
  forward: string;
  auth: ComputlessAuth;
}

/** Routes only the owner may use; a customer is refused rather than routed elsewhere. */
export const OWNER_ONLY = "owner-only" as const;

/**
 * Owner routes act as the fabric owner (they carry the owner token), so a signed-in
 * session is not enough: the session's verified email must be on the configured
 * owner list. An empty list allows no one (fail closed).
 */
export function parseFabricOwners(raw: string | undefined): Set<string> {
  return new Set(
    (raw || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isFabricOwner(principal: unknown, owners: Set<string>): boolean {
  if (!principal || typeof principal !== "object") return false;
  const email = (principal as { email?: unknown }).email;
  return typeof email === "string" && owners.has(email.trim().toLowerCase());
}

/**
 * Limited beta: when FABRIC_BETA_EMAILS is set, only those accounts (and listed owners) may use
 * Private Cloud; set but empty admits no customer. Unset leaves Private Cloud open to every
 * signed-in account with a workspace (staging and development).
 */
export function parseFabricBeta(raw: string | undefined): Set<string> | "open" {
  return raw === undefined ? "open" : parseFabricOwners(raw);
}

export function inFabricBeta(principal: unknown, beta: Set<string> | "open"): boolean {
  return beta === "open" || isFabricOwner(principal, beta);
}

/** The session's workspace as LockerPhycer reported it, if it is a usable id. */
export function principalWorkspace(principal: unknown): string | null {
  if (!principal || typeof principal !== "object") return null;
  const ws = (principal as { workspace_id?: unknown }).workspace_id;
  return typeof ws === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(ws) && ws !== "__owner__" ? ws : null;
}

const ID = "[A-Za-z0-9._:-]{1,128}";

export function computlessForwardPath(
  method: string,
  path: string,
  caller: "owner" | "customer",
): ComputlessRoute | typeof OWNER_ONLY | null {
  const p = path.replace(/^\/api\/computless/, "");
  const match = (m: string, re: string) => method === m && new RegExp(`^${re}$`).test(p);

  if (caller === "owner") {
    if (match("GET", "/fabric/state")) return { forward: "/api/fabric/state", auth: "none" };
    if (match("GET", `/fabric/jobs/${ID}`)) return { forward: `/api${p}`, auth: "none" };
    if (match("PUT", "/fabric/policy")) return { forward: "/api/fabric/policy", auth: "owner" };
    if (match("GET", "/fabric/enrollment")) return { forward: "/api/fabric/enrollment", auth: "owner" };
    return null;
  }

  if (match("GET", "/fabric/enrollment")) return OWNER_ONLY;
  const t = (rest: string): ComputlessRoute => ({ forward: `/api/fabric/t${rest}`, auth: "service" });
  if (match("GET", "/fabric/state")) return t("/state");
  if (match("GET", `/fabric/jobs/${ID}`)) return t(p.replace(/^\/fabric/, ""));
  if (match("PUT", "/fabric/policy")) return t("/policy");
  if (match("POST", "/fabric/enrollment-keys")) return t("/enrollment-keys");
  if (match("PUT", `/fabric/workers/${ID}/revoke`)) return t(p.replace(/^\/fabric/, ""));
  if (match("POST", "/fabric/jobs")) return t("/jobs");
  if (match("POST", `/fabric/jobs/${ID}/(credential|cancel)`)) return t(p.replace(/^\/fabric/, ""));
  return null;
}
