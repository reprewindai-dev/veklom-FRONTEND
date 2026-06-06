"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { api, getToken } from "@/lib/api";
import { Button, Skeleton, Table } from "@/components/ui";
import { ModuleHeader, SectionCard, Pill, RoutePill } from "@/components/telemetry";
import PipelineCanvas, { PNode, PEdge, CAT_COLOR } from "@/components/PipelineCanvas";
import { unwrapList } from "@/types/api";
import { Play, Rocket, Plus, Save, Search, Cpu } from "lucide-react";

const RUN_STAGES = ["Source", "Build", "Validate", "Test", "Stage", "Gate", "Deploy"];

// LangChain category — many teams standardise on it, so it's first-class here.
const LANGCHAIN_CAT = {
  id: "langchain",
  label: "LangChain",
  nodes: [
    { id: "lc-agent", name: "LangChain Agent", description: "ReAct tool-calling agent" },
    { id: "lc-langgraph", name: "LangGraph", description: "Stateful multi-step graph" },
    { id: "lc-memory", name: "Conversation Memory", description: "Buffer / summary memory" },
    { id: "lc-retrievalqa", name: "RetrievalQA Chain", description: "RAG question-answering" },
    { id: "lc-parser", name: "Output Parser", description: "Structured Pydantic parsing" },
    { id: "lc-toolnode", name: "Tool Node", description: "Bind marketplace tools" },
  ],
};

// Extra nodes to match the governed-inference reference palette.
const EXTRA: Record<string, { id: string; name: string; description: string }[]> = {
  retrieval: [
    { id: "weaviate", name: "Weaviate Store", description: "Weaviate vector DB" },
    { id: "doc-loader", name: "Document Loader", description: "Ingest PDFs, docs, URLs" },
  ],
  routing: [{ id: "semantic-router", name: "Semantic Router", description: "Embed + route by intent" }],
  output: [
    { id: "markdown-render", name: "Markdown Render", description: "Render output as Markdown" },
    { id: "audit-signer", name: "Audit Signer", description: "HMAC-sign the evidence record" },
  ],
};

function catOf(nodeType: string, type: string | undefined, lookup: Record<string, string>): string {
  if (lookup[nodeType]) return lookup[nodeType];
  switch (type) {
    case "model": case "embedding": return "models";
    case "vector_store": case "transform": case "retrieval": return "retrieval";
    case "tool": return "tools";
    case "gate": case "router": return "routing";
    case "output": return "output";
    default: return "input";
  }
}

