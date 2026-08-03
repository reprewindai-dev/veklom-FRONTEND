import { NextRequest } from "next/server";

export interface ExecutionIdentity {
  principal: string;
  role: string;
  permissions: string[];
  capabilities: Record<string, string>; // e.g., { "openai_api_key": "sk-..." }
}

/**
 * Extracts an execution identity only from a JWT signed by the runtime. An
 * unsigned/base64 cookie is never an authorization source.
 */
export async function getExecutionIdentity(request: NextRequest): Promise<ExecutionIdentity | null> {
  const cookie = request.cookies.get("vnp_execution_identity");
  const secret = process.env.VNP_IDENTITY_SIGNING_SECRET;
  if (!cookie?.value || !secret) return null;

  try {
    const [encodedHeader, encodedPayload, encodedSignature] = cookie.value.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null;
    const input = `${encodedHeader}.${encodedPayload}`;
    const decode = (value: string) => {
      const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
      return Uint8Array.from(atob(normalized), (char) => char.charCodeAt(0));
    };
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify("HMAC", key, decode(encodedSignature), new TextEncoder().encode(input));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(decode(encodedPayload))) as Partial<ExecutionIdentity>;
    if (typeof payload.principal !== "string" || typeof payload.role !== "string" || !Array.isArray(payload.permissions) || !payload.capabilities || typeof payload.capabilities !== "object") return null;
    return payload as ExecutionIdentity;
  } catch {
    return null;
  }
}

/**
 * Validates if the given Execution Identity has the required capabilities.
 */
export function hasRequiredCapabilities(
  identity: ExecutionIdentity | null, 
  requiredCaps: string[]
): { missing: string[] } {
  if (!identity) {
    return { missing: requiredCaps };
  }

  const missing = requiredCaps.filter(cap => !identity.capabilities[cap]);
  
  return { missing };
}
