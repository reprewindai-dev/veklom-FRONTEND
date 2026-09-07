import Image from "next/image";

export function VeklomLogo() {
  return (
    <div className="flex items-center gap-3" aria-label="Veklom — Machine-to-Machine Trust Infrastructure">
      <Image
        src="/brand/veklom-mark.png"
        alt="Veklom"
        width={40}
        height={40}
        priority
        className="h-9 w-9 shrink-0 drop-shadow-[0_0_14px_rgba(0,229,255,0.35)]"
      />
      <div className="leading-none">
        <div className="text-[17px] font-semibold tracking-[0.22em] text-white">VEKLOM</div>
        <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-cos-steel">Machine-to-Machine Trust Infrastructure</div>
      </div>
    </div>
  );
}
