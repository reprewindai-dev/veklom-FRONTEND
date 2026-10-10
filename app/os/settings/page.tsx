"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cable, KeyRound, LogOut, Plug, Webhook } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { Field } from "@/components/cos/StageParts";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

/**
 * Settings (Operator): a plain settings page, nothing more. The owner's definition (2026-10-10):
 * your account, your own model key, an API key for your software, the MCP connection, a simple
 * webhook, and enterprise integrations. Each section states exactly what is live today. Nothing
 * here grants authority: a key, a connection or a notification never causes a consequence by itself.
 *
 * Live today: account (identity service) and the MCP connection (the governed tool server at
 * /api/mcp, the same one the Terminal uses). Not yet served by any Veklom service (checked
 * 2026-10-09: 404 on every live service): model keys, API keys, webhooks, Slack/Linear integrations.
 */
const buttonClass = "inline-flex items-center gap-2 rounded-lg border border-cos-accent/40 px-3 py-2 text-xs text-cos-accent disabled:opacity-50";

export default function SettingsPage() {
  const stage = getStage("settings");
  const data = useStageData("settings");
  const router = useRouter();
  const { me, loading, logout } = useAuth();
  const signedIn = Boolean(me);
  const mcpUrl = typeof window === "undefined" ? "/api/mcp" : `${window.location.origin}/api/mcp`;

  if (!loading && !signedIn) {
    return (
      <SectionShell stage={stage} proof="Manual step" records={data.records}>
        <div className="xl:col-span-2">
          <Pillar title="Sign in" proof="Manual step">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-cos-muted">
              <span>Settings belong to a signed-in account.</span>
              <span className="flex gap-2"><Link href="/login?returnTo=%2Fos%2Fsettings" className={buttonClass}>Sign in</Link><Link href="/signup?returnTo=%2Fos%2Fsettings" className="inline-flex items-center rounded-lg border border-cos-border px-3 py-2 text-xs text-cos-muted">Create account</Link></span>
            </div>
          </Pillar>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell stage={stage} proof={signedIn ? "Present" : "Not started"} records={data.records}>
      <Pillar title="Account" proof={signedIn ? "Present" : "Not started"} detail="As returned by the identity service. Your workspace comes from your signed-in identity, never from a typed value.">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Email" value={me?.email} />
          <Field label="Role" value={me?.role ?? (me?.is_superuser ? "admin" : undefined)} />
          <Field label="Workspace" value={me?.workspace_id} />
          <Field label="Plan" value={me?.tier} />
        </div>
        <button type="button" onClick={() => { logout(); router.push("/login?returnTo=%2Fos"); }} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cos-border px-3 py-2 text-xs text-cos-muted hover:text-cos-text"><LogOut size={13} />Sign out</button>
      </Pillar>

      <Pillar title="Connect by MCP" proof="Present" detail="Point any MCP client at the governed tool server. Discovery is not authority: every consequential tool still needs its own single-use grant, decided by the authority layer.">
        <div className="space-y-2 text-xs text-cos-muted">
          <div className="flex items-center gap-2"><Cable size={13} className="text-cos-accent" /><span className="font-mono text-cos-text">{mcpUrl}</span></div>
          <p>JSON-RPC over HTTP. Start with <code className="font-mono text-cos-text">tools/list</code>; the Terminal in this OS uses the same server. To pair a machine instead, create a link in <Link href="/vlink/connect" className="text-cos-accent">VLink</Link>.</p>
        </div>
      </Pillar>

      <Pillar title="Your model key" proof="Not started" detail="Bring your own provider key and choose the model your capabilities run on.">
        <HonestEmpty title="Not available yet" route="model key store: no routed endpoint" detail="No Veklom service stores a provider key or a model choice for your account yet. Nothing here pretends to." />
      </Pillar>

      <Pillar title="API key" proof="Not started" detail="A key for your own software to call Veklom.">
        <HonestEmpty title="Not available yet" route="POST /api/v1/auth/api-keys: 404 on every live service" detail="Software connects through MCP or VLink today. A key would identify the caller; it would never be authority to cause a consequence." />
      </Pillar>

      <Pillar title="Webhook" proof="Not started" detail="One URL that receives a notification when something happens to your capabilities.">
        <HonestEmpty title="Not available yet" route="/api/v1/webhooks: 404 on every live service" detail="No notifications are sent yet. A notification is evidence of an event, never permission for the next one." />
      </Pillar>

      <Pillar title="Integrations" proof="Not started" detail="Enterprise connections such as Slack and Linear.">
        <div className="flex flex-wrap gap-2 text-xs text-cos-muted">
          <span className="inline-flex items-center gap-1 rounded border border-cos-border px-2 py-1"><Plug size={12} /> Slack · not connected</span>
          <span className="inline-flex items-center gap-1 rounded border border-cos-border px-2 py-1"><Plug size={12} /> Linear · not connected</span>
          <span className="inline-flex items-center gap-1 rounded border border-cos-border px-2 py-1"><Webhook size={12} /> Custom · not connected</span>
        </div>
        <p className="mt-3 text-xs text-cos-steel"><KeyRound size={12} className="mr-1 inline" />No integration service is routed yet. When one is, it connects here and its actions still cross the authority layer.</p>
      </Pillar>
    </SectionShell>
  );
}
