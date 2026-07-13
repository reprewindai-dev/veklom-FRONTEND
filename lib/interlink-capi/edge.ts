import { NextRequest } from "next/server";

export interface ExecutionIdentity {
  principal: string;
  role: string;
  permissions: string[];
  capabilities: Record<string, string>; // e.g., { "openai_api_key": "sk-..." }
}

/**
 * Extracts and decodes the Execution Identity from the request.
 * In a production zero-trust setup, this would verify a PGL signed JWT.
 * For now, we simulate extraction from an encrypted session cookie or fallback to default.
 */
export function getExecutionIdentity(request: NextRequest): ExecutionIdentity | null {
  const cookie = request.cookies.get("vnp_execution_identity");
  
  if (cookie && cookie.value) {
    try {
      // In production, this must be a JWT verify.
      // We are decoding a simple base64 JSON payload for the edge prompt demo.
      const decoded = Buffer.from(cookie.value, "base64").toString("utf-8");
      return JSON.parse(decoded) as ExecutionIdentity;
    } catch (e) {
      console.error("Failed to decode ExecutionIdentity at edge", e);
      return null;
    }
  }

  // If no cookie exists, return a default identity missing capabilities
  return {
    principal: "anonymous",
    role: "user",
    permissions: [],
    capabilities: {}
  };
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
