import Image from "next/image";
import clsx from "clsx";

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/veklom-shield-512.png"
      alt="Veklom"
      width={512}
      height={512}
      draggable={false}
      className={clsx("shrink-0 rounded-sm object-contain", className)}
      style={{ height: size, width: size }}
    />
  );
}

export function LogoWordmark({ height = 28, className }: { height?: number; className?: string }) {
  return (
    <div className={clsx("inline-flex items-center gap-2", className)} aria-label="Veklom Capability OS">
      <LogoMark size={height} />
      <span className="leading-none">
        <span className="block font-mono font-bold tracking-[0.18em] text-theme-ink">VEKLOM</span>
        <span className="mt-1 block font-mono text-[7px] uppercase tracking-[0.18em] text-theme-inkDim">Capability OS</span>
      </span>
    </div>
  );
}
