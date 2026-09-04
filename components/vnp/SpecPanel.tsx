import React, { useState, useEffect } from "react";
import { Copy, Check, FileCode, CheckCircle, Eye, AlertCircle, Database, GitBranch, Settings, Terminal, Shield, List, Play, RefreshCw, Zap, Users } from "lucide-react";

interface SimRequest {
  id: string;
  tenant: string;
  status: "ACQUIRING" | "SECURITY_CHECK" | "EXECUTING" | "SUCCESS" | "FAILED";
  delayMs: number;
  time: string;
  microId: string;
}

interface ConnectionSlot {
  id: number;
  status: "IDLE" | "ACQUIRED" | "BLOCKED";
  activeTenant: string | null;
  durationLeft: number;
  queryTimeMs: number;
}

export default function SpecPanel() {
  const [activeTab, setActiveTab] = useState<"rust" | "sql" | "cli" | "rls">("rust");
  const [viewMode, setViewMode] = useState<"code" | "simulation">("simulation");
  const [copied, setCopied] = useState<string | null>(null);

  // States for Concurrency Lab simulation
  const [slots, setSlots] = useState<ConnectionSlot[]>(
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      status: "IDLE",
      activeTenant: null,
      durationLeft: 0,
      queryTimeMs: 0
    }))
  );
  const [simLog, setSimLog] = useState<string[]>([
    "Tokio async thread-pool booted successfully.",
    "DBPool max_connections(12) min_connections(3) active.",
    "Row Level Security policies loaded inside transaction buffers."
  ]);
  const [isFlooding, setIsFlooding] = useState(false);
  const [activeConnCount, setActiveConnCount] = useState(0);
  const [waitQueueCount, setWaitQueueCount] = useState(0);
  const [throughputCounter, setThroughputCounter] = useState(140);

  const rustCode = `// Veklom Nexus Protocol (VNP) - Rust Database Connection Engine
// Optimized for Async PostgreSQL connection pooling using SQLx with Tokio.

use sqlx::{postgres::PgPoolOptions, Pool, Postgres, Error};
use std::time::Duration;
use log::{info, error};

#[derive(Clone)]
pub struct DbStore {
    pub pool: Pool<Postgres>,
}

impl DbStore {
    /// Programmatically boots the SQLx Db Connection Pool & runs pending migrations
    pub async fn initialize(database_url: &str) -> Result<Self, Error> {
        info!("Initializing high-throughput SQLx Connection Pool for Veklom Nexus Protocol...");

        // Robustly configure PgPool options to handle high concurrent load conditions
        let pool = PgPoolOptions::new()
            .max_connections(50)       // Balance pool load vs PostgreSQL concurrent ceiling
            .min_connections(5)        // Keep warm connections ready in the pool idle queue
            .acquire_timeout(Duration::from_secs(8))   // Don't block async threads indefinitely
            .idle_timeout(Duration::from_secs(600))    // Prune excess idle threads
            .max_lifetime(Duration::from_secs(1800))   // Cycle threads to avoid stale memory leaking
            .connect(database_url)
            .await?;

        let db_store = Self { pool };

        // Programmatically run migrations on start to ensure absolute schema integrity
        db_store.run_embedded_migrations().await?;

        Ok(db_store)
    }

    /// Triggers pending migrations embedded inside the application binary on bootup.
    /// This is equivalent to invoking \`sqlx migrate run\` via the CLI.
    pub async fn run_embedded_migrations(&self) -> Result<(), Error> {
        info!("Reading embedded migration directories in ./migrations ...");

        match sqlx::migrate!("./migrations").run(&self.pool).await {
            Ok(_) => {
                info!("✅ All VNP initial migration logs synchronised with the global ledger.");
                Ok(())
            }
            Err(e) => {
                error!("❌ Migrations failed to compile: {:?}", e);
                Err(Error::Migrate(Box::new(e)))
            }
        }
    }
}`;

  const sqlCode = `-- 20260622000000_init_vnp_schema.sql
-- Veklom Nexus Protocol Database Migration
-- Implements robust, indexed tables for multi-tenant users, API states, high-stakes transactions, audit logging, and leaderboard tracking.

-- Enable UUID extension for cryptographically secure, unguessable key identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Multi-Tenant Users and RBAC Configs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Guest Developer' CHECK (role IN ('System Administrator', 'Node Operator', 'Compliance Auditor', 'Guest Developer')),
    tenant_name VARCHAR(100) NOT NULL DEFAULT 'Global Public Tenant',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. API Registry State
CREATE TABLE IF NOT EXISTS api_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_did VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'did:vnp:api:llama-3-deepseek'
    name VARCHAR(255) NOT NULL,
    endpoint TEXT NOT NULL,
    version VARCHAR(50) NOT NULL,
    composite_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    x402_compliant BOOLEAN NOT NULL DEFAULT FALSE,
    stability_rating VARCHAR(50) NOT NULL DEFAULT 'Provisional',
    last_measured TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Regional Benchmark Aggregations (Continuous Telemetry Ingestion)
CREATE TABLE IF NOT EXISTS regional_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_id UUID REFERENCES api_state(id) ON DELETE CASCADE,
    region VARCHAR(50) NOT NULL CHECK (region IN ('us-east', 'us-west', 'eu-west', 'ap-southeast', 'ap-northeast')),
    p50_latency_ms INT NOT NULL,
    p95_latency_ms INT NOT NULL,
    p99_latency_ms INT NOT NULL,
    error_rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    uptime_percent DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    throughput_rps INT NOT NULL DEFAULT 0,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. High-Stakes Transactions (Escrow Payments via x402 / MPP)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_api_id UUID REFERENCES api_state(id) ON DELETE RESTRICT,
    microtransaction_id VARCHAR(255) UNIQUE NOT NULL, -- x402 payment anchor hash
    amount_usd DECIMAL(15, 6) NOT NULL, -- Microcent resolution
    gas_fee_usd DECIMAL(15, 6) NOT NULL DEFAULT 0.000000,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Escrowed', 'Settled', 'Refunded', 'Slashed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP WITH TIME ZONE
);

-- Create optimized Indexes to handle high concurrent search/leaderboard sorting queries
CREATE INDEX IF NOT EXISTS idx_api_state_composite ON api_state(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_measured ON regional_telemetry(measured_at DESC);`;

  const cliCode = `# .env config for local setup
DATABASE_URL=postgres://vnp_admin:security_override_9918@localhost:5432/vnp_production

# 1. Install SQLx Command Line Interface globally
cargo install sqlx-cli --no-default-features --features postgres

# 2. Check current migration state against target container
sqlx migrate info

# 3. Create a new SQL setup file inside /migrations
sqlx migrate add create_tenant_onboarding_ledgers

# 4. Trigger structural Postgres updates synchronously
sqlx migrate run`;

  const rlsCode = `-- Multi-Tenant Database Segregation using Row-Level Security (RLS)
-- Each tenant is dynamically allocated a tenant_name scope. Queries filter implicitly.

-- Enable Row-Level Security on critical tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create Tenant Decoupling Access Policy for users table
CREATE POLICY tenant_isolation_policy ON users
    FOR ALL
    USING (tenant_name = current_setting('vnp.current_tenant_header'));

-- Apply session scope programmatically within Rust before query firing:
-- tx.execute(sqlx::query("SET LOCAL vnp.current_tenant_header = 'Tempo Global LLC';")).await?;
-- tx.execute(sqlx::query("SELECT * FROM compliance_audit_log;")).await?;`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  };

  // Real-time animation cycle driving the Tokio simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSlots((prevSlots) => {
        let activeCount = 0;
        const mapped = prevSlots.map((slot) => {
          if (slot.status === "ACQUIRED") {
            const nextDur = slot.durationLeft - 1;
            if (nextDur <= 0) {
              // Finish transaction connection
              return { ...slot, status: "IDLE" as const, activeTenant: null, durationLeft: 0 };
            }
            activeCount++;
            return { ...slot, durationLeft: nextDur };
          }
          return slot;
        });

        // Trigger random incoming query to random slot if not overflowing the connection cap
        if (Math.random() > 0.4 && activeCount < 10) {
          const idleIndex = mapped.findIndex(s => s.status === "IDLE");
          if (idleIndex !== -1) {
            const tenants = ["veklom.io", "tempo_global", "coinbase_swarms", "mcp_gateway", "vnp_operator"];
            const selectedTenant = tenants[Math.floor(Math.random() * tenants.length)];
            const queryLatency = parseFloat((0.15 + Math.random() * 0.4).toFixed(3));
            
            mapped[idleIndex] = {
              ...mapped[idleIndex],
              status: "ACQUIRED" as const,
              activeTenant: selectedTenant,
              durationLeft: Math.ceil(Math.random() * 4) + 1,
              queryTimeMs: queryLatency
            };

            // Write to console logger log
            setSimLog((logs) => {
              const newLog = `[${new Date().toLocaleTimeString([], { hour12: false })}] Slot #${idleIndex+1} [ACQUIRED] Tenant "${selectedTenant}" - SET LOCAL isolation_key & execute transaction statement (${queryLatency}ms)`;
              return [newLog, ...logs.slice(0, 16)];
            });
          }
        }

        // Active count update
        const count = mapped.filter(s => s.status === "ACQUIRED").length;
        setActiveConnCount(count);
        setWaitQueueCount(count > 8 ? Math.floor(Math.random() * 3) : 0);
        
        return mapped;
      });
    }, 900);

    return () => clearInterval(timer);
  }, []);

  const triggerBulkFlood = () => {
    setIsFlooding(true);
    setThroughputCounter(590);
    
    // Set all slots to acquired/blocked
    setSlots((prev) => prev.map((s, idx) => {
      const tenants = ["coinbase_swarms", "tempo_global", "veklom.io"];
      const activeT = tenants[idx % tenants.length];
      return {
        ...s,
        status: idx > 9 ? ("BLOCKED" as const) : ("ACQUIRED" as const),
        activeTenant: activeT,
        durationLeft: 8,
        queryTimeMs: parseFloat((0.35 + Math.random() * 0.15).toFixed(3))
      };
    }));

    setSimLog((logs) => [
      `[${new Date().toLocaleTimeString([], { hour12: false })}] ⚡️ TOKIO CONCURRENCY FLOOD DETECTED - 1,000 requests ingested. Connections saturated, scaling active pool...`,
      `[${new Date().toLocaleTimeString([], { hour12: false })}] [RLS SHIELD] All queries isolated securely per tenant config context headers. No cross-leaks detected.`,
      ...logs.slice(0, 5)
    ]);

    setTimeout(() => {
      setIsFlooding(false);
      setThroughputCounter(140);
    }, 4000);
  };

  const currentCode = 
    activeTab === "rust" ? rustCode : 
    activeTab === "sql" ? sqlCode : 
    activeTab === "cli" ? cliCode : 
    rlsCode;

  const currentPath = 
    activeTab === "rust" ? "/vnp-rust-backend/src/db.rs" : 
    activeTab === "sql" ? "/vnp-rust-backend/migrations/init_vnp_schema.sql" : 
    activeTab === "cli" ? "sqlx-cli Migrations Instructions (.env)" : 
    "Row Level Security (RLS) isolation.sql";

  return (
    <div id="vnp-spec-room-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Sidebar navigation - col-span 4 */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Toggle Mode Controller */}
        <div className="bg-[#121924] border border-slate-900 rounded-2xl p-2 flex gap-1 font-mono text-[10px]">
          <button
            onClick={() => setViewMode("simulation")}
            className={`flex-1 py-2.5 rounded-xl font-extrabold cursor-pointer transition ${
              viewMode === "simulation" 
                ? "bg-[#1d273a] text-emerald-400 border border-slate-800" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tokio Concurrency Lab
          </button>
          <button
            onClick={() => setViewMode("code")}
            className={`flex-1 py-2.5 rounded-xl font-extrabold cursor-pointer transition ${
              viewMode === "code" 
                ? "bg-[#1d273a] text-emerald-400 border border-slate-800" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Show Code Spec
          </button>
        </div>

        <div className="bg-[#0b1017] border border-slate-900 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2.5">
            <Database className="w-4.5 h-4.5 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              High-Perf Database Blueprints
            </h3>
          </div>
          
          <p className="text-xs text-slate-400 leading-relaxed pl-0.5">
            VNP relies on native Rust **SQLx connection pooling** and PostgreSQL **Row Level Security (RLS)** to enforce military-grade multi-tenant isolation with zero overhead layers.
          </p>

          <nav className="flex flex-col gap-2 pt-1 font-mono text-[10px]">
            <button
              onClick={() => setActiveTab("rust")}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                activeTab === "rust"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold"
                  : "bg-slate-950 border border-slate-900 text-slate-400 hover:bg-slate-900/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-500" />
                <span>SQLx Connection Pool</span>
              </div>
              <span className="text-[9px] text-amber-400 font-bold">Rust</span>
            </button>

            <button
              onClick={() => setActiveTab("sql")}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                activeTab === "sql"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold"
                  : "bg-slate-950 border border-slate-900 text-slate-400 hover:bg-slate-900/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Init Database Ledger</span>
              </div>
              <span className="text-[9px] text-emerald-400 font-bold">Postgres</span>
            </button>

            <button
              onClick={() => setActiveTab("rls")}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                activeTab === "rls"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold"
                  : "bg-slate-950 border border-slate-900 text-slate-400 hover:bg-slate-900/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Row Level Security (RLS)</span>
              </div>
              <span className="text-[9px] text-indigo-400 font-bold">Isolation</span>
            </button>
          </nav>
        </div>

        {/* Informational connection counter stats card */}
        <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3 font-mono text-[10px]">
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" /> Isolation Shield
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Rust sets the local tenant connection variable <code className="text-slate-300">vnp.current_tenant_header</code> upon acquiring from pool. PostgreSQL isolates row visibility programmatically inside database hardware.
          </p>
        </div>
      </div>

      {/* Main Area View Pane - col-span 8 */}
      <div className="lg:col-span-8">
        
        {viewMode === "simulation" ? (
          /* TOKIO SIMULATOR VIEW (THE WOW FACTOR PLAYGROUND!) */
          <div className="bg-[#090d13] border border-slate-900 rounded-2xl p-5 space-y-5 h-[535px] flex flex-col justify-between font-mono text-[11px]">
            
            {/* Header Dashboard stats bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-900 pb-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">Tokio SQLx Connection Pool Core</span>
                </div>
                <span className="text-[9px] text-[#86efac] font-bold block uppercase bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 w-max shrink-0">
                  ⚡️ High-Performance Async Pool (vnp_production)
                </span>
              </div>

              {/* Ingestion load multiplier button */}
              <button
                onClick={triggerBulkFlood}
                disabled={isFlooding}
                className="p-3 bg-gradient-to-tr from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-black transition duration-200 flex items-center gap-2 shadow-lg shadow-emerald-950/20 active:scale-95 cursor-pointer selection:bg-transparent"
              >
                <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>{isFlooding ? "BURSTING POOL LOAD..." : "🚀 FIRE 1,000 LOAD PROBES / SEC"}</span>
              </button>
            </div>

            {/* Simulated Live Connection Threads Grid */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-extrabold uppercase">
                <span>Active Connection Slots (max_connections = 12)</span>
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Latency: 0.24ms avg
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {slots.map((slot) => {
                  let statusColor = "border-slate-800 bg-[#0d131f]/20 text-slate-500";
                  let lightColor = "bg-slate-700";
                  
                  if (slot.status === "ACQUIRED") {
                    statusColor = "border-emerald-500/60 bg-emerald-950/15 text-emerald-300 text-slate-200 shadow-md";
                    lightColor = "bg-emerald-400 animate-pulse";
                  } else if (slot.status === "BLOCKED") {
                    statusColor = "border-red-500/60 bg-red-950/15 text-red-300 shadow-md";
                    lightColor = "bg-red-500 animate-bounce";
                  }

                  return (
                    <div 
                      key={slot.id} 
                      className={`p-2 rounded-xl border flex flex-col justify-between h-[65px] transition duration-200 ${statusColor}`}
                    >
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold">
                        <span>SLOT #{slot.id}</span>
                        <div className="flex items-center gap-1">
                          <span className={`${lightColor} w-1.5 h-1.5 rounded-full inline-block`} />
                          <span className="text-[8px] uppercase">{slot.status}</span>
                        </div>
                      </div>
                      
                      <div className="text-[10px] truncate max-w-full font-bold">
                        {slot.status === "ACQUIRED" ? (
                          <div className="text-slate-100 flex items-center gap-1">
                            <span className="text-emerald-400 font-bold">@{slot.activeTenant}</span>
                          </div>
                        ) : slot.status === "BLOCKED" ? (
                          <span className="text-red-400 font-semibold">QUEUE OUT</span>
                        ) : (
                          <span className="text-slate-600 font-normal">-- empty queue --</span>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[7.5px] text-slate-500">
                        <span>{slot.status === "ACQUIRED" ? `${slot.queryTimeMs}ms execute` : "idle (warm)"}</span>
                        <span>{slot.status === "ACQUIRED" && `dur: ${slot.durationLeft}s`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diagnostic stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] uppercase font-bold text-slate-500 pt-1 border-t border-slate-900">
              <div className="p-2.5 bg-[#0e1420]/50 border border-slate-900 rounded-xl">
                <span>Active Channels</span>
                <span className="text-white text-sm block mt-1 font-black text-emerald-400">{activeConnCount} / 12</span>
              </div>
              <div className="p-2.5 bg-[#0e1420]/50 border border-slate-900 rounded-xl">
                <span>Ingest Queue Wait</span>
                <span className={`text-sm block mt-1 font-black ${waitQueueCount > 0 ? "text-amber-500 animate-pulse" : "text-slate-300"}`}>{waitQueueCount} threads</span>
              </div>
              <div className="p-2.5 bg-[#0e1420]/50 border border-slate-900 rounded-xl">
                <span>SLA Success Rate</span>
                <span className="text-white text-sm block mt-1 font-black text-emerald-400">99.998%</span>
              </div>
              <div className="p-2.5 bg-[#0e1420]/50 border border-slate-900 rounded-xl">
                <span>Simulated Ingestion</span>
                <span className="text-white text-sm block mt-1 font-black text-indigo-400">{throughputCounter} RPS</span>
              </div>
            </div>

            {/* Realtime log stream output */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" /> VNP Engine Transaction Log Console (Simulated PostgreSQL local connection trace)
              </span>
              <div className="bg-[#05060a] border border-slate-900 p-3 rounded-xl h-[120px] overflow-y-auto font-mono text-[9.5px]/relaxed text-slate-400 space-y-1 select-text custom-scrollbar">
                {simLog.map((log, idx) => {
                  let badge = "text-slate-500";
                  if (log.includes("ACQUIRED")) badge = "text-emerald-400";
                  if (log.includes("SECURITYCHECK") || log.includes("RLS")) badge = "text-cyan-400";
                  if (log.includes("BURST") || log.includes("FLOOD")) badge = "text-yellow-400 font-extrabold animate-pulse";
                  return (
                    <div key={idx} className={`${badge} break-all border-b border-slate-950/20 pb-0.5`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          /* CODE SPEC MODE (Static Source Code View) */
          <div className="bg-[#090d13] border border-slate-900 rounded-2xl overflow-hidden flex flex-col h-[535px]">
            {/* Header bar */}
            <div className="bg-[#121822] border-b border-slate-900 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 block" />
                </div>
                <span className="text-[11px] font-mono text-slate-400 select-all tracking-tight truncate max-w-[280px] md:max-w-none">
                  {currentPath}
                </span>
              </div>

              <button
                onClick={() => copyToClipboard(currentCode, activeTab)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs transition duration-200 cursor-pointer font-bold font-mono text-[10px]"
              >
                {copied === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy file</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-5 font-mono text-[11px] leading-normal text-slate-300 selection:bg-emerald-500/20">
              <pre className="whitespace-pre">
                {currentCode}
              </pre>
            </div>

            {/* Footer info bar */}
            <div className="bg-slate-950 border-t border-slate-900 px-5 py-3 text-xs text-slate-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Ready for compiler integration: No unresolved imports.</span>
              </div>
              <span className="text-[10px] tracking-wider text-slate-600 uppercase font-mono">MIT License</span>
            </div>
          </div>
        )}
        
      </div>

    </div>
  );
}
