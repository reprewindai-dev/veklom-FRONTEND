"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { Button, Skeleton, ErrorBox, Spinner } from "@/components/ui";
import { ModuleHeader, SectionCard, Pill, RoutePill, Field, Select, KV, fmtNum, fmtUsd } from "@/components/telemetry";
import { Send, Cpu, Zap, ShieldCheck, Trash2, Gauge, Clock } from "lucide-react";

type Msg = {
  role: "user" | "assistant";
  content: string;
  provider?: string;
  model?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  latency_ms?: number;
  cost?: number;
  error?: boolean;
};

function modelName(m: any) {
  return m.name || m.display_name || m.model_name || m.id;
}
function modelId(m: any) {
  return m.id || m.model_name || m.name;
}

export default function PlaygroundPage() {
  const models = useApi<any>("/api/v1/ai/models");
  const tools = useApi<any>("/api/v1/playground/tools");

  const modelList: any[] = Array.isArray(models.data) ? models.data : models.data?.models || [];
  const [model, setModel] = useState<string>("");
  const [input, setInput] = useState("");
  const [system, setSystem] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!model && modelList.length) setModel(modelId(modelList[0]));
  }, [modelList, model]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const selectedModel = useMemo(() => modelList.find((m) => modelId(m) === model), [modelList, model]);
  const last = useMemo(() => [...msgs].reverse().find((m) => m.role === "assistant" && !m.error), [msgs]);
  const totals = useMemo(() => {
    const calls = msgs.filter((m) => m.role === "assistant" && !m.error).length;
    const tokens = msgs.reduce((a, m) => a + (m.usage?.total_tokens || 0), 0);
    const cost = msgs.reduce((a, m) => a + (m.cost || 0), 0);
    return { calls, tokens, cost };
  }, [msgs]);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setErr(undefined);
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const res = await api<any>("/api/v1/playground/inference", {
        method: "POST",
        body: { model, message, ...(system.trim() ? { system: system.trim() } : {}) },
      });
      const usage = res.usage || {};
      const inRate = selectedModel?.cost_per_1k_input ?? 0;
      const outRate = selectedModel?.cost_per_1k_output ?? inRate;
      const cost = (usage.prompt_tokens || 0) / 1000 * inRate + (usage.completion_tokens || 0) / 1000 * outRate;
      setMsgs((m) => [...m, {
        role: "assistant",
        content: res.content || "(empty response)",
        provider: res.provider,
        model: res.model,
        usage,
        latency_ms: res.latency_ms,
        cost,
      }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", content: e?.message || "Inference failed", error: true }]);
      setErr(e?.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <ModuleHeader
        breadcrumb="Operations · Playground"
        title="Governed inference console"
        subtitle="Every prompt is scanned by the MCP gateway, routed by policy, metered, and logged — pick a model and watch the routing, tokens, latency, and cost per call."
        pills={
          <>
            <Pill tone="green" dot>MCP gateway active</Pill>
            <Pill tone="amber">Policy-routed</Pill>
            <Pill tone="neutral">{modelList.length} models</Pill>
          </>
        }
        actions={<Button variant="ghost" onClick={() => setMsgs([])} disabled={!msgs.length}><Trash2 size={14} /> Clear</Button>}
      />

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        {/* Console */}
        <SectionCard label="Console" title={selectedModel ? modelName(selectedModel) : "Inference"} bodyClassName="p-0" className="min-w-0"
          actions={selectedModel && <RoutePill route={selectedModel.provider === "ollama" ? "hetzner" : "aws"} />}>
          <div ref={scrollRef} className="h-[44vh] overflow-y-auto scroll-thin px-4 py-3 space-y-3">
            {msgs.length === 0 && (
              <div className="h-full grid place-items-center text-center text-ink-500 text-[13px]">
                <div>
                  <Cpu size={22} className="mx-auto mb-2 text-ink-600" />
                  Send a prompt to run governed inference.<br />Routing, tokens, latency, and cost appear per call.
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-sm bg-brand-500/15 border border-brand-500/25 px-3.5 py-2.5 text-[13px] text-ink-50"
                    : m.error
                      ? "max-w-[85%] rounded-2xl rounded-bl-sm bg-accent-red/10 border border-accent-red/30 px-3.5 py-2.5 text-[13px] text-accent-red"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm bg-white/[0.03] border border-border px-3.5 py-2.5 text-[13px] text-ink-100"
                }>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  {m.role === "assistant" && !m.error && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border/60 text-[10px] text-ink-600 font-mono">
                      <span className="text-brand-400">{m.provider}</span>
                      <span>· {m.model}</span>
                      {m.usage && <span>· {fmtNum(m.usage.total_tokens)} tok</span>}
                      {m.latency_ms != null && <span>· {m.latency_ms}ms</span>}
                      {m.cost != null && <span>· {fmtUsd(m.cost, 4)}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex justify-start"><div className="rounded-2xl bg-white/[0.03] border border-border px-3.5 py-2.5"><Spinner /></div></div>}
          </div>
          <div className="border-t border-border p-3">
            {err && <div className="mb-2"><ErrorBox message={err} /></div>}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Send a governed prompt…  (Enter to run, Shift+Enter for newline)"
                rows={2}
                className="input flex-1 resize-none"
                disabled={!model}
              />
              <Button onClick={send} loading={busy} disabled={!input.trim() || !model}><Send size={14} /> Run</Button>
            </div>
          </div>
        </SectionCard>

        {/* Config + telemetry rail */}
        <div className="space-y-4">
          <SectionCard label="Configuration" title="Model & policy">
            {models.isLoading ? <Skeleton className="h-10" /> : models.error ? <ErrorBox message="Could not load models." /> : (
              <div className="space-y-3">
                <Field label="Model">
                  <Select value={model} onChange={setModel} options={modelList.map((m) => ({ value: modelId(m), label: modelName(m) }))} />
                </Field>
                {selectedModel && (
                  <div className="card p-3">
                    <KV k="Provider" v={selectedModel.provider} mono={false} />
                    {selectedModel.context_window != null && <KV k="Context" v={`${fmtNum(selectedModel.context_window)} tok`} />}
                    <KV k="In / 1k" v={fmtUsd(selectedModel.cost_per_1k_input ?? 0, 5)} />
                    {selectedModel.cost_per_1k_output != null && <KV k="Out / 1k" v={fmtUsd(selectedModel.cost_per_1k_output, 5)} />}
                  </div>
                )}
                <Field label="System prompt (optional)">
                  <textarea value={system} onChange={(e) => setSystem(e.target.value)} rows={3} className="input resize-none" placeholder="You are a governed assistant…" />
                </Field>
              </div>
            )}
          </SectionCard>

          <SectionCard label="This session" title="Live meter">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center"><Zap size={14} className="mx-auto text-brand-400 mb-1" /><div className="text-[15px] font-semibold">{totals.calls}</div><div className="text-[10px] text-ink-600 uppercase tracking-wider">Calls</div></div>
              <div className="text-center"><Gauge size={14} className="mx-auto text-accent-green mb-1" /><div className="text-[15px] font-semibold">{fmtNum(totals.tokens)}</div><div className="text-[10px] text-ink-600 uppercase tracking-wider">Tokens</div></div>
              <div className="text-center"><Clock size={14} className="mx-auto text-ink-300 mb-1" /><div className="text-[15px] font-semibold">{last?.latency_ms ?? "—"}<span className="text-[10px]">ms</span></div><div className="text-[10px] text-ink-600 uppercase tracking-wider">Last</div></div>
            </div>
            <div className="card p-3">
              <KV k="Est. session cost" v={fmtUsd(totals.cost, 4)} />
              <KV k="Last provider" v={last?.provider || "—"} mono={false} />
              <KV k="Last route" v={last ? (last.provider === "ollama" ? "Hetzner · primary" : "AWS · burst") : "—"} mono={false} />
            </div>
            <div className="flex items-start gap-2 mt-3 text-[11px] text-ink-500">
              <ShieldCheck size={13} className="text-accent-green mt-0.5 shrink-0" />
              Prompts are sanitized for injection, rate-limited, and written to the audit log before execution.
            </div>
            {!tools.isLoading && tools.data?.tools?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tools.data.tools.slice(0, 6).map((t: any) => <Pill key={t.id || t.name} tone="neutral">{t.name || t.id}</Pill>)}
              </div>
            ) : null}
          </SectionCard>
        </div>
      </div>
    </Shell>
  );
}
