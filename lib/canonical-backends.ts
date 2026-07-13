import {
  CAPI_RUNTIME_LABEL,
  CAPI_RUNTIME_REPO,
  CAPI_RUNTIME_URL,
} from "@/lib/capi-runtime";

export type CanonicalBackendId = "byos" | "capi";

export type CanonicalBackendRole =
  | "sovereign-control-plane"
  | "governed-runtime"
  | "ledger";

export type CanonicalBackendAuthMode = "forward-bearer" | "server-api-key";

export interface CanonicalBackendConfig {
  id: CanonicalBackendId;
  label: string;
  repo: string;
  role: CanonicalBackendRole;
  baseUrl: string;
  healthPath: string;
  overviewPath: string;
  sourceOfTruthPath?: string;
  authMode: CanonicalBackendAuthMode;
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export function canonicalBackends(): CanonicalBackendConfig[] {
  const byosUrl =
    process.env.BACKEND_URL ||
    "https://api.veklom.com";

  const capiUrl = CAPI_RUNTIME_URL;

  return [
    {
      id: "byos",
      label: "veklom BYOS backend",
      repo: "veklom-byos-backend",
      role: "sovereign-control-plane",
      baseUrl: trimTrailingSlash(byosUrl),
      healthPath: "/health",
      overviewPath: "/api/v1/workspace/overview/live",
      sourceOfTruthPath: "/api/v1/source-of-truth/snapshot",
      authMode: "forward-bearer",
    },
    {
      id: "capi",
      label: CAPI_RUNTIME_LABEL,
      repo: CAPI_RUNTIME_REPO,
      role: "governed-runtime",
      baseUrl: trimTrailingSlash(capiUrl),
      healthPath: "/health",
      overviewPath: "/v1/vnp/methodology",
      sourceOfTruthPath: "/v1/audit/ledger",
      authMode: "server-api-key",
    },
  ];
}

export function canonicalBackendUrl(
  backend: CanonicalBackendConfig,
  path: string,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${backend.baseUrl}${normalizedPath}`;
}
