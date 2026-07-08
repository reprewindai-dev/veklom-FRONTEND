export const VNP_METHODOLOGY_VERSION = "VNP Methodology v1.0";

export const VNP_METHODOLOGY_TAGLINE =
  "Cryptographic API telemetry for the machine-to-machine economy";

export const VNP_VERIFICATION_STACK_TITLE = "VNP v1.0 Verification Stack";

export type VNPImplementationStatus =
  | "Live"
  | "Connected"
  | "Partially Implemented"
  | "Demo Mode"
  | "Methodology Target"
  | "Not Yet Wired"
  | "Config Incomplete"
  | "Disconnected"
  | "Auth Required";

export const VNP_VERIFICATION_STACK: Array<{
  label: string;
  shortLabel: string;
  description: string;
  status: VNPImplementationStatus;
}> = [
  {
    label: "Physical measurements",
    shortLabel: "Physical",
    description: "Regional DNS, TCP, TLS, TTFB, latency, availability, and error observations from the measurement path.",
    status: "Live",
  },
  {
    label: "Signed telemetry",
    shortLabel: "Signed",
    description: "Probe outputs are represented as signed measurement records before card publication.",
    status: "Partially Implemented",
  },
  {
    label: "Route beacons",
    shortLabel: "Beacons",
    description: "Route and region signals used to identify where a measurement was produced.",
    status: "Connected",
  },
  {
    label: "Robust scoring",
    shortLabel: "Scoring",
    description: "Composite trust output using bounded, reproducible scoring instead of provider marketing claims.",
    status: "Partially Implemented",
  },
  {
    label: "x402 settlement evidence",
    shortLabel: "x402",
    description: "Payment-required, verification, protected route, and ledger evidence from the BYOS backend when configured.",
    status: "Connected",
  },
  {
    label: "PGL audit trails",
    shortLabel: "PGL",
    description: "PGL genome, identity, certificate, and lineage evidence across BYOS and CAPPO route surfaces.",
    status: "Connected",
  },
  {
    label: "Agent/runtime enforcement",
    shortLabel: "Runtime",
    description: "CAPPO governed execution via /v1/exec, ExecutionIdentityV1, PGL certificates, and LAW 0 enforcement.",
    status: "Auth Required",
  },
];
