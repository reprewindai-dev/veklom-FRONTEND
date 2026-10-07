// CAPI_URL is what the deployment (compose + Dockerfile) actually sets. Without it
// in this chain the server fell through to the public hostname, so every cAPI call
// left the private network and came back through the edge (and a staging stack
// talked to production cAPI).
export const CAPI_RUNTIME_URL =
  process.env.CAPI_BACKEND_URL ||
  process.env.CAPI_URL ||
  process.env.INTERLINK_CAPI_URL ||
  "https://capi.veklom.com";

export const CAPPO_BACKEND_URL = process.env.CAPPO_BACKEND_URL || process.env.CAPPO_URL;

export const CAPI_RUNTIME_LABEL = "cAPI Runtime";

export const CAPI_RUNTIME_REPO = "cAPI";

export const CAPI_EXECUTION_PATH =
  process.env.CAPI_EXECUTION_PATH ||
  process.env.INTERLINK_CAPI_EXECUTION_PATH ||
  "/v1/exec";

export function capiRuntimeUrl(path: string): string {
  if (!CAPI_RUNTIME_URL) {
    throw new Error("CAPI_BACKEND_URL is not configured");
  }
  const base = CAPI_RUNTIME_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function capiExecutionUrl(): string {
  return capiRuntimeUrl(CAPI_EXECUTION_PATH);
}

export function capiAuthHeaderValue(): string | null {
  return process.env.CAPI_API_KEY ||
    process.env.INTERLINK_CAPI_API_KEY ||
    null;
}
