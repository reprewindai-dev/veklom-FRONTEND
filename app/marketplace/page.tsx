"use client";

import { useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { api, getToken } from "@/lib/api";
import { Button, Skeleton, ErrorBox, SuccessBox, Spinner } from "@/components/ui";
import { ModuleHeader, SectionCard, Pill, Field, Select, KV } from "@/components/telemetry";
import Modal from "@/components/Modal";
import {
  Store, Download, Play, ShoppingBag, Plus, Star, Sparkles, ExternalLink,
  Search, ShieldCheck, FileCheck2, BadgeCheck, Wand2, Check, Server, Boxes,
} from "lucide-react";

const CAT_LABELS: Record<string, string> = {
  models: "Models", deployment_images: "Deployment Images", rag_templates: "RAG Templates",
  pipelines: "Pipelines", prompt_packs: "Prompt Packs", compliance_packs: "Compliance Packs",
  connectors: "Connectors", sdk_extensions: "SDK Extensions", managed_services: "Managed Services",
  infrastructure: "Infrastructure", tool: "Tools",
};
function catLabel(c?: string) {
  if (!c) return "Other";
  return CAT_LABELS[c] || c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
function priceLabel(l: any) {
  if (!l?.price || l.pricing_model === "free") return "Free";
  const amt = `$${Number(l.price).toLocaleString()}`;
  if (l.pricing_model === "one_time") return `${amt} one-time`;
  return `${amt} / mo`;
}
const AVAILABILITY = [
  { value: "open_source", label: "Open source — everywhere (free)" },
  { value: "common", label: "Common — easy to find (low)" },
  { value: "standard", label: "Standard — typical commercial" },
  { value: "uncommon", label: "Uncommon — harder to source" },
  { value: "rare", label: "Rare — few alternatives" },
  { value: "exclusive", label: "Veklom-exclusive — unheard-of" },
];

function RarityPill({ rarity, exclusive }: { rarity?: string; exclusive?: boolean }) {
  if (exclusive) return <Pill tone="violet">EXCLUSIVE</Pill>;
  const tone = rarity === "rare" ? "amber" : rarity === "uncommon" ? "cyan" : rarity === "open_source" || rarity === "common" ? "green" : "neutral";
  return <Pill tone={tone as any}>{(rarity || "standard").replace("_", " ").toUpperCase()}</Pill>;
}

function Badges({ badges, compliance }: { badges: string[]; compliance: string[] }) {
  const comp = new Set((compliance || []).map((c) => c.toUpperCase()));
  return (
    <div className="flex flex-wrap gap-1.5">
      {(badges || []).slice(0, 5).map((b) => (
        <Pill key={b} tone={comp.has(b.toUpperCase()) ? "amber" : "neutral"}>{b}</Pill>
      ))}
    </div>
  );
}

function ListingCard({ l, onOpen }: { l: any; onOpen: (l: any) => void }) {
  return (
    <button onClick={() => onOpen(l)} className="card card-hover p-4 text-left flex flex-col gap-2.5 group">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-600">
        <span>{catLabel(l.category)}</span>
        <span className="text-ink-600">·</span>
        <span className="text-ink-400">{l.vendor_name}</span>
        <span className="ml-auto flex items-center gap-1 text-brand-400 normal-case tracking-normal">
          <Star size={11} className="fill-brand-400" /> {Number(l.rating || 0).toFixed(1)}
        </span>
      </div>
      <div className="flex items-start gap-2">
        <h3 className="text-[15px] font-semibold text-ink-50 group-hover:text-brand-400 transition">{l.name}</h3>
        {l.exclusive && <Sparkles size={13} className="text-accent-violet mt-1 shrink-0" />}
      </div>
      <p className="text-[12.5px] text-ink-400 line-clamp-2 leading-snug">{l.description}</p>
      <Badges badges={l.badges} compliance={l.compliance_tags} />
      <div className="flex items-center gap-2 mt-auto pt-2">
        {(l.deploy_target || "").split("+").map((d: string) => d.trim()).filter(Boolean).map((d: string) => (
          <span key={d} className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-600">
            <Server size={10} /> {d}
          </span>
        ))}
        <span className="ml-auto text-[13px] font-semibold text-ink-50">{priceLabel(l)}</span>
      </div>
      <div className="text-[9px] text-ink-600 text-right mt-0.5 italic">Simulated stats: {l.downloads || "0"} installs · ★ {Number(l.rating || 0).toFixed(1)}</div>
    </button>
  );
}

export default function MarketplacePage() {
  const listings = useApi<any[]>("/api/v1/marketplace/listings");
  const installed = useApi<any>("/api/v1/marketplace/installed");

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<any>(null);
  const [showPurchases, setShowPurchases] = useState(false);
  const [showProvider, setShowProvider] = useState(false);

  const all: any[] = Array.isArray(listings.data) ? listings.data : [];
  const installedIds = new Set((installed.data?.installed || []).map((a: any) => a.listing_id));

  const categories = useMemo(() => {
    const set = new Set(all.map((l) => l.category));
    return ["all", ...Array.from(set)];
  }, [all]);

  const featured = useMemo(
    () => [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.price || 0) - (a.price || 0)).slice(0, 2),
    [all]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((l) => {
      if (tab !== "all" && l.category !== tab) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q) ||
        (l.vendor_name || "").toLowerCase().includes(q) ||
        (l.badges || []).some((b: string) => b.toLowerCase().includes(q))
      );
    });
  }, [all, tab, query]);

  const providerCount = useMemo(() => new Set(all.map((l) => l.vendor_slug)).size, [all]);

  return (
    <Shell>
      <ModuleHeader
        breadcrumb="Workspace · Marketplace"
        title="Sovereign-ready assets, governed distribution"
        subtitle="Models, pipelines, compliance packs, connectors, and managed services — every listing inherits Veklom's policy engine and audit trail. Listed metrics are simulated for demonstration."
        pills={
          <>
            <Pill tone="amber" dot>License-bound · Watermarked · Signed</Pill>
            <Pill tone="neutral">{all.length} listings</Pill>
            <Pill tone="green">{providerCount} verified providers</Pill>
            <Pill tone="violet">DEMO MODE</Pill>
          </>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowPurchases(true)}><ShoppingBag size={14} /> My purchases</Button>
            <Button onClick={() => setShowProvider(true)}><Plus size={14} /> Become a provider</Button>
          </>
        }
      />

      {listings.error && <ErrorBox message="Could not load the marketplace catalog." />}

      {/* Featured */}
      {listings.isLoading ? (
        <div className="grid md:grid-cols-2 gap-4 mb-5"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-5">
          {featured.map((l) => (
            <button key={l.id} onClick={() => setSel(l)} className="card card-hover p-5 text-left relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand-500/10 blur-3xl" />
              <div className="flex items-center gap-2 mb-2">
                <Pill tone="amber"><Sparkles size={11} /> Featured</Pill>
                <span className="text-[10px] uppercase tracking-wider text-ink-600">{catLabel(l.category)}</span>
                <span className="text-[10px] uppercase tracking-wider text-ink-400">· {l.vendor_name}</span>
              </div>
              <h3 className="text-[18px] font-semibold text-ink-50 group-hover:text-brand-400 transition">{l.name}</h3>
              <p className="text-[13px] text-ink-400 mt-1.5 line-clamp-2 max-w-md">{l.description}</p>
              <div className="mt-3"><Badges badges={l.badges} compliance={l.compliance_tags} /></div>
              <div className="flex items-end gap-3 mt-4">
                <span className="text-[17px] font-semibold text-ink-50">{priceLabel(l)}</span>
                <span className="text-[11px] text-ink-600">{l.downloads} installs · ★ {Number(l.rating || 0).toFixed(1)}</span>
                <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-brand-400 font-medium">View listing <ExternalLink size={12} /></span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Search + tabs */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-900 px-3 h-11 mb-3">
        <Search size={15} className="text-ink-600" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search listings, providers, compliance frameworks…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-600" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className={
              tab === c
                ? "px-3 py-1.5 rounded-lg text-[12px] font-medium bg-brand-500/15 text-brand-400 border border-brand-500/30"
                : "px-3 py-1.5 rounded-lg text-[12px] text-ink-400 border border-border hover:border-ink-600 hover:text-ink-200 transition"
            }
          >
            {c === "all" ? "All" : catLabel(c)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {listings.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => <ListingCard key={l.id} l={l} onOpen={setSel} />)}
        </div>
      )}
      {!listings.isLoading && !filtered.length && <div className="text-center text-ink-500 py-12">No listings match your search.</div>}

      {/* Trust footer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 card p-5">
        {[
          { icon: <ShieldCheck size={16} />, t: "Governed packaging", d: "Hosted APIs · containers · CLI · SDK · signed builds" },
          { icon: <BadgeCheck size={16} />, t: "License-bound", d: "Activation, account binding, watermarking, metering, expiry" },
          { icon: <FileCheck2 size={16} />, t: "Vetted providers", d: "Identity verified · signed builds · evidence-linked" },
          { icon: <Boxes size={16} />, t: "One bill", d: "Marketplace charges roll into your Veklom invoice" },
        ].map((f) => (
          <div key={f.t} className="flex flex-col gap-1.5">
            <span className="text-brand-400">{f.icon}</span>
            <span className="text-[13px] font-medium text-ink-50">{f.t}</span>
            <span className="text-[11px] text-ink-500 leading-snug">{f.d}</span>
          </div>
        ))}
      </div>

      {sel && <ListingDetail listing={sel} installed={installedIds.has(sel.id)} onClose={() => setSel(null)} onInstalled={() => { installed.mutate(); listings.mutate(); }} />}
      {showPurchases && <PurchasesModal installed={installed} all={all} onClose={() => setShowPurchases(false)} onOpen={(l) => { setShowPurchases(false); setSel(l); }} />}
      {showProvider && <ProviderWizard onClose={() => setShowProvider(false)} onPublished={() => { listings.mutate(); }} />}
    </Shell>
  );
}

/* ---------------- Listing detail ---------------- */
function ListingDetail({ listing, installed, onClose, onInstalled }: { listing: any; installed: boolean; onClose: () => void; onInstalled: () => void }) {
  const [demo, setDemo] = useState<any>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed2, setInstalled2] = useState(installed);
  const [msg, setMsg] = useState<string>();
  const [downloading, setDownloading] = useState(false);

  async function runDemo() {
    setDemoLoading(true); setDemo(null);
    try {
      const res = await api<any>(`/api/v1/marketplace/listings/${listing.id}/demo`, { method: "POST", body: { input: "Evaluate this asset for our workspace." } });
      setDemo(res);
    } catch (e) { setMsg(`Demo error: ${(e as Error).message}`); }
    finally { setDemoLoading(false); }
  }
  async function install() {
    setInstalling(true); setMsg(undefined);
    try {
      const res = await api<any>(`/api/v1/marketplace/listings/${listing.id}/install`, { method: "POST", body: {} });
      setInstalled2(true);
      setMsg(res.message || "Installed to your workspace.");
      onInstalled();
    } catch (e) { setMsg(`Install error: ${(e as Error).message}`); }
    finally { setInstalling(false); }
  }
  async function downloadDatasheet() {
    setDownloading(true);
    try {
      const res = await fetch(`${window.location.origin}/api/v1/marketplace/listings/${listing.id}/datasheet`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${listing.id}-datasheet.md`; a.click();
      URL.revokeObjectURL(url);
    } finally { setDownloading(false); }
  }

  const paid = listing.price && listing.price > 0;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={<span className="flex items-center gap-2">{listing.name} {listing.exclusive && <Sparkles size={14} className="text-accent-violet" />}</span>}
      subtitle={<span>{catLabel(listing.category)} · {listing.vendor_name} · ★ {Number(listing.rating || 0).toFixed(1)} · {listing.downloads} installs</span>}
      footer={
        <>
          <span className="text-[15px] font-semibold text-ink-50">{priceLabel(listing)}</span>
          <RarityPill rarity={listing.rarity} exclusive={listing.exclusive} />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={downloadDatasheet} loading={downloading}><Download size={14} /> Datasheet</Button>
            {listing.demo_available && <Button variant="ghost" onClick={runDemo} loading={demoLoading}><Play size={14} /> Try demo</Button>}
            {installed2 ? (
              <Button variant="ghost" disabled><Check size={14} /> Installed</Button>
            ) : (
              <Button onClick={install} loading={installing}>{paid ? <>Buy · {priceLabel(listing)}</> : <>Install free</>}</Button>
            )}
          </div>
        </>
      }
    >
      <div className="grid md:grid-cols-[1fr_240px] gap-5">
        <div className="space-y-4 min-w-0">
          <Badges badges={listing.badges} compliance={listing.compliance_tags} />
          <p className="text-[13px] text-ink-200 leading-relaxed whitespace-pre-line">{listing.long_description || listing.description}</p>

          {!!(listing.features || []).length && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-600 mb-2">Features</div>
              <ul className="space-y-1.5">
                {listing.features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-ink-200"><Check size={13} className="text-accent-green mt-0.5 shrink-0" /> {f}</li>
                ))}
              </ul>
            </div>
          )}

          {!!(listing.install_instructions) && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-600 mb-2">Installation</div>
              <pre className="text-[11.5px] text-ink-300 bg-bg-900 border border-border rounded-lg p-3 whitespace-pre-wrap font-mono">{listing.install_instructions}</pre>
            </div>
          )}

          {!!(listing.changelog || []).length && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-600 mb-2">Changelog</div>
              <div className="space-y-2">
                {listing.changelog.map((c: any, i: number) => (
                  <div key={i} className="text-[12px]"><span className="font-mono text-brand-400">v{c.version}</span> <span className="text-ink-600">· {c.date}</span><div className="text-ink-400">{c.notes}</div></div>
                ))}
              </div>
            </div>
          )}

          {(demo || msg) && (
            <div className="rounded-lg border border-border bg-bg-900 p-3">
              {msg && <div className="mb-2">{msg.startsWith("Install error") || msg.startsWith("Demo error") ? <ErrorBox message={msg} /> : <SuccessBox message={msg} />}</div>}
              {demo && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px]"><Pill tone="green" dot>Demo · {demo.policy_result}</Pill><span className="text-ink-600 font-mono">{demo.billing_impact}</span></div>
                  <div className="text-[12.5px] text-ink-200">{demo.output}</div>
                  <div className="text-[10px] text-ink-600 font-mono">evidence {demo.evidence_id} · provider {demo.provider}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side metadata */}
        <div className="space-y-3">
          <div className="card p-3">
            <div className="text-[10px] uppercase tracking-wider text-ink-600 mb-2">Distribution</div>
            <KV k="Install" v={listing.install_method} />
            <KV k="Deploy" v={listing.deploy_target} />
            <KV k="License" v={<span className="text-right">{listing.license_type}</span>} mono={false} />
            <KV k="Watermark" v={listing.watermark || "none"} mono={false} />
            <KV k="Build" v={listing.build} mono={false} />
          </div>
          {listing.price_rationale && (
            <div className="card p-3">
              <div className="text-[10px] uppercase tracking-wider text-ink-600 mb-1.5">Why this price</div>
              <p className="text-[11.5px] text-ink-300 leading-snug">{listing.price_rationale}</p>
            </div>
          )}
          {!!(listing.compatibility || []).length && (
            <div className="card p-3">
              <div className="text-[10px] uppercase tracking-wider text-ink-600 mb-2">Compatibility</div>
              <ul className="space-y-1">
                {listing.compatibility.map((c: string, i: number) => <li key={i} className="text-[11.5px] text-ink-300">· {c}</li>)}
              </ul>
            </div>
          )}
          {(listing.github_url || listing.docs_url) && (
            <div className="card p-3 space-y-1.5">
              {listing.docs_url && <a href={listing.docs_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] text-brand-400 hover:underline">Docs <ExternalLink size={11} /></a>}
              {listing.github_url && <a href={listing.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] text-brand-400 hover:underline">Source <ExternalLink size={11} /></a>}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- My purchases ---------------- */
function PurchasesModal({ installed, all, onClose, onOpen }: { installed: any; all: any[]; onClose: () => void; onOpen: (l: any) => void }) {
  const items = installed.data?.installed || [];
  return (
    <Modal open onClose={onClose} title="My purchases" subtitle={`${items.length} installed asset${items.length === 1 ? "" : "s"} in this workspace`}>
      {installed.isLoading ? <Skeleton className="h-32" /> : items.length === 0 ? (
        <div className="text-center text-ink-500 py-8">No assets installed yet.</div>
      ) : (
        <div className="space-y-2">
          {items.map((a: any) => {
            const full = all.find((l) => l.id === a.listing_id);
            return (
              <div key={a.id} className="flex items-center gap-3 card p-3">
                <Boxes size={16} className="text-brand-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[13px] text-ink-50 truncate">{a.name}</div>
                  <div className="text-[11px] text-ink-600">{catLabel(a.asset_type)} · v{a.version} · {a.installed_at ? new Date(a.installed_at).toLocaleDateString() : "—"}</div>
                </div>
                <Pill tone="green" dot>{a.status}</Pill>
                {full && <Button variant="ghost" onClick={() => onOpen(full)} className="ml-auto">Open</Button>}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

/* ---------------- Become a provider wizard ---------------- */
function ProviderWizard({ onClose, onPublished }: { onClose: () => void; onPublished: () => void }) {
  const [form, setForm] = useState({
    name: "", category: "rag_templates", summary: "", availability: "standard",
    deploy_target: "hetzner", compliance: "", exclusive: false,
  });
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(false);
  const [err, setErr] = useState<string>();

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((f) => ({ ...f, [k]: v })); }

  function body(publish: boolean) {
    return {
      name: form.name,
      category: form.category,
      summary: form.summary,
      availability: form.availability,
      deploy_target: form.deploy_target,
      compliance_tags: form.compliance.split(",").map((s) => s.trim()).filter(Boolean),
      exclusive: form.exclusive,
      publish,
    };
  }
  async function doPreview() {
    if (!form.name.trim()) { setErr("Give your asset a name first."); return; }
    setBusy(true); setErr(undefined);
    try { setPreview(await api<any>("/api/v1/marketplace/generate", { method: "POST", body: body(false) })); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }
  async function doPublish() {
    setBusy(true); setErr(undefined);
    try { await api("/api/v1/marketplace/generate", { method: "POST", body: body(true) }); setPublished(true); onPublished(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  const pl = preview?.listing;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={<span className="flex items-center gap-2"><Wand2 size={15} className="text-brand-400" /> Become a provider</span>}
      subtitle="Give us a few details — the marketplace auto-writes the listing and prices it for you."
      footer={
        published ? (
          <div className="ml-auto"><Button onClick={onClose}>Done</Button></div>
        ) : (
          <>
            {pl && <span className="text-[15px] font-semibold text-ink-50">{priceLabel(pl)}</span>}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" onClick={doPreview} loading={busy && !preview}><Sparkles size={14} /> {preview ? "Re-generate" : "Auto-generate & price"}</Button>
              {pl && <Button onClick={doPublish} loading={busy && !!preview}><Store size={14} /> Publish to marketplace</Button>}
            </div>
          </>
        )
      }
    >
      {published ? (
        <SuccessBox message={`"${form.name}" is live on the marketplace, fully packaged and priced. It now appears in the catalog.`} />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Vendor brief */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-ink-600">Your brief</div>
            <Field label="Asset name"><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Radiology Report Summariser" /></Field>
            <Field label="Category"><Select value={form.category} onChange={(v) => set("category", v)} options={Object.keys(CAT_LABELS).map((k) => ({ value: k, label: CAT_LABELS[k] }))} /></Field>
            <Field label="One-line summary"><textarea className="input min-h-[68px]" value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="What it does, in a sentence." /></Field>
            <Field label="Availability" hint="Drives the price — common is cheap, exclusive is priced to worth."><Select value={form.availability} onChange={(v) => set("availability", v)} options={AVAILABILITY} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Deploy target"><input className="input" value={form.deploy_target} onChange={(e) => set("deploy_target", e.target.value)} placeholder="hetzner" /></Field>
              <Field label="Compliance" hint="comma separated"><input className="input" value={form.compliance} onChange={(e) => set("compliance", e.target.value)} placeholder="HIPAA, SOC2" /></Field>
            </div>
            <label className="flex items-center gap-2 text-[12.5px] text-ink-200 cursor-pointer">
              <input type="checkbox" checked={form.exclusive} onChange={(e) => set("exclusive", e.target.checked)} className="accent-brand-500" />
              Veklom-exclusive (not available anywhere else)
            </label>
            {err && <ErrorBox message={err} />}
          </div>

          {/* Auto-generated preview */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-ink-600">Auto-generated listing</div>
            {!pl ? (
              <div className="card p-6 text-center text-ink-500 text-[12.5px] h-full grid place-items-center">
                {busy ? <Spinner /> : "Fill the brief, then hit Auto-generate. The marketplace will write the full listing and set a realistic price."}
              </div>
            ) : (
              <div className="card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-ink-50">{pl.name}</h3>
                  <RarityPill rarity={pl.rarity} exclusive={pl.exclusive} />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-[20px] font-semibold text-brand-400">{priceLabel(pl)}</span>
                </div>
                <p className="text-[11.5px] text-ink-400">{preview.pricing?.price_rationale}</p>
                <Badges badges={pl.badges} compliance={pl.compliance_tags} />
                <p className="text-[12px] text-ink-300 whitespace-pre-line line-clamp-4">{pl.long_description}</p>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-600 mb-1">Generated features</div>
                  <ul className="space-y-1">
                    {(pl.features || []).slice(0, 4).map((f: string, i: number) => <li key={i} className="text-[11.5px] text-ink-300 flex gap-1.5"><Check size={12} className="text-accent-green mt-0.5 shrink-0" />{f}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
