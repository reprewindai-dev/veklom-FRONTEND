"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  Boxes,
  Cable,
  CircleDollarSign,
  Command,
  FileCheck2,
  LayoutGrid,
  Library,
  LockKeyhole,
  Play,
  Route,
  Scale,
  ScrollText,
  Server,
  Settings,
  Shield,
  Store,
  X,
} from "lucide-react";
import { SANDBOX_COPY } from "@/lib/cos/sandbox";
import { isActiveRoute, navGroups, type NavItem } from "@/lib/cos/nav";
import { withCapability } from "@/lib/cos/capability-context";

const icons: Record<string, typeof Boxes> = {
  capabilities: LayoutGrid,
  mount: Boxes,
  blueprint: Route,
  govern: Scale,
  authority: LockKeyhole,
  execute: Play,
  evidence: FileCheck2,
  measure: Activity,
  settle: CircleDollarSign,
  tracker: Shield,
  registry: Library,
  marketplace: Store,
  harnesses: Cable,
  contracts: ScrollText,
  verification: BadgeCheck,
  computeless: Server,
  terminal: Command,
  settings: Settings,
};

type NavProps = {
  onTerminal: () => void;
  sandbox: boolean;
  capabilityId?: string | null;
  onNavigate?: () => void;
  /** Distinguishes the animated active marker between the desktop rail and the phone drawer. */
  layoutKey: string;
};

function NavContent({ onTerminal, sandbox, capabilityId, onNavigate, layoutKey }: NavProps) {
  const pathname = usePathname();
  const renderItem = (item: NavItem) => {
    const Icon = icons[item.id] || CircleDollarSign;
    if (item.action === "terminal") {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => { onNavigate?.(); onTerminal(); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-cos-muted transition hover:bg-cos-surface2 hover:text-cos-text"
        >
          <Icon size={16} strokeWidth={1.8} />
          <span>{item.label}</span>
          {item.hint ? <kbd className="ml-auto font-mono text-[10px] text-cos-steel">{item.hint}</kbd> : null}
        </button>
      );
    }
    const route = item.route ?? "/os";
    const active = isActiveRoute(pathname, route);
    return (
      <Link
        href={withCapability(route, capabilityId)}
        key={item.id}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-cos-accent/10 text-cos-accent" : "text-cos-muted hover:bg-cos-surface2 hover:text-cos-text"}`}
      >
        <Icon size={16} strokeWidth={active ? 2.4 : 1.8} />
        <span>{item.label}</span>
        {item.hint && !active ? <kbd className="ml-auto font-mono text-[10px] text-cos-steel">{item.hint}</kbd> : null}
        {active && <motion.span layoutId={`cos-nav-active-${layoutKey}`} className="ml-auto h-1.5 w-1.5 rounded-full bg-cos-accent shadow-[0_0_10px_rgb(var(--theme-accent))]" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
      </Link>
    );
  };
  return (
    <>
      {navGroups.map((group, index) => (
        <div key={group.id} className={index === 0 ? "" : "mt-5 border-t border-cos-border pt-4"}>
          <div className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[0.22em] text-cos-steel">{group.label}</div>
          <nav aria-label={group.label} className="space-y-1">{group.items.map(renderItem)}</nav>
        </div>
      ))}
      {sandbox ? (
        <div data-testid="sandbox-rail-footer" className="mt-8 rounded-lg border border-cos-warn/40 bg-cos-warn/[0.08] p-3 font-mono text-[10px] uppercase leading-5 tracking-[0.12em] text-cos-warn">
          {SANDBOX_COPY.railFooter}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-cos-border bg-cos-surface2 p-3">
          <div className="flex items-center gap-2 text-xs text-cos-steel"><Shield size={14} /> Honest runtime state</div>
          <p className="mt-2 text-[11px] leading-5 text-cos-muted">A configured route or manifest is not operational proof.</p>
        </div>
      )}
    </>
  );
}

/** The persistent left rail (laptop width and up). */
export function LeftNav(props: Omit<NavProps, "layoutKey" | "onNavigate">) {
  return (
    <aside className={`hidden w-60 shrink-0 overflow-y-auto border-r border-cos-border bg-cos-bg/90 px-3 py-5 lg:block ${props.sandbox ? "border-l-2 border-l-cos-warn" : ""}`}>
      <NavContent {...props} layoutKey="rail" />
    </aside>
  );
}

/** The same navigation as a drawer on phones and tablets, where the rail is hidden. */
export function MobileNav({ open, onClose, footer, ...props }: Omit<NavProps, "layoutKey" | "onNavigate"> & { open: boolean; onClose: () => void; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Capability OS navigation">
      <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-cos-bg/70 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto border-r border-cos-border bg-cos-bg px-3 py-4 shadow-cos-glow">
        <div className="mb-3 flex items-center justify-between px-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cos-steel">Capability OS</span>
          <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-full border border-cos-border p-2 text-cos-steel hover:text-cos-text"><X size={16} /></button>
        </div>
        {footer ? <div className="mb-4 px-1">{footer}</div> : null}
        <NavContent {...props} onNavigate={onClose} layoutKey="drawer" />
      </aside>
    </div>
  );
}
