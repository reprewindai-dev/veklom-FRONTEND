/**
 * The outcome contract.
 *
 * A governed call produces three independent facts, and collapsing them into one
 * word is how a surface ends up reporting `SUCCESS (HTTP 200)` above a runtime
 * error. They are kept separate all the way to the headline:
 *
 *   transport   did the call arrive            200 / 402 / 5xx / unreachable
 *   execution   did the work run and finish    allowed / denied / runtime error
 *   integrity   can the record be checked      verifiable / self-attested / tampered
 *
 * `integrity` is the one most easily misread as endorsement. A sealed record of a
 * failure is a correct and valuable artifact: it says *this record has not been
 * edited*, never *this execution was valid*.
 */

export type TransportOutcome =
  | { kind: "reached"; status: number }
  /** A priced route answering 402 is the payment protocol working, not a failure. */
  | { kind: "payment-required"; status: 402 }
  | { kind: "rejected"; status: number }
  | { kind: "unreachable" }
  | { kind: "not-called" };

export type ExecutionOutcome =
  /** Policy permitted it and it ran to completion. */
  | "allowed"
  /** A policy verdict stopped it. This is a successful enforcement, not a fault. */
  | "denied"
  /** Policy permitted it, the code ran and threw. */
  | "runtime-error"
  /**
   * The deadline was hit. Kept distinct from `runtime-error` because the two settle
   * differently and a timeout does not say whose fault it was — see `FaultAttribution`.
   */
  | "timeout"
  /** An earlier phase stopped short, so this never ran. */
  | "not-run"
  /** The response carried no execution result. Never assume success from silence. */
  | "unreported";

export type IntegrityOutcome =
  /** Signed such that a third party can verify it without the issuer's cooperation. */
  | "verifiable"
  /**
   * Sealed with a secret the issuer also holds (e.g. an HMAC). The issuer cannot be
   * checked by anyone else and could have produced any record it liked, so this must
   * never be presented as `verifiable`.
   */
  | "self-attested"
  | "tampered"
  | "unsigned"
  | "unreported";

export interface CallOutcome {
  transport: TransportOutcome;
  execution: ExecutionOutcome;
  integrity: IntegrityOutcome;
}

export function transportLabel(transport: TransportOutcome): string {
  switch (transport.kind) {
    case "reached":
      return `HTTP ${transport.status}`;
    case "payment-required":
      return "HTTP 402 payment required";
    case "rejected":
      return `HTTP ${transport.status} rejected`;
    case "unreachable":
      return "unreachable";
    case "not-called":
      return "not called";
  }
}

export const EXECUTION_LABEL: Record<ExecutionOutcome, string> = {
  allowed: "ALLOWED",
  denied: "DENIED",
  "runtime-error": "RUNTIME_ERROR",
  timeout: "TERMINATED_TIMEOUT",
  "not-run": "NOT_RUN",
  unreported: "NOT_REPORTED",
};

export const INTEGRITY_LABEL: Record<IntegrityOutcome, string> = {
  verifiable: "VERIFIABLE",
  "self-attested": "SELF-ATTESTED",
  tampered: "TAMPERED",
  unsigned: "UNSIGNED",
  unreported: "NOT_REPORTED",
};

/**
 * The headline may only report the pipeline completing, never the work succeeding.
 * Nothing here can produce a bare "SUCCESS": a reached transport with a failed
 * execution reads as a completed pipeline with a failed execution, which is what
 * actually happened.
 */
export function headline(outcome: CallOutcome): { pipeline: string; result: string } {
  const pipeline =
    outcome.transport.kind === "reached" || outcome.transport.kind === "payment-required"
      ? "PIPELINE COMPLETED"
      : "PIPELINE INCOMPLETE";

  switch (outcome.execution) {
    case "allowed":
      return { pipeline, result: "EXECUTION COMPLETED" };
    case "denied":
      return { pipeline, result: "EXECUTION DENIED" };
    case "runtime-error":
      return { pipeline, result: "EXECUTION FAILED" };
    case "timeout":
      return { pipeline, result: "EXECUTION TERMINATED ON TIMEOUT" };
    case "not-run":
      return { pipeline, result: "EXECUTION DID NOT RUN" };
    case "unreported":
      return { pipeline, result: "EXECUTION RESULT NOT REPORTED" };
  }
}

