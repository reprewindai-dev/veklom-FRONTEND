"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogIn, LogOut, Settings, ShieldCheck, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/** Who is acting (design brief top bar: requester identity + role), with sign-in and sign-out. */
export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { me, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("mousedown", close); window.removeEventListener("keydown", escape); };
  }, [open]);

  const returnTo = encodeURIComponent(pathname || "/os");

  if (loading) {
    return <span className="rounded-full border border-cos-border px-3 py-2 text-xs text-cos-steel">Checking sign-in…</span>;
  }

  if (!me) {
    return (
      <div className={`flex items-center gap-2 ${compact ? "flex-col items-stretch" : ""}`}>
        <Link href={`/login?returnTo=${returnTo}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-cos-accent/50 bg-cos-accent/10 px-3 py-2 text-xs font-medium text-cos-accent transition hover:bg-cos-accent/20">
          <LogIn size={14} /> Sign in
        </Link>
        <Link href={`/signup?returnTo=${returnTo}`} className={`items-center justify-center gap-2 rounded-full border border-cos-border px-3 py-2 text-xs text-cos-muted transition hover:text-cos-text ${compact ? "inline-flex" : "hidden sm:inline-flex"}`}>
          <UserPlus size={14} /> Create account
        </Link>
      </div>
    );
  }

  const name = me.email || me.name || "Signed in";
  const role = me.role || (me.is_superuser ? "admin" : undefined);
  const signOut = () => {
    setOpen(false);
    logout();
    router.push("/login?returnTo=%2Fos");
  };

  if (compact) {
    return (
      <div className="rounded-lg border border-cos-border bg-cos-surface2/50 p-3 text-xs">
        <div className="flex items-center gap-2 text-cos-text"><ShieldCheck size={14} className="text-cos-accent" /><span className="truncate">{name}</span></div>
        {role ? <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Role · {role}</div> : null}
        <button type="button" onClick={signOut} className="mt-3 inline-flex items-center gap-2 text-cos-muted hover:text-cos-text"><LogOut size={14} /> Sign out</button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex max-w-[18rem] items-center gap-2 rounded-full border border-cos-border bg-cos-surface2/40 px-3 py-2 text-xs text-cos-muted transition hover:border-cos-accent/50 hover:text-cos-text"
      >
        <ShieldCheck size={14} className="shrink-0 text-cos-accent" />
        <span className="truncate">{name}</span>
        {role ? <span className="hidden shrink-0 rounded-full border border-cos-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-cos-steel xl:inline">{role}</span> : null}
        <ChevronDown size={14} className="shrink-0" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-cos-border bg-cos-surface shadow-cos-glow">
          <div className="border-b border-cos-border px-4 py-3 text-xs">
            <div className="truncate text-cos-text">{name}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">{role ? `Role · ${role}` : "Role not reported"}</div>
          </div>
          <Link role="menuitem" href="/os/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-cos-muted hover:bg-cos-surface2 hover:text-cos-text"><Settings size={14} /> Settings</Link>
          <button role="menuitem" type="button" onClick={signOut} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-cos-muted hover:bg-cos-surface2 hover:text-cos-text"><LogOut size={14} /> Sign out</button>
        </div>
      ) : null}
    </div>
  );
}
