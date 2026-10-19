"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  Boxes,
  Cable,
  ChevronDown,
  CircleDollarSign,
  Command,
  FileCheck2,
  LayoutGrid,
  Library,
  LockKeyhole,
  MessageSquareText,
  Play,
  Route,
  Scale,
  ScrollText,
  Server,
  Settings,
  Shield,
  Terminal,
  Wrench,
  X,
} from "lucide-react";
import { SANDBOX_COPY } from "@/lib/cos/sandbox";
import { isActiveRoute, navGroups, type NavGroup, type NavItem } from "@/lib/cos/nav";
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
  marketplace: Library,
  harnesses: Cable,
  contracts: ScrollText,
  verification: BadgeCheck,
  computeless: Server,
  terminal: Command,
  settings: Settings,
  workspace: MessageSquareText,
  connectors: Cable,
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
  index,
  pathname,
  capabilityId,
  onNavigate,
  onTerminal,
  layoutKey,
}: {
  group: NavGroup;
  index: number;
  pathname: string;
  capabilityId?: string | null;
  onNavigate?: () => void;
  onTerminal: () => void;
  layoutKey: string;
}) {
  const isAnyItemActive = group.items.some(
    (item) => item.route && isActiveRoute(pathname, item.route)
  );
  const [isOpen, setIsOpen] = useState(
    group.collapsible ? isAnyItemActive || !group.defaultCollapsed : true
  );

  useEffect(() => {
    if (group.collapsible && isAnyItemActive) {
      setIsOpen(true);
    }
  }, [group.collapsible, isAnyItemActive]);

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
          <Icon size={15} strokeWidth={1.8} />
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
        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
          active
            ? "bg-cos-accent/10 font-medium text-cos-accent"
            : "text-cos-muted hover:bg-cos-surface2 hover:text-cos-text"
        }`}
      >
        <Icon size={16} strokeWidth={active ? 2.4 : 1.8} />
        <span>{item.label}</span>
        {item.hint && !active ? (
          <kbd className="ml-auto font-mono text-[10px] text-cos-steel">{item.hint}</kbd>
        ) : null}
        {active && (
          <motion.span
            layoutId={`cos-nav-active-${layoutKey}`}
            className="ml-auto h-1.5 w-1.5 rounded-full bg-cos-accent shadow-[0_0_10px_rgb(var(--theme-accent))]"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
      </Link>
    );
  };

  if (group.collapsible) {
    return (
      <div className="mt-5 border-t border-cos-border/80 pt-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group flex w-full items-center justify-between rounded-md px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-cos-steel transition hover:bg-cos-surface2/60 hover:text-cos-text"
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            <Wrench size={11} className="text-cos-muted transition-colors group-hover:text-cos-accent" />
            <span>{group.label}</span>
          </span>
          <ChevronDown
            size={13}
            className={`text-cos-steel transition-transform duration-200 ${
              isOpen ? "rotate-180 text-cos-accent" : ""
            }`}
          />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="mt-1 space-y-1 overflow-hidden"
              aria-label={group.label}
            >
              {group.items.map(renderItem)}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={index === 0 ? "" : "mt-5 border-t border-cos-border/80 pt-4"}>
      <div className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[0.22em] text-cos-steel">
        {group.label}
      </div>
      <nav aria-label={group.label} className="space-y-1">{group.items.map(renderItem)}</nav>
    </div>
  );
}

function NavContent(props: NavProps) {
  const pathname = usePathname();
  return (
    <>
      {navGroups.map((group, index) => (
        <NavGroupSection
          key={group.id}
          group={group}
          index={index}
          pathname={pathname}
          capabilityId={props.capabilityId}
          onNavigate={props.onNavigate}
          onTerminal={props.onTerminal}
          layoutKey={props.layoutKey}
        />
      ))}
      {props.sandbox ? (
        <div
          data-testid="sandbox-rail-footer"
          className="mt-8 rounded-lg border border-cos-warn/40 bg-cos-warn/[0.08] p-3 font-mono text-[10px] uppercase leading-5 tracking-[0.12em] text-cos-warn"
        >
          {SANDBOX_COPY.railFooter}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-cos-border bg-cos-surface2 p-3">
          <div className="flex items-center gap-2 text-xs text-cos-steel">
            <Shield size={14} /> Honest runtime state
          </div>
          <p className="mt-2 text-[11px] leading-5 text-cos-muted">
            A configured route or manifest is not operational proof.
          </p>
        </div>
      )}
    </>
  );
}

/** The persistent left rail (laptop width and up). */
export function LeftNav(props: Omit<NavProps, "layoutKey" | "onNavigate">) {
  return (
    <aside
      className={`hidden w-60 shrink-0 overflow-y-auto border-r border-cos-border bg-cos-bg/90 px-3 py-5 lg:block ${
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
