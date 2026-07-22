import {
  CAPI_RUNTIME_LABEL,
  CAPI_RUNTIME_REPO,
  CAPI_RUNTIME_URL,
} from "@/lib/capi-runtime";

export type CanonicalBackendId = "byos" | "capi" | "cappo" | "gnomledger" | "gpc" | "genome" | "vnp" | "apex" | "abide";

export type CanonicalBackendRole =
  | "sovereign-control-plane"
  | "governed-runtime"
  | "execution-engine"
  | "ledger"
  | "policy-oracle";

export type CanonicalBackendAuthMode = "forward-bearer" | "server-api-key" | "none";

export interface CanonicalBackendConfig {
  id: CanonicalBackendId;
  label: string;
  repo: string;
  role: CanonicalBackendRole;
  baseUrl: string;
  healthPath: string;
  overviewPath?: string;
  sourceOfTruthPath?: string;
  authMode: CanonicalBackendAuthMode;
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export function canonicalBackends(): CanonicalBackendConfig[] {
  const byosUrl = process.env.BACKEND_URL || "https://api.veklom.com";
  const capiUrl = CAPI_RUNTIME_URL;
  const cappoUrl = process.env.CAPPO_URL || "https://cappo.veklom.com";
  const ledgerUrl = process.env.LEDGER_URL || "https://ledger.veklom.com";
  const gpcUrl = process.env.GPC_URL || "https://gpc.veklom.com";
  const pglUrl = process.env.PGL_URL || "https://pgl.veklom.com";
  const vnpUrl = process.env.VNP_URL || "https://vnp.veklom.com";
  const apexUrl = process.env.APEX_URL || "https://apex.veklom.com";
  const abideUrl = process.env.ABIDE_URL || "https://abide.veklom.com";

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
      label: "CAPPO Execution Engine",
      repo: "cappo-backend",
      role: "execution-engine",
      baseUrl: trimTrailingSlash(cappoUrl),
      healthPath: "/health",
      overviewPath: undefined,
      authMode: "server-api-key",
    },
    {
      id: "gnomledger",
      label: "GnomLedger",
      repo: "gnomledger",
      role: "ledger",
      baseUrl: trimTrailingSlash(ledgerUrl),
      healthPath: "/health",
      overviewPath: undefined,
      authMode: "none",
    },
    {
      id: "gpc",
      label: "Veklom GPC",
      repo: "veklom-gpc",
      role: "policy-oracle",
      baseUrl: trimTrailingSlash(gpcUrl),
      healthPath: "/health",
      overviewPath: undefined,
      authMode: "none",
    },
    {
      id: "genome",
      label: "Genome Ledger (PGL)",
      repo: "veklom-byos-backend",
      role: "sovereign-control-plane",
      baseUrl: trimTrailingSlash(pglUrl),
      healthPath: "/health",
      overviewPath: "/api/v1/genome/status",
      authMode: "forward-bearer",
    },
    {
      id: "vnp",
      label: "Value Network Protocol (VNP)",
      repo: "veklom-vnp",
      role: "execution-engine",
      baseUrl: trimTrailingSlash(vnpUrl),
      healthPath: "/health",
      overviewPath: undefined,
      authMode: "none",
    },
    {
      id: "apex",
      label: "Apex Blueprint",
      repo: "ApexBlueprintV4",
      role: "policy-oracle",
      baseUrl: trimTrailingSlash(apexUrl),
      healthPath: "/health",
      overviewPath: undefined,
      authMode: "none",
    },
    {
      id: "abide",
      label: "Abide Sovereign Agentic Control Plane",
      repo: "abide",
      role: "sovereign-control-plane",
      baseUrl: trimTrailingSlash(abideUrl),
      healthPath: "/health",
      overviewPath: undefined,
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
