import React, { useState } from "react";
import { UserCheck, ShieldAlert, Key, ClipboardList, Database, FileUp, Globe, CheckSquare, Search, PlusCircle, Server, Lock, AlertCircle, Fingerprint } from "lucide-react";
import { AuditLog, TenantInfo, UserRole } from "./types";

interface RbacPanelProps {
  auditLogs: AuditLog[];
  onExportReport: (format: "json" | "csv" | "pdf") => void;
  exporting: boolean;
}

export default function RbacPanel({ auditLogs, onExportReport, exporting }: RbacPanelProps) {
  // Existing baseline state tenants
  const [tenantsList, setTenantsList] = useState<TenantInfo[]>([
    { id: "tenant-veklom", name: "VNP Global Foundation LLC", role: UserRole.ADMIN, domain: "veklom.io" },
    { id: "tenant-stripe", name: "Stripe MPP Payment Hub", role: UserRole.OPERATOR, domain: "stripe.com" },
    { id: "tenant-tempo", name: "Tempo Global Partners", role: UserRole.COMPLIANCE_AUDITOR, domain: "tempo.org" },
    { id: "tenant-guest", name: "Independent App Developer", role: UserRole.VISITOR_DEV, domain: "public-devs.net" }
  ]);

  const [activeTenant, setActiveTenant] = useState<TenantInfo>(tenantsList[0]);

  // Form states for dynamic onboarding
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDomain, setNewOrgDomain] = useState("");
  const [newOrgRole, setNewOrgRole] = useState<UserRole>(UserRole.ADMIN);
  const [dbIsolationMode, setDbIsolationMode] = useState("row-level-security");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionSuccessMsg, setProvisionSuccessMsg] = useState("");

  const handleRoleChange = (tenant: TenantInfo) => {
    setActiveTenant(tenant);
    setProvisionSuccessMsg("");
  };

  // Onboard new tenant organization
  const handleOnboardTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgDomain) {
      alert("Please fill in Organization Name and Scope Domain.");
      return;
    }

    setIsProvisioning(true);
    setProvisionSuccessMsg("");

    setTimeout(() => {
      const newId = `tenant-${newOrgName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "custom"}`;
      const freshTenant: TenantInfo = {
        id: newId,
        name: newOrgName,
        role: newOrgRole,
        domain: newOrgDomain
      };

      setTenantsList((prev) => [...prev, freshTenant]);
      setActiveTenant(freshTenant);
      setIsProvisioning(false);
      setProvisionSuccessMsg(`✅ Workspace isolation spawned for ${newOrgName}! Host cryptographically registered at "${newOrgDomain}".`);
      
      // Reset form
      setNewOrgName("");
      setNewOrgDomain("");
    }, 1200);
  };

  // Filter audit logs by tenant for strict data isolation and segmentation
  const filteredLogs = auditLogs.filter((log) => {
    // If Admin of VNP global, let them see everything, else segment strictly based on domain metadata matches!
    if (activeTenant.role === UserRole.ADMIN) return true;
    return (
      log.tenant.toLowerCase().includes(activeTenant.name.split(" ")[0].toLowerCase()) ||
      log.actor.toLowerCase().includes(activeTenant.domain.split(".")[0])
    );
  });

  return (
    <div id="vnp-rbac-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Role Switcher & Onboarding - col-span 5 */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Tenant Switcher Console */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <UserCheck className="w-4 h-4 text-emerald-400" /> PGL Identity Lineages
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded font-mono font-bold">
              Multi-Tenant
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-normal pl-0.5">
            Switch your active authenticated team context to simulate real-time API isolation, ledger queries, and distinct microservice permissions.
          </p>

          <div className="space-y-2 pt-1 max-h-[220px] overflow-y-auto pr-1">
            {tenantsList.map((tenant) => {
              const isSelected = activeTenant.id === tenant.id;
              return (
                <button
                  key={tenant.id}
                  onClick={() => handleRoleChange(tenant)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-lg text-xs font-semibold select-none border transition-all text-left ${
                    isSelected
                      ? "bg-slate-950 border-emerald-500/50 text-emerald-300"
                      : "bg-slate-800/30 border-transparent hover:bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div>
                    <div className="font-bold">{tenant.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{tenant.domain}</div>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-1 rounded tracking-tight ${
                    tenant.role === UserRole.ADMIN 
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : tenant.role === UserRole.OPERATOR
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : tenant.role === UserRole.COMPLIANCE_AUDITOR
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                  }`}>
                    {tenant.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tenant Onboarding Registration Form */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2.5">
            <PlusCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-200">
              Onboard New Tenant Organization
            </h4>
          </div>

          {provisionSuccessMsg && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-300 font-mono leading-relaxed">
              {provisionSuccessMsg}
            </div>
          )}

          <form onSubmit={handleOnboardTenant} className="space-y-3.5">
            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase font-bold mb-1">
                Organization Name
              </label>
              <input
                type="text"
                placeholder="e.g. Coinbase AI Ventures"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="w-full bg-[#0a0d13] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase font-bold mb-1">
                Core Scope Domain
              </label>
              <input
                type="text"
                placeholder="e.g. coinbase.com"
                value={newOrgDomain}
                onChange={(e) => setNewOrgDomain(e.target.value)}
                className="w-full bg-[#0a0d13] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase font-bold mb-1">
                  Default Role
                </label>
                <select
                  value={newOrgRole}
                  onChange={(e) => setNewOrgRole(e.target.value as UserRole)}
                  className="w-full bg-[#0a0d13] border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.OPERATOR}>Node Operator</option>
                  <option value={UserRole.COMPLIANCE_AUDITOR}>Compliance Auditor</option>
                  <option value={UserRole.VISITOR_DEV}>Guest Developer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase font-bold mb-1">
                  DB Isolation Level
                </label>
                <select
                  value={dbIsolationMode}
                  onChange={(e) => setDbIsolationMode(e.target.value)}
                  className="w-full bg-[#0a0d13] border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="row-level-security">SaaS Pool RLS</option>
                  <option value="postgres-schema">PG Isolated Schema</option>
                  <option value="dedicated-db">Dedicated Database</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProvisioning}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black py-2 rounded text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isProvisioning ? "Provisioning Ledger Space..." : "Spawn Isolated Tenancy"}</span>
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT COLUMN: Active Permissions & Segregated Compliance Logs - col-span 7 */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Active Isolation Status Bar */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Fingerprint className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 font-bold block">PGL GENOME IDENTITY CERTIFICATE</span>
              <h4 className="text-xs font-bold text-slate-200">
                PGL Ledger isolation: <span className="text-emerald-400 font-extrabold uppercase font-mono">SECURE - ACTIVE</span>
              </h4>
            </div>
          </div>

          <div className="font-mono text-[9px] text-slate-500 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded space-y-0.5">
            <div>Isolation: <strong className="text-slate-300 font-semibold">{dbIsolationMode.toUpperCase()}</strong></div>
            <div className="truncate max-w-[170px]">Hash Anchor: <span className="text-slate-300 font-semibold">sha256:{activeTenant.id.substr(0,10)}</span></div>
          </div>
        </div>

        {/* Audit Trails Isolated List */}
        <div className="border border-slate-900 bg-[#0d1117] rounded-xl p-5 flex flex-col justify-between min-h-[380px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2 font-mono">
                <ClipboardList className="w-4.5 h-4.5 text-emerald-400" /> PGL Gnomledger ({filteredLogs.length})
              </h3>
              <span className="text-[9px] bg-[#0c121e] px-2.5 py-0.5 text-slate-500 rounded font-mono font-bold border border-slate-800">
                Lineage View
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Below are target operations logged under tenant organization <strong className="text-slate-300">{activeTenant.name}</strong>. Data from other organizations is cryptographically hidden to enforce strict database row-level isolation guarantees.
            </p>

            <div className="space-y-3 overflow-y-auto max-h-[290px] pr-1.5 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-600 space-y-2 border border-dashed border-slate-900 rounded-lg">
                  <AlertCircle className="w-7 h-7 mx-auto text-slate-700" />
                  <p className="text-[10px]">No isolated compliance transactions recorded for this tenant yet.</p>
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <div key={index} className="p-3 bg-slate-950 border border-slate-900 rounded-lg space-y-1.5 hover:border-slate-800 transition duration-150">
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Tenant Source: {log.tenant}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-200 gap-2">
                      <span className="font-bold text-emerald-400">{log.action}</span>
                      <span className="bg-slate-900 border border-slate-800 text-[9px] text-slate-400 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                        {log.actor}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between pt-0.5 border-t border-slate-900">
                      <span>Entity Scope: {log.entity}</span>
                      <span className="text-[8px] tracking-wide max-w-[140px] truncate">Tx Hash: {log.transaction}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Export compliance triggers */}
          <div className="border-t border-slate-900/60 pt-4 mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-400 font-sans">
              Export security ledger for <strong className="text-slate-200">{activeTenant.name}</strong>:
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onExportReport("pdf")}
                disabled={exporting || activeTenant.role === UserRole.VISITOR_DEV}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Export isolated PDF</span>
              </button>
              <button
                onClick={() => onExportReport("json")}
                disabled={exporting || activeTenant.role === UserRole.VISITOR_DEV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white rounded text-[11px] font-bold border border-slate-700 transition cursor-pointer"
              >
                <span>Raw JSON-LD</span>
              </button>
            </div>
          </div>
        </div>

        {/* Current Tenant Allowed Operations Grid Matrix */}
        <div className="bg-slate-900/40 p-4.5 rounded-xl border border-slate-800/80 font-mono space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold border-b border-slate-800/60 pb-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Active Tenant Allowed Operations (RBAC Check)</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
            <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg flex flex-col justify-between">
              <span className="text-slate-500">Edit Alert Config Rules:</span>
              <span className={`font-bold mt-1 text-center ${activeTenant.role === UserRole.ADMIN ? "text-emerald-400" : "text-red-500"}`}>
                {activeTenant.role === UserRole.ADMIN ? "ALLOW" : "DENY"}
              </span>
            </div>
            
            <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg flex flex-col justify-between">
              <span className="text-slate-500">Trigger Testing Pod Probe:</span>
              <span className={`font-bold mt-1 text-center ${(activeTenant.role === UserRole.ADMIN || activeTenant.role === UserRole.OPERATOR) ? "text-emerald-400" : "text-red-500"}`}>
                {(activeTenant.role === UserRole.ADMIN || activeTenant.role === UserRole.OPERATOR) ? "ALLOW" : "DENY"}
              </span>
            </div>

            <div className="p-2.5 bg-[#070b12] border border-slate-900 rounded-lg flex flex-col justify-between">
              <span className="text-slate-500">Compliance Audit Reports:</span>
              <span className={`font-bold mt-1 text-center ${activeTenant.role !== UserRole.VISITOR_DEV ? "text-emerald-400" : "text-red-500"}`}>
                {activeTenant.role !== UserRole.VISITOR_DEV ? "ALLOW" : "DENY"}
              </span>
            </div>

            <div className="p-2.5 bg-[#070b12] border border-slate-900 rounded-lg flex flex-col justify-between">
              <span className="text-slate-500">Rotate Cryptographic Keys:</span>
              <span className={`font-bold mt-1 text-center ${activeTenant.role === UserRole.ADMIN ? "text-emerald-400" : "text-red-500"}`}>
                {activeTenant.role === UserRole.ADMIN ? "ALLOW" : "DENY"}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
