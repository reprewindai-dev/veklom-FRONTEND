import { assertNever, type SseEvent } from "../generated/sse";

export type RunState =
  | "not_started"
  | "accepted"
  | "streaming"
  | "succeeded"
  | "security_blocked"
  | "failed"
  | "cancelled"
  | "archived";

export function reduceRunState(current: RunState, evt: SseEvent): RunState {
  switch (evt.event) {
    case "run.accepted":
      return "accepted";

    case "run.phase":
    case "run.token":
    case "run.artifact":
      return current === "not_started" ? "accepted" : "streaming";

    case "run.receipt":
      return "succeeded";

    case "run.error":
      return (
        evt.payload.error_code === "PROMPT_INJECTION_BLOCKED" ||
        evt.payload.error_code === "DEPTH_LIMIT_EXCEEDED" ||
        evt.payload.error_code === "POLICY_DENIED"
      )
        ? "security_blocked"
        : "failed";

    case "run.heartbeat":
      return current;

    case "run.done":
      return evt.payload.final_status === "cancelled" ? "cancelled" : current;

    default:
      return assertNever(evt);
  }
}
