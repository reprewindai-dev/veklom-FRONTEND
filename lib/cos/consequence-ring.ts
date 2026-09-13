// The consequence ring: the six positions one machine action must pass through,
// and the rule that decides which transitions may be drawn as proven.
//
// The ring is not a diagram of the architecture. It is a reading of what the
// estate can currently evidence. An arc exists only where both of the positions
// it joins are attested, so a ring with gaps is the normal, honest output and a
// closed ring is a claim that has to be earned.

export type RingPositionId =
  | "identity"
  | "connection"
  | "authority"
  | "compute"
  | "evidence"
  | "measure";

export type RingObservation =
  | { kind: "unobserved" }
  | { kind: "not-observable"; reason: string }
  | { kind: "route-absent" }
  | { kind: "failed"; status?: number; detail?: string }
  | { kind: "reachable"; status: number }
  | { kind: "attested"; status: number };

export type RingState =
  | "VERIFIED"
  | "LIVE"
  | "DEGRADED"
  | "FAILED"
  | "UNKNOWN"
  | "NEEDS PROOF";

export interface RingProbe {
  method: "GET";
  path: string;
  proves: string;
  attestable: boolean;
}

export interface RingPositionDefinition {
  id: RingPositionId;
  index: number;
  label: string;
  role: string;
  owner: string;
  route: string;
  probe: RingProbe | null;
  unobservableReason?: string;
}

export interface RingPosition extends RingPositionDefinition {
  observation: RingObservation;
}

export interface RingLease {
  mountId: string;
  tokenId: string;
  expiresAt?: string;
}

export const ringPositions: RingPositionDefinition[] = [
  {
    id: "identity",
    index: 1,
    label: "Identity",
    role: "Which workspace is asking, proven to the authority that will answer.",
    owner: "Identity assertion → CAPPO",
    route: "/os/authority",
    probe: {
      method: "GET",
      path: "/api/v1/agents",
      proves: "The runtime accepted the workspace assertion.",
      attestable: false,
    },
  },
  {
    id: "connection",
    index: 2,
    label: "Connection",
    role: "What the connected systems advertise they can do.",
    owner: "cAPI capability registry",
    route: "/os",
    probe: {
      method: "GET",
      path: "/v1/capability/beacons",
      proves: "A signed capability advertisement was returned.",
      attestable: true,
    },
  },
  {
    id: "authority",
    index: 3,
    label: "Authority",
    role: "A scoped, expiring lease for one operation on one target.",
    owner: "CAPPO consequence authority",
    route: "/os/mount",
    probe: null,
    unobservableReason:
      "Issuing a lease is itself a consequence. This position reports proof only from a lease you actually requested.",
  },
  {
    id: "compute",
    index: 4,
    label: "Compute",
    role: "A bounded environment that runs the work and is then wiped.",
    owner: "Governed Compute",
    route: "/os/execute",
    probe: null,
    unobservableReason:
      "Execution cannot be observed without executing. This position reports proof only from a run that happened.",
  },
  {
    id: "evidence",
    index: 5,
    label: "Evidence",
    role: "A signed receipt of what happened, durable and replayable.",
    owner: "EEE / PGL",
    route: "/os/evidence",
    probe: {
      method: "GET",
      path: "/v1/audit/verify",
      proves: "The ledger verified its own chain.",
      attestable: true,
    },
  },
  {
    id: "measure",
    index: 6,
    label: "Measure",
    role: "What the run actually cost and delivered.",
    owner: "VNP",
    route: "/os/measure",
    probe: {
      method: "GET",
      path: "/v1/vnp/metrics",
      proves: "Estate-wide measurement is being served. It is not proof of any single run.",
      attestable: false,
    },
  },
];

export function positionState(observation: RingObservation): RingState {
  switch (observation.kind) {
    case "unobserved":
      return "UNKNOWN";
    case "not-observable":
      return "NEEDS PROOF";
    case "route-absent":
      return "NEEDS PROOF";
    case "failed":
      return observation.status && observation.status >= 500 ? "DEGRADED" : "FAILED";
    case "reachable":
      return "LIVE";
    case "attested":
      return "VERIFIED";
  }
}

export function arcProven(from: RingPosition, to: RingPosition): boolean {
  return positionState(from.observation) === "VERIFIED" && positionState(to.observation) === "VERIFIED";
}

export function writeBackProven(positions: RingPosition[]): boolean {
  const evidence = positions.find((position) => position.id === "evidence");
  const measure = positions.find((position) => position.id === "measure");
  if (!evidence || !measure) return false;
  return arcProven(evidence, measure);
}

export function ringClosed(positions: RingPosition[]): boolean {
  const ordered = [...positions].sort((a, b) => a.index - b.index);
  if (ordered.length !== ringPositions.length) return false;
  return ordered.every((position, i) => i === 0 || arcProven(ordered[i - 1], position));
}

export function provenTransitionCount(positions: RingPosition[]): number {
  const ordered = [...positions].sort((a, b) => a.index - b.index);
  let count = 0;
  for (let i = 1; i < ordered.length; i += 1) {
    if (arcProven(ordered[i - 1], ordered[i])) count += 1;
  }
  return count + (writeBackProven(positions) ? 1 : 0);
}

export const totalTransitions = ringPositions.length;

export function leaseRemainingMs(lease: RingLease | null, now: number): number | null {
  if (!lease?.expiresAt) return null;
  const expiry = Date.parse(lease.expiresAt);
  if (Number.isNaN(expiry)) return null;
  return Math.max(0, expiry - now);
}

export function formatRemaining(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function observationForHeldLease(lease: RingLease | null, now: number): RingObservation {
  if (!lease) {
    return { kind: "not-observable", reason: ringPositions[2].unobservableReason! };
  }
  const remaining = leaseRemainingMs(lease, now);
  if (remaining !== null && remaining <= 0) {
    return { kind: "failed", detail: "The lease expired. Authority is gone." };
  }
  return { kind: "reachable", status: 200 };
}
