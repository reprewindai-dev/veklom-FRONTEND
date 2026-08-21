import React, { useState } from "react";
import { AlertTriangle, BellRing, Settings, Plus, Mail, MessageSquare, Play, RefreshCw, Layers } from "lucide-react";
import { AlertConfig, AlertLog } from "./types";

interface AlertPanelProps {
  configs: AlertConfig[];
  logs: AlertLog[];
  onAddConfig: (config: Omit<AlertConfig, "id" | "enabled">) => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function AlertPanel({ configs, logs, onAddConfig, onRefresh, loading }: AlertPanelProps) {
  const [metric, setMetric] = useState("latency_p99");
  const [threshold, setThreshold] = useState("1000");
  const [email, setEmail] = useState("pluggedfinds41@gmail.com");
  const [sms, setSms] = useState("+15550192837");
  const [formSuccess, setFormSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threshold) return;

    onAddConfig({
      metric,
      threshold: parseFloat(threshold),
      email,
      sms
    });

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
    }, 3000);
  };

  return (
    <div id="vnp-alerts-center-root" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Alert Policy Constructor Form */}
      <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-emerald-400" /> SEKED Policy Engine
          </h3>
          <span className="text-[10px] uppercase font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Real-Time</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div className="space-y-1">
            <label className="text-slate-400 block font-medium">Trigger Metric Target:</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="latency_p99">Latency Outlier (P99) &gt; ms</option>
              <option value="error_rate">API Error Rate &gt; %</option>
              <option value="uptime">Uptime Downtime Warning &lt; %</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 block font-medium">Threshold Capacity (ms or %):</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              placeholder="e.g. 1000"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 block font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" /> Notification Email Destination:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 focus:outline-none"
              placeholder="admin@veklom.io"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 block font-medium flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> SMS Contact Phone Endpoint:
            </label>
            <input
              type="text"
              value={sms}
              onChange={(e) => setSms(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 focus:outline-none font-mono"
              placeholder="+15550192837"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 hover:shadow text-white rounded font-bold transition duration-200 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Update SEKED Policy Rule</span>
          </button>

          {formSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-center font-medium animate-fade-in text-[11px]">
              ✓ VNP core alert policy successfully registered. Live alerts activated.
            </div>
          )}
        </form>

        {/* List of active mapped configs */}
        <div className="space-y-2 border-t border-slate-800/60 pt-4">
          <span className="text-[10px] font-mono uppercase text-slate-500">Active Handlers</span>
          <div className="space-y-2 max-h-[140px] overflow-y-auto">
            {configs.map((cfg) => (
              <div key={cfg.id} className="bg-slate-950 p-2.5 rounded border border-slate-800/40 space-y-1 flex justify-between items-center text-[10px] font-mono">
                <div className="space-y-0.5">
                  <div className="text-slate-300 font-bold">
                    {cfg.metric === "latency_p99" ? "P99 Latency" : cfg.metric === "error_rate" ? "Error Rate" : "Uptime"} Alert Rule
                  </div>
                  <div className="text-slate-500">
                    Threshold: <strong className="text-slate-400">{cfg.threshold}</strong> | Email: {cfg.email}
                  </div>
                </div>
                <span className="p-1 px-1.5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded text-[9px]">
                  ON / ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Triggered Live Alerts logs */}
      <div className="lg:col-span-3 border border-slate-800 bg-[#0d1117] rounded-xl p-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <BellRing className="w-4.5 h-4.5 text-amber-500 animate-bounce" /> SEKED Policy Halts & Kill Switch Triggers ({logs.length})
            </h3>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] text-slate-300 flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              <span>Poll Alerts</span>
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[310px] pr-1">
            {logs.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-lg text-slate-500 space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs">No critical microservice violations registered.</p>
                <p className="text-[10px] text-slate-600">Simulated jitter and background probes will trigger live alerts if parameters exceed threshold rules.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg flex items-start gap-3 transition">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{log.apiName}</span>
                      <span className="text-[10px] font-mono text-slate-500">Region: {log.region.toUpperCase()}</span>
                      <span className="text-[9px] text-slate-500 font-mono italic ml-auto">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] font-mono">{log.message}</p>
                    <p className="text-slate-500 text-[9px] font-mono flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 text-emerald-500" />
                      <span>{log.channel}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-900 text-[10px] text-slate-500 font-mono text-center">
          SEKED execution plans are mathematically sealed to ensure immutable, exportable audit evidence.
        </div>
      </div>
    </div>
  );
}
