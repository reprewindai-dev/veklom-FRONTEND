import { SCHEMA_VERSION } from "./sse";

export type VnpBlock = {
  schema_version: typeof SCHEMA_VERSION;
  chain_id: string;
  block_index: number;
  prev_hash: string;
  block_hash: string;
  run_id: string;
  workspace_id: string;
  stream_id: string;
  event_id: string;
  transition: "yield" | "slash";
  amount_vnp: number;
  reason_code:
    | "RUN_SUCCESS"
    | "PROMPT_INJECTION_BLOCKED"
    | "DEPTH_LIMIT_EXCEEDED"
    | "POLICY_DENIED"
    | "SYSTEM_ERROR";
  policy_ref?: string;
  trace_hash: string;
  receipt_hash?: string;
  metadata: Record<string, string | number | boolean | null>;
  emitted_at: string;
  signed_by?: string;
};
