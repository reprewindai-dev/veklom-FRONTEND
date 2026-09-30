/**
 * Sandbox Scenarios — real, runnable rehearsals against the REAL CAPPO
 * capability-mount routes using the sandbox-family package
 * `veklom.governed-counter@v1`. Every mount is requested with
 * execution_scope.project = "sandbox" (the scope CAPPO persists and keys the
 * governed counter by), so no scenario can touch live state.
 *
 * Routes used (all verified in cappo_backend/api/routers/capability_mount_router.py
 * and bridged by the frontend proxy / cAPI interlink):
 *   GET  /v1/capability/packages
 *   POST /v1/capability/mounts
 *   GET  /v1/capability/mounts/{mount_id}
 *   POST /v1/capability/mounts/{mount_id}/execute
 *   POST /v1/capability/mounts/{mount_id}/terminate
 *   GET  /v1/capability/targets/{target_ref}/state
 */
import { SANDBOX_PROJECT } from "./sandbox";
import { targetStateReadbackPath } from "./readback";

export const SCENARIO_PACKAGE = "veklom.governed-counter@v1";
export const SCENARIO_TARGET = "activation.governed-counter";

export type ScenarioMethod = "GET" | "POST";
export type ScenarioRequest = { method: ScenarioMethod; path: string; body?: Record<string, unknown> };
export type ScenarioResponse = { status?: number; data?: unknown; error?: string };
export type ScenarioTransport = (request: ScenarioRequest) => Promise<ScenarioResponse>;

export type ScenarioStep = {
  label: string;
  method: ScenarioMethod;
  path: string;
  status?: number;
  decision?: string;
  reason?: string;
};

export type ScenarioEvidence = {
  mountId?: string;
  receiptId?: string;
  anchorId?: string;
  pglEventHash?: string;
  operationId?: string;
};

export type CounterState = { value: number; version: number; initialised: boolean; project?: string };

export type ScenarioResult = {
  id: ScenarioId;
  environment: "sandbox";
  expected: string;
  actual: string;
  pass: boolean;
  evidence: ScenarioEvidence;
  steps: ScenarioStep[];
  before?: CounterState;
  after?: CounterState;
  finishedAt: string;
};

export type ScenarioContext = {
  workspace: string;
  resource: string;
  transport: ScenarioTransport;
  sleep?: (ms: number) => Promise<void>;
  newId?: () => string;
};

export type ScenarioId =
  | "allowed-increment"
  | "blocked-reset"
  | "replay-spent-token"
  | "revoked-credential"
  | "forged-credential"
  | "expired-mount"
  | "unknown-mount";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function defaultId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

class ScenarioAbort extends Error {}

/** The single mount body every scenario uses. project is always "sandbox". */
export function sandboxMountRequest(workspace: string, ttlSeconds = 120): JsonRecord {
  return {
    package_ref: SCENARIO_PACKAGE,
    execution_scope: { workspace, project: SANDBOX_PROJECT },
    requested_action_scope: {
      reads: ["counter.read"],
      writes: ["counter.increment"],
      blocked: ["counter.reset"],
    },
    ttl_seconds: ttlSeconds,
  };
}

type Mounted = { mountId: string; tokenId: string; nonce: string; anchoring?: JsonRecord };

class Runner {
  steps: ScenarioStep[] = [];
  evidence: ScenarioEvidence = {};
  constructor(private ctx: ScenarioContext) {}

  newId(): string {
    return (this.ctx.newId ?? defaultId)();
  }

