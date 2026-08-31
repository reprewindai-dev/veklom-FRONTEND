import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "VNP | Veklom Nexus Protocol",
  description: "Measured API and route telemetry for Veklom's machine infrastructure layer.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="Veklom Nexus Protocol"
      title="Measure the route. Do not inherit the provider's claim."
      body="VNP is Veklom's measurement and routing-trust surface. It records probe events, regional telemetry, route snapshots and API state so infrastructure decisions can be based on observed behavior instead of a vendor status badge."
      role="Network / API measurement and routing-trust fabric"
      state="MIXED"
      stateDetail="CAPPO now exposes real VNP methodology and metrics endpoints backed by stored probe, telemetry, route, validator, incident, PGL and x402 records. Each dimension reports VERIFIED_LIVE only when the corresponding evidence exists; an empty store remains UNVERIFIED."
      owns={[
        "Probe events and regional API telemetry used to measure latency, error rate, uptime and throughput.",
        "API registry state, route snapshots, incidents and validator/measurement surfaces.",
        "Evidence-labelled methodology and metrics outputs that distinguish measured from unmeasured state.",
        "Routing recommendations derived from recorded observations where the required telemetry exists.",
      ]}
      doesNotOwn={[
        "VNP no longer owns public execution consequences; canonical execution remains POST /v1/exec through CAPPO.",
        "A configured region or expected validator is not counted as a live measurement without recorded telemetry.",
        "VNP does not turn network quality into execution authority or regulatory compliance by itself.",
      ]}
      interfaces={[
        { label: "Methodology", value: "GET /v1/vnp/methodology" },
        { label: "Metrics", value: "GET /v1/vnp/metrics" },
        { label: "Registry", value: "POST /v1/vnp/apis" },
        { label: "Routes / incidents", value: "/v1/vnp/beacon/routes · /v1/vnp/incidents · /v1/vnp/validators" },
      ]}
      proofNote="Yes, VNP still measures. The important change is that the site must show whether measurements actually exist. No telemetry rows means no measured-network claim; real rows can be surfaced as measured state with their timestamps and provenance."
      primaryHref="/proof"
      primaryLabel="Inspect current observation"
      secondaryHref="/docs"
      secondaryLabel="Open docs"
    />
  );
}
