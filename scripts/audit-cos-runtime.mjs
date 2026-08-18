#!/usr/bin/env node

/**
 * Capability OS runtime audit.
 *
 * This is a non-mutating browser-path audit reconstructed from the current
 * canonical stage inventory. It intentionally does not mount, execute,
 * authorize, revoke, terminate, or verify a payment.
 *
 * Authentication (optional for public-only checks):
 *   VEKLOM_AUDIT_BEARER=<existing BYOS session bearer>
 * or
 *   VEKLOM_AUDIT_EMAIL=<email> VEKLOM_AUDIT_PASSWORD=<password>
 *
 * Other options:
 *   VEKLOM_AUDIT_ORIGIN=https://control.veklom.com
 *   VEKLOM_AUDIT_JSON=/tmp/cos-runtime-audit.json
 */

import fs from "node:fs/promises";

const origin = (process.env.VEKLOM_AUDIT_ORIGIN || "https://control.veklom.com").replace(/\/$/, "");
const outputPath = process.env.VEKLOM_AUDIT_JSON || "";
const timeoutMs = Number(process.env.VEKLOM_AUDIT_TIMEOUT_MS || "12000");

const checks = [
  { stage: "Capabilities", method: "GET", path: "/api/cappo/api/v1/agents", auth: true },
  { stage: "Capabilities", method: "GET", path: "/api/cappo/api/v1/benchmarks/leaderboard", auth: true },
  { stage: "Capabilities", method: "GET", path: "/api/cappo/v1/capability/beacons", auth: false },
  { stage: "Capabilities", method: "GET", path: "/api/cappo/.well-known/capability-beacon-keys", auth: false },
  // Non-mutating contract reachability check. An empty body may return 400/422;
  // that is recorded as CONTRACT_REACHED, not as a verified/usable runtime pass.
  { stage: "Capabilities", method: "POST", path: "/api/cappo/v1/capability/beacons/verify", auth: false, body: {} },
  { stage: "Mount", method: "GET", path: "/api/cappo/v1/capability/packages", auth: true },
  { stage: "Blueprint", method: "GET", path: "/api/v1/gpc/stats", auth: true },
  { stage: "Govern", method: "GET", path: "/api/cappo/v1/governance/v2/quarantine", auth: true },
  { stage: "Evidence", method: "GET", path: "/api/cappo/v1/audit/ledger", auth: true },
  { stage: "Evidence", method: "GET", path: "/api/cappo/v1/audit/verify", auth: true },
  { stage: "Measure", method: "GET", path: "/api/cappo/v1/vnp/metrics", auth: false },
  { stage: "Measure", method: "GET", path: "/api/cappo/v1/vnp/leaderboard", auth: true },
  { stage: "Measure", method: "GET", path: "/api/cappo/v1/vnp/validators", auth: true },
  { stage: "Measure", method: "GET", path: "/api/cappo/v1/vnp/incidents", auth: true },
  { stage: "Measure", method: "GET", path: "/api/cappo/api/v1/benchmarks/leaderboard", auth: true },
  { stage: "Measure", method: "GET", path: "/api/cappo/api/v1/platform/pulse", auth: true },
  { stage: "Settle", method: "GET", path: "/api/cappo/.well-known/x402", auth: false },
  { stage: "Settle", method: "GET", path: "/api/cappo/api/v1/pricing", auth: false },
  { stage: "Authority", method: "GET", path: "/api/cappo/api/v1/agents", auth: true },
  { stage: "Authority", method: "GET", path: "/api/cappo/v1/runs", auth: true },
  { stage: "Tracker", method: "GET", path: "/api/cappo/v1/audit/ledger", auth: true },
  { stage: "Tracker", method: "GET", path: "/api/cappo/v1/runs", auth: true },
  { stage: "Tracker", method: "GET", path: "/api/cappo/api/v1/platform/pulse", auth: true },
];

