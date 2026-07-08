export type CanonicalBackendId = "byos" | "cappo";

export type CanonicalBackendRole =
  | "sovereign-control-plane"
  | "governed-runtime";

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

  const cappoUrl =
    process.env.CAPPO_BACKEND_URL ||
    "https://cappo.veklom.com";

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
      id: "cappo",
      label: "Cappo backend",
      repo: "cappo-backend",
      role: "governed-runtime",
      baseUrl: trimTrailingSlash(cappoUrl),
      healthPath: "/health",
      overviewPath: "/v1/vnp/metrics",
      sourceOfTruthPath: "/api/v1/platform/pulse",
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
