import React, { useState } from 'react';
import { Agent, Capability, Policy, PolicyRule } from './types';
import { ShieldCheck, Calendar, Clock, Terminal, CheckCircle2, AlertTriangle, PlusCircle, Bookmark, Compass } from 'lucide-react';

interface PolicyManagerProps {
  agents: Agent[];
  capabilities: Capability[];
  policies: Policy[];
  onAddPolicyRule: (policyId: string, rule: PolicyRule) => void;
}

export default function PolicyManager({
  agents,
  capabilities,
  policies,
  onAddPolicyRule
}: PolicyManagerProps) {
  // Effective permissions calculator states
  const [calcAgentId, setCalcAgentId] = useState(agents[0]?.id || 'agent-researcher');
  const [calcCapId, setCalcCapId] = useState(capabilities[0]?.id || 'search');
  const [virtualTime, setVirtualTime] = useState<'business' | 'offhours' | 'holiday'>('business');
  const [calculatedEffective, setCalculatedEffective] = useState<{
    effect: 'allow' | 'deny';
    reason: string;
    rulesInteracting: string[];
    rateLimit: number;
    requiresApproval: boolean;
  } | null>(null);

  // Custom rule creation states
  const [targetPolicyId, setTargetPolicyId] = useState(policies[1]?.id || 'owner-policy-kate');
  const [newEffect, setNewEffect] = useState<'allow' | 'deny'>('allow');
  const [newAgent, setNewAgent] = useState('*');
  const [newCap, setNewCap] = useState('*');
  const [newMinTrust, setNewMinTrust] = useState(50);
  const [newRateLimit, setNewRateLimit] = useState(10);
  const [newRequireApproval, setNewRequireApproval] = useState(false);

  // Perform Effective permissions composition
  const handleCalculatePermissions = () => {
    const selectedAgent = agents.find(a => a.id === calcAgentId);
    const selectedCap = capabilities.find(c => c.id === calcCapId);

    if (!selectedAgent || !selectedCap) return;

    // Standard hierarchy composition: System -> Owner -> Runtime
    let decision: 'allow' | 'deny' = 'deny'; // default closed
    let reason = 'Default closed boundary enforced: No explicit allow permission rules located.';
    let steps: string[] = [];
    let composedRateLimit = 0;
    let compositionRequireApproval = false;

    // Scan System Policies first (Has priority overriding power)
    const sysPolicies = policies.filter(p => p.type === 'system' && p.active);
    let sysMatch = false;

    for (const p of sysPolicies) {
      for (const r of p.rules) {
        const agentMatch = r.principal === calcAgentId || r.principal === '*';
        const capMatch = r.action === calcCapId || r.action === '*';

        if (agentMatch && capMatch) {
          sysMatch = true;
          decision = r.effect;
          composedRateLimit = r.rateLimit;
          compositionRequireApproval = r.requiresApproval;
          steps.push(`[SYSTEM PRIORITY OVERRIDE] Matched sovereign system rule [${r.id}]: effect is ${r.effect.toUpperCase()}`);
          break;
        }
      }
      if (sysMatch) break;
    }

    // If no System lock matches, scan Owner Group policies
    if (!sysMatch) {
      const ownPolicies = policies.filter(p => p.type === 'owner' && p.active);
      let ownMatch = false;

      for (const p of ownPolicies) {
        for (const r of p.rules) {
          const agentMatch = r.principal === calcAgentId || r.principal === '*';
          const capMatch = r.action === calcCapId || r.action === '*';

          if (agentMatch && capMatch) {
            ownMatch = true;
            decision = r.effect;
            composedRateLimit = r.rateLimit;
            compositionRequireApproval = r.requiresApproval;
            steps.push(`[OWNER GROUP RULE] Matched Kate permission group rule [${r.id}]: effect is ${r.effect.toUpperCase()}`);
            break;
          }
        }
        if (ownMatch) break;
      }

      // If no System or Owner policy rules matched, fall back to central Runtime Operations policies
      if (!ownMatch) {
        const runPolicies = policies.filter(p => p.type === 'runtime' && p.active);
        let runMatch = false;

        for (const p of runPolicies) {
          for (const r of p.rules) {
            const agentMatch = r.principal === calcAgentId || r.principal === '*';
            const capMatch = r.action === calcCapId || r.action === '*';

            if (agentMatch && capMatch) {
              runMatch = true;
              decision = r.effect;
              composedRateLimit = r.rateLimit;
              compositionRequireApproval = r.requiresApproval;
              steps.push(`[RUNTIME FALLBACK] Matched generic operational compliance rule [${r.id}]: effect is ${r.effect.toUpperCase()}`);
              break;
            }
          }
          if (runMatch) break;
        }
      }
    }

    // Evaluate Temporal Overrides / Situation factors
    if (virtualTime === 'offhours') {
      composedRateLimit = Math.max(1, Math.round(composedRateLimit * 0.15)); // Suppress rate-limits significantly at night
      compositionRequireApproval = true; // Auto-foster quarantine during late actions
      steps.push('[TEMPORAL DECAY OVERRIDE] Night off-hours multiplier active: Slashed rate-limits by 85%. Forced Quorum requirements [TRUE].');
    } else if (virtualTime === 'holiday') {
      decision = 'deny';
      reason = 'Federal holiday calendar lock constraints active. All non-emergency agent operations are temporarily blocked.';
      steps.push('[CALENDAR BLOCK STATE] Unified system holiday state overrides active: Swapped effective state to DENY autonomously.');
    }

    // Check Trust Score thresholds against composed minimums
    if (decision === 'allow' && selectedAgent.trustScore < selectedCap.minTrust) {
      decision = 'deny';
      reason = `Trust score breach: calling agent trust rating is [${selectedAgent.trustScore}], but target capability demands a minimum scale of [${selectedCap.minTrust}].`;
      steps.push(`[SECURITY BARRIER] Trust index breach: Agent contains trust [${selectedAgent.trustScore}], Capability requires [${selectedCap.minTrust}]. Allowance denied.`);
    }

    if (decision === 'allow' && steps.length > 0) {
      reason = 'Authorized: composition check confirmed valid permit lineage from system registers.';
    }

    setCalculatedEffective({
      effect: decision,
      reason: reason,
      rulesInteracting: steps.length > 0 ? steps : ['No active policy matches located.'],
      rateLimit: composedRateLimit,
      requiresApproval: compositionRequireApproval
    });
  };

  // Add rule submit handler
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();

    const ruleId = `rule-user-${Math.floor(Math.random() * 899 + 100)}`;
    const rule: PolicyRule = {
      id: ruleId,
      effect: newEffect,
      principal: newAgent,
      action: newCap,
      trustMinimum: Number(newMinTrust),
      rateLimit: Number(newRateLimit),
      requiresApproval: newRequireApproval,
      approvalPath: newRequireApproval ? 'Quorum Security team' : undefined
    };

    onAddPolicyRule(targetPolicyId, rule);
    
    const conflictsCount = validationWarnings.filter(w => w.type === 'conflict').length;
    let alertMsg = `Successfully generated and appended rule [${ruleId}] to chosen governance block!`;
    if (conflictsCount > 0) {
      alertMsg += `\n\n⚠️ Disclaimer: Note that this rule creates ${conflictsCount} active conflict(s) or shadowing exceptions.`;
    }
    alert(alertMsg);
  };

  // Real-time conflict or redundancy checker across the entire policy tree
  const getValidationWarnings = () => {
    const warnings: { type: 'conflict' | 'redundancy'; message: string; ruleId: string; policyName: string; policyType: string }[] = [];

    // Find the policy layer details we are targetting
    const targetPolicy = policies.find(p => p.id === targetPolicyId);
    if (!targetPolicy) return warnings;

    // Evaluate against each active policy
    for (const p of policies) {
      if (!p.active) continue;

      for (const r of p.rules) {
        // Overlap exists if:
        // 1. One principal is '*' or both are identical
        // 2. One action is '*' or both are identical
        const principalOverlap = r.principal === '*' || newAgent === '*' || r.principal === newAgent;
        const actionOverlap = r.action === '*' || newCap === '*' || r.action === newCap;

        if (principalOverlap && actionOverlap) {
          if (r.effect === newEffect) {
            // REDUNDANCY: Exist is equal/broader scope, rendering the new rule redundant
            const existingIsAsBroadOrBroader = (r.principal === '*' || r.principal === newAgent) && 
                                               (r.action === '*' || r.action === newCap);
            if (existingIsAsBroadOrBroader) {
              warnings.push({
                type: 'redundancy',
                message: `This rule is redundant. Active policy "${p.name}" contains an active rule "${r.id}" which already enforces "${r.effect.toUpperCase()}" for this matching scope.`,
                ruleId: r.id,
                policyName: p.name,
                policyType: p.type
              });
            }
          } else {
            // CONFLICT: Opposite policy effects (Shadowing or Contradictions)
            // Priorities: system (3) > owner (2) > runtime (1)
            const getPriority = (type: string) => {
              if (type === 'system') return 3;
              if (type === 'owner') return 2;
              return 1;
            };

            const existingPriority = getPriority(p.type);
            const targetPriority = getPriority(targetPolicy.type);

            let explanation = '';
            if (existingPriority > targetPriority) {
              explanation = `Rule SHADOWED: The higher-priority "${p.name}" (${p.type} layer) already enforces "${r.effect.toUpperCase()}" for this scope. Your new rule will be ignored in practice.`;
            } else if (existingPriority < targetPriority) {
              explanation = `Rule OVERRIDE: This rule will override the lower-priority rule "${r.id}" in "${p.name}" (${p.type} layer) which specifies "${r.effect.toUpperCase()}". Ensure this override is intended.`;
            } else {
              explanation = `CONTRADICTION: Inside the same tier ("${p.name}"), rule "${r.id}" specifies "${r.effect.toUpperCase()}", directly opposing your requested "${newEffect.toUpperCase()}". Verification outcomes may be non-deterministic.`;
            }

            warnings.push({
              type: 'conflict',
              message: explanation,
              ruleId: r.id,
              policyName: p.name,
              policyType: p.type
            });
          }
        }
      }
    }

    return warnings;
  };

  const validationWarnings = getValidationWarnings();

  return (
    <div className="space-y-4" id="policies-tab">
      {/* Composed sovereign system policies columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {policies.map(policy => (
          <div key={policy.id} className="bg-[#0F1115] border border-[#23272E] p-4 rounded flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono border ${
                  policy.type === 'system' ? 'bg-red-950/20 text-red-400 border-red-900/30' :
                  policy.type === 'owner' ? 'bg-indigo-950/20 text-indigo-400 border-indigo-900/30' :
                  'bg-green-950/20 text-green-400 border-green-900/30'
                }`}>
                  {policy.type} Layer
                </span>
                <span className="font-mono text-xs text-slate-500">v{policy.version}</span>
              </div>
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wide">{policy.name}</h3>
              <p className="text-[11px] text-gray-400 leading-normal">
                {policy.type === 'system' ? 'Central sovereign rules prioritized globally across all connections.' :
                 policy.type === 'owner' ? 'Departmental boundaries delegated directly to owner Kate.' :
                 'Fallback operations standards for transient network queries.'}
              </p>

              {/* List of rules */}
              <div className="space-y-2 pt-2 border-t border-[#23272E]">
                <h4 className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Active Rules ({policy.rules.length})</h4>
                {policy.rules.map(rule => (
                  <div key={rule.id} className="bg-[#0B0C0E] border border-[#23272E] p-2.5 rounded text-[11px] space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-blue-400">{rule.id}</span>
                      <span className={`px-1 rounded text-[9px] font-mono font-bold uppercase ${
                        rule.effect === 'allow' ? 'bg-green-950/25 text-green-400' : 'bg-red-950/25 text-red-400'
                      }`}>
                        {rule.effect}
                      </span>
                    </div>
                    <div className="text-gray-400 font-mono text-[10px]">
                      Principal: <strong className="text-gray-300">{rule.principal}</strong> ➔
                      Action: <strong className="text-gray-300">{rule.action}</strong>
                    </div>
                    <div className="text-[9px] text-gray-500 flex gap-2 font-mono">
                      <span>Trust Min: {rule.trustMinimum}</span>
                      <span>● Rate Limit: {rule.rateLimit} req/m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 text-[10px] text-gray-500 font-mono text-right flex items-center justify-end gap-1 border-t border-[#23272E] mt-4">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Active Registry Secure
            </div>
          </div>
        ))}
      </div>

      {/* Composed permission calculator & test form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Composition Permission Calculator (Left 7 Cols) */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded lg:col-span-7 space-y-4">
          <div className="border-b border-[#23272E] pb-3">
            <h3 className="text-xs font-bold text-[#D1D5DB] uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-green-400" />
              Effective Permissions Calculator
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">
              Simulate dynamic evaluation chains under configurable temporal settings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Target Agent</label>
              <select
                value={calcAgentId}
                onChange={(e) => setCalcAgentId(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-[#23272E] p-2 text-xs rounded text-gray-300 focus:outline-none focus:border-blue-500/50"
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Requested Capability</label>
              <select
                value={calcCapId}
                onChange={(e) => setCalcCapId(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-[#23272E] p-2 text-xs rounded text-gray-300 focus:outline-none focus:border-blue-500/50"
              >
                {capabilities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Virtual Time-of-day</label>
              <select
                value={virtualTime}
                onChange={(e) => setVirtualTime(e.target.value as any)}
                className="w-full bg-[#0B0C0E] border border-[#23272E] p-2 text-xs rounded text-gray-300 focus:outline-none focus:border-blue-500/50"
              >
                <option value="business">Business Hours (09:00 - 17:00)</option>
                <option value="offhours">Late Night Off-hours (17:00 - 09:00)</option>
                <option value="holiday">National Declared Holiday</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCalculatePermissions}
            className="w-full py-1.5 bg-[#15181E] hover:bg-[#1C1F26] text-white border border-[#23272E] font-bold text-xs uppercase rounded transition-all tracking-wider font-mono"
          >
            Calculate Composed Permission State
          </button>

          {/* Calculator Output Display */}
          {calculatedEffective && (
            <div className="bg-[#0B0C0E] border border-[#23272E] p-4 rounded space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-rose-950/20">
                <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase font-mono">Effective Outcome:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-widest border ${
                  calculatedEffective.effect === 'allow'
                    ? 'bg-green-950/20 text-green-400 border-green-90D0 border-green-900/30'
                    : 'bg-red-950/20 text-red-400 border-red-900/30'
                }`}>
                  {calculatedEffective.effect === 'allow' ? 'AUTHORIZED' : 'DENIED'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-300">
                <div className="text-[9px] text-gray-500 uppercase font-bold font-mono">Outcome summary:</div>
                <p className="font-bold">{calculatedEffective.reason}</p>
              </div>

              {/* Dynamic steps evaluated */}
              <div className="space-y-1 text-slate-440 pt-2 border-t border-[#23272E]">
                <div className="text-[9px] text-gray-500 uppercase font-mono font-bold">Composition Chain Execution Logs:</div>
                <div className="bg-[#0F1115] p-2.5 rounded font-mono text-[9px] text-gray-400 space-y-1 border border-[#23272E] max-h-32 overflow-y-auto">
                  {calculatedEffective.rulesInteracting.map((rule, idx) => (
                    <div key={idx} className="flex gap-1">
                      <span className="text-gray-650">&gt;</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                  <div className="flex gap-1 text-gray-500">
                    <span className="text-gray-650">&gt;</span>
                    <span>Composed Rate limit allowance: {calculatedEffective.rateLimit} trans/min</span>
                  </div>
                  <div className="flex gap-1 text-gray-500">
                    <span className="text-gray-650">&gt;</span>
                    <span>Quorum triggers: {calculatedEffective.requiresApproval ? 'ACTIVE' : 'INACTIVE'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Append policy rules form (Right 5 Cols) */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded lg:col-span-5 space-y-4">
          <div className="border-b border-[#23272E] pb-3">
            <h3 className="text-xs font-bold text-[#D1D5DB] uppercase tracking-wider flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-[#D1D5DB]" />
              Sovereign Policy Exceptions
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 font-mono text-right">
              Inject custom rules to the active policies registry instantly.
            </p>
          </div>

          <form onSubmit={handleAddRule} className="space-y-3 text-xs text-gray-300">
            <div>
              <label className="text-[10px] text-gray-500 font-bold block mb-1 uppercase font-mono">Target Permission policy</label>
              <select
                value={targetPolicyId}
                onChange={(e) => setTargetPolicyId(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-[#23272E] p-2 rounded text-gray-300 focus:outline-none"
              >
                {policies.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 font-bold block mb-1 uppercase font-mono">Outcome action</label>
                <select
                  value={newEffect}
                  onChange={(e) => setNewEffect(e.target.value as any)}
                  className="w-full bg-[#0B0C0E] border border-[#23272E] p-2 rounded text-gray-300 focus:outline-none"
                >
                  <option value="allow">ALLOW</option>
                  <option value="deny">DENY</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold block mb-1 uppercase font-mono">Agent scopes</label>
                <select
                  value={newAgent}
                  onChange={(e) => setNewAgent(e.target.value)}
                  className="w-full bg-[#0B0C0E] border border-[#23272E] p-2 rounded text-gray-300 focus:outline-none"
                >
                  <option value="*">* (All Agents)</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 font-bold block mb-1 uppercase font-mono">Target Capability</label>
                <select
                  value={newCap}
                  onChange={(e) => setNewCap(e.target.value)}
                  className="w-full bg-[#0B0C0E] border border-[#23272E] p-2 rounded text-gray-300 focus:outline-none"
                >
                  <option value="*">* (All capabilities)</option>
                  {capabilities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold block mb-1 uppercase font-mono">Minimum Trust demanded</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newMinTrust}
                  onChange={(e) => setNewMinTrust(Number(e.target.value))}
                  className="w-full bg-[#0B0C0E] border border-[#23272E] p-1.5 rounded text-gray-300 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-[10px] text-gray-500 font-bold block mb-1 uppercase font-mono">Max rate Limit (req/m)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={newRateLimit}
                  onChange={(e) => setNewRateLimit(Number(e.target.value))}
                  className="w-full bg-[#0B0C0E] border border-[#23272E] p-1.5 rounded text-gray-300 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2 mt-4 select-none">
                <input
                  type="checkbox"
                  id="user-rule-quota-approvals"
                  checked={newRequireApproval}
                  onChange={(e) => setNewRequireApproval(e.target.checked)}
                  className="rounded bg-[#0B0C0E] border-[#23272E] text-blue-600 focus:ring-0 focus:outline-none w-4 h-4 cursor-pointer"
                />
                <label htmlFor="user-rule-quota-approvals" className="text-[10px] text-gray-400 font-bold uppercase cursor-pointer font-mono">
                  Force Quarantine
                </label>
              </div>
            </div>

            {/* Real-time Policy Overlap / Conflict Validation Warning Alert */}
            {validationWarnings.length > 0 && (
              <div id="policy-validation-alert" className="bg-[#1C130D] border border-amber-600/30 p-3 rounded space-y-2 mt-2 transition-all">
                <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[9.5px] font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Policy Validation Alerts ({validationWarnings.length})
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {validationWarnings.map((warning, wIdx) => {
                    const isConflict = warning.type === 'conflict';
                    const isShadowed = warning.message.includes('SHADOWED');
                    const badgeText = isConflict ? (isShadowed ? 'SHADOWED' : 'OVERRIDE') : 'REDUNDANT';
                    const badgeColor = isConflict 
                      ? (isShadowed ? 'bg-red-950/40 text-red-400 border border-red-900/60' : 'bg-blue-950/40 text-blue-400 border border-blue-900/60') 
                      : 'bg-amber-950/40 text-amber-400 border border-amber-900/60';

                    return (
                      <div 
                        key={wIdx} 
                        className={`text-[10px] p-2 rounded border font-mono leading-relaxed transition-all ${
                          isConflict 
                            ? (isShadowed ? 'bg-red-950/15 border-red-950/50 text-red-300' : 'bg-blue-950/10 border-blue-950/40 text-blue-300')
                            : 'bg-amber-950/15 border-amber-950/40 text-amber-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1 font-bold">
                          <span className={`text-[8.5px] px-1.5 py-0.5 rounded uppercase font-bold ${badgeColor}`}>
                            {badgeText}
                          </span>
                          <span className="text-gray-500 text-[9px] font-normal font-mono">ID: {warning.ruleId}</span>
                        </div>
                        <p className="opacity-90">{warning.message}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-[#1A1D23] hover:bg-[#20242D] border border-[#23272E] text-white font-bold uppercase text-[10px] rounded transition-all mt-3 font-mono tracking-wider shadow"
            >
              Append Governance exception
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
