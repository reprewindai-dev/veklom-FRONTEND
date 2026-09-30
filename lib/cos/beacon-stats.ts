/**
 * Command-screen beacon statistics. Every value is derived from a real CAPPO
 * response (GET /v1/capability/beacons and POST /v1/capability/beacons/verify)
 * or rendered as "—" ("no data yet"). Nothing here is seeded or hard-coded.
 */
export const NO_DATA = "—";
export const NO_DATA_TOOLTIP = "no data yet";

export type BeaconStat = {
  id: "active" | "new" | "verified" | "networks" | "nodes";
  label: string;
  value: string;
  /** Route that produced the value; undefined when no source exists yet. */
  source?: string;
};

type Beacon = Record<string, unknown>;
type Verification = { valid?: boolean };

function timeOf(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function beaconsFromPayload(payload: unknown): Beacon[] | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const beacons = (payload as { beacons?: unknown }).beacons;
  if (!Array.isArray(beacons)) return undefined;
  return beacons.filter((item): item is Beacon => Boolean(item && typeof item === "object" && !Array.isArray(item)));
}

export function beaconStats(
  payload: unknown,
  verification: Record<string, Verification>,
  now: number = Date.now(),
): BeaconStat[] {
  const beacons = beaconsFromPayload(payload);
  const source = "GET /v1/capability/beacons";
  if (!beacons) {
    return [
      { id: "active", label: "Active beacons", value: NO_DATA },
      { id: "new", label: "New (24h)", value: NO_DATA },
      { id: "verified", label: "Signature verified", value: NO_DATA },
      { id: "networks", label: "Networks", value: NO_DATA },
      { id: "nodes", label: "Nodes", value: NO_DATA },
    ];
  }
  const active = beacons.filter((beacon) => {
    const expires = timeOf(beacon.expires_at);
    return expires === undefined || expires > now;
  }).length;
  const fresh = beacons.filter((beacon) => {
    const issued = timeOf(beacon.issued_at);
    return issued !== undefined && now - issued <= 24 * 60 * 60 * 1000 && issued <= now;
  }).length;
  const refs = beacons
    .map((beacon) => beacon.package_ref)
    .filter((ref): ref is string => typeof ref === "string");
  const allVerified = refs.length > 0 && refs.length === beacons.length && refs.every((ref) => verification[ref] !== undefined);
  const validCount = refs.filter((ref) => verification[ref]?.valid === true).length;
  return [
    { id: "active", label: "Active beacons", value: String(active), source },
    { id: "new", label: "New (24h)", value: String(fresh), source },
    {
      id: "verified",
      label: "Signature verified",
      value: allVerified ? `${Math.round((validCount / beacons.length) * 100)}%` : NO_DATA,
      source: allVerified ? "POST /v1/capability/beacons/verify" : undefined,
    },
    // No CAPPO/cAPI/VLink endpoint currently reports network or node counts.
    { id: "networks", label: "Networks", value: NO_DATA },
    { id: "nodes", label: "Nodes", value: NO_DATA },
  ];
}
