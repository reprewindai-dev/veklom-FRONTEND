import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro } from "@/components/brand/PremiumPrimitives";
import { LiveProofFabric } from "@/components/proof/LiveProofFabric";

export const metadata = { title: "System Status | Veklom" };

export default function Page() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-45" />
        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-14 pt-20 sm:px-8 md:pb-20 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="Operational status"
            title="Observe the services. Do not paint the page green."
            body="This status surface is backed by the same direct runtime probes used by Veklom's public proof fabric. It reports current HTTP reachability and latency for the configured core services; it does not infer consequence-level correctness from a health response."
          />
        </section>
        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-24 sm:px-8 md:pb-32 lg:px-10">
          <LiveProofFabric />
        </section>
      </main>
    </HumanAppShell>
  );
}
