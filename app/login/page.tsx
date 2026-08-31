import React from "react";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, StageLabel } from "@/components/brand/PremiumPrimitives";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in | Veklom Capability OS",
  description: "Authenticate to your governed machine-action workspace.",
};

const rails = [
  ["Identity", "Workspace-bound operator identity"],
  ["Authority", "Policy and capability remain separate from login"],
  ["Evidence", "Session entry never manufactures execution proof"],
];

export default function LoginPage() {
  return (
    <HumanAppShell>
      <main className="relative flex flex-1 overflow-hidden">
        <AmbientField className="opacity-45" />
        <div className="relative mx-auto grid w-full max-w-[1480px] flex-1 gap-10 px-5 py-12 sm:px-8 md:py-18 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:gap-16 lg:px-10 xl:py-24">
          <section className="hidden lg:block">
            <StageLabel>Governed entry</StageLabel>
            <h2 className="mt-7 max-w-2xl text-6xl font-semibold leading-[.92] tracking-[-.06em] text-theme-ink xl:text-7xl">Your session opens the workspace. It does not widen authority.</h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-theme-inkDim">Veklom keeps identity, access and consequence authority as separate layers. Signing in establishes who you are and which workspace you belong to. CAPPO still decides what any machine execution is allowed to cause.</p>

            <div className="mt-12 max-w-xl overflow-hidden rounded-[28px] border border-theme-border bg-theme-surface/75 backdrop-blur">
              {rails.map(([title, body], index) => (
                <div key={title} className="grid grid-cols-[42px_1fr] gap-4 border-b border-theme-border p-5 last:border-b-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-theme-border text-[10px] font-semibold text-theme-inkDim">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="text-sm font-semibold text-theme-ink">{title}</div>
                    <div className="mt-1 text-xs leading-5 text-theme-inkDim">{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[600px] rounded-[32px] border border-theme-border bg-theme-bg/82 p-5 shadow-[0_40px_120px_rgba(2,8,23,.09)] backdrop-blur-2xl sm:p-8 md:p-10">
              <LoginForm />
            </div>
          </section>
        </div>
      </main>
    </HumanAppShell>
  );
}