/**
 * Tiered gas settlement.
 *
 * Two components, accounted separately, so that "work was done" and "who caused the
 * failure" are never conflated:
 *
 *   gas_attempt   baseline scheduling cost. Payable only once transport arrived AND
 *                 isolation setup succeeded — a provider that never stood the
 *                 boundary up has not earned the baseline.
 *   gas_executed  metered compute for a delivered result. Reserved units not consumed
 *                 are released back to the caller's escrow rather than kept.
 */

/**
 * Who caused a failure. This is a *reported* runtime fact, never inferred here.
 *
 * A timeout looks identical from the outside whether user code looped forever or the
 * provider stalled, and the two settle in opposite directions. Guessing is exploitable
 * either way: default to provider fault and a caller gets free compute by always
 * timing out; default to user fault and a stalled node is paid for delivering nothing.
 * So an unattributed fault settles to `UNDECIDED` and writes no payout.
 */
export type FaultAttribution = "user-code" | "provider" | "unattributed";

export type SettlementStatus =
  /** Delivered: exit 0 and schema valid. Full metered compute plus baseline. */
  | "SETTLED_FULL"
  /** User-code fault after a boundary was established. Baseline only; rest refunded. */
  | "SETTLED_PARTIAL_FAULT"
  /** Substrate or provider fault. Zero payout, full void. */
  | "VOID_PROVIDER_FAULT"
  /** Denied by policy or never run. Enforcement is not a billable service. */
  | "VOID_NOT_EXECUTED"
  /** Attribution or execution result missing. No amount may be written. */
  | "UNDECIDED";

export interface SettlementInput {
  transport: TransportOutcome;
  execution: ExecutionOutcome;
  /** Whether the execution boundary was actually established for this run. */
  isolationEstablished: boolean;
  fault: FaultAttribution;
}

export interface SettlementVerdict {
  status: SettlementStatus;
  gasAttemptPayable: boolean;
  gasExecutedPayable: boolean;
  /** Reserved-but-unused compute units are released back to the caller. */
  releasesReservedUnits: boolean;
}

export function settlementVerdict(input: SettlementInput): SettlementVerdict {
  const void_ = (status: SettlementStatus): SettlementVerdict => ({
    status,
    gasAttemptPayable: false,
    gasExecutedPayable: false,
    releasesReservedUnits: true,
  });

  if (input.execution === "denied" || input.execution === "not-run") {
    return void_("VOID_NOT_EXECUTED");
  }
  if (input.execution === "unreported") return void_("UNDECIDED");

  const transportArrived =
    input.transport.kind === "reached" || input.transport.kind === "payment-required";
  if (!transportArrived || !input.isolationEstablished) {
    return void_("VOID_PROVIDER_FAULT");
  }

  if (input.execution === "allowed") {
    return {
      status: "SETTLED_FULL",
      gasAttemptPayable: true,
      gasExecutedPayable: true,
      releasesReservedUnits: true,
    };
  }

  switch (input.fault) {
    case "user-code":
      return {
        status: "SETTLED_PARTIAL_FAULT",
        gasAttemptPayable: true,
        gasExecutedPayable: false,
        releasesReservedUnits: true,
      };
    case "provider":
      return void_("VOID_PROVIDER_FAULT");
    case "unattributed":
      return void_("UNDECIDED");
  }
}

/** No settlement status may read as plain success. */
export const SETTLEMENT_LABEL: Record<SettlementStatus, string> = {
  SETTLED_FULL: "Settled · delivered",
  SETTLED_PARTIAL_FAULT: "Settled · partial, user-code fault",
  VOID_PROVIDER_FAULT: "Void · provider fault",
  VOID_NOT_EXECUTED: "Void · not executed",
  UNDECIDED: "Undecided · no payout written",
};
