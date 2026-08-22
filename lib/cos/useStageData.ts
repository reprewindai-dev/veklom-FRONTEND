"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { classifyPayload, deriveProofStatus } from "./proof";
import { isCappoProxyPath } from "@/lib/cappo-proxy-paths";
import { getStage, type StageDefinition, type StageEndpoint } from "./stages";
import type { ProofObservation } from "./proof";
import type { ProofStatus } from "./capabilities";
import { useSandboxMode } from "./sandbox";

export interface StageCallRecord {
  method: StageEndpoint["method"];
  path: string;
  classification: StageEndpoint["classification"];
  status?: number;
  latencyMs?: number;
  proof: ProofStatus;
  observation: ProofObservation;
  error?: string;
  paymentRequired?: boolean;
}

export interface StageCallResult<T = unknown> {
  data?: T;
  record: StageCallRecord;
}

interface StageDataOptions {
  sandbox?: boolean;
  autoGet?: boolean;
}

function keyFor(endpoint: StageEndpoint) {
  return `${endpoint.method} ${endpoint.path}`;
}

export function resolveStageTransportPath(
  _stageId: StageDefinition["id"],
  path: string,
): string {
  if (isCappoProxyPath(path)) {
    return `/api/cappo${path}`;
  }
  if (path.startsWith("/lockerphycer/")) {
    return `/api${path}`;
  }
  return path;
}

export function resolveStageBaseUrl(
  stageId: StageDefinition["id"],
  sandbox: boolean,
  endpointBaseUrl?: string,
  sandboxBaseUrl?: string,
  endpointPath?: string,
): string | undefined {
  // CAPPO calls must always traverse the same-origin /api/cappo boundary. That
  // route validates the caller against BYOS and injects the server-held CAPPO
  // credential/workspace scope. An external base URL would bypass that boundary.
  if (
    stageId === "mount"
    || (endpointPath && isCappoProxyPath(endpointPath))
    || endpointPath?.startsWith("/lockerphycer/")
  ) {
    return undefined;
  }
  return sandbox ? (sandboxBaseUrl || endpointBaseUrl) : endpointBaseUrl;
}

function initialRecord(endpoint: StageEndpoint, sandbox: boolean): StageCallRecord {
  const observation: ProofObservation = endpoint.classification === "absent"
    ? { kind: "no-route" }
    : { kind: "not-called" };
  return {
    method: endpoint.method,
    path: endpoint.path,
    classification: endpoint.classification,
    proof: deriveProofStatus(observation, sandbox),
    observation,
  };
}

