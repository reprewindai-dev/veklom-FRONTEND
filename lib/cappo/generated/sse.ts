export const SCHEMA_VERSION = "2026-07-01" as const;

export type SseBase = {
  schema_version: typeof SCHEMA_VERSION;
  stream_id: string;
  run_id: string;
  workspace_id: string;
  event_id: string;
  sequence: number;
  emitted_at: string;
  replayable: boolean;
};

export type RunAcceptedEvent = SseBase & {
  event: "run.accepted";
  payload: {
    request_id: string;
    actor_id: string;
    mode: "sync" | "stream";
    policy_bundle: string;
  };
};

export type RunPhaseEvent = SseBase & {
  event: "run.phase";
  payload: {
    phase:
      | "accepted"
      | "planning"
      | "tooling"
      | "policy_check"
      | "execution"
      | "settlement";
    message?: string;
    progress_pct?: number;
  };
};

export type RunTokenEvent = SseBase & {
  event: "run.token";
  payload: {
    channel: "assistant" | "system" | "tool";
    text: string;
    token_count?: number;
  };
};

export type RunArtifactEvent = SseBase & {
  event: "run.artifact";
  payload: {
    artifact_type: "trace_node" | "claim" | "receipt_ref" | "policy_ref";
    artifact_id: string;
    title: string;
    content_type?: string;
    uri?: string;
  };
};

export type RunReceiptEvent = SseBase & {
  event: "run.receipt";
  payload: {
    receipt_id: string;
    receipt_hash: string;
    trace_hash: string;
    amount_vnp: number;
    settlement_status: "yielded";
  };
};

export type RunErrorEvent = SseBase & {
  event: "run.error";
  payload: {
    error_code:
      | "PROMPT_INJECTION_BLOCKED"
      | "DEPTH_LIMIT_EXCEEDED"
      | "POLICY_DENIED"
      | "BACKEND_UNAVAILABLE"
      | "SCHEMA_MISMATCH"
      | "SYSTEM_ERROR";
    message: string;
    trace_hash?: string;
    slash_vnp?: number;
    retryable: boolean;
  };
};

export type RunHeartbeatEvent = SseBase & {
  event: "run.heartbeat";
  payload: {
    server_time: string;
    idle_for_ms: number;
  };
};

export type RunDoneEvent = SseBase & {
  event: "run.done";
  payload: {
    final_status: "succeeded" | "failed" | "security_blocked" | "cancelled";
    total_events: number;
  };
};

export type SseEvent =
  | RunAcceptedEvent
  | RunPhaseEvent
  | RunTokenEvent
  | RunArtifactEvent
  | RunReceiptEvent
  | RunErrorEvent
  | RunHeartbeatEvent
  | RunDoneEvent;

export function assertNever(x: never): never {
  throw new Error(`Unhandled event variant: ${JSON.stringify(x)}`);
}
