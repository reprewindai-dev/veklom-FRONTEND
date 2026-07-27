import {
  CAPI_RUNTIME_LABEL,
  CAPI_RUNTIME_REPO,
  CAPI_RUNTIME_URL,
} from "@/lib/capi-runtime";

export type CanonicalBackendId = "byos" | "capi" | "cappo" | "pgl" | "lockerphycer";

export type CanonicalBackendRole =
  | "sovereign-control-plane"
  | "governed-runtime"
  | "governed-authorization/execution"
  | "ledger"
  | "security/command";

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
  const cappoUrl = process.env.CAPPO_URL || "https://cappo.veklom.com";
  const pglUrl = process.env.PGL_URL || "https://pgl.veklom.com";
  const lockerphycerUrl =
    process.env.LOCKERPHYCER_URL || "https://command.veklom.com";

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
    {
      id: "cappo",
      label: "CAPPO governed authorization/execution",
      repo: "cappo-backend",
      role: "governed-authorization/execution",
      baseUrl: trimTrailingSlash(cappoUrl),
      healthPath: "/health",
      overviewPath: "/protocol.json",
      authMode: "forward-bearer",
    },
    {
      id: "pgl",
      label: "gnomledger Policy Governance Ledger",
      repo: "gnomledger",
      role: "ledger",
      baseUrl: trimTrailingSlash(pglUrl),
      healthPath: "/health",
      overviewPath: "/protocol.json",
      authMode: "forward-bearer",
    },
    {
      id: "lockerphycer",
      label: "Lockerphycer security command plane",
      repo: "lockerphycer",
      role: "security/command",
      baseUrl: trimTrailingSlash(lockerphycerUrl),
      healthPath: "/health",
      overviewPath: "/protocol.json",
      authMode: "forward-bearer",
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