function redact(text) {
  if (!text) return "";
  return text
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer <redacted>")
    .replace(/(["']?(?:access_token|refresh_token|token|password|api_key)["']?\s*[:=]\s*["'])[^"']+/gi, "$1<redacted>")
    .slice(0, 500);
}

function classify(status, bodyText) {
  if (status === 402) return "PAYMENT_REQUIRED_OBSERVED";
  if (status === 401) return "AUTHENTICATION_REQUIRED";
  if (status === 403) return "AUTHORITY_DENIED";
  if (status === 400 || status === 422) return "CONTRACT_REACHED";
  if (status === 404) return "NOT_FOUND";
  if (status >= 500) return "UPSTREAM_FAILURE";
  if (status >= 200 && status < 300) {
    const trimmed = bodyText.trim();
    if (!trimmed || trimmed === "{}" || trimmed === "[]" || trimmed === "null") return "HTTP_RESPONSE_OBSERVED_EMPTY";
    return "HTTP_RESPONSE_OBSERVED";
  }
  return "UNEXPECTED";
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${origin}${path}`, { ...options, redirect: "manual", signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function acquireBearer() {
  if (process.env.VEKLOM_AUDIT_BEARER) return process.env.VEKLOM_AUDIT_BEARER.trim();

  const email = process.env.VEKLOM_AUDIT_EMAIL;
  const password = process.env.VEKLOM_AUDIT_PASSWORD;
  if (!email || !password) return "";

  const response = await request("/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Veklom-Data-Mode": "production" },
    body: JSON.stringify({ email, password }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Login failed with HTTP ${response.status}: ${redact(text)}`);

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Login response was not JSON");
  }
  if (!payload?.access_token || typeof payload.access_token !== "string") {
    throw new Error("Login response did not contain access_token");
  }
  return payload.access_token;
}

const bearer = await acquireBearer();
const results = [];

for (const check of checks) {
  if (check.auth && !bearer) {
    results.push({ ...check, status: null, classification: "SKIPPED_NO_SESSION", ms: 0, body: "" });
    continue;
  }

  const headers = { "X-Veklom-Data-Mode": "production", accept: "application/json" };
  if (check.auth && bearer) headers.authorization = `Bearer ${bearer}`;
  if (check.body !== undefined) headers["content-type"] = "application/json";

  const started = performance.now();
  try {
    const response = await request(check.path, {
      method: check.method,
      headers,
      body: check.body === undefined ? undefined : JSON.stringify(check.body),
    });
    const text = await response.text();
    results.push({
      ...check,
      status: response.status,
      classification: classify(response.status, text),
      ms: Math.round(performance.now() - started),
      body: redact(text),
    });
  } catch (error) {
    results.push({
      ...check,
      status: null,
      classification: error?.name === "AbortError" ? "TIMEOUT" : "NETWORK_FAILURE",
      ms: Math.round(performance.now() - started),
      body: redact(String(error?.message || error)),
    });
  }
}

const counts = results.reduce((acc, result) => {
  acc[result.classification] = (acc[result.classification] || 0) + 1;
  return acc;
}, {});
const observedResponses = results.filter((r) => ["HTTP_RESPONSE_OBSERVED", "HTTP_RESPONSE_OBSERVED_EMPTY", "PAYMENT_REQUIRED_OBSERVED", "CONTRACT_REACHED"].includes(r.classification)).length;
const failures = results.filter((r) => ["NOT_FOUND", "UPSTREAM_FAILURE", "NETWORK_FAILURE", "TIMEOUT", "UNEXPECTED"].includes(r.classification)).length;

console.log(`Capability OS runtime audit: ${origin}`);
console.log(`Session: ${bearer ? "present" : "absent (authenticated checks skipped)"}`);
console.log(`Checks: ${results.length} | HTTP/contract observations: ${observedResponses} | hard failures: ${failures}`);
console.log("");
for (const result of results) {
  const status = result.status === null ? "---" : String(result.status);
  console.log(`${result.stage.padEnd(12)} ${result.method.padEnd(4)} ${status.padEnd(3)} ${result.classification.padEnd(29)} ${String(result.ms).padStart(5)}ms  ${result.path}`);
}
console.log("");
console.log("Classification counts:", counts);

const report = {
  audited_at: new Date().toISOString(),
  origin,
  authenticated: Boolean(bearer),
  methodology: "Current-source, non-mutating Capability OS browser-path audit. Check 5 is a contract-only empty-body capability-beacon verification probe; HTTP/contract observations are not runtime verification.",
  verification_state: "NOT_VERIFIED",
  counts,
  http_or_contract_observations: observedResponses,
  hard_failures: failures,
  results,
};

if (outputPath) {
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(`Wrote JSON report to ${outputPath}`);
}

if (failures > 0) process.exitCode = 1;
