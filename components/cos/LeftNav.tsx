"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Boxes,
  Cable,
  CircleDollarSign,
  Cloud,
  FileCheck2,
  FolderCheck,
  LayoutGrid,
  LockKeyhole,
  MessageSquareText,
  Play,
  Route,
  Scale,
  ScrollText,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";
import { SANDBOX_COPY } from "@/lib/cos/sandbox";
import { isActiveRoute, navGroups, type NavGroup, type NavItem } from "@/lib/cos/nav";
import { withCapability } from "@/lib/cos/capability-context";

const icons: Record<string, typeof Boxes> = {
  workspace: LayoutGrid,
  capabilities: Boxes,
  govern: ShieldCheck,
  evidence: FileCheck2,
  measure: Activity,
  computeless: Cloud,
  settings: Settings,
  connectors: Cable,
  mount: Boxes,
  blueprint: Route,
  authority: LockKeyhole,
  execute: Play,
  settle: CircleDollarSign,
  tracker: Shield,
};

type NavProps = {
  onTerminal: () => void;
  sandbox: boolean;
  capabilityId?: string | null;
  onNavigate?: () => void;
  /** Distinguishes the animated active marker between the desktop rail and the phone drawer. */
  layoutKey: string;
};

function NavGroupSection({
  group,
  pathname,
  capabilityId,
  onNavigate,
  onTerminal,
  layoutKey,
}: {
  group: NavGroup;
  pathname: string;
  capabilityId?: string | null;
  onNavigate?: () => void;
  onTerminal: () => void;
  layoutKey: string;
}) {
  const renderItem = (item: NavItem) => {
    const Icon = icons[item.id] || CircleDollarSign;
    if (item.action === "terminal") {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            onNavigate?.();
            onTerminal();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-cos-muted transition hover:bg-cos-surface2 hover:text-cos-text"
        >
          <Icon size={16} strokeWidth={1.8} />
          <span>{item.label}</span>
          {item.hint ? (
            <kbd className="ml-auto font-mono text-[10px] text-cos-steel">{item.hint}</kbd>
          ) : null}
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
        className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150 ${
          active
            ? "bg-cyan-500/15 border border-cyan-500/30 font-medium text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"
        }`}
      >
        <Icon size={17} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"} />
        <span className="tracking-tight">{item.label}</span>
        {active && (
          <motion.span
            layoutId={`cos-nav-active-${layoutKey}`}
            className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
      </Link>
    );
  };

  return (
    <nav aria-label={group.label} className="space-y-1.5">
      {group.items.map(renderItem)}
    </nav>
  );
}

function NavContent(props: NavProps) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-2">
        {navGroups.map((group) => (
          <NavGroupSection
            key={group.id}
            group={group}
            pathname={pathname}
            capabilityId={props.capabilityId}
            onNavigate={props.onNavigate}
            onTerminal={props.onTerminal}
            layoutKey={props.layoutKey}
          />
        ))}
      </div>

      {props.sandbox ? (
        <div
          data-testid="sandbox-rail-footer"
          className="mt-6 rounded-lg border border-cos-warn/40 bg-cos-warn/[0.08] p-3 font-mono text-[10px] uppercase leading-5 tracking-[0.12em] text-cos-warn"
        >
          {SANDBOX_COPY.railFooter}
        </div>
      ) : null}
    </div>
  );
}

/** The persistent left rail (laptop width and up). */
export function LeftNav(props: Omit<NavProps, "layoutKey" | "onNavigate">) {
  return (
    <aside
      className={`hidden w-60 shrink-0 overflow-y-auto border-r border-slate-800/80 bg-[#060a14]/90 px-3.5 py-6 lg:block backdrop-blur-xl ${
        props.sandbox ? "border-l-2 border-l-cos-warn" : ""
      }`}
    >
      <NavContent {...props} layoutKey="rail" />
    </aside>
  );
}

/** The same navigation as a drawer on phones and tablets, where the rail is hidden. */
export function MobileNav({
  open,
  onClose,
  footer,
  ...props
}: Omit<NavProps, "layoutKey" | "onNavigate"> & {
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Capability OS navigation"
    >
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-cos-bg/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto border-r border-cos-border bg-cos-bg px-3 py-4 shadow-cos-glow">
        <div className="mb-3 flex items-center justify-between px-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cos-steel">
            Capability OS
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-full border border-cos-border p-2 text-cos-steel hover:text-cos-text"
          >
            <X size={16} />
          </button>
        </div>
        {footer ? <div className="mb-4 px-1">{footer}</div> : null}
        <NavContent {...props} onNavigate={onClose} layoutKey="drawer" />
      </aside>
    </div>
  );
}
