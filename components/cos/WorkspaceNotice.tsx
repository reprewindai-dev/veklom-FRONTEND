"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSandboxMode } from "@/lib/cos/sandbox";

/**
 * A signed-in account with no workspace yet. Every consequence-bearing call is refused for it
 * (the authority layer answers 403 WORKSPACE_CONTEXT_MISSING), which is correct, but a newcomer
 * needs to be told where the one required step is. Found 2026-10-10 by running the recorder as a
 * brand-new account: only the Private Cloud page said so. This bar says it on every OS page.
 */
export function WorkspaceNotice() {
  const { me } = useAuth();
  const sandbox = useSandboxMode();
  const pathname = usePathname();
  if (sandbox || !me || me.workspace_id || pathname?.startsWith("/os/onboarding")) return null;
  return (
    <div role="status" data-testid="workspace-notice" className="flex flex-wrap items-center gap-3 border-b border-cos-accent/40 bg-cos-accent/[0.06] px-4 py-2.5 text-xs text-cos-text lg:px-7">
      <Building2 size={14} className="text-cos-accent" />
      <span>Your account has no workspace yet. Mounting, grants and execution are refused until you create one. It takes one step.</span>
      <Link href="/os/onboarding" className="rounded-lg border border-cos-accent/40 px-3 py-1.5 text-cos-accent">Create your workspace</Link>
    </div>
  );
}
