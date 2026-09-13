import React, { useState } from 'react';
import { ShieldAlert, Cpu, Server, Lock, Layers, Zap, CheckCircle2, ArrowRight, GitBranch, Key, FileText, Database, ShieldCheck, Code, RefreshCw, UserCheck, Activity } from 'lucide-react';

export const ThesisEvaluationView: React.FC = () => {
 const [activeStep, setActiveStep] = useState<number>(1);

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-200">
 {/* Title & System Architecture Banner */}
 <div className="bg-theme-surface p-6 sm:p-8 rounded-2xl border border-theme-border shadow-xl relative overflow-hidden">
 <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-theme-accent/5 rounded-full blur-3xl pointer-events-none"></div>
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
 <div className="space-y-2">
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-accent/10 border border-theme-border text-theme-accent text-xs font-mono font-medium">
 <Zap className="w-3.5 h-3.5" /> ARCHITECTURAL EVALUATION & SYSTEM SPECIFICATION
 </div>
 <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
 Veklom cAPI Control Plane: Technical Stress-Test & Blueprint
 </h2>
 <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
 Critically assessing the shift from ECC to EUC (Everything Universal Code) — wrapping raw supply into a universal cAPI control plane that works seamlessly across Codex, Ollama, Claude, Devin, Antigravity, Cursor, OpenCode, and any IDE or coding agent.
 </p>
 </div>

 <div className="grid grid-cols-2 gap-3 shrink-0 text-xs font-mono">
 <div className="bg-theme-surface p-3 rounded-lg border border-theme-border">
 <div className="text-slate-400">PGL Ledger</div>
 <div className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
 <CheckCircle2 className="w-3.5 h-3.5" /> GnomLedger Active
 </div>
 </div>
 <div className="bg-theme-surface p-3 rounded-lg border border-theme-border">
 <div className="text-slate-400">Ollama Local</div>
 <div className="text-theme-accent font-bold flex items-center gap-1.5 mt-0.5">
 <Cpu className="w-3.5 h-3.5" /> 100% First-Class
 </div>
 </div>
 </div>
 </div>

 {/* Step Selector Pills */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8 pt-6 border-t border-theme-border">
 {[
 { id: 1, title: 'Step 1: Thesis Stress-Test', sub: 'cAPI vs ECC Raw Supply & Bottlenecks' },
 { id: 2, title: 'Step 2: Harness Adapters', sub: 'Universal Execution & Memory Routing' },
 { id: 3, title: 'Step 3: Evidence & Governance', sub: 'EI Tokens & PGL Certificates' },
 { id: 4, title: 'Step 4: Frontend Architecture', sub: 'State Management, Auth & Real vs Demo' }
 ].map((s) => (
 <button
 key={s.id}
 onClick={() => setActiveStep(s.id)}
 className={`p-3.5 rounded-xl text-left transition-all border ${
 activeStep === s.id
 ? 'bg-theme-accent/10 border-theme-border text-white shadow-md'
 : 'bg-theme-surface border-theme-border text-slate-400 hover:bg-theme-surface hover:text-slate-200'
 }`}
 >
 <div className="text-2xs font-mono uppercase tracking-wider text-theme-accent mb-0.5">0{s.id}</div>
 <div className="text-xs font-bold">{s.title}</div>
 <div className="text-3xs text-slate-400 truncate mt-0.5">{s.sub}</div>
 </button>
 ))}
 </div>
 </div>

 {/* STEP 1: THESIS STRESS-TEST */}
 {activeStep === 1 && (
 <div className="space-y-6">
 <div className="bg-theme-surface p-6 rounded-2xl border border-theme-border space-y-6">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
 <ShieldAlert className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-white">Step 1: Deep Evaluation of cAPI wrapping EUC (Everything Universal Code) as &quot;Raw Supply&quot;</h3>
 <p className="text-xs text-slate-400 font-mono">From ECC to EUC: Universal Code Protocol for Devin, Antigravity, Codex, Ollama, Claude, Cursor & All IDEs</p>
 </div>
 </div>

 <p className="text-sm text-slate-300 leading-relaxed">
 <strong>The EUC Thesis:</strong> Our architecture is not an &quot;Everything Claude Code&quot; agent; it is <strong>EUC (Everything Universal Code)</strong>. Universal means that capability supply is not locked into Claude or any single vendor&apos;s agent loop. By wrapping capability supply inside Veklom cAPI, EUC creates a truly universal harness protocol that powers autonomous agents (Devin, Antigravity, Cursor, OpenCode) as well as local zero-trust engines (Ollama) and cloud model endpoints (Gemini, Claude, Codex) interchangeably.
 </p>

 {/* Detailed Bottlenecks Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-theme-surface p-5 rounded-xl border border-theme-border space-y-3">
 <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 font-mono">
 <ShieldAlert className="w-4 h-4" /> Major Technical Bottlenecks
 </h4>
 <div className="space-y-3 text-xs text-slate-300 font-sans">
 <div className="p-3 bg-theme-surface rounded-lg border border-theme-border space-y-1">
 <span className="font-bold text-amber-300 font-mono text-2xs block">1. Hook Lifecycle & Event Loop Divergence</span>
 <p className="text-2xs text-slate-400 leading-normal">
 ECC assumes Claude Code&apos;s native event loop (`PreToolUse`, `PostToolUse`, `OnUserPrompt`). Streaming Gemini API operates on request-response or WebSocket streams without persistent client-side hook handlers. Local Ollama nodes are stateless completion engines that lack background event dispatching entirely.
 </p>
 </div>

 <div className="p-3 bg-theme-surface rounded-lg border border-theme-border space-y-1">
 <span className="font-bold text-amber-300 font-mono text-2xs block">2. Memory State & Context Window Asymmetry</span>
 <p className="text-2xs text-slate-400 leading-normal">
 Claude Code maintains auto-memory buffers in local files (`.claude/memory`). Gemini features a 1M+ token context window allowing full-context dump, whereas local Ollama models (e.g., Llama-3 8B) operate with 8k–32k context constraints. Syncing state across these models causes severe memory truncation or cache invalidation.
 </p>
 </div>

 <div className="p-3 bg-theme-surface rounded-lg border border-theme-border space-y-1">
 <span className="font-bold text-amber-300 font-mono text-2xs block">3. Tool Call Serialization Incompatibility</span>
 <p className="text-2xs text-slate-400 leading-normal">
 Claude expects XML/JSON tool calls, Gemini requires OpenAPI function declarations, and local Ollama deployments frequently rely on system prompt instructions or JSON markdown blocks.
 </p>
 </div>
 </div>
 </div>

 <div className="bg-theme-surface p-5 rounded-xl border border-theme-border space-y-3">
 <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 font-mono">
 <CheckCircle2 className="w-4 h-4" /> cAPI Architectural Solution
 </h4>
 <div className="space-y-3 text-xs text-slate-300 font-sans">
 <div className="p-3 bg-theme-surface rounded-lg border border-theme-border space-y-1">
 <span className="font-bold text-emerald-300 font-mono text-2xs block">1. Decoupled Cappo State Buffer</span>
 <p className="text-2xs text-slate-400 leading-normal">
 cAPI lifts transient memory and hook execution out of the LLM process into a centralized `cappo-backend` state buffer backed by Redis and Lockerphycer secrets vault, guaranteeing state continuity across providers.
 </p>
 </div>

 <div className="p-3 bg-theme-surface rounded-lg border border-theme-border space-y-1">
 <span className="font-bold text-emerald-300 font-mono text-2xs block">2. Universal Schema & Parameter Normalization</span>
 <p className="text-2xs text-slate-400 leading-normal">
 cAPI parses `SKILL.md` declarations into standard JSON Schema primitives. Harness adapters dynamically translate parameters into the exact dialect expected by Ollama, Gemini, or Anthropic.
 </p>
 </div>

 <div className="p-3 bg-theme-surface rounded-lg border border-theme-border space-y-1">
 <span className="font-bold text-emerald-300 font-mono text-2xs block">3. Non-Repudiable EI Binding</span>
 <p className="text-2xs text-slate-400 leading-normal">
 Every skill invocation receives a cryptographic Execution Identity (`ei_v2_...`) token and is logged to GnomLedger PGL for complete non-repudiation, regardless of execution environment.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* STEP 2: HARNESS ADAPTERS ARCHITECTURE */}
 {activeStep === 2 && (
 <div className="space-y-6">
 <div className="bg-theme-surface p-6 rounded-2xl border border-theme-border space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-theme-accent/10 text-theme-accent border border-theme-border">
 <GitBranch className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-white">Step 2: Universal Harness Adapters Architecture</h3>
 <p className="text-xs text-slate-400 font-mono">How cAPI intercepts, translates, and routes payloads seamlessly</p>
 </div>
 </div>

 <p className="text-sm text-slate-300 leading-relaxed">
 The `veklom-harness-adapters` layer decouples capability definitions (`SKILL.md`) from execution model semantics. When an agent calls a skill, cAPI intercepts the query, translates tool parameters into the provider&apos;s format, injects Execution Identity tokens, and routes execution to Ollama, Gemini, Claude, Codex, Cursor, or OpenCode.
 </p>

 {/* Architecture Sequence Diagram Box */}
 <div className="bg-theme-surface p-5 rounded-xl border border-theme-border space-y-4">
 <h4 className="text-xs font-bold text-theme-accent uppercase tracking-wider font-mono">cAPI Interception & Payload Translation Sequence</h4>
 <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs font-mono">
 <div className="p-3 bg-theme-surface rounded-lg border border-theme-border">
 <div className="text-theme-accent font-bold">1. Requester / Agent</div>
 <div className="text-3xs text-slate-400 mt-1">Invokes skill via cAPI</div>
 </div>
 <div className="flex items-center justify-center text-slate-500">
 <ArrowRight className="w-4 h-4 hidden md:block" />
 </div>
 <div className="p-3 bg-theme-surface rounded-lg border border-theme-border">
 <div className="text-emerald-400 font-bold">2. cAPI Router & GPC</div>
 <div className="text-3xs text-slate-400 mt-1">RBAC check + Mint EI Token</div>
 </div>
 <div className="flex items-center justify-center text-slate-500">
 <ArrowRight className="w-4 h-4 hidden md:block" />
 </div>
 <div className="p-3 bg-theme-surface rounded-lg border border-theme-border">
 <div className="text-theme-accent font-bold">3. Target Harness</div>
 <div className="text-3xs text-slate-400 mt-1">Ollama Local / Gemini / Claude</div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
 <div className="p-4 bg-theme-surface rounded-xl border border-theme-border space-y-2">
 <div className="text-emerald-400 font-bold">Ollama Local (100% First-Class)</div>
 <p className="text-slate-400 text-2xs leading-normal">
 Connects directly to local daemon on port 11434 (`/api/generate`). Zero network outbound, 100% data sovereignty, zero token cost.
 </p>
 </div>
 <div className="p-4 bg-theme-surface rounded-xl border border-theme-border space-y-2">
 <div className="text-theme-accent font-bold">Gemini Server-Side SDK</div>
 <p className="text-slate-400 text-2xs leading-normal">
 Uses `@google/genai` server-side SDK. API keys stored strictly in server process.env, never exposed to client browser.
 </p>
 </div>
 <div className="p-4 bg-theme-surface rounded-xl border border-theme-border space-y-2">
 <div className="text-theme-accent font-bold">Claude Code / Codex / Cursor</div>
 <p className="text-slate-400 text-2xs leading-normal">
 Universal cAPI payload wrapping. Translates SKILL.md specs and ECC hooks into compliant execution responses.
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* STEP 3: EVIDENCE & GOVERNANCE LAYER */}
 {activeStep === 3 && (
 <div className="space-y-6">
 <div className="bg-theme-surface p-6 rounded-2xl border border-theme-border space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
 <Database className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-white">Step 3: Evidence & Cryptographic Governance Layer</h3>
 <p className="text-xs text-slate-400 font-mono">Execution Identity (EI), PGL Certificates & VNP Telemetry</p>
 </div>
 </div>

 <p className="text-sm text-slate-300 leading-relaxed">
 `veklom-capability-evidence` solves the core enterprise deficit of open-source frameworks like ECC: the lack of undeniable, non-repudiable audit logs. By generating a cryptographic Execution Identity (EI) token for every request and minting a Proof-of-Graph Ledger (PGL) block via GnomLedger, actions are mathematically bound to the original human requester (`reprewindai@gmail.com`).
 </p>

 <div className="bg-theme-surface p-4 rounded-xl border border-theme-border space-y-3 font-mono text-xs">
 <div className="text-slate-300 font-bold flex items-center justify-between">
 <span>PGL Cryptographic Certificate Formula</span>
 <span className="text-emerald-400 text-2xs">GnomLedger Engine</span>
 </div>
 <div className="p-3 bg-theme-surface rounded-lg text-emerald-300 text-2xs overflow-x-auto border border-theme-border">
 LeafHash = SHA256(EI_Token + HumanRequester + SkillID + OutputPayload + Timestamp)<br />
 MerkleRoot = SHA256(PrevBlockHash + LeafHash)<br />
 NonRepudiableHash = SHA256(&quot;PGL_CERT&quot; + BlockIndex + MerkleRoot + VerifierSig)
 </div>
 </div>
 </div>
 </div>
 )}

 {/* STEP 4: FRONTEND ARCHITECTURE & DEMO VS REAL SEPARATION */}
 {activeStep === 4 && (
 <div className="space-y-6">
 <div className="bg-theme-surface p-6 rounded-2xl border border-theme-border space-y-6">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-theme-accent/10 text-theme-accent border border-theme-border">
 <Server className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-white">Step 4: Frontend Architecture for Unified Developer Portal</h3>
 <p className="text-xs text-slate-400 font-mono">State Management, Human & M2M Auth Protocols, and Production vs Demo Separation</p>
 </div>
 </div>

 {/* Architecture Cards Grid */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
 {/* State Management */}
 <div className="bg-theme-surface p-4 rounded-xl border border-theme-border space-y-3">
 <div className="flex items-center gap-2 text-theme-accent font-bold font-mono text-xs border-b border-theme-border pb-2">
 <Layers className="w-4 h-4" /> 1. State Management Architecture
 </div>
 <div className="space-y-2 text-2xs text-slate-300">
 <p>
 <strong className="text-theme-accent/70 font-mono">Preferred Choice:</strong> Slice-based state management (Zustand / React Context with custom hooks).
 </p>
 <ul className="list-disc pl-4 space-y-1 text-slate-400">
 <li><strong className="text-slate-200">uiSlice:</strong> Active tab, modal visibility, quick command state.</li>
 <li><strong className="text-slate-200">telemetrySlice:</strong> Real-time VNP node health, TTFT, and stream buffers.</li>
 <li><strong className="text-slate-200">skillRegistrySlice:</strong> Seeded 60+ ECC skills, AST security scan audit results.</li>
 <li><strong className="text-slate-200">authSlice:</strong> EI tokens, RBAC roles (`admin`, `architect`, `auditor`, `operator`), and M2M credentials.</li>
 </ul>
 </div>
 </div>

 {/* Authentication Protocols */}
 <div className="bg-theme-surface p-4 rounded-xl border border-theme-border space-y-3">
 <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-xs border-b border-theme-border pb-2">
 <Lock className="w-4 h-4" /> 2. Dual Auth Protocols
 </div>
 <div className="space-y-2 text-2xs text-slate-300">
 <div>
 <strong className="text-emerald-300 font-mono block mb-0.5">Human User Authentication:</strong>
 <p className="text-slate-400">
 OAuth 2.0 + OpenID Connect (OIDC) with PKCE (Proof Key for Code Exchange) flow. Issues short-lived JWT bearer tokens bound to user sessions.
 </p>
 </div>
 <div>
 <strong className="text-emerald-300 font-mono block mb-0.5">Machine-to-Machine (M2M) Auth:</strong>
 <p className="text-slate-400">
 Mutual TLS (mTLS) + HMAC-SHA256 signed Service Account API Keys (`veklom_sec_...`). Injects non-repudiable Execution Identity (EI) headers on all REST/cAPI endpoints.
 </p>
 </div>
 </div>
 </div>

 {/* Demo vs Production Separation */}
 <div className="bg-theme-surface p-4 rounded-xl border border-theme-border space-y-3">
 <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-xs border-b border-theme-border pb-2">
 <ShieldCheck className="w-4 h-4" /> 3. Real vs Demo Separation
 </div>
 <div className="space-y-2 text-2xs text-slate-300">
 <p>
 <strong className="text-amber-300 font-mono">Strict Delineation Rules:</strong>
 </p>
 <ul className="list-disc pl-4 space-y-1 text-slate-400">
 <li>
 <strong className="text-emerald-400 font-mono">PROD_LIVE:</strong> Connected to real Express backend, live Ollama daemon, real Google GenAI SDK, real RepoGate AST scanner, real X402 lease engine, and real PGL Merkle block generation.
 </li>
 <li>
 <strong className="text-amber-400 font-mono">DEMO_SANDBOX:</strong> Isolated client simulation with clear visual warning badges and synthetic log indicators.
 </li>
 <li>
 <strong className="text-slate-200">UI Badges:</strong> Every API call response explicitly highlights execution type (`REAL_SERVER_SIDE_API` vs `DEMO_SIMULATION`).
 </li>
 </ul>
 </div>
 </div>
 </div>

 {/* 100% Transparent Reality & Truthfulness Matrix */}
 <div className="bg-theme-surface p-5 rounded-xl border border-theme-border space-y-4">
 <div className="flex items-center justify-between border-b border-theme-border pb-3">
 <div>
 <h4 className="font-bold text-sm text-white flex items-center gap-2">
 <ShieldCheck className="w-4.5 h-4.5 text-theme-accent" /> 100% Transparent Veklom System Reality Matrix
 </h4>
 <p className="text-3xs text-slate-400 font-mono">
 Absolute architectural honesty: Delineating active production code, client demo sandboxes, and future infrastructure.
 </p>
 </div>
 <span className="px-2.5 py-1 rounded bg-theme-accent/10 border border-theme-border text-theme-accent/70 font-mono text-3xs font-bold">
 VERIFIED TRUTHFULNESS AUDIT
 </span>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left font-mono text-xs">
 <thead>
 <tr className="text-3xs text-slate-400 border-b border-theme-border">
 <th className="pb-2 font-semibold">Subsystem / Feature</th>
 <th className="pb-2 font-semibold">Classification</th>
 <th className="pb-2 font-semibold">Technical Implementation in Codebase</th>
 <th className="pb-2 font-semibold">Transparency Guarantee</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800/60 text-2xs">
 <tr className="hover:bg-theme-surface">
 <td className="py-2.5 text-white font-bold">Express Server API & Routes</td>
 <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-3xs">100% REAL PRODUCTION</span></td>
 <td className="py-2.5 text-slate-300">Live `server.ts` Express entrypoint serving `/api/v1/capi/invoke`, `/api/v1/x402/*`, `/api/v1/abide/plan`, and `/api/v1/repogate/scan`.</td>
 <td className="py-2.5 text-slate-400">Node process listening on port 3000 in Cloud Run container.</td>
 </tr>
 <tr className="hover:bg-theme-surface">
 <td className="py-2.5 text-white font-bold">cAPI Harness Router</td>
 <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-3xs">100% REAL PRODUCTION</span></td>
 <td className="py-2.5 text-slate-300">`src/server/capi-engine.ts` handles Ollama REST, Google GenAI SDK, Anthropic Claude API, and OpenAI endpoint routing.</td>
 <td className="py-2.5 text-slate-400">Executes server-side API calls when credentials are supplied.</td>
 </tr>
 <tr className="hover:bg-theme-surface">
 <td className="py-2.5 text-white font-bold">Quebec Law 25 PII Enforcer</td>
 <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-3xs">100% REAL PRODUCTION</span></td>
 <td className="py-2.5 text-slate-300">Automatically inspects payload PII tags and overrides requested cloud harness to 100% Local Baremetal Ollama node.</td>
 <td className="py-2.5 text-slate-400">Zero cross-border telemetry leak & CLOUD Act shielding.</td>
 </tr>
 <tr className="hover:bg-theme-surface">
 <td className="py-2.5 text-white font-bold">X402 Microtransaction Engine</td>
 <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-3xs">100% REAL PRODUCTION</span></td>
 <td className="py-2.5 text-slate-300">`src/server/x402-engine.ts` computes logarithmic bonding curve pricing `P(t)`, issues RAR ephemeral leases, and enforces eviction.</td>
 <td className="py-2.5 text-slate-400">Live active lease decaying store with TTL countdowns.</td>
 </tr>
 <tr className="hover:bg-theme-surface">
 <td className="py-2.5 text-white font-bold">RepoGate AST Security Scanner</td>
 <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-3xs">100% REAL PRODUCTION</span></td>
 <td className="py-2.5 text-slate-300">`src/server/repogate-scanner.ts` executes static analysis for `eval`, dynamic imports, child_process execution, and secrets leaks.</td>
 <td className="py-2.5 text-slate-400">Scores skills 0-100 and rejects malicious payloads with AST report.</td>
 </tr>
 <tr className="hover:bg-theme-surface">
 <td className="py-2.5 text-white font-bold">GnomLedger PGL Proofs</td>
 <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-3xs">100% REAL PRODUCTION</span></td>
 <td className="py-2.5 text-slate-300">`src/server/gnomledger-pgl.ts` computes real SHA-256 Merkle tree leaf hashes, roots, and Ed25519-style certificate signatures.</td>
 <td className="py-2.5 text-slate-400">Mathematically verifiable certificates on `/api/v1/pgl/verify`.</td>
 </tr>
 <tr className="hover:bg-theme-surface">
 <td className="py-2.5 text-amber-300 font-bold">Demo Sandbox Mode</td>
 <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-3xs">SIMULATED SANDBOX</span></td>
 <td className="py-2.5 text-slate-300">Client-side interactive sandbox mode when user explicitly selects `mode: 'demo'` or when live model keys are unset.</td>
 <td className="py-2.5 text-slate-400">Clearly labeled with `DEMO_SANDBOX_SIMULATION` badge.</td>
 </tr>
 <tr className="hover:bg-theme-surface">
 <td className="py-2.5 text-theme-accent/70 font-bold">On-Chain Solana Settlement</td>
 <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-theme-accent/20 text-theme-accent font-bold text-3xs">ASPIRATIONAL / FUTURE</span></td>
 <td className="py-2.5 text-slate-300">X402 HTTP 402 offer headers generate Solana Pay URIs (`solana:sol_veklom_...`); on-chain RPC validation is simulated via payment proof verification.</td>
 <td className="py-2.5 text-slate-400">Targeting mainnet deployment with Solana 400ms finality.</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Canonical Repos & Infrastructure Summary */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
 <div className="bg-theme-surface p-4 rounded-xl border border-theme-border space-y-2">
 <div className="text-theme-accent font-bold flex items-center gap-2">
 <Key className="w-4 h-4" /> Canonical Backend Ecosystem
 </div>
 <ul className="text-slate-300 space-y-1.5 text-2xs">
 <li><span className="text-theme-accent font-bold">veklom-byos-backend:</span> Bring Your Own Storage / Services</li>
 <li><span className="text-theme-accent font-bold">cappo-backend:</span> Agent Execution Control Plane</li>
 <li><span className="text-theme-accent font-bold">gnomledger:</span> Proof-of-Graph Ledger (PGL)</li>
 <li><span className="text-theme-accent font-bold">lockerphycer:</span> Cryptographic Secrets Vault</li>
 <li><span className="text-theme-accent font-bold">uacpv3 (GPC):</span> General Policy Controller (RBAC)</li>
 <li><span className="text-theme-accent font-bold">cAPI:</span> Unified MCP & API Query Engine</li>
 <li><span className="text-theme-accent font-bold">veklom-vnp:</span> Veklom Nexus Protocol Telemetry</li>
 <li><span className="text-theme-accent font-bold">real-repo-gate-for-veklom:</span> Security Static Scanner</li>
 <li><span className="text-theme-accent font-bold">abide:</span> Hierarchical Abstract Plan Controller</li>
 </ul>
 </div>

 <div className="bg-theme-surface p-4 rounded-xl border border-theme-border space-y-2">
 <div className="text-emerald-400 font-bold flex items-center gap-2">
 <Lock className="w-4 h-4" /> Hetzner & Coolify Global Deployment
 </div>
 <p className="text-slate-300 text-2xs leading-relaxed">
 Targeting Hetzner Cloud dedicated nodes managed via Coolify container orchestrator. Ensures low microsecond latency, explicit regional data sovereignty, container health monitoring, and automated failover.
 </p>
 <div className="pt-2">
 <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-3xs">
 ENCRYPTION: AES-256-GCM AT REST | TLS 1.3 IN TRANSIT
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

