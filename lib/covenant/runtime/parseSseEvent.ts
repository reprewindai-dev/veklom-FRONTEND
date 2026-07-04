import { SseEvent, SCHEMA_VERSION } from "../generated/sse";

export class ContractMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractMismatchError";
  }
}

export function parseSseEvent(rawData: string): SseEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawData);
  } catch (err) {
    throw new ContractMismatchError("Failed to parse SSE JSON payload");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new ContractMismatchError("SSE event payload is not an object");
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.schema_version !== SCHEMA_VERSION) {
    throw new ContractMismatchError(
      `Schema version mismatch. Expected ${SCHEMA_VERSION}, got ${obj.schema_version}`
    );
  }

  // At runtime, we assume the backend Pydantic validation handles the strict
  // structural checks, but we enforce the discriminator shape here.
  if (typeof obj.event !== "string") {
    throw new ContractMismatchError("Missing or invalid 'event' discriminator");
  }

  return obj as SseEvent;
}
