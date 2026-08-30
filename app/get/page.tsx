"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { useVeklomInstall } from "@/components/acquisition/PwaInstallBridge";

const ACQUISITION_SESSION_KEY = "veklom_acquisition_prompt_v2";

type Platform = "ios" | "android" | "windows" | "mac" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows/.test(ua)) return "windows";
  if (/macintosh|mac os x/.test(ua)) return "mac";
  return "other";
}

function markAcquisitionStarted() {
  try {
    window.sessionStorage.setItem(
      ACQUISITION_SESSION_KEY,
      JSON.stringify({ dismissals: 0, lastDismissedAt: 0, completed: true }),
    );
  } catch {
    // Acquisition state is convenience-only and must never block product access.
  }
}

export default function GetVeklomPage() {
  const { state, install } = useVeklomInstall();
  const [platform, setPlatform] = useState<Platform>("other");
  const [installing, setInstalling] = useState(false);

  useEffect(() => setPlatform(detectPlatform()), []);

  const label = useMemo(() => {
    if (state === "installed") return "Continue with Veklom";
    if (state === "installable") return "Install Veklom now";
    if (platform === "ios") return "Open Veklom now";
    return "Start using Veklom now";
  }, [platform, state]);

  async function primaryAction() {
    if (state === "installable") {
      setInstalling(true);
      try {
        const accepted = await install();
        if (accepted) {
          markAcquisitionStarted();
          window.location.assign("/signup");
        }
      } finally {
        setInstalling(false);
      }
      return;
    }

    markAcquisitionStarted();
    window.location.assign("/signup");
  }

  return (
    <HumanAppShell>
      <main className="relative flex-1 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-theme-surface2 opacity-40" />
        <section className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-theme-accent">
              <span className="h-px w-8 bg-theme-accent" />
              Universal Veklom entry
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.045em] text-theme-ink sm:text-6xl lg:text-7xl">
              You are one approval away.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-theme-inkDim sm:text-xl">
              No keys to copy. No ports to configure. No setup maze. Install the Veklom web app when your browser supports it, or open the governed web experience immediately.
            </p>

            <button
              type="button"
              onClick={primaryAction}
              disabled={installing || state === "checking"}
              className="group mt-9 flex min-h-16 w-full max-w-xl items-center justify-between rounded-xl bg-theme-ink px-6 text-left text-theme-bg shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-wait disabled:opacity-60"
            >
              <span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.2em] opacity-60">
                  {state === "installable" ? "Browser install available" : "Fastest available path detected"}
                </span>
                <span className="mt-1 block text-base font-bold">{installing ? "Waiting for approval…" : label}</span>
              </span>
              <span aria-hidden="true" className="text-2xl transition-transform group-hover:translate-x-1">→</span>
            </button>

            <div className="mt-5 max-w-xl rounded-lg border border-theme-border bg-theme-surface px-4 py-3 text-sm leading-6 text-theme-inkDim">
              {state === "installed" ? (
                <>This device already reports Veklom running in installed/standalone mode. Continue to your workspace.</>
              ) : platform === "ios" ? (
                <>On iPhone/iPad, iOS controls installation. Open Veklom now; in Safari you can use Share → Add to Home Screen for an app-style install.</>
              ) : state === "installable" ? (
                <>Your browser is ready to install Veklom. The only remaining step is the browser&apos;s own approval dialog.</>
              ) : (
                <>The web experience is available immediately. If this browser exposes an install prompt, this page automatically upgrades the primary action to one-click install.</>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-theme-inkDim">
              <span>Web · ready now</span>
              <span>PWA · browser-controlled</span>
              <span>Authority · never hidden</span>
            </div>
          </div>

          <aside className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-theme-border bg-theme-bg p-7 shadow-2xl sm:p-9">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-theme-accent">On another device?</div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-theme-ink">Point the camera. That&apos;s it.</h2>
              <p className="mt-3 text-sm leading-6 text-theme-inkDim">
                This QR always resolves to the canonical Veklom acquisition path. Your phone chooses its own fastest supported route when it opens.
              </p>
              <div className="mx-auto mt-7 w-fit rounded-2xl bg-white p-4 shadow-inner">
                <Image src="/get-veklom-qr.svg" width={232} height={232} alt="QR code for https://veklom.com/get" priority />
              </div>
              <div className="mt-5 text-center font-mono text-[11px] font-bold text-theme-ink">veklom.com/get</div>
              <p className="mt-3 text-center text-xs leading-5 text-theme-inkDim">
                The QR is only an acquisition link. It contains no API key, bearer credential, capability token, or consequence authority.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-4 text-xs text-theme-inkDim">
              <Link href="/login" className="hover:text-theme-ink">Already connected? Log in</Link>
              <span aria-hidden="true">·</span>
              <Link href="/security" className="hover:text-theme-ink">Security</Link>
            </div>
          </aside>
        </section>
      </main>
    </HumanAppShell>
  );
}