export function useStageData(stageId: StageDefinition["id"], options: StageDataOptions = {}) {
  const stage = getStage(stageId);
  const sandboxContext = useSandboxMode();
  const sandbox = options.sandbox ?? sandboxContext;
  const [records, setRecords] = useState<Record<string, StageCallRecord>>(() => (
    Object.fromEntries(stage.endpoints.map((endpoint) => [keyFor(endpoint), initialRecord(endpoint, sandbox)]))
  ));
  const [payloads, setPayloads] = useState<Record<string, unknown>>({});
  const [additionalRecords, setAdditionalRecords] = useState<Record<string, StageCallRecord>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const call = useCallback(async <T,>(
    endpoint: StageEndpoint,
    body?: unknown,
  ): Promise<StageCallResult<T>> => {
    const key = keyFor(endpoint);
    const isDeclaredEndpoint = stage.endpoints.some((candidate) => keyFor(candidate) === key);
    if (endpoint.classification === "absent") {
      const record = initialRecord(endpoint, sandbox);
      setRecords((current) => ({ ...current, [key]: record }));
      return { record };
    }
    if (endpoint.path.includes("{")) {
      const record = initialRecord(endpoint, sandbox);
      setAdditionalRecords((current) => ({ ...current, [key]: record }));
      return { record };
    }
    const started = performance.now();
    setLoading((current) => ({ ...current, [key]: true }));
    try {
      const data = await api<T>(resolveStageTransportPath(stageId, endpoint.path), {
        method: endpoint.method,
        body,
        query: { mode: sandbox ? "sandbox" : "production" },
        headers: { "X-Veklom-Data-Mode": sandbox ? "sandbox" : "production" },
        handlePaymentRequired: false,
        baseUrl: resolveStageBaseUrl(
          stageId,
          sandbox,
          endpoint.baseUrl,
          process.env.NEXT_PUBLIC_SANDBOX_API_BASE_URL,
          endpoint.path,
        ),
      });
      const latencyMs = Math.round((performance.now() - started) * 100) / 100;
      const classification = classifyPayload(data);
      const record: StageCallRecord = {
        method: endpoint.method,
        path: endpoint.path,
        classification: endpoint.classification,
        status: 200,
        latencyMs,
        observation: classification.observation,
        proof: deriveProofStatus(classification.observation, sandbox),
        error: classification.reason,
      };
      setRecords((current) => ({ ...current, [key]: record }));
      setAdditionalRecords((current) => {
        if (!isDeclaredEndpoint) return { ...current, [key]: record };
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
      setPayloads((current) => ({ ...current, [key]: data }));
      return { data, record };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : undefined;
      const message = error instanceof Error ? error.message : "Request failed";
      const latencyMs = Math.round((performance.now() - started) * 100) / 100;
      if (status === 402 && error instanceof ApiError) {
        const observation: ProofObservation = { kind: "reachability-only", status: 402 };
        const record: StageCallRecord = {
          method: endpoint.method,
          path: endpoint.path,
          classification: endpoint.classification,
          status,
          latencyMs,
          observation,
          proof: deriveProofStatus(observation, sandbox),
          paymentRequired: true,
        };
        setRecords((current) => ({ ...current, [key]: record }));
        if (!isDeclaredEndpoint) setAdditionalRecords((current) => ({ ...current, [key]: record }));
        setPayloads((current) => ({ ...current, [key]: error.body }));
        return { data: error.body as T, record };
      }
      const observation: ProofObservation = { kind: "failed", status };
      const record: StageCallRecord = {
        method: endpoint.method,
        path: endpoint.path,
        classification: endpoint.classification,
        status,
        latencyMs,
        observation,
        proof: deriveProofStatus(observation, sandbox),
        error: message,
      };
      setRecords((current) => ({ ...current, [key]: record }));
      setAdditionalRecords((current) => {
        if (!isDeclaredEndpoint) return { ...current, [key]: record };
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
      return { record };
    } finally {
      setLoading((current) => ({ ...current, [key]: false }));
    }
  }, [sandbox, stage.endpoints, stageId]);

  useEffect(() => {
    if (!options.autoGet) return;
    for (const endpoint of stage.endpoints) {
      if (endpoint.method === "GET" && !endpoint.path.includes("{")) void call(endpoint);
    }
  }, [call, options.autoGet, stage.endpoints]);

  const recordsList = useMemo(
    () => [
      ...stage.endpoints.map((endpoint) => records[keyFor(endpoint)] ?? initialRecord(endpoint, sandbox)),
      ...Object.values(additionalRecords),
    ],
    [additionalRecords, records, sandbox, stage.endpoints],
  );

  const stageProof = useMemo<ProofStatus>(() => {
    if (recordsList.some((record) => record.observation.kind === "no-route")) return "Not started";
    if (recordsList.every((record) => record.proof === "Not started")) return "Not started";
    if (recordsList.some((record) => record.proof === "Simulated")) return "Simulated";
    if (recordsList.some((record) => record.proof === "Degraded")) return "Degraded";

    const called = recordsList.filter(
      (record) => record.observation.kind !== "not-called" && record.classification !== "absent",
    );

    if (called.length > 0) {
      if (called.some((record) => record.proof === "Needs proof")) return "Needs proof";
      if (called.every((record) => record.proof === "Verified")) return "Verified";
      if (called.every((record) => record.proof === "Verified" || record.proof === "Present")) return "Present";
    }

    return "Needs proof";
  }, [recordsList]);

  const hasLoading = Object.values(loading).some(Boolean);
  return { stage, records: recordsList, payloads, loading: hasLoading, call, stageProof };
}
