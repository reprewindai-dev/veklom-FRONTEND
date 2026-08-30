const CAPPO_PUBLIC_PATHS = [
  "/.well-known/x402",
  "/.well-known/capability-beacon-keys",
  "/api/v1/pricing",
  "/v1/vnp/metrics",
] as const;

const CAPPO_EXEC_PATH = "/v1/exec";

function matchesAgentRoute(path: string, suffix: string) {
  const prefix = "/api/v1/agents/";
  if (!path.startsWith(prefix)) return false;
  if (suffix && !path.endsWith(suffix)) return false;
  const end = suffix ? -suffix.length : undefined;
  const agentId = path.slice(prefix.length, end).replace(/\/+$/, "");
  return Boolean(agentId) && !agentId.includes("/");
}

function matchesLedgerRoute(path: string, suffix: string) {
  const prefix = "/api/v1/ledger/agents/";
  if (!path.startsWith(prefix)) return false;
  if (suffix && !path.endsWith(suffix)) return false;
  const end = suffix ? -suffix.length : undefined;
  const agentId = path.slice(prefix.length, end).replace(/\/+$/, "");
  return Boolean(agentId) && !agentId.includes("/");
}

export function isCappoPublicPath(path: string) {
  return CAPPO_PUBLIC_PATHS.some((candidate) => path === candidate);
}

export function isCappoExecPath(path: string) {
  return path === CAPPO_EXEC_PATH || path.startsWith(`${CAPPO_EXEC_PATH}/`);
}

export function isCappoIdentityPath(path: string) {
  if (path === "/api/v1/agents") return true;
  if (path.startsWith("/v1/capability/")) return true;
  if ([
    "/v1/audit/ledger",
    "/v1/audit/verify",
    "/v1/audit-logs",
    "/v1/runs",
    "/v1/governance/v2/assess",
    "/v1/governance/v2/quarantine",
    "/v1/vnp/leaderboard",
    "/v1/vnp/validators",
    "/v1/vnp/incidents",
    "/v1/vnp/methodology",
    "/v1/vnp/apis",
    "/api/v1/benchmarks/leaderboard",
    "/api/v1/platform/pulse",
    "/api/v1/execution/authorize",
  ].some((candidate) => path === candidate)) {
    return true;
  }
  if (/^\/v1\/governance\/v2\/quarantine\/[^/]+\/(?:approve|deny)$/.test(path)) {
    return true;
  }
  if (path.startsWith("/v1/governance/v2/risk/")) return true;
  if (/^\/v1\/identities\/[^/]+\/revoke$/.test(path)) return true;
  if (
    /^\/v1\/executions\/[^/]+\/(?:evidence|measurements|target-observation)$/.test(path)
  ) {
    return true;
  }
  if (matchesAgentRoute(path, "")) return true;
  if (matchesAgentRoute(path, "/certificate")) return true;
  if (matchesAgentRoute(path, "/lifecycle")) return true;
  if (matchesLedgerRoute(path, "")) return true;
  return matchesLedgerRoute(path, "/verify");
}

export function isCappoProxyPath(path: string) {
  return isCappoPublicPath(path) || isCappoExecPath(path) || isCappoIdentityPath(path);
}
