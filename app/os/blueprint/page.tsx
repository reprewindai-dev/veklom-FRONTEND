import { WorkspaceScaffold } from "@/components/cos/WorkspaceScaffold";
import IntentCompiler from "@/components/cos/IntentCompiler";
import BlueprintCanvas from "@/components/cos/BlueprintCanvas";
import { capabilities as capabilityRegistry } from "@/lib/cos/capabilities";

// Build the company graph dynamically from the canonical capability registry
// (lib/cos/capabilities.ts) — this is the source of truth, not mock data.
function buildCompanyGraph() {
  // Derive unique domains from lifecycleStage groupings
  const stageSet = new Set(capabilityRegistry.map((c) => c.lifecycleStage));
  const domains = Array.from(stageSet).map((stage) => ({
    name: stage,
    description: `Capabilities in the ${stage} lifecycle stage.`,
  }));

  // Derive products from capability kinds
  const kindSet = new Set(capabilityRegistry.map((c) => c.kind));
  const products = Array.from(kindSet).map((kind) => {
    // Assign to the first capability with that kind's stage
    const cap = capabilityRegistry.find((c) => c.kind === kind);
    return {
      name: kind,
      domain: cap?.lifecycleStage ?? "Mount",
      businessValue: `${kind} capabilities in the Veklom OS.`,
    };
  });

  // Canonical systems from the infrastructure
  const canonicalSystems = [
    { name: "BYOS Backend", purpose: "Sovereign API control plane — api.veklom.com" },
    { name: "CAPPO Engine", purpose: "Zero-trust authorization and policy enforcement layer" },
    { name: "GnomLedger (PGL)", purpose: "Immutable proof-of-graph audit ledger — pgl.veklom.com" },
    { name: "VNP", purpose: "Cryptographic telemetry mesh — vnp.veklom.com" },
    { name: "ABIDE", purpose: "Intent-to-blueprint compiler node — abide.veklom.com" },
    { name: "LockerPhycer", purpose: "Hardware key vault — lockerphycer-api:8092" },
    { name: "cAPI", purpose: "Central nervous system registry — capi.veklom.com" },
  ];

  return { domains, products, canonicalSystems };
}

// Map capability registry entries to BlueprintCanvas Capability shape
function buildCapabilities() {
  return capabilityRegistry.map((cap) => ({
    id: cap.id,
    name: cap.name,
    purpose: cap.description,
    lifecycleState: cap.lifecycleStage,
    verificationState: cap.evidence.proofState,
    canonicalDataDomain: cap.kind,
    canonicalSystem:
      cap.auth === "jwt"
        ? "BYOS Backend"
        : cap.id.includes("settle")
        ? "GnomLedger (PGL)"
        : cap.id.includes("evidence")
        ? "GnomLedger (PGL)"
        : "CAPPO Engine",
    owner: "Veklom OS",
    pricingModel: undefined,
    dependencies: [],
  }));
}

export default function BlueprintPage() {
  const companyGraph = buildCompanyGraph();
  const capabilities = buildCapabilities();

  return (
    <WorkspaceScaffold
      stage="Blueprint"
      title="Blueprint"
      description="Shape intent into a reviewable plan before a capability is governed."
    >
      <div className="flex flex-col space-y-12 pb-12">
        <section>
          <IntentCompiler />
        </section>

        <section>
          {/* Live data from lib/cos/capabilities.ts — canonical registry */}
          <BlueprintCanvas
            companyGraph={companyGraph}
            capabilities={capabilities}
          />
        </section>
      </div>
    </WorkspaceScaffold>
  );
}