  sleep(ms: number): Promise<void> {
    return this.ctx.sleep ? this.ctx.sleep(ms) : new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  async call(label: string, request: ScenarioRequest): Promise<{ status?: number; data?: JsonRecord }> {
    const response = await this.ctx.transport(request);
    const data = asRecord(response.data);
    this.steps.push({
      label,
      method: request.method,
      path: request.path,
      status: response.status,
      decision: asString(data?.decision),
      reason: asString(data?.reason) ?? asString(data?.detail) ?? asString(data?.error) ?? response.error,
    });
    return { status: response.status, data };
  }

  recordAnchoring(data?: JsonRecord) {
    const anchoring = asRecord(data?.anchoring);
    const consequence = asRecord(data?.consequence);
    this.evidence = {
      ...this.evidence,
      anchorId: asString(anchoring?.anchor_id) ?? this.evidence.anchorId,
      pglEventHash: asString(anchoring?.pgl_event_hash) ?? this.evidence.pglEventHash,
      receiptId: asString(consequence?.receipt_id) ?? this.evidence.receiptId,
      operationId: asString(data?.operation_id) ?? this.evidence.operationId,
    };
  }

  async preflightPackage() {
    const { data, status } = await this.ctx.transport({ method: "GET", path: "/v1/capability/packages" });
    const packages = Array.isArray(data) ? data : [];
    const match = packages.map(asRecord).find((item) => item?.id === SCENARIO_PACKAGE);
    this.steps.push({
      label: "Discover sandbox package",
      method: "GET",
      path: "/v1/capability/packages",
      status,
      reason: match ? `family=${String(match.family)}` : "package not returned",
    });
    if (!match) throw new ScenarioAbort(`${SCENARIO_PACKAGE} was not returned by CAPPO`);
    if (match.family !== "sandbox") throw new ScenarioAbort(`${SCENARIO_PACKAGE} is family=${String(match.family)}, not sandbox`);
  }

  async mount(ttlSeconds = 120): Promise<Mounted> {
    const { data } = await this.call("Request sandbox mount", {
      method: "POST",
      path: "/v1/capability/mounts",
      body: sandboxMountRequest(this.ctx.workspace, ttlSeconds),
    });
    const mount = asRecord(data?.mount);
    const token = asRecord(data?.token);
    const mountId = asString(mount?.id) ?? asString(token?.mount_id);
    const tokenId = asString(token?.token_id);
    const nonce = asString(token?.nonce);
    if (data?.decision !== "allow" || !mountId || !tokenId || !nonce) {
      throw new ScenarioAbort(`mount not issued: ${asString(data?.reason) ?? "no decision returned"}`);
    }
    // Enforcement check: CAPPO must echo the sandbox project it persisted.
    const project = asString(asRecord(mount?.scope)?.project)
      ?? asString(asRecord(mount?.execution_scope)?.project)
      ?? asString(asRecord(token?.scope)?.project);
    if (project !== SANDBOX_PROJECT) {
      throw new ScenarioAbort(`CAPPO returned project=${project ?? "none"}; refusing to continue outside sandbox`);
    }
    this.evidence.mountId = mountId;
    return { mountId, tokenId, nonce, anchoring: asRecord(data?.anchoring) };
  }

  async readback(mountId: string, label: string): Promise<CounterState> {
    const path = targetStateReadbackPath(SCENARIO_TARGET, this.ctx.resource, mountId);
    const { status, data } = await this.call(label, { method: "GET", path });
    if (status === 404 && (data?.detail === "resource_not_found")) {
      // The governed-counter adapter creates the row at 0 on first increment.
      return { value: 0, version: 0, initialised: false, project: SANDBOX_PROJECT };
    }
    const state = asRecord(data?.state);
    if (typeof state?.value !== "number" || typeof state?.version !== "number") {
      throw new ScenarioAbort(`readback returned no counter state (HTTP ${status ?? "unreachable"})`);
    }
    const project = asString(data?.project);
    if (project !== SANDBOX_PROJECT) {
      throw new ScenarioAbort(`readback project=${project ?? "none"}; expected sandbox`);
    }
    return { value: state.value, version: state.version, initialised: true, project };
  }

  async execute(mount: Pick<Mounted, "mountId" | "tokenId" | "nonce">, action: string, label: string) {
    const operationId = this.newId();
    this.evidence.operationId = operationId;
    const { data } = await this.call(label, {
      method: "POST",
      path: `/v1/capability/mounts/${encodeURIComponent(mount.mountId)}/execute`,
      body: {
        token_id: mount.tokenId,
        nonce: mount.nonce,
        action,
        target_ref: SCENARIO_TARGET,
        resource: this.ctx.resource,
        arguments: {},
        operation_id: operationId,
      },
    });
    this.recordAnchoring(data);
    return data;
  }

  async terminate(mountId: string, label = "Terminate mount (cleanup)") {
    const { data } = await this.call(label, {
      method: "POST",
      path: `/v1/capability/mounts/${encodeURIComponent(mountId)}/terminate`,
      body: { reason: "explicit_terminate" },
    });
    return data;
  }
}

export type ScenarioDefinition = {
  id: ScenarioId;
  title: string;
  expected: string;
  endpoints: string[];
  run: (runner: Runner) => Promise<{ pass: boolean; actual: string; before?: CounterState; after?: CounterState }>;
};

function decisionOf(data?: JsonRecord): string {
  return `decision=${asString(data?.decision) ?? "none"} · ${asString(data?.reason) ?? "no reason"}`;
}

const MOUNT = "POST /v1/capability/mounts";
const EXECUTE = "POST /v1/capability/mounts/{mount_id}/execute";
const READBACK = "GET /v1/capability/targets/{target_ref}/state";
const TERMINATE = "POST /v1/capability/mounts/{mount_id}/terminate";
const STATUS = "GET /v1/capability/mounts/{mount_id}";
const PACKAGES = "GET /v1/capability/packages";

export const SANDBOX_SCENARIOS: ScenarioDefinition[] = [
  {
    id: "allowed-increment",
    title: "Allowed action · counter.increment",
    expected: "decision=allow · independent readback Δ = +1",
    endpoints: [PACKAGES, MOUNT, READBACK, EXECUTE, READBACK],
    async run(r) {
      const mount = await r.mount();
      const before = await r.readback(mount.mountId, "Readback before");
      const result = await r.execute(mount, "counter.increment", "Execute counter.increment");
      const after = await r.readback(mount.mountId, "Independent readback after");
      const delta = after.value - before.value;
      return {
        pass: result?.decision === "allow" && delta === 1,
        actual: `${decisionOf(result)} · readback Δ = ${delta >= 0 ? "+" : ""}${delta}`,
        before,
        after,
      };
    },
  },
  {
    id: "blocked-reset",
    title: "Blocked action · counter.reset",
    expected: "decision=deny · readback unchanged",
    endpoints: [PACKAGES, MOUNT, READBACK, EXECUTE, READBACK],
    async run(r) {
      const mount = await r.mount();
      const before = await r.readback(mount.mountId, "Readback before");
      const result = await r.execute(mount, "counter.reset", "Execute blocked counter.reset");
      const after = await r.readback(mount.mountId, "Independent readback after");
      if (asRecord(result?.consequence)?.terminated !== true) await r.terminate(mount.mountId);
      const unchanged = after.value === before.value && after.version === before.version;
      return {
        pass: result?.decision === "deny" && unchanged,
        actual: `${decisionOf(result)} · readback ${unchanged ? "unchanged" : `changed ${before.value}→${after.value}`}`,
        before,
        after,
      };
    },
  },
  {
    id: "replay-spent-token",
    title: "Replay of a spent mount token",
    expected: "first execute allow · replay decision=deny · readback Δ = +1 total",
    endpoints: [PACKAGES, MOUNT, READBACK, EXECUTE, EXECUTE, READBACK],
    async run(r) {
      const mount = await r.mount();
      const before = await r.readback(mount.mountId, "Readback before");
      const first = await r.execute(mount, "counter.increment", "Execute (spends token)");
      const replay = await r.execute(mount, "counter.increment", "Replay same token + nonce");
      const after = await r.readback(mount.mountId, "Independent readback after");
      const delta = after.value - before.value;
      return {
        pass: first?.decision === "allow" && replay?.decision === "deny" && delta === 1,
        actual: `first ${decisionOf(first)} · replay ${decisionOf(replay)} · Δ = ${delta}`,
        before,
        after,
      };
    },
  },
  {
    id: "revoked-credential",
    title: "Revoked credential (terminated mount)",
    expected: "terminate allow · execute with revoked token decision=deny",
    endpoints: [PACKAGES, MOUNT, TERMINATE, EXECUTE, READBACK],
    async run(r) {
      const mount = await r.mount();
      const before = await r.readback(mount.mountId, "Readback before");
      const revoked = await r.terminate(mount.mountId, "Revoke (terminate) mount");
      const result = await r.execute(mount, "counter.increment", "Execute with revoked credential");
      const after = await r.readback(mount.mountId, "Independent readback after");
      const unchanged = after.value === before.value;
      return {
        pass: revoked?.decision === "allow" && result?.decision === "deny" && unchanged,
        actual: `revoke ${decisionOf(revoked)} · execute ${decisionOf(result)} · readback ${unchanged ? "unchanged" : "changed"}`,
        before,
        after,
      };
    },
  },
  {
    id: "forged-credential",
    title: "Invalid credential (forged token + nonce)",
    expected: "decision=deny (token_mismatch) · readback unchanged",
    endpoints: [PACKAGES, MOUNT, READBACK, EXECUTE, READBACK, TERMINATE],
    async run(r) {
      const mount = await r.mount();
      const before = await r.readback(mount.mountId, "Readback before");
      const forged = { mountId: mount.mountId, tokenId: `tok_forged_${r.newId()}`, nonce: r.newId() };
      const result = await r.execute(forged, "counter.increment", "Execute with forged credential");
      const after = await r.readback(mount.mountId, "Independent readback after");
      await r.terminate(mount.mountId);
      const unchanged = after.value === before.value && after.version === before.version;
      return {
        pass: result?.decision === "deny" && unchanged,
        actual: `${decisionOf(result)} · readback ${unchanged ? "unchanged" : "changed"}`,
        before,
        after,
      };
    },
  },
  {
    id: "expired-mount",
    title: "Expired mount (TTL 1s)",
    expected: "decision=deny after token expiry",
    endpoints: [PACKAGES, MOUNT, EXECUTE],
    async run(r) {
      const mount = await r.mount(1);
      await r.sleep(2500);
      const result = await r.execute(mount, "counter.increment", "Execute after TTL elapsed");
      return { pass: result?.decision === "deny", actual: decisionOf(result) };
    },
  },
  {
    id: "unknown-mount",
    title: "Unknown mount id",
    expected: "status and execute decision=deny · unknown_mount",
    endpoints: [STATUS, EXECUTE],
    async run(r) {
      const mountId = `mnt_sandbox_unknown_${r.newId()}`;
      r.evidence.mountId = mountId;
      const { data: status } = await r.call("Read unknown mount status", {
        method: "GET",
        path: `/v1/capability/mounts/${encodeURIComponent(mountId)}`,
      });
      const result = await r.execute({ mountId, tokenId: `tok_${r.newId()}`, nonce: r.newId() }, "counter.increment", "Execute on unknown mount");
      return {
        pass: status?.decision === "deny" && result?.decision === "deny",
        actual: `status ${decisionOf(status)} · execute ${decisionOf(result)}`,
      };
    },
  },
];

export function getScenario(id: ScenarioId): ScenarioDefinition {
  const scenario = SANDBOX_SCENARIOS.find((item) => item.id === id);
  if (!scenario) throw new Error(`Unknown sandbox scenario: ${id}`);
  return scenario;
}

export async function runSandboxScenario(id: ScenarioId, ctx: ScenarioContext): Promise<ScenarioResult> {
  const scenario = getScenario(id);
  const runner = new Runner(ctx);
  try {
    if (scenario.id !== "unknown-mount") await runner.preflightPackage();
    const outcome = await scenario.run(runner);
    return {
      id,
      environment: "sandbox",
      expected: scenario.expected,
      actual: outcome.actual,
      pass: outcome.pass,
      evidence: runner.evidence,
      steps: runner.steps,
      before: outcome.before,
      after: outcome.after,
      finishedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      id,
      environment: "sandbox",
      expected: scenario.expected,
      actual: error instanceof Error ? `aborted: ${error.message}` : "aborted",
      pass: false,
      evidence: runner.evidence,
      steps: runner.steps,
      finishedAt: new Date().toISOString(),
    };
  }
}

/** Python `veklom` SDK reproduction. Paths are the same proxied routes the UI calls. */
export function scenarioSdkSnippet(
  id: ScenarioId,
  options: { baseUrl: string; workspace: string; resource: string; transportPath: (path: string) => string },
): string {
  const { baseUrl, workspace, resource, transportPath } = options;
  const mountPath = transportPath("/v1/capability/mounts");
  const executePath = transportPath("/v1/capability/mounts/MOUNT_ID/execute").replace("MOUNT_ID", "{mount_id}");
  const terminatePath = transportPath("/v1/capability/mounts/MOUNT_ID/terminate").replace("MOUNT_ID", "{mount_id}");
  const statusPath = transportPath("/v1/capability/mounts/MOUNT_ID").replace("MOUNT_ID", "{mount_id}");
  const readPath = transportPath(`/v1/capability/targets/${SCENARIO_TARGET}/state`);
  const prelude = `import os, time, uuid
from veklom import VeklomClient, VeklomError

# Sandbox scenario "${id}". project="sandbox" is the scope CAPPO enforces.
# The veklom SDK has no mount helpers yet; its authenticated transport is used directly.
c = VeklomClient(access_token=os.environ["VEKLOM_ACCESS_TOKEN"], base_url="${baseUrl}")
WORKSPACE, RESOURCE = "${workspace}", "${resource}"

def mount(ttl=120):
    r = c._post("${mountPath}", {
        "package_ref": "${SCENARIO_PACKAGE}",
        "execution_scope": {"workspace": WORKSPACE, "project": "${SANDBOX_PROJECT}"},
        "requested_action_scope": {"reads": ["counter.read"], "writes": ["counter.increment"], "blocked": ["counter.reset"]},
        "ttl_seconds": ttl,
    })
    assert r["decision"] == "allow" and r["mount"]["scope"]["project"] == "${SANDBOX_PROJECT}", r
    return r["mount"]["id"], r["token"]["token_id"], r["token"]["nonce"]

def execute(mount_id, token_id, nonce, action="counter.increment"):
    return c._post(f"${executePath}", {
        "token_id": token_id, "nonce": nonce, "action": action,
        "target_ref": "${SCENARIO_TARGET}", "resource": RESOURCE,
        "arguments": {}, "operation_id": str(uuid.uuid4()),
    })

def readback(mount_id):
    try:
        return c._get(f"${readPath}?resource={RESOURCE}&mount_id={mount_id}")["state"]["value"]
    except VeklomError as e:
        if e.status == 404:
            return 0  # governed counter not yet created
        raise

def terminate(mount_id):
    return c._post(f"${terminatePath}", {"reason": "explicit_terminate"})
`;
  const bodies: Record<ScenarioId, string> = {
    "allowed-increment": `
m, t, n = mount()
before = readback(m)
r = execute(m, t, n)
after = readback(m)
print(r["decision"], r["consequence"]["receipt_id"], r["anchoring"])
assert r["decision"] == "allow" and after - before == 1
`,
    "blocked-reset": `
m, t, n = mount()
before = readback(m)
r = execute(m, t, n, action="counter.reset")
assert r["decision"] == "deny" and readback(m) == before, r
`,
    "replay-spent-token": `
m, t, n = mount()
before = readback(m)
first = execute(m, t, n)
replay = execute(m, t, n)
assert first["decision"] == "allow" and replay["decision"] == "deny", replay
assert readback(m) - before == 1
`,
    "revoked-credential": `
m, t, n = mount()
assert terminate(m)["decision"] == "allow"
r = execute(m, t, n)
assert r["decision"] == "deny", r
`,
    "forged-credential": `
m, t, n = mount()
before = readback(m)
r = execute(m, "tok_forged_" + uuid.uuid4().hex, uuid.uuid4().hex)
assert r["decision"] == "deny" and readback(m) == before, r
terminate(m)
`,
    "expired-mount": `
m, t, n = mount(ttl=1)
time.sleep(2.5)
r = execute(m, t, n)
assert r["decision"] == "deny", r
`,
    "unknown-mount": `
mount_id = "mnt_sandbox_unknown_" + uuid.uuid4().hex
status = c._get(f"${statusPath}")
r = execute(mount_id, "tok_" + uuid.uuid4().hex, uuid.uuid4().hex)
assert status["decision"] == "deny" and r["decision"] == "deny", (status, r)
`,
  };
  return `${prelude}${bodies[id]}`;
}
