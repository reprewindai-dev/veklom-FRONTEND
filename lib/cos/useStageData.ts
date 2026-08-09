"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { deriveProofStatus } from "./proof";
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

function isSourceOfTruthPayload(payload: unknown): boolean {
  if (payload === null || payload === undefined) return false;
  if (Array.isArray(payload)) return true;
  if (typeof payload !== "object") return false;
  const keys = Object.keys(payload);
  if (keys.length === 0) return false;
  return !keys.every((key) => ["status", "message", "version", "service", "timestamp"].includes(key));
}

export function useStageData(stageId: StageDefinition["id"], options: StageDataOptions = {}) {
  const stage = getStage(stageId);
  const sandboxContext = useSandboxMode();
  const sandbox = options.sandbox ?? sandboxContext;
  const [records, setRecords] = useState<Record<string, StageCallRecord>>(() => (
    Object.fromEntries(stage.endpoints.map((endpoint) => [keyFor(endpoint), initialRecord(endpoint, sandbox)]))
  ));
  const [payloads, setPayloads] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const call = useCallback(async <T,>(
    endpoint: StageEndpoint,
    body?: unknown,
  ): Promise<StageCallResult<T>> => {
    const key = keyFor(endpoint);
    if (endpoint.classification === "absent") {
      const record = initialRecord(endpoint, sandbox);
      setRecords((current) => ({ ...current, [key]: record }));
      return { record };
    }
    const started = performance.now();
    setLoading((current) => ({ ...current, [key]: true }));
    try {
      const data = await api<T>(endpoint.path, {
        method: endpoint.method,
        body,
      });
      const latencyMs = Math.round((performance.now() - started) * 100) / 100;
      const observation: ProofObservation = isSourceOfTruthPayload(data)
        ? { kind: "source-of-truth", status: 200 }
        : { kind: "reachability-only", status: 200 };
      const record: StageCallRecord = {
        method: endpoint.method,
        path: endpoint.path,
        classification: endpoint.classification,
        status: 200,
        latencyMs,
        observation,
        proof: deriveProofStatus(observation, sandbox),
      };
      setRecords((current) => ({ ...current, [key]: record }));
      setPayloads((current) => ({ ...current, [key]: data }));
      return { data, record };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : undefined;
      const message = error instanceof Error ? error.message : "Request failed";
      const latencyMs = Math.round((performance.now() - started) * 100) / 100;
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
      return { record };
    } finally {
      setLoading((current) => ({ ...current, [key]: false }));
    }
  }, [sandbox]);

  useEffect(() => {
    if (!options.autoGet) return;
    for (const endpoint of stage.endpoints) {
      if (endpoint.method === "GET") void call(endpoint);
    }
  }, [call, options.autoGet, stage.endpoints]);

  const recordsList = useMemo(
    () => stage.endpoints.map((endpoint) => records[keyFor(endpoint)] ?? initialRecord(endpoint, sandbox)),
    [records, sandbox, stage.endpoints],
  );

  const stageProof = useMemo<ProofStatus>(() => {
    if (recordsList.some((record) => record.proof === "Simulated")) return "Simulated";
    if (recordsList.some((record) => record.proof === "Verified")) return "Verified";
    if (recordsList.some((record) => record.proof === "Present")) return "Present";
    if (recordsList.some((record) => record.proof === "Degraded")) return "Degraded";
    if (recordsList.every((record) => record.proof === "Not started")) return "Not started";
    return "Needs proof";
  }, [recordsList]);

  const hasLoading = Object.values(loading).some(Boolean);
  return { stage, records: recordsList, payloads, loading: hasLoading, call, stageProof };
}
