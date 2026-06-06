"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Skeleton, Table, Button, ErrorBox, SuccessBox } from "@/components/ui";
import { unwrapList } from "@/types/api";
import { api } from "@/lib/api";
import { useState } from "react";
import Modal from "@/components/Modal";
import { ModuleHeader, SectionCard, Pill, Field, fmtNum } from "@/components/telemetry";
import { KeyRound, Plus, Copy, Check, Trash2 } from "lucide-react";

export default function ApiKeysPage() {
  const keys = useApi<any>("/api/v1/auth/api-keys");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string>();

  const rows = unwrapList<any>(keys.data);

  async function create() {
    if (!name.trim()) { setErr("Name the key first."); return; }
    setBusy(true); setErr(undefined); setNewKey(undefined);
    try {
      const res = await api<any>("/api/v1/auth/api-keys", { method: "POST", body: { name: name.trim() } });
      setNewKey(res.key || res.api_key || res.token);
      setName("");
      keys.mutate();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  async function revoke(id: string) {
    setRevoking(id);
    try { await api(`/api/v1/auth/api-keys/${id}`, { method: "DELETE" }); keys.mutate(); }
    catch { /* ignore */ } finally { setRevoking(undefined); }
  }
  function copy() {
    if (newKey) { navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  }
  function closeCreate() { setShowCreate(false); setNewKey(undefined); setName(""); setErr(undefined); }

  return (
    <Shell>
      <TierGate required="starter" feature="API Keys">
        <ModuleHeader
          breadcrumb="Account · API Keys"
          title="Programmatic access keys"
          subtitle="Issue and revoke keys for the OpenAI-compatible gateway. Keys are shown once at creation — store them securely."
          pills={<Pill tone="neutral">{fmtNum(rows.length)} active</Pill>}
          actions={<Button onClick={() => setShowCreate(true)}><Plus size={14} /> New key</Button>}
        />

        <SectionCard label="Keys" title="Active credentials" bodyClassName="p-0">
          {keys.isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> :
            <Table
              rows={rows}
              rowKey={(r) => r.id || r.key_id}
              empty="No API keys yet — create one to call the gateway."
              columns={[
                { key: "name", header: "Name", render: (r) => <span className="flex items-center gap-2"><KeyRound size={13} className="text-brand-400" /> {r.name}</span> },
                { key: "prefix", header: "Prefix", render: (r) => <code className="text-xs text-ink-400">{r.prefix || r.preview || r.key_prefix || "—"}…</code> },
                { key: "created", header: "Created", render: (r) => <span className="text-ink-500 text-xs">{(r.created_at || "").slice(0, 10)}</span> },
                { key: "last_used", header: "Last used", render: (r) => <span className="text-ink-500 text-xs">{r.last_used_at ? (r.last_used_at || "").slice(0, 10) : "never"}</span> },
                { key: "actions", header: "", width: "100px", render: (r) => <Button variant="danger" onClick={() => revoke(r.id || r.key_id)} loading={revoking === (r.id || r.key_id)}><Trash2 size={13} /> Revoke</Button> },
              ]}
            />
          }
        </SectionCard>

        {showCreate && (
          <Modal open onClose={closeCreate} size="md"
            title={<span className="flex items-center gap-2"><KeyRound size={15} className="text-brand-400" /> New API key</span>}
            subtitle="Give it a recognizable name."
            footer={newKey
              ? <div className="ml-auto"><Button onClick={closeCreate}>Done</Button></div>
              : <div className="ml-auto flex gap-2"><Button variant="ghost" onClick={closeCreate}>Cancel</Button><Button onClick={create} loading={busy}>Create key</Button></div>}>
            {newKey ? (
              <div className="space-y-3">
                <SuccessBox message="Key created. Copy it now — it will not be shown again." />
                <div className="flex items-center gap-2 card p-3">
                  <code className="text-[12px] break-all flex-1">{newKey}</code>
                  <Button variant="ghost" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Field label="Key name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Production server" autoFocus /></Field>
                {err && <ErrorBox message={err} />}
              </div>
            )}
          </Modal>
        )}
      </TierGate>
    </Shell>
  );
}
