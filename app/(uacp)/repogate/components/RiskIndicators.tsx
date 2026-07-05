import React, { useEffect, useState } from 'react';
import { VerifiedFinding, RiskLevel } from '../types';
import { AlertCircle, CheckCircle, ShieldAlert, BadgeInfo, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RiskIndicatorsProps {
  findings: VerifiedFinding[];
  riskLevel: RiskLevel;
  isScanning: boolean;
  filesScanned: number;
  runId?: string;
}

export const RiskIndicators: React.FC<RiskIndicatorsProps> = ({ 
  findings, 
  riskLevel, 
  isScanning,
  filesScanned,
  runId
}) => {
  const [riskHistory, setRiskHistory] = useState<{ runId: string; riskLevel: RiskLevel }[]>(() => {
    try {
      const saved = localStorage.getItem('veklom_run_risk_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading risk history', e);
    }
    // Pre-seed matching the EvidenceLedger's pre-seeded runs
    return [
      { runId: 'RUN_18FA', riskLevel: 'HIGH' },
      { runId: 'RUN_191B', riskLevel: 'LOW' },
      { runId: 'RUN_204A', riskLevel: 'MEDIUM' },
      { runId: 'RUN_211C', riskLevel: 'MEDIUM' },
      { runId: 'RUN_225M', riskLevel: 'CRITICAL' },
      { runId: 'run_8fa29d', riskLevel: 'CRITICAL' }, // Initial default run
    ];
  });

  // Track run completion to dynamically log finished run statistics
  useEffect(() => {
    if (isScanning || !runId) return;

    const currentRunNormalized = runId.toUpperCase();

    setRiskHistory(prev => {
      // Avoid duplicates
      if (prev.some(h => h.runId.toUpperCase() === currentRunNormalized)) {
        return prev;
      }

      const updated = [...prev, { runId, riskLevel }];
      // Bound the history series
      if (updated.length > 10) {
        updated.shift();
      }

      try {
        localStorage.setItem('veklom_run_risk_history', JSON.stringify(updated));
      } catch (err) {
        console.error('Error writing risk history', err);
      }
      return updated;
    });
  }, [isScanning, runId, riskLevel]);

  // Retrieve the previous scan run
  const getPreviousRun = () => {
    if (!runId) return null;
    const currentRunNormalized = runId.toUpperCase();

    // Look back sequentially for the nearest run with a different ID
    for (let i = riskHistory.length - 1; i >= 0; i--) {
      if (riskHistory[i].runId.toUpperCase() !== currentRunNormalized) {
        return riskHistory[i];
      }
    }

    // Fallback to second-to-last if available
    if (riskHistory.length > 1) {
      return riskHistory[riskHistory.length - 2];
    }
    return null;
  };

  const previousRun = getPreviousRun();
  const previousLevel = previousRun ? previousRun.riskLevel : null;

  const riskScores: Record<RiskLevel, number> = {
    'SAFE': 1,
    'LOW': 2,
    'MEDIUM': 3,
    'HIGH': 4,
    'CRITICAL': 5
  };

  const currentScore = riskScores[riskLevel] || 0;
  const previousScore = previousLevel ? (riskScores[previousLevel] || 0) : 0;
  const delta = previousLevel ? (currentScore - previousScore) : 0;

  const getDriftDetails = () => {
    if (!previousLevel) return '';
    return `${previousLevel} ➔ ${riskLevel}`;
  };
  
  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'CRITICAL':
      case 'HIGH':
        return (
          <div className="w-12 h-12 border-2 border-[#FF6B00] rounded-full flex items-center justify-center font-bold text-[#FF6B00] text-xl animate-bounce">
            !
          </div>
        );
      case 'MEDIUM':
        return (
          <div className="w-12 h-12 border-2 border-[#FF6B00] rounded-full flex items-center justify-center font-bold text-[#FF6B00] text-lg">
            ?
          </div>
        );
      case 'LOW':
      case 'SAFE':
        return (
          <div className="w-12 h-12 border-2 border-[#00FF41] rounded-full flex items-center justify-center font-bold text-[#00FF41] text-lg">
            ✓
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 border border-[#333] rounded-full flex items-center justify-center text-gray-500 font-mono">
            -
          </div>
        );
    }
  };

  const getRiskColorClass = (risk: RiskLevel) => {
    switch (risk) {
      case 'CRITICAL':
        return 'text-red-500 border-red-500/20 bg-red-950/20';
      case 'HIGH':
        return 'text-[#FF6B00] border-[#FF6B00]/20 bg-[#FF6B00]/10';
      case 'MEDIUM':
        return 'text-yellow-500 border-yellow-500/10 bg-yellow-950/10';
      case 'LOW':
        return 'text-[#00FF41] border-[#00FF41]/10 bg-[#00FF41]/10';
      default:
        return 'text-gray-400 border-[#333] bg-neutral-900/40';
    }
  };

  return (
    <div className="p-6 md:p-8 flex-1 border-b border-[#333] flex flex-col justify-between">
      <div>
        <h2 className="font-mono text-[11px] tracking-widest text-[#666] uppercase mb-10">02 / Risk Indicators</h2>
        
        {/* Risk Assessment Block */}
        <div className="space-y-10">
          <div className="flex justify-between items-start">
            <div className="text-[38px] md:text-[44px] font-black leading-none tracking-tight text-white uppercase">
              {riskLevel}
              <br />
              <span className="text-[12px] md:text-[14px] font-mono text-[#666] tracking-widest uppercase font-normal block mt-2">
                Risk Assessment Level
              </span>
            </div>
            {getRiskIcon()}
          </div>

          {/* Risk Comparison Summary Card */}
          {previousLevel && (
            <div className="bg-[#090909] p-3 border border-[#1b1b1b] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-[11px] animate-[fadeIn_0.2s_ease-out]">
              <div className="flex flex-col">
                <span className="text-[#666] uppercase text-[9px] tracking-wider font-bold">Risk Drift Delta</span>
                <span className="text-gray-400 mt-0.5">
                  vs Run #{previousRun?.runId?.replace(/^run_/i, '').toUpperCase()} ({previousLevel})
                </span>
              </div>
              
              <div className="flex items-center space-x-1.5 shrink-0">
                {delta > 0 ? (
                  <div className="flex items-center text-red-500 font-bold bg-red-950/20 border border-red-500/30 px-2.5 py-1 rounded">
                    <TrendingUp className="w-3.5 h-3.5 mr-1 text-red-500" />
                    <span>+{delta} DRIFT ({getDriftDetails()})</span>
                  </div>
                ) : delta < 0 ? (
                  <div className="flex items-center text-[#00FF41] font-bold bg-[#00FF41]/5 border border-[#00FF41]/30 px-2.5 py-1 rounded">
                    <TrendingDown className="w-3.5 h-3.5 mr-1 text-[#00FF41]" />
                    <span>{delta} DRIFT ({getDriftDetails()})</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400 font-bold bg-neutral-900/40 border border-neutral-800 px-2.5 py-1 rounded">
                    <Minus className="w-3.5 h-3.5 mr-1 text-gray-600" />
                    <span>STABLE ({riskLevel})</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scanned files tracker */}
          <div className="flex justify-between items-center bg-[#090909] py-2.5 px-4 border border-[#222] font-mono text-[11px]">
            <span className="text-gray-500 uppercase">GPC File Coverage</span>
            <span className="text-[#00FF41] font-bold">
              {isScanning ? 'SCANNING...' : `${filesScanned} PATHS COVERED`}
            </span>
          </div>

          {/* Verified Findings section */}
          <div className="border-l-4 border-[#FF6B00] pl-4">
            <h3 className="text-[14px] font-bold uppercase mb-4 text-white tracking-wider flex items-center space-x-2">
              <span>Verified Findings ({findings.length})</span>
            </h3>

            {findings.length === 0 ? (
              <p className="text-[12px] text-gray-500 italic font-mono uppercase bg-[#090909] p-3 border border-[#1C1C1C] rounded">
                {isScanning ? '// Evaluating file architectures...' : '// No structural governance deviations found.'}
              </p>
            ) : (
              <div className="max-h-[220px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-[#333]">
                {findings.map((finding) => (
                  <div 
                    key={finding.id} 
                    className="border border-[#222] bg-[#0A0A0A] p-3 text-[12px] flex flex-col space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-300 break-all pr-2">{finding.path}</span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 border rounded uppercase font-bold shrink-0 ${getRiskColorClass(finding.risk_level)}`}>
                        {finding.risk_level}
                      </span>
                    </div>
                    <div className="text-gray-500 text-[11px] leading-relaxed">
                      {finding.matched_rule} – <span className="italic">{finding.reason}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#FF6B00] uppercase mt-1">
                      Action Required: {finding.policy_result.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
