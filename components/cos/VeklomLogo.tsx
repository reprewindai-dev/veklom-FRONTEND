import Image from "next/image";
import Link from "next/link";

export function VeklomLogo() {
  return (
    <Link
      href="/os/workspace"
      className="group flex items-center gap-3 transition-opacity hover:opacity-90"
      aria-label="Veklom Capability OS · Workspace"
    >
      <Image
        src="/brand/veklom-shield-512.png"
        alt="Veklom"
        width={40}
        height={40}
        priority
        className="h-9 w-9 shrink-0 drop-shadow-[0_0_14px_rgba(0,229,255,0.35)] transition-transform duration-200 group-hover:scale-105"
      />
      <div className="leading-none">
        <div className="text-[17px] font-semibold tracking-[0.22em] text-cos-text">VEKLOM</div>
        <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-cos-steel">Capability OS</div>
      </div>
    </Link>
  );
}
