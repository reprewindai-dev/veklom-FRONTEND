export const CAPI_RUNTIME_URL =
  process.env.CAPI_BACKEND_URL ||
  process.env.INTERLINK_CAPI_URL ||
  "https://capi.veklom.com";

export const CAPI_RUNTIME_LABEL = "CAPPO Backend";

export const CAPI_RUNTIME_REPO = "cappo-backend";

export const CAPI_EXECUTION_PATH =
  process.env.CAPI_EXECUTION_PATH ||
  process.env.INTERLINK_CAPI_EXECUTION_PATH ||
  "/api/request";

export function capiRuntimeUrl(path: string): string {
  const base = CAPI_RUNTIME_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function capiExecutionUrl(): string {
  return capiRuntimeUrl(CAPI_EXECUTION_PATH);
}

export function capiAuthHeaderValue(): string {
  return process.env.CAPI_API_KEY ||
    process.env.INTERLINK_CAPI_API_KEY ||
    process.env.CAPPO_API_KEY ||
    process.env.CAPPO_BACKEND_API_KEY ||
    "";
}
