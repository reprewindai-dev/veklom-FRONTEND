import { parseSseEvent } from "../runtime/parseSseEvent";
import type { SseEvent } from "../generated/sse";

export type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "stale"
  | "reconnecting"
  | "failed"
  | "failed_authz"
  | "completed"
  | "cancelled";

export type StreamMachineState = {
  connection: ConnectionState;
  generation: number;
  lastSequence: number;
  lastEventId?: string;
  retryCount: number;
  heartbeatAt?: number;
  error?: string;
};

const HEARTBEAT_TIMEOUT_MS = 25_000;

export function initialStreamState(): StreamMachineState {
  return {
    connection: "idle",
    generation: 0,
    lastSequence: -1,
    retryCount: 0,
  };
}

export function shouldAcceptEvent(
  state: StreamMachineState,
  generation: number,
  evt: SseEvent,
): boolean {
  if (generation !== state.generation) return false;
  if (evt.sequence <= state.lastSequence) return false;
  return true;
}

export function nextBackoffMs(retryCount: number): number {
  const base = Math.min(1000 * 2 ** retryCount, 15000);
  const jitter = Math.floor(Math.random() * 300);
  return base + jitter;
}

export async function connectStream(params: {
  url: string;
  token: string;
  generation: number;
  onEvent: (evt: SseEvent, generation: number) => void;
  onProtocolError: (detail: string) => void;
  signal: AbortSignal;
}) {
  const res = await fetch(params.url, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${params.token}`,
    },
    signal: params.signal,
  });

  if (res.status === 401) throw new Error("AUTH_EXPIRED");
  if (res.status === 403) throw new Error("AUTH_FORBIDDEN");
  if (!res.ok || !res.body) throw new Error(`HTTP_${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const dataLines = chunk
        .split("\n")
        .filter(line => line.startsWith("data:"))
        .map(line => line.slice(5).trimStart());

      if (!dataLines.length) continue;

      const raw = dataLines.join("\n");
      let parsed;
      try {
        parsed = parseSseEvent(raw);
        params.onEvent(parsed, params.generation);
      } catch (err: any) {
        if (err.name === "ContractMismatchError") {
          params.onProtocolError(err.message);
          return;
        }
        throw err;
      }
    }
  }
}

export function isHeartbeatExpired(state: StreamMachineState, now = Date.now()): boolean {
  return !!state.heartbeatAt && now - state.heartbeatAt > HEARTBEAT_TIMEOUT_MS;
}
