/**
 * Private Cloud (COMPUTLESS owned-compute fabric) routes reachable through the OS proxy.
 * Only these are forwarded; everything else under /api/computless is refused.
 * `owner` routes carry the fabric owner token, which is attached server-side only.
 */
export interface ComputlessRoute {
  forward: string;
  owner: boolean;
}

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

export function computlessForwardPath(method: string, path: string): ComputlessRoute | null {
  const forward = path.replace(/^\/api\/computless/, "/api");
  if (method === "GET" && forward === "/api/fabric/state") return { forward, owner: false };
  if (method === "GET" && /^\/api\/fabric\/jobs\/[A-Za-z0-9._:-]{1,128}$/.test(forward)) return { forward, owner: false };
  if (method === "PUT" && forward === "/api/fabric/policy") return { forward, owner: true };
  if (method === "GET" && forward === "/api/fabric/enrollment") return { forward, owner: true };
  return null;
}