export default function PipelinesPage() {
  const router = useRouter();
  const pipelines = useApi<any>("/api/v1/pipelines");
  const palette = useApi<any>("/api/v1/pipelines/nodes");

  const [pid, setPid] = useState<string | null>(null);
  const [nodes, setNodes] = useState<PNode[]>([]);
  const [edges, setEdges] = useState<PEdge[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);
  const [stageStatus, setStageStatus] = useState<Record<string, string>>({});
  const [runMsg, setRunMsg] = useState<string>();

  const list = unwrapList<any>(pipelines.data);
  const current = list.find((p) => p.id === pid) || list[0];

  // nodeType -> category lookup from live palette
  const catLookup = useMemo(() => {
    const m: Record<string, string> = {};
    (palette.data?.categories || []).forEach((c: any) => (c.nodes || []).forEach((n: any) => (m[n.id] = c.id)));
    LANGCHAIN_CAT.nodes.forEach((n) => (m[n.id] = "langchain"));
    Object.entries(EXTRA).forEach(([cat, ns]) => ns.forEach((n) => (m[n.id] = cat)));
    return m;
  }, [palette.data]);

  // Merge live palette + extras + LangChain
  const categories = useMemo(() => {
    const base = (palette.data?.categories || []).map((c: any) => ({
      ...c,
      nodes: [...(c.nodes || []), ...(EXTRA[c.id] || [])],
    }));
    return [...base, LANGCHAIN_CAT];
  }, [palette.data]);

  // Default selection
  useEffect(() => {
    if (!pid && list.length) setPid(list[0].id);
  }, [list, pid]);

  // Load graph when pipeline changes
  useEffect(() => {
    if (!pid) return;
    let cancelled = false;
    setLoadingGraph(true);
    api<any>(`/api/v1/pipelines/${pid}/graph`)
      .then((g) => {
        if (cancelled) return;
        const ns: PNode[] = (g.nodes || []).map((n: any) => ({
          id: n.id,
          nodeType: n.data?.nodeType || n.type || "node",
          label: n.data?.label || n.id,
          cat: catOf(n.data?.nodeType || "", n.type, catLookup),
          x: n.position?.x ?? 60,
          y: n.position?.y ?? 60,
        }));
        const es: PEdge[] = (g.edges || []).map((e: any) => ({ id: e.id, source: e.source, target: e.target }));
        setNodes(ns);
        setEdges(es);
        setSelected(null);
      })
      .finally(() => !cancelled && setLoadingGraph(false));
    return () => { cancelled = true; };
  }, [pid, catLookup]);

  function addNode(catId: string, node: any) {
    const id = `${node.id}-${Date.now().toString(36)}`;
    const cx = 120 + (nodes.length % 6) * 60;
    const cy = 80 + (nodes.length % 5) * 70;
    setNodes((ns) => [...ns, { id, nodeType: node.id, label: node.name, cat: catId, x: cx, y: cy }]);
    setSelected(id);
  }

  async function saveGraph() {
    if (!pid) return;
    setSaving(true); setSaved(false);
    try {
      await api(`/api/v1/pipelines/${pid}/graph`, {
        method: "PUT",
        body: {
          nodes: nodes.map((n) => ({ id: n.id, type: n.cat, position: { x: n.x, y: n.y }, data: { label: n.label, nodeType: n.nodeType } })),
          edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, animated: true })),
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  async function testRun() {
    if (!pid || running) return;
    setRunning(true); setRunMsg(undefined);
    setStageStatus(Object.fromEntries(RUN_STAGES.map((s) => [s, "pending"])));
    try {
      const { run_id } = await api<any>(`/api/v1/pipelines/${pid}/run`, { method: "POST" });
      const origin = window.location.origin;
      const res = await fetch(`${origin}/api/v1/pipelines/${pid}/runs/${run_id}/stream`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          let ev: any;
          try { ev = JSON.parse(line.slice(5).trim()); } catch { continue; }
          if (ev.stage) setStageStatus((s) => ({ ...s, [ev.stage]: ev.type === "step.completed" ? "completed" : "running" }));
          if (ev.type === "run.completed") {
            setStageStatus(Object.fromEntries(RUN_STAGES.map((s) => [s, "completed"])));
            setRunMsg(`Completed · evidence ${ev.evidence_id || "—"} · proof ${ev.proof_hash || "—"}`);
          }
        }
      }
    } catch (e) {
      setRunMsg(`Run error: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  }

  async function newPipeline() {
    const name = window.prompt("Name your pipeline", "untitled-pipeline");
    if (!name) return;
    const created = await api<any>("/api/v1/pipelines", { method: "POST", body: { name, template: "Custom", vectorStore: "pgvector" } });
    await pipelines.mutate();
    if (created?.id) setPid(created.id);
  }

  const p50 = 180 + edges.length * 12 + nodes.length * 6;

  return (
    <Shell>
      <TierGate required="pro" feature="Pipelines">
        <ModuleHeader
          breadcrumb="Infrastructure · Pipelines"
          title="Visual builder for governed inference"
          subtitle="Drag-and-drop graphs that chain models, retrieval, memory, tools, and routing — every node gated by your policy engine."
          pills={<><Pill tone="green" dot>Policy engine inline</Pill><Pill tone="amber">LangChain · LangGraph</Pill><Pill tone="cyan">pgvector · Qdrant · Weaviate</Pill></>}
          actions={<>
            <Button variant="ghost" onClick={newPipeline}><Plus size={14} /> New pipeline</Button>
          </>}
        />

        {/* Builder */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 mb-5">
          <div className="card overflow-hidden">
            {/* Builder toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Cpu size={15} className="text-brand-400" />
              <span className="text-sm font-semibold">{current?.name || "—"}</span>
              <Pill tone="neutral">{(current?.steps?.template || current?.template || "Custom")}</Pill>
              <Pill tone="amber">{current?.status || "draft"}</Pill>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" onClick={saveGraph} loading={saving}><Save size={14} /> {saved ? "Saved" : "Save"}</Button>
                <Button variant="ghost" onClick={testRun} loading={running}><Play size={14} /> Test</Button>
                <Button onClick={() => { saveGraph(); router.push("/deployments"); }}><Rocket size={14} /> Deploy as endpoint</Button>
              </div>
            </div>

            {loadingGraph ? (
              <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>
            ) : (
              <div className="p-3">
                <PipelineCanvas
                  nodes={nodes} edges={edges}
                  setNodes={setNodes} setEdges={setEdges}
                  selected={selected} setSelected={setSelected}
                  running={running}
                />
              </div>
            )}

            {/* Footer status */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border text-[11px]">
              <span className="flex items-center gap-1.5 text-accent-green"><span className="w-1.5 h-1.5 rounded-full bg-accent-green" /> POLICY ENGINE INLINE</span>
              <span className="ml-auto text-ink-600 font-mono">{nodes.length} nodes · {edges.length} edges · est. p50 ~{p50}ms</span>
            </div>

            {/* Run progress */}
            {(running || runMsg) && (
              <div className="px-4 py-3 border-t border-border">
                <div className="flex flex-wrap items-center gap-1.5">
                  {RUN_STAGES.map((s) => {
                    const st = stageStatus[s] || "pending";
                    return (
                      <span key={s} className={
                        st === "completed" ? "text-[10px] px-2 py-1 rounded-md border border-accent-green/40 bg-accent-green/10 text-accent-green"
                        : st === "running" ? "text-[10px] px-2 py-1 rounded-md border border-brand-500/40 bg-brand-500/10 text-brand-400 animate-pulse"
                        : "text-[10px] px-2 py-1 rounded-md border border-border text-ink-600"
                      }>{s}</span>
                    );
                  })}
                </div>
                {runMsg && <div className="mt-2 text-[11px] text-ink-400 font-mono">{runMsg}</div>}
              </div>
            )}
          </div>

          {/* Node palette */}
          <SectionCard label="Library" title="Nodes" className="self-start">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-900 px-2.5 h-9 mb-3">
              <Search size={13} className="text-ink-600" />
              <input value={paletteQuery} onChange={(e) => setPaletteQuery(e.target.value)} placeholder="Search nodes…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-600" />
            </div>
            <div className="space-y-4 max-h-[460px] overflow-y-auto scroll-thin pr-1">
              {palette.isLoading ? <Skeleton className="h-40 w-full" /> :
                categories.map((cat: any) => {
                  const q = paletteQuery.trim().toLowerCase();
                  const ns = (cat.nodes || []).filter((n: any) => !q || n.name.toLowerCase().includes(q) || (n.description || "").toLowerCase().includes(q));
                  if (!ns.length) return null;
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLOR[cat.id] || CAT_COLOR.input }} />
                        <span className="text-[10px] uppercase tracking-wider text-ink-600 font-semibold">{cat.label}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {ns.map((n: any) => (
                          <button key={n.id} onClick={() => addNode(cat.id, n)}
                            className="group flex items-center gap-2 rounded-lg border border-border bg-white/[0.02] hover:border-ink-600 hover:bg-white/[0.04] px-2.5 py-1.5 text-left transition">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CAT_COLOR[cat.id] || CAT_COLOR.input }} />
                            <span className="min-w-0">
                              <span className="block text-[12px] text-ink-50 truncate">{n.name}</span>
                              <span className="block text-[10px] text-ink-600 truncate">{n.description}</span>
                            </span>
                            <Plus size={12} className="ml-auto text-ink-600 group-hover:text-brand-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </SectionCard>
        </div>

        {/* Pipelines list */}
        <SectionCard label="Deployed & draft" title={`${list.length} pipelines`}>
          {pipelines.isLoading ? <Skeleton className="h-32 w-full" /> :
            <Table
              rows={list}
              rowKey={(r) => r.id}
              empty="No pipelines yet — create one to start building"
              columns={[
                { key: "name", header: "Name", render: (r) => (
                  <button onClick={() => setPid(r.id)} className={r.id === pid ? "text-brand-400 font-medium" : "text-ink-50 hover:text-brand-400"}>{r.name}</button>
                ) },
                { key: "template", header: "Template", render: (r) => <span className="text-ink-400">{r.steps?.template || r.template || "Custom"}</span> },
                { key: "vs", header: "Vector store", render: (r) => <RoutePill route={r.steps?.vectorStore || "pgvector"} /> },
                { key: "nodes", header: "Nodes", render: (r) => <span className="font-mono">{r.steps?.nodes ?? "—"}</span> },
                { key: "inv", header: "Invocations", render: (r) => <span className="font-mono tabular-nums">{(r.steps?.invocations ?? 0).toLocaleString()}</span> },
                { key: "status", header: "Status", render: (r) => <Pill tone={r.status === "deployed" || r.status === "live" ? "green" : "neutral"} dot={r.status === "deployed" || r.status === "live"}>{r.status || "draft"}</Pill> },
              ]}
            />
          }
        </SectionCard>
      </TierGate>
    </Shell>
  );
}
