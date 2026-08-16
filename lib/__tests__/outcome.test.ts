import {
  EXECUTION_LABEL,
  INTEGRITY_LABEL,
  headline,
  SETTLEMENT_LABEL,
  settlementVerdict,
  transportLabel,
  type CallOutcome,
  type ExecutionOutcome,
  type FaultAttribution,
  type IntegrityOutcome,
  type SettlementInput,
} from "@/lib/cos/outcome";

describe("governed call outcome contract", () => {
  it("never reports a bare SUCCESS when transport reached but execution failed", () => {
    const result = headline({
      transport: { kind: "reached", status: 200 },
      execution: "runtime-error",
      integrity: "unreported",
    });

    expect(result).toEqual({
      pipeline: "PIPELINE COMPLETED",
      result: "EXECUTION FAILED",
    });
    expect(`${result.pipeline} ${result.result}`).not.toMatch(/^SUCCESS$/);
  });

  it.each(Object.keys(EXECUTION_LABEL) as ExecutionOutcome[])(
    "labels execution outcome %s without collapsing it",
    (execution) => {
      expect(headline({
        transport: { kind: "reached", status: 200 },
        execution,
        integrity: "unreported",
      }).result).toBe(
        execution === "allowed"
          ? "EXECUTION COMPLETED"
          : execution === "denied"
            ? "EXECUTION DENIED"
            : execution === "runtime-error"
              ? "EXECUTION FAILED"
              : execution === "timeout"
                ? "EXECUTION TERMINATED ON TIMEOUT"
              : execution === "not-run"
                ? "EXECUTION DID NOT RUN"
                : "EXECUTION RESULT NOT REPORTED",
      );
    },
  );

  it.each(["unreachable", "rejected", "not-called"] as const)(
    "marks %s transport as pipeline incomplete",
    (kind) => {
      expect(headline({
        transport: kind === "rejected" ? { kind, status: 403 } : { kind },
        execution: "unreported",
        integrity: "unreported",
      }).pipeline).toBe("PIPELINE INCOMPLETE");
    },
  );

  it("voids enforcement and skipped execution without attributing provider fault", () => {
    const transports: SettlementInput["transport"][] = [
      { kind: "reached", status: 200 },
      { kind: "payment-required", status: 402 },
      { kind: "unreachable" },
      { kind: "rejected", status: 403 },
      { kind: "not-called" },
    ];
    const faults: FaultAttribution[] = ["user-code", "provider", "unattributed"];
    for (const execution of ["denied", "not-run"] as const) {
      for (const transport of transports) {
        for (const fault of faults) {
          expect(settlementVerdict({
            transport,
            execution,
            fault,
            isolationEstablished: false,
          })).toEqual({
            status: "VOID_NOT_EXECUTED",
            gasAttemptPayable: false,
            gasExecutedPayable: false,
            releasesReservedUnits: true,
          });
        }
      }
    }
  });

  it("keeps an unreported execution undecided with nothing payable", () => {
    expect(settlementVerdict({
      transport: { kind: "reached", status: 200 },
      execution: "unreported",
      fault: "provider",
      isolationEstablished: true,
    })).toEqual({
      status: "UNDECIDED",
      gasAttemptPayable: false,
      gasExecutedPayable: false,
      releasesReservedUnits: true,
    });
  });

  it("voids every transport that did not arrive", () => {
    for (const transport of [
      { kind: "unreachable" },
      { kind: "rejected", status: 403 },
      { kind: "not-called" },
    ] as const) {
      expect(settlementVerdict({
        transport,
        execution: "allowed",
        fault: "unattributed",
        isolationEstablished: true,
      }).status).toBe("VOID_PROVIDER_FAULT");
    }
  });

  it("voids the provider when isolation was not established", () => {
    expect(settlementVerdict({
      transport: { kind: "reached", status: 200 },
      execution: "allowed",
      fault: "user-code",
      isolationEstablished: false,
    })).toMatchObject({
      status: "VOID_PROVIDER_FAULT",
      gasAttemptPayable: false,
      gasExecutedPayable: false,
    });
  });

  it("settles a delivered execution fully, including payment-required transport", () => {
    for (const transport of [
      { kind: "reached", status: 200 },
      { kind: "payment-required", status: 402 },
    ] as const) {
      expect(settlementVerdict({
        transport,
        execution: "allowed",
        fault: "unattributed",
        isolationEstablished: true,
      })).toEqual({
        status: "SETTLED_FULL",
        gasAttemptPayable: true,
        gasExecutedPayable: true,
        releasesReservedUnits: true,
      });
    }
  });

  it.each(["runtime-error", "timeout"] as const)(
    "settles %s as a partial user-code fault and refunds unused compute",
    (execution) => {
      expect(settlementVerdict({
        transport: { kind: "reached", status: 200 },
        execution,
        fault: "user-code",
        isolationEstablished: true,
      })).toEqual({
        status: "SETTLED_PARTIAL_FAULT",
        gasAttemptPayable: true,
        gasExecutedPayable: false,
        releasesReservedUnits: true,
      });
    },
  );

  it.each(["runtime-error", "timeout"] as const)(
    "voids %s for provider fault and leaves it undecided when unattributed",
    (execution) => {
      expect(settlementVerdict({
        transport: { kind: "reached", status: 200 },
        execution,
        fault: "provider",
        isolationEstablished: true,
      }).status).toBe("VOID_PROVIDER_FAULT");
      expect(settlementVerdict({
        transport: { kind: "reached", status: 200 },
        execution,
        fault: "unattributed",
        isolationEstablished: true,
      }).status).toBe("UNDECIDED");
    },
  );

  it("releases reserved units in every non-full settlement", () => {
    const executions: ExecutionOutcome[] = [
      "allowed",
      "denied",
      "runtime-error",
      "timeout",
      "not-run",
      "unreported",
    ];
    const faults: FaultAttribution[] = ["user-code", "provider", "unattributed"];
    const transports: SettlementInput["transport"][] = [
      { kind: "reached", status: 200 },
      { kind: "unreachable" },
    ];
    for (const execution of executions) {
      for (const fault of faults) {
        for (const transport of transports) {
          const verdict = settlementVerdict({
            transport,
            execution,
            fault,
            isolationEstablished: true,
          });
          if (verdict.status !== "SETTLED_FULL") {
            expect(verdict.releasesReservedUnits).toBe(true);
          }
        }
      }
    }
  });

  it("does not label any settlement as success", () => {
    // A failed run must never render as success, even when an attempt is payable.
    for (const label of Object.values(SETTLEMENT_LABEL)) {
      expect(label).not.toMatch(/success/i);
    }
  });

  it("never pays executed gas unless settlement is fully delivered", () => {
    const executions: ExecutionOutcome[] = [
      "allowed",
      "denied",
      "runtime-error",
      "timeout",
      "not-run",
      "unreported",
    ];
    const faults: FaultAttribution[] = ["user-code", "provider", "unattributed"];
    const transports: SettlementInput["transport"][] = [
      { kind: "reached", status: 200 },
      { kind: "rejected", status: 403 },
    ];
    for (const execution of executions) {
      for (const fault of faults) {
        for (const isolationEstablished of [false, true]) {
          for (const transport of transports) {
            const verdict = settlementVerdict({
              transport,
              execution,
              fault,
              isolationEstablished,
            });
            if (verdict.gasExecutedPayable) {
              expect(verdict.status).toBe("SETTLED_FULL");
            }
          }
        }
      }
    }
  });

  it("renders HTTP 402 as payment required, not as a failure", () => {
    expect(transportLabel({ kind: "payment-required", status: 402 })).toBe(
      "HTTP 402 payment required",
    );
  });

  it("keeps verifiable and self-attested integrity distinct", () => {
    const labels: Record<IntegrityOutcome, string> = INTEGRITY_LABEL;
    expect(labels.verifiable).toBe("VERIFIABLE");
    // An HMAC sealed with a secret the issuer also holds is not third-party verifiable.
    expect(labels["self-attested"]).toBe("SELF-ATTESTED");
    expect(labels.verifiable).not.toBe(labels["self-attested"]);
  });

  it("accepts the contract as three independent axes", () => {
    const outcome: CallOutcome = {
      transport: { kind: "reached", status: 200 },
      execution: "denied",
      integrity: "verifiable",
    };
    expect(outcome.transport.kind).toBe("reached");
    expect(outcome.execution).toBe("denied");
    expect(outcome.integrity).toBe("verifiable");
  });
});
