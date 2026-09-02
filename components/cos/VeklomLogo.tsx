import Image from "next/image";

export function VeklomLogo() {
  return (
    <div className="flex items-center gap-3" aria-label="Veklom Capability OS">
      <Image
        src="/brand/veklom-shield-512.png"
        alt=""
        width={512}
        height={512}
        priority
        className="h-10 w-10 rounded-sm object-contain"
      />
      <div className="leading-none">
        <div className="font-mono text-sm font-bold tracking-[0.22em] text-theme-ink">VEKLOM</div>
        <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.2em] text-theme-inkDim">Capability OS</div>
      </div>
    </div>
  );
}
