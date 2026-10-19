"use client";

import React, { useState, useMemo } from "react";
import {
  Cable,
  Check,
  ChevronDown,
  ExternalLink,
  Filter,
  Plus,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  X,
  Laptop,
  Cloud,
  FileCode,
  Layers,
  ArrowRight
} from "lucide-react";

export interface ConnectorItem {
  id: string;
  name: string;
  category: "Productivity" | "Engineering" | "Marketing" | "Design" | "Sovereign M365" | "Substrate";
  provider: string;
  type: "Native Sovereign MCP" | "Web Plugin" | "Custom MCP";
  connected: boolean;
  toolsCount: number;
  description: string;
  iconLetter: string;
  iconBg: string;
  iconColor: string;
  sovereignLocal?: boolean;
}

const DEFAULT_CONNECTORS: ConnectorItem[] = [
  // Native Sovereign Microsoft Office 365 (Discovered directly on Windows host)
  {
    id: "teams",
    name: "microsoft teams",
    category: "Sovereign M365",
    provider: "Office 365 Sovereign MCP (Local Windows MSAL)",
    type: "Native Sovereign MCP",
    connected: true,
    toolsCount: 6,
    description: "Governed Teams chat, channel messaging, and thread dispatch. Runs 100% locally with zero cloud auth leak.",
    iconLetter: "T",
    iconBg: "bg-indigo-900/40 border-indigo-500/30",
    iconColor: "text-indigo-400",
    sovereignLocal: true
  },
  {
    id: "onedrive",
    name: "microsoft onedrive",
    category: "Sovereign M365",
    provider: "Office 365 Sovereign MCP (Local Windows MSAL)",
    type: "Native Sovereign MCP",
    connected: true,
    toolsCount: 4,
    description: "Sovereign file synchronization, secure drive indexing, and readback. Bounded by single-use read/write permits.",
    iconLetter: "O",
    iconBg: "bg-blue-900/40 border-blue-500/30",
    iconColor: "text-blue-400",
    sovereignLocal: true
  },
  {
    id: "outlook",
    name: "microsoft outlook",
    category: "Sovereign M365",
    provider: "Office 365 Sovereign MCP (Local Windows MSAL)",
    type: "Native Sovereign MCP",
    connected: true,
    toolsCount: 8,
    description: "Calendar scheduling, email indexing, and verified outbound transmission with fail-closed recipient locking.",
    iconLetter: "M",
    iconBg: "bg-sky-900/40 border-sky-500/30",
    iconColor: "text-sky-400",
    sovereignLocal: true
  },
  {
    id: "github",
    name: "github native",
    category: "Engineering",
    provider: "GitHub MCP Server (Native Binary github-mcp-server.exe)",
    type: "Native Sovereign MCP",
    connected: true,
    toolsCount: 14,
    description: "Native Windows binary for PR reviews, issue verification, commit signing, and repo drift detection.",
    iconLetter: "G",
    iconBg: "bg-slate-800 border-slate-700",
    iconColor: "text-white",
    sovereignLocal: true
  },
  // Enterprise Connectors from Claude Plugin Directory
  {
    id: "notion",
    name: "notion",
    category: "Productivity",
    provider: "Provided by the Design & Productivity plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 12,
    description: "Enterprise workspace documentation, structured database sync, and project requirements syncing.",
    iconLetter: "N",
    iconBg: "bg-slate-800 border-slate-700",
    iconColor: "text-slate-200"
  },
  {
    id: "slack",
    name: "slack",
    category: "Productivity",
    provider: "Provided by the Engineering & Productivity plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 9,
    description: "Incident coordination, verified operator notification webhooks, and channel auditing.",
    iconLetter: "S",
    iconBg: "bg-amber-900/40 border-amber-500/30",
    iconColor: "text-amber-400"
  },
  {
    id: "linear",
    name: "linear",
    category: "Engineering",
    provider: "Provided by the Engineering plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 10,
    description: "Engineering issue lifecycle tracking, pull request linkage, and sprint execution boundaries.",
    iconLetter: "L",
    iconBg: "bg-purple-900/40 border-purple-500/30",
    iconColor: "text-purple-400"
  },
  {
    id: "pagerduty",
    name: "pagerduty",
    category: "Engineering",
    provider: "Provided by the Engineering plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 7,
    description: "High-urgency escalation engine, on-call paging, and cryptographic incident receipts.",
    iconLetter: "P",
    iconBg: "bg-emerald-900/40 border-emerald-500/30",
    iconColor: "text-emerald-400"
  },
  {
    id: "google-calendar",
    name: "google calendar",
    category: "Productivity",
    provider: "Provided by the Productivity plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 6,
    description: "Enterprise calendar synchronization, meeting scheduling, and time-block reservation.",
    iconLetter: "C",
    iconBg: "bg-blue-900/40 border-blue-500/30",
    iconColor: "text-blue-300"
  },
  {
    id: "gmail",
    name: "gmail",
    category: "Productivity",
    provider: "Provided by the Engineering & Marketing plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 5,
    description: "Executive report delivery, inbound contract parsing, and audit notification.",
    iconLetter: "M",
    iconBg: "bg-red-900/40 border-red-500/30",
    iconColor: "text-red-400"
  },
  {
    id: "upstash",
    name: "upstash",
    category: "Substrate",
    provider: "Provided by the Upstash Redis plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 6,
    description: "Serverless Redis & Vector store, low-latency token caching, and monotonic state locks.",
    iconLetter: "U",
    iconBg: "bg-teal-900/40 border-teal-500/30",
    iconColor: "text-teal-400"
  },
  {
    id: "similarweb",
    name: "similarweb",
    category: "Marketing",
    provider: "Provided by the Marketing plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 4,
    description: "Domain traffic intelligence, competitor analysis, and audience discovery indexing.",
    iconLetter: "W",
    iconBg: "bg-orange-900/40 border-orange-500/30",
    iconColor: "text-orange-400"
  },
  {
    id: "supermetrics",
    name: "supermetrics",
    category: "Marketing",
    provider: "Provided by the Marketing plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 8,
    description: "Unified cross-platform marketing telemetry, revenue reporting, and spend analytics.",
    iconLetter: "S",
    iconBg: "bg-rose-900/40 border-rose-500/30",
    iconColor: "text-rose-400"
  },
  {
    id: "klaviyo",
    name: "klaviyo",
    category: "Marketing",
    provider: "Provided by the Marketing plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 6,
    description: "Governed audience segmentation, transactional SMS/email dispatch, and customer metrics.",
    iconLetter: "K",
    iconBg: "bg-cyan-900/40 border-cyan-500/30",
    iconColor: "text-cyan-400"
  },
  {
    id: "intercom",
    name: "intercom",
    category: "Design",
    provider: "Provided by the Design plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 5,
    description: "Customer conversational support, ticket routing, and feedback ledger synchronization.",
    iconLetter: "I",
    iconBg: "bg-blue-900/40 border-blue-500/30",
    iconColor: "text-blue-400"
  },
  {
    id: "figma",
    name: "figma",
    category: "Design",
    provider: "Provided by the Design plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 7,
    description: "Design system tokens, component inspection, and automated layout attestation.",
    iconLetter: "F",
    iconBg: "bg-violet-900/40 border-violet-500/30",
    iconColor: "text-violet-400"
  },
  {
    id: "monday",
    name: "monday",
    category: "Productivity",
    provider: "Provided by the Productivity plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 6,
    description: "Team roadmaps, board item status transitions, and timeline milestone checks.",
    iconLetter: "M",
    iconBg: "bg-yellow-900/40 border-yellow-500/30",
    iconColor: "text-yellow-400"
  },
  {
    id: "datadog",
    name: "datadog",
    category: "Engineering",
    provider: "Provided by the Engineering plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 9,
    description: "Container infrastructure telemetry, distributed tracing, and SLA threshold monitoring.",
    iconLetter: "D",
    iconBg: "bg-purple-900/40 border-purple-500/30",
    iconColor: "text-purple-300"
  },
  {
    id: "cloudflare",
    name: "cloudflare",
    category: "Substrate",
    provider: "Provided by the Cloudflare plugin",
    type: "Web Plugin",
    connected: true,
    toolsCount: 11,
    description: "Edge worker routing, DNS zone configuration, and DDoS mitigation policy enforcement.",
    iconLetter: "C",
    iconBg: "bg-amber-900/40 border-amber-500/30",
    iconColor: "text-amber-300"
  }
];

