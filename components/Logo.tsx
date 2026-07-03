import clsx from "clsx";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// The official self-contained Veklom app icon (dark rounded tile + orange V),
// served at the site root by the backend (same asset the main site uses).
const OFFICIAL_ICON = "/favicon.svg";

/** The official Veklom V app-icon tile. NOTE: contains a V — never place next
 *  to the wordmark (brand rule: do not create a second V). */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src={OFFICIAL_ICON}
      alt="Veklom"
      width={size}
      height={size}
      draggable={false}
      className={clsx("rounded-xl shrink-0 brand-glow", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Full "Veklom" or "UACP" wordmark. */
export function LogoWordmark({ height = 28, className }: { height?: number; className?: string }) {
  const isUacp = process.env.NEXT_PUBLIC_BRAND_MODE === "uacp";
  if (isUacp) {
    return (
      <span className={clsx("font-bold tracking-tight text-white select-none", className)} style={{ fontSize: height * 0.8 }}>
        UACP<span className="text-brand-500">.</span>
      </span>
    );
  }
  return (
    <img
      src={`${BASE}/veklom-wordmark.svg`}
      alt="Veklom"
      height={height}
      style={{ height, width: "auto" }}
      className={className}
      draggable={false}
    />
  );
}
