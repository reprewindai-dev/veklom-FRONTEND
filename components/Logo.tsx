import clsx from "clsx";

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/images/veklom_logo_hex.jpg"
      alt="Veklom"
      draggable={false}
      className={clsx("shrink-0 object-contain", className)}
      style={{ height: size, width: "auto" }}
    />
  );
}

export function LogoWordmark({ height = 28, className }: { height?: number; className?: string }) {
  return (
    <img
      src="/images/veklom_logo_hex.jpg"
      alt="Veklom"
      height={height}
      style={{ height, width: "auto" }}
      className={clsx("object-contain", className)}
      draggable={false}
    />
  );
}