// Sample of the 180 registered MCP tools matching the user's uploaded images
const REGISTERED_MCP_TOOLS = [
  { name: "ccd_session · dismiss_session", cost: 420, category: "Session Management" },
  { name: "ccd_session · spawn_task", cost: 990, category: "Task Execution" },
  { name: "Claude Docs · Make document", cost: 150, category: "Documentation" },
  { name: "Claude Docs · Create document", cost: 235, category: "Documentation" },
  { name: "Claude Docs · Delete from document", cost: 316, category: "Documentation" },
  { name: "Claude Docs · Export", cost: 298, category: "Documentation" },
  { name: "Claude Docs · Guide", cost: 191, category: "Documentation" },
  { name: "Claude Docs · Read content", cost: 164, category: "Documentation" },
  { name: "teams · teams_send_chat_message", cost: 380, category: "Microsoft Teams" },
  { name: "teams · teams_send_channel_message", cost: 450, category: "Microsoft Teams" },
  { name: "teams · teams_list_teams", cost: 120, category: "Microsoft Teams" },
  { name: "onedrive · onedrive_file_read", cost: 210, category: "OneDrive" },
  { name: "onedrive · onedrive_file_upload", cost: 540, category: "OneDrive" },
  { name: "outlook · outlook_send_mail", cost: 620, category: "Outlook" },
  { name: "outlook · outlook_calendar_event", cost: 310, category: "Outlook" },
  { name: "github · repo_scan_gate", cost: 280, category: "GitHub" },
  { name: "github · pr_review_audit", cost: 510, category: "GitHub" },
  { name: "slack · post_channel_message", cost: 340, category: "Slack" },
  { name: "linear · issue_create_governed", cost: 260, category: "Linear" },
  { name: "notion · page_append_record", cost: 290, category: "Notion" }
];

