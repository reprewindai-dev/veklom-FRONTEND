import React from 'react';
import { Lock, ShieldCheck, Check, X, Key, UserCheck } from 'lucide-react';
import { UserRole, RBACPolicy } from '../types.js';

interface RbacPolicyViewProps {
  currentRole: UserRole;
  setRole: (r: UserRole) => void;
}

export const RbacPolicyView: React.FC<RbacPolicyViewProps> = ({ currentRole, setRole }) => {
  const policies: Record<UserRole, RBACPolicy> = {
    admin: {
      role: 'admin',
      allowedCapabilities: ['*'],
      canExecuteDemo: true,
      canExecuteProduction: true,
      canManageKeys: true,
      canApproveBlueprints: true,
      maxDailyInvocations: 100000
    },
    architect: {
      role: 'architect',
      allowedCapabilities: ['veklom-skill-spec', 'cAPI-mcp-translator', 'abide-planner'],
      canExecuteDemo: true,
      canExecuteProduction: true,
      canManageKeys: false,
      canApproveBlueprints: true,
      maxDailyInvocations: 50000
    },
    auditor: {
      role: 'auditor',
      allowedCapabilities: ['gnomledger-pgl', 'veklom-vnp', 'repogate-scanner'],
      canExecuteDemo: true,
      canExecuteProduction: false,
      canManageKeys: false,
      canApproveBlueprints: false,
      maxDailyInvocations: 10000
    },
    operator: {
      role: 'operator',
      allowedCapabilities: ['cAPI-mcp-translator'],
      canExecuteDemo: true,
      canExecuteProduction: true,
      canManageKeys: false,
      canApproveBlueprints: false,
      maxDailyInvocations: 25000
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-medium mb-1">
            <Lock className="w-4 h-4" /> UACP V3 (GPC) GENERAL POLICY CONTROLLER
          </div>
          <h2 className="text-2xl font-bold text-white">Role-Based Access Control (RBAC) Matrix</h2>
          <p className="text-xs text-slate-400 font-mono">
            Grain-level capability access permissions enforced across cAPI invocations and Lockerphycer secrets.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Active Identity Role:</span>
          <select
            value={currentRole}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-slate-950 text-cyan-400 font-bold border border-slate-800 px-3 py-1 rounded focus:outline-none"
          >
            <option value="admin">Admin</option>
            <option value="architect">Architect</option>
            <option value="auditor">Auditor</option>
            <option value="operator">Operator</option>
          </select>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden font-mono text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 uppercase text-3xs border-b border-slate-800">
              <th className="p-4">Role</th>
              <th className="p-4">Prod Execution</th>
              <th className="p-4">Demo Execution</th>
              <th className="p-4">Manage Key Vault</th>
              <th className="p-4">Approve Blueprints</th>
              <th className="p-4">Daily Invocation Limit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {(['admin', 'architect', 'auditor', 'operator'] as UserRole[]).map((r) => {
              const pol = policies[r];
              const isCurrent = currentRole === r;
              return (
                <tr key={r} className={isCurrent ? 'bg-cyan-500/10' : 'hover:bg-slate-950/50'}>
                  <td className="p-4 font-bold text-white flex items-center gap-2">
                    {r.toUpperCase()}
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-3xs font-bold border border-cyan-500/40">
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {pol.canExecuteProduction ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-600" />}
                  </td>
                  <td className="p-4">
                    {pol.canExecuteDemo ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-600" />}
                  </td>
                  <td className="p-4">
                    {pol.canManageKeys ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-600" />}
                  </td>
                  <td className="p-4">
                    {pol.canApproveBlueprints ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-600" />}
                  </td>
                  <td className="p-4 text-slate-300 font-bold">{pol.maxDailyInvocations.toLocaleString()} req/day</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
