import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";

export const metadata = {
  title: "API | Veklom",
  description: "Developer entry points and public API surfaces across Veklom Capability OS.",
};

const groups = [
  {
    title: "Capability OS",
    body: "Authenticated tenant and workspace APIs are issued by BYOS. Browser traffic stays same-origin through the control plane so cookies and session validation do not depend on a separate CORS contract.",
    routes: ["/api/v1/auth/*", "/api/v1/*", "BYOS /health", "BYOS /ready"],
    href: "/byos",
  },
  {
    title: "Consequence authority",
    body: "CAPPO owns the governed execution decision. Public product flows should reach this boundary instead of recreating authorization in the frontend.",
    routes: ["POST /v1/exec", "/api/v1/cappo/*", "execution evidence lookup"],
    href: "/cappo",
  },
  {
    title: "Connection",
    body: "cAPI and VLink connect systems without making a connection identifier equal authority.",
    routes: ["cAPI :3003", "VLink /.well-known/vlink.json", "VLink /vlinks/{id}/v1", "POST /receipts/verify"],
    href: "/vlink",
  },
  {
    title: "Evidence",
    body: "Gnomledger/PGL persists provenance. EEE packages a single already-governed execution into a portable signed artifact.",
    routes: ["POST /api/v1/ledger/events", "GET /api/v1/ledger/agents/{id}/verify", "EEE offline verifier"],
    href: "/pgl",
  },
  {
    title: "Measurement",
    body: "VNP exposes evidence-labelled network and API telemetry. Missing measurements stay unverified instead of receiving a synthetic score.",
    routes: ["GET /v1/vnp/methodology", "GET /v1/vnp/metrics", "/v1/vnp/beacon/routes"],
    href: "/vnp",
  },
  {
    title: "Host boundary",
    body: "LockerPhycer exposes its security/identity host boundary separately from BYOS and CAPPO.",
    routes: ["LockerPhycer :8092", "GET /health", "local /docs when running"],
    href: "/lockerphycer",
  },
];

export default function ApiDirectoryPage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-50" />
        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-16 pt-20 sm:px-8 md:pb-24 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="Developer surface"
            title="One system. Explicit boundaries."
            body="The API directory describes where each Veklom responsibility actually lives. It is intentionally not a giant undifferentiated REST catalog: authority, runtime, evidence, measurement and connection are separate because their trust boundaries are separate."
          />
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-24 sm:px-8 md:pb-32 lg:px-10">
          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((group) => (
              <article key={group.title} className="group rounded-[28px] border border-theme-border bg-theme-surface p-7 transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,.08)] sm:p-8">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">API domain</div>
                    <h2 className="mt-5 text-3xl font-semibold tracking-[-.045em] text-theme-ink">{group.title}</h2>
                  </div>
                  <Link href={group.href} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-theme-border text-theme-inkDim transition group-hover:border-theme-ink group-hover:text-theme-ink">↗</Link>
                </div>
                <p className="mt-5 text-sm leading-7 text-theme-inkDim">{group.body}</p>
                <div className="mt-7 grid gap-2">
                  {group.routes.map((route) => (
                    <div key={route} className="rounded-xl border border-theme-border bg-theme-bg/60 px-4 py-3 font-mono text-[11px] leading-5 text-theme-ink">{route}</div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-theme-border bg-theme-surface/62">
          <div className="mx-auto grid w-full max-w-[1480px] gap-10 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.75fr_1.25fr] lg:px-10">
            <div>
              <StageLabel>Rules of the API</StageLabel>
              <h2 className="mt-6 text-4xl font-semibold tracking-[-.055em] text-theme-ink md:text-5xl">The browser is not the authority kernel.</h2>
            </div>
            <div className="grid gap-3">
              {["Authentication and workspace state come from BYOS.", "Consequence authorization comes from CAPPO.", "Host-sensitive execution boundaries stay in LockerPhycer.", "Durable evidence belongs in PGL/Gnomledger; portable execution evidence belongs in EEE.", "Connection identifiers and transport routes never mint wider authority."].map((item, index) => (
                <div key={item} className="grid grid-cols-[34px_1fr] gap-4 rounded-2xl border border-theme-border bg-theme-bg p-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-theme-border text-[9px] font-semibold text-theme-inkDim">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-sm leading-6 text-theme-ink">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