export function ConnectorsHub() {
  const [activeTab, setActiveTab] = useState<"yours" | "discover">("yours");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [connectors, setConnectors] = useState<ConnectorItem[]>(DEFAULT_CONNECTORS);
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // New Custom MCP form state
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<"stdio" | "sse">("stdio");
  const [customCommand, setCustomCommand] = useState("");
  const [customCategory, setCustomCategory] = useState<ConnectorItem["category"]>("Productivity");

  // Filtering
  const filteredConnectors = useMemo(() => {
    return connectors.filter((item) => {
      if (activeTab === "yours" && !item.connected) return false;
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.provider.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [connectors, activeTab, categoryFilter, searchQuery]);

  function handleToggleConnect(id: string) {
    setConnectors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, connected: !c.connected } : c))
    );
  }

  function handleAddCustomMcp(e: React.FormEvent) {
    e.preventDefault();
    if (!customName.trim() || !customCommand.trim()) return;

    const newConnector: ConnectorItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim().toLowerCase(),
      category: customCategory,
      provider: customType === "stdio" ? `Custom Stdio MCP (${customCommand})` : `Custom SSE Endpoint (${customCommand})`,
      type: "Custom MCP",
      connected: true,
      toolsCount: 5,
      description: `User-defined sovereign MCP server. Governed by Veklom Law 0 boundary with single-use lease allocation.`,
      iconLetter: customName.trim().charAt(0).toUpperCase(),
      iconBg: "bg-emerald-900/40 border-emerald-500/30",
      iconColor: "text-emerald-400",
      sovereignLocal: true
    };

    setConnectors((prev) => [newConnector, ...prev]);
    setCustomName("");
    setCustomCommand("");
    setAddModalOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* 1. SOVEREIGN POST-CLOUD DOCTRINE BANNER */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#080d1a] via-[#09152b] to-[#080d1a] p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-cyan-300">
                Sovereign Post-Cloud Connectors & MCP Hub
              </h2>
              <span className="rounded bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                True Modular · Zero Lock-In
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Connect the tools you already use across Windows, Linux, Microsoft 365, Google Cloud, and Azure.
              In Veklom, <strong className="text-white">you retain 100% consequence authority</strong>: no ambient token billing, no surprise invoices, and no background data leaks. Every tool operates strictly under an explicit, single-use lease.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setToolsDrawerOpen(!toolsDrawerOpen)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 text-xs font-mono text-slate-200 transition shadow-sm"
            >
              <Terminal size={14} className="text-cyan-400" />
              <span>MCP Tools (180 Active)</span>
            </button>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition shadow-md"
            >
              <Plus size={14} />
              <span>Add Custom MCP</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MCP TOOLS ACTIVE DRAWER (Annotation matching media_1792414893875_1854f79b.png) */}
      {toolsDrawerOpen && (
        <div className="rounded-2xl border border-slate-800 bg-[#060a14] p-5 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-200">
                Registered MCP Tools (180)
              </span>
              <span className="text-slate-500 text-xs">· Active in current session</span>
            </div>
            <button
              type="button"
              onClick={() => setToolsDrawerOpen(false)}
              className="text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-h-72 overflow-y-auto pr-1">
            {REGISTERED_MCP_TOOLS.map((tool, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-slate-800/90 bg-[#0d1627] px-3 py-2 text-xs font-mono"
              >
                <div className="truncate pr-2">
                  <div className="text-slate-200 truncate">{tool.name}</div>
                  <div className="text-[10px] text-slate-500">{tool.category}</div>
                </div>
                <span className="flex-shrink-0 text-slate-400 text-[11px]">
                  {tool.cost}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MAIN CONNECTORS MODAL / SURFACE (Matching media_1792415011204_4da9171b.png) */}
      <div className="rounded-2xl border border-slate-800 bg-[#080d1a] shadow-2xl overflow-hidden">
        {/* Header Tabs & Search Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-4 bg-[#0a1020]/90">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white tracking-tight">Connectors</h1>

            {/* Tab Pill Toggle (Yours / Discover) */}
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900/80 p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("yours")}
                className={`rounded-lg px-3.5 py-1 text-xs font-medium transition ${
                  activeTab === "yours"
                    ? "bg-slate-700 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Yours ({connectors.filter((c) => c.connected).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("discover")}
                className={`rounded-lg px-3.5 py-1 text-xs font-medium transition ${
                  activeTab === "discover"
                    ? "bg-slate-700 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Discover (3,605)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
            {/* Search Input */}
            <div className="relative w-full max-w-xs">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search connectors..."
                className="w-full rounded-xl border border-slate-700/80 bg-[#0d1627] pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-700/80 bg-[#0d1627] px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500 transition"
            >
              <option value="All">All Categories</option>
              <option value="Sovereign M365">Sovereign M365</option>
              <option value="Productivity">Productivity</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
              <option value="Substrate">Substrate</option>
            </select>

            {/* + Add v Button */}
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition"
            >
              <Plus size={14} />
              <span>Add</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Connectors List Items */}
        <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
          {filteredConnectors.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Cable size={32} className="mx-auto text-slate-600" />
              <p className="text-sm">No connectors match your current search.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("All");
                }}
                className="text-xs text-cyan-400 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredConnectors.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-900/40 transition group"
              >
                {/* Left: Icon & Names */}
                <div className="flex items-center gap-4 min-w-0 pr-4">
                  {/* Brand letter badge */}
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border font-bold text-sm ${item.iconBg} ${item.iconColor}`}
                  >
                    {item.iconLetter}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100 capitalize">
                        {item.name}
                      </span>
                      {item.sovereignLocal && (
                        <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.2 text-[9px] font-mono text-indigo-300">
                          <Laptop size={10} /> Local Sovereign
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {item.provider}
                    </p>
                  </div>
                </div>

                {/* Right: Type Badge & Connection Status */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">
                      {item.type.includes("Sovereign") ? "Native" : "Web"}
                    </span>
                    <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                      {item.type.includes("Sovereign") ? "Sovereign" : "Plugin"}
                    </span>
                  </div>

                  <div className="w-36 text-right">
                    {item.connected ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Connects in sessions</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleConnect(item.id)}
                        className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3.5 py-1 text-xs font-semibold text-slate-950 transition shadow-sm"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. ADD CUSTOM MCP MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0a1020] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-cyan-400" />
                <h3 className="text-base font-semibold text-white">Add Custom MCP Server</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCustomMcp} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Connector Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. postgres-local or my-internal-api"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-[#0d1627] px-3.5 py-2 text-slate-200 outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Transport Type</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as "stdio" | "sse")}
                    className="w-full rounded-xl border border-slate-700 bg-[#0d1627] px-3.5 py-2 text-slate-200 outline-none focus:border-cyan-500 transition"
                  >
                    <option value="stdio">Stdio Command (Local Binary / npx)</option>
                    <option value="sse">Remote SSE Endpoint (URL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as ConnectorItem["category"])}
                    className="w-full rounded-xl border border-slate-700 bg-[#0d1627] px-3.5 py-2 text-slate-200 outline-none focus:border-cyan-500 transition"
                  >
                    <option value="Productivity">Productivity</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Design">Design</option>
                    <option value="Substrate">Substrate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {customType === "stdio" ? "Execution Command & Arguments" : "Server SSE URL"}
                </label>
                <input
                  type="text"
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  placeholder={
                    customType === "stdio"
                      ? "npx -y @modelcontextprotocol/server-postgres postgresql://..."
                      : "https://mcp.internal.enterprise.com/sse"
                  }
                  required
                  className="w-full font-mono text-xs rounded-xl border border-slate-700 bg-[#0d1627] px-3.5 py-2 text-cyan-300 outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-[11px] text-cyan-200 leading-relaxed">
                <strong>Sovereign Consequence Invariant:</strong> Adding an MCP server imports its tool definitions into the catalog. It grants <em>zero ambient execution authority</em>. Any consequential mutations require an explicit, single-use `CapabilityLease`.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 font-semibold text-slate-950 transition shadow-md"
                >
                  Save & Mount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
