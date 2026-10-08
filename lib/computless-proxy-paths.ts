/**
 * Private Cloud (COMPUTLESS owned-compute fabric) routes reachable through the OS proxy.
 * Only these are forwarded; everything else under /api/computless is refused.
 * `owner` routes carry the fabric owner token, which is attached server-side only.
 */
export interface ComputlessRoute {
  forward: string;
  owner: boolean;
}

export function computlessForwardPath(method: string, path: string): ComputlessRoute | null {
  const forward = path.replace(/^\/api\/computless/, "/api");
  if (method === "GET" && forward === "/api/fabric/state") return { forward, owner: false };
  if (method === "GET" && /^\/api\/fabric\/jobs\/[A-Za-z0-9._:-]{1,128}$/.test(forward)) return { forward, owner: false };
  if (method === "PUT" && forward === "/api/fabric/policy") return { forward, owner: true };
  if (method === "GET" && forward === "/api/fabric/enrollment") return { forward, owner: true };
  return null;
}
