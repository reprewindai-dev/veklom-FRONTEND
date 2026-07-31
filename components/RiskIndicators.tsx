import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { VerifiedFinding, RiskLevel } from '../types';
import { 
  AlertCircle, 
  CheckCircle, 
  ShieldAlert, 
  BadgeInfo, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Network,
  HelpCircle,
  BookOpen,
  Sparkles,
  Layers,
  Lock,
  Shield,
  Workflow,
  Cpu,
  ChevronDown,
  ChevronUp,
  Wrench,
  CheckSquare,
  Activity,
  RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface EducationalDetails {
  whyItBroke: string;
  professionalFix: string;
  poltergeistAuto: string;
  remediationSteps: string[];
}

export function getEducationalDetails(matchedRule: string, path: string): EducationalDetails {
  const ruleLower = (matchedRule || '').toLowerCase();
  const pathLower = (path || '').toLowerCase();

  if (ruleLower.includes('secrets') || pathLower.includes('env') || pathLower.includes('key') || pathLower.includes('pem')) {
    return {
      whyItBroke: "Plaintext secrets or cryptographic keys were stored directly in version control. Storing credentials (such as API tokens, passwords, database URLs, or SSL keys) in a public or private git repository exposes them to unauthorized reading, risking immediate credential harvesting, system compromise, and financial liabilities.",
      professionalFix: "Isolate all secrets from your codebase. Use a secure backend server proxy combined with a secrets vault provider (such as Google Cloud Secret Manager, AWS Secrets Manager, or HashiCorp Vault) to inject values into the application context at runtime. Always add files like '.env', '.key', or '.pem' to your '.gitignore' file at the repository root.",
      poltergeistAuto: "The M2M Fix Daemon immediately intercepted the unencrypted credentials leak, virtualized and quarantined the target file, replaced the secret data with a dynamic dotenv placeholder config, and updated the system state to prevent any downstream automated tasks from exposing the true secret values.",
      remediationSteps: [
        "Revoke and rotate the exposed credentials immediately (treat the old ones as public).",
        "Add '.env', '.key', and '.pem' files to your '.gitignore' file so they are never committed.",
        "Run 'git rm --cached <file_path>' to untrack and remove the files from Git history.",
        "Migrate configurations to Cloud Secret Manager and inject them securely as environment variables."
      ]
    };
  }

  if (ruleLower.includes('auth') || pathLower.includes('auth') || pathLower.includes('login') || pathLower.includes('jwt') || pathLower.includes('session')) {
    return {
      whyItBroke: "Detected access or modification attempts to user authorization modules or session routines. Direct mutation of JWT algorithms, session claims, login guards, or OAuth settings can introduce security vulnerabilities that allow token spoofing, privilege bypasses, or administrative hijacking.",
      professionalFix: "Consolidate authorization rules, login guards, and session claims validation into centralized, read-only middleware blocks. Use modern, industry-standard authentication libraries. Sign all JSON Web Tokens with robust asymmetric algorithms (RS256 or ES256) using rotated private keys, and enforce strict SameSite, Secure, and HttpOnly cookies.",
      poltergeistAuto: "The M2M Fix Daemon spawned Refactor-Agent-Alpha and Security-Shield-Guard to wrap the authorization pathway, automatically enforcing strict JWT claims validation, schema constraints, and isolated request-handling bounds to deny any arbitrary session manipulation.",
      remediationSteps: [
        "Audit JWT configurations to ensure they use strong asymmetric algorithms (e.g., RS256) instead of HS256.",
        "Enforce HttpOnly, Secure, and SameSite=Strict on all cookies to prevent cross-site scripting (XSS) leaks.",
        "Configure strict rate-limiting on user login and verification endpoints.",
        "Validate user roles on the server side for every protected API request."
      ]
    };
  }

  if (ruleLower.includes('stripe') || ruleLower.includes('billing') || pathLower.includes('stripe') || pathLower.includes('payment') || pathLower.includes('invoice')) {
    return {
      whyItBroke: "Direct query or write attempt detected on billing pipelines or Stripe payment hooks. Manipulating billing parameters, transaction webhooks, or subscription controllers can lead to major accounting inaccuracies, revenue leakage, or transactional poisoning.",
      professionalFix: "Maintain strict server-side validation of all transactions. Never trust pricing parameters sent directly from client-side frameworks. For payment notifications, always enforce official cryptographic signature verification inside Stripe webhook receivers to verify the payload originates from Stripe's official servers.",
      poltergeistAuto: "The M2M Fix Shield locked down the active billing pipeline, dynamically patched webhook handler scripts to assert signature verification, and sandbox-redirected billing actions into a harmless emulator.",
      remediationSteps: [
        "Incorporate official signature verification on webhook receivers using 'stripe.webhooks.constructEvent'.",
        "Securely store your Stripe Webhook Signing Secret in Cloud Secret Manager.",
        "Calculate subscription fees and invoice totals strictly on the backend, never using values from the client.",
        "Conduct quarterly database audits comparing transaction logs against the Stripe ledger."
      ]
    };
  }

  if (ruleLower.includes('migrations') || ruleLower.includes('rbac') || ruleLower.includes('tenant') || pathLower.includes('migrations') || pathLower.includes('.sql') || pathLower.includes('schema')) {
    return {
      whyItBroke: "Detected raw SQL migrations or changes to Multi-Tenant RBAC boundary policies. Directly altering database schemas, user permissions, or tenant mapping logic bypasses governance controls and can cause catastrophic data leakage between tenants.",
      professionalFix: "Strictly segregate multi-tenant resources. Manage database schema alterations through specialized migration frameworks (such as Drizzle, Prisma, or Flyway) executed by secure, audited pipelines. Enforce Row-Level Security (RLS) in PostgreSQL to ensure a tenant can only query its own rows.",
      poltergeistAuto: "The M2M Fix system blocked raw query mutations, quarantined the migration script, and dynamically injected PostgreSQL Row-Level Security (RLS) filters to secure multi-tenant storage boundaries against unauthorized cross-tenant queries.",
      remediationSteps: [
        "Never run raw database statements constructed with client inputs (enforce prepared parameterization).",
        "Incorporate PostgreSQL Row-Level Security: 'ALTER TABLE tenant_data ENABLE ROW LEVEL SECURITY;'.",
        "Execute schema migrations strictly using verified automated pipelines, never via active shell prompts.",
        "Set up isolated DB connections with restricted execution permissions for user sessions."
      ]
    };
  }

  if (ruleLower.includes('deploy') || ruleLower.includes('k8s') || ruleLower.includes('terraform') || pathLower.includes('deploy') || pathLower.includes('k8s') || pathLower.includes('docker')) {
    return {
      whyItBroke: "Attempted to mutate live container deployment manifests, Kubernetes files, or cloud infrastructure definitions. Directly updating live environment parameters bypasses critical integration testing, risking massive outages and cluster-wide privilege escalations.",
      professionalFix: "Manage all infrastructure configurations using Infrastructure as Code (IaC) principles. Enforce a GitOps workflow (using tools like ArgoCD or Flux) to reconcile live cluster configurations with cryptographically signed, peer-reviewed commits in your master branch.",
      poltergeistAuto: "The M2M Fix Daemon locked down write privileges to the infrastructure manifests directory, and virtualized container adjustment requests inside a dry-run emulator to shield the live Kubernetes cluster.",
      remediationSteps: [
        "Implement branch protection rules preventing direct master branch pushes to the 'deploy/' directory.",
        "Integrate static manifest checkers (e.g., Kube-Linter or Checkov) inside continuous integration gates.",
        "Set Kubernetes pods to run with non-root privileges and activate read-only root filesystems.",
        "Manage environment secrets securely using specialized cluster controllers or external vault integrations."
      ]
    };
  }

  return {
    whyItBroke: "Detected access to continuous integration (CI/CD) pipelines or workflow files. Unauthorized mutations on actions or pipeline definitions can permit malicious code injection inside privileged runner environments, potentially leaking source code and cloud credentials.",
    professionalFix: "Apply strict repository-level write permissions on all CI/CD pipelines. Require mandatory pull request reviews, pass check runs, and enforce branch protections. Enforce runner token permission limits (read-only) and pin action dependencies to exact git commit SHAs.",
    poltergeistAuto: "The M2M Fix Daemon locked CI/CD configurations in read-only mode, parsed workflows for suspicious third-party action injections, and verified container runner sandbox constraints.",
    remediationSteps: [
      "Limit GitHub Actions tokens to read-only permissions inside repository settings.",
      "Pin third-party actions to an exact 40-character commit SHA instead of mutable tags.",
      "Require maintainer approval for all workflow executions initiated by external contributors.",
      "Implement branch protection rules requiring approved reviews before pull requests can merge."
    ]
  };
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'directory' | 'file' | 'finding';
  riskLevel?: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findingRule?: string;
  findingReason?: string;
  remediated?: boolean;
}

interface GraphLink {
  source: string;
  target: string;
  type: 'hierarchy' | 'finding';
}

interface TopologyGraphProps {
  scannedFilesList: string[];
  findings: VerifiedFinding[];
  isScanning: boolean;
}

const TopologyGraph: React.FC<TopologyGraphProps> = ({ scannedFilesList, findings, isScanning }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 260 });
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions({ width: width || 300, height: 260 });
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (isScanning || scannedFilesList.length === 0) {
      return;
    }

    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    const addNode = (id: string, name: string, type: 'directory' | 'file' | 'finding', riskLevel?: any, rule?: string, reason?: string, remediated?: boolean) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, name, type, riskLevel, findingRule: rule, findingReason: reason, remediated });
      }
    };

    addNode('root', 'Root', 'directory');

    scannedFilesList.forEach(filePath => {
      const parts = filePath.split('/');
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (i === parts.length - 1) {
          const fileFinding = findings.find(f => f.path === filePath);
          const risk = fileFinding ? fileFinding.risk_level : 'SAFE';
          const remediated = fileFinding ? fileFinding.remediated : false;
          addNode(currentPath, part, 'file', risk, undefined, undefined, remediated);
          
          links.push({
            source: parentPath || 'root',
            target: currentPath,
            type: 'hierarchy'
          });
        } else {
          addNode(currentPath, part, 'directory');
          
          links.push({
            source: parentPath || 'root',
            target: currentPath,
            type: 'hierarchy'
          });
        }
      }
    });

    findings.forEach((finding, index) => {
      const findingId = `finding-${finding.id || index}`;
      addNode(findingId, finding.matched_rule, 'finding', finding.risk_level, finding.matched_rule, finding.reason, finding.remediated);
      
      const targetFile = scannedFilesList.includes(finding.path) ? finding.path : 'root';
      links.push({
        source: targetFile,
        target: findingId,
        type: 'finding'
      });
    });

    const nodes = Array.from(nodesMap.values());

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(d => d.type === 'finding' ? 25 : 45))
      .force('charge', d3.forceManyBody().strength(-40))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(12));

    const gContainer = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        gContainer.attr('transform', event.transform);
      });
    svg.call(zoom);

    const link = gContainer.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.type === 'finding' ? '#ef4444' : '#2a2a2a')
      .attr('stroke-width', d => d.type === 'finding' ? 1.5 : 1)
      .attr('stroke-dasharray', d => d.type === 'finding' ? '3,3' : 'none');

    const node = gContainer.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    node.append('circle')
      .attr('r', d => d.type === 'finding' ? 7 : d.type === 'directory' ? 5 : 4)
      .attr('fill', d => {
        if (d.remediated) return '#00ff41';
        if (d.type === 'finding') {
          return d.riskLevel === 'CRITICAL' ? '#ef4444' : '#ff6b00';
        }
        if (d.type === 'directory') return '#666666';
        
        if (d.riskLevel === 'CRITICAL') return '#ef4444';
        if (d.riskLevel === 'HIGH') return '#ff6b00';
        if (d.riskLevel === 'MEDIUM') return '#eab308';
        return '#00ff41';
      })
      .attr('stroke', d => d.type === 'finding' ? (d.remediated ? '#00ff41' : '#ffffff') : 'none')
      .attr('stroke-width', d => d.type === 'finding' ? 1 : 0);

    node.append('text')
      .text(d => d.type === 'finding' ? (d.remediated ? '🛡️' : '⚠️') : d.name)
      .attr('x', d => d.type === 'finding' ? 0 : 8)
      .attr('y', d => d.type === 'finding' ? 3 : 3)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', d => d.type === 'finding' ? '9px' : '7.5px')
      .attr('fill', d => d.type === 'finding' ? (d.remediated ? '#00ff41' : '#ef4444') : '#888888')
      .attr('text-anchor', d => d.type === 'finding' ? 'middle' : 'start')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    node.on('mouseover', (event, d) => {
      setHoveredNode(d);
    }).on('mouseout', () => {
      setHoveredNode(null);
    });

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [scannedFilesList, findings, dimensions.width, isScanning]);

  return (
    <div className="relative border border-[#222] bg-[#050505] rounded overflow-hidden" ref={wrapperRef}>
      {isScanning ? (
        <div className="h-[260px] flex flex-col items-center justify-center font-mono text-xs text-neutral-500 gap-2">
          <div className="w-5 h-5 border border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
          <span>CONSTRUCTING SECURE GOVERNANCE GRAPH...</span>
        </div>
      ) : scannedFilesList.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center font-mono text-xs text-neutral-600">
          // AWAITING SCAN TO PLOT TOPOLOGY
        </div>
      ) : (
        <>
          <svg ref={svgRef} width="100%" height={260} className="cursor-grab active:cursor-grabbing" />
          
          {hoveredNode && (
            <div className="absolute top-2 left-2 right-2 bg-black/95 backdrop-blur-sm border border-[#333] p-2.5 rounded font-mono text-[10px] text-gray-300 leading-normal z-10 pointer-events-none transition-all">
              <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1 mb-1">
                <span className="font-bold text-white uppercase truncate">{hoveredNode.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                  hoveredNode.type === 'finding' ? 'bg-red-950/40 text-red-500 border border-red-500/30' :
                  hoveredNode.type === 'directory' ? 'bg-neutral-800 text-gray-400' :
                  hoveredNode.riskLevel === 'SAFE' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' :
                  'bg-red-950/40 text-orange-500 border border-orange-500/30'
                }`}>
                  {hoveredNode.type}
                </span>
              </div>
              <div className="space-y-0.5">
                {hoveredNode.type === 'finding' ? (
                  <>
                    <div><span className="text-gray-500 uppercase">Policy violated:</span> <span className="text-red-400 font-bold">{hoveredNode.findingRule}</span></div>
                    <div><span className="text-gray-500 uppercase">Reason:</span> <span className="text-neutral-400 italic">{hoveredNode.findingReason}</span></div>
                    <div><span className="text-gray-500 uppercase">Severity risk:</span> <span className="text-red-500 font-black uppercase">{hoveredNode.riskLevel}</span></div>
                  </>
                ) : (
                  <>
                    <div><span className="text-gray-500 uppercase">Artifact path:</span> <span className="text-gray-300 font-mono break-all">{hoveredNode.id}</span></div>
                    {hoveredNode.type === 'file' && (
                      <div><span className="text-gray-500 uppercase">Security status:</span> <span className={`font-bold ${hoveredNode.riskLevel === 'SAFE' ? 'text-emerald-400' : 'text-orange-400'}`}>{hoveredNode.riskLevel === 'SAFE' ? 'GOVERNANCE SECURE' : 'POLICY VIOLATION'}</span></div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[8px] font-mono text-gray-500 uppercase tracking-tight pointer-events-none bg-black/60 backdrop-blur-[2px] px-2 py-1 rounded border border-neutral-900">
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00ff41]"></span><span>Safe</span></span>
              <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]"></span><span>High</span></span>
              <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span><span>Critical</span></span>
              <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-[#666]"></span><span>Dir</span></span>
            </div>
            <span className="text-[7.5px] opacity-60">Hover / Drag to inspect</span>
          </div>
        </>
      )}
    </div>
  );
};

const CustomTelemetryTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const remediated = data.remediated !== undefined ? data.remediated : 0;
    const blocked = data.blocked !== undefined ? data.blocked : 0;
    const valMsg = data.valueMessage || 'Sovereign governance run verified successfully. Compliance standard fully maintained.';

    return (
      <div className="bg-[#050505] border border-[#222] p-3 text-left font-mono text-[10px] space-y-2 max-w-[280px] rounded-xs shadow-[0_10px_20px_rgba(0,0,0,0.8)] select-none">
        <div className="border-b border-[#1b1b1b] pb-1.5 flex items-center justify-between">
          <span className="font-bold text-gray-300">BUILD COMMIT: <span className="text-white font-black">{label}</span></span>
          <span className="text-[8px] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 text-[#00FF41] font-bold">VERIFIED</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Remediations:</span>
            <span className="text-[#00FF41] font-bold">{remediated} active patch{remediated === 1 ? '' : 'es'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Policy Blocks:</span>
            <span className="text-[#FF6B00] font-bold">{blocked} contained event{blocked === 1 ? '' : 's'}</span>
          </div>
        </div>

        <div className="border-t border-[#111] pt-1.5 text-neutral-400 font-sans text-[9.5px] leading-relaxed">
          <strong className="text-gray-300 block font-mono text-[8px] uppercase tracking-wider text-neutral-500 mb-0.5">Value Insight:</strong>
          {valMsg}
        </div>
      </div>
    );
  }
  return null;
};

interface RiskIndicatorsProps {
  findings: VerifiedFinding[];
  riskLevel: RiskLevel;
  isScanning: boolean;
  filesScanned: number;
  runId?: string;
  scannedFilesList?: string[];
  history?: any[];
  onResetHistory?: () => void;
}

export const RiskIndicators: React.FC<RiskIndicatorsProps> = ({ 
  findings, 
  riskLevel, 
  isScanning,
  filesScanned,
  runId,
  scannedFilesList = [],
  history = [],
  onResetHistory
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

  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

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

  const criticalCount = findings.filter(f => f.risk_level === 'CRITICAL').length;
  const highCount = findings.filter(f => f.risk_level === 'HIGH').length;
  const mediumCount = findings.filter(f => f.risk_level === 'MEDIUM').length;
  const lowCount = findings.filter(f => f.risk_level === 'LOW').length;

  // 1. Raw human developer posture score (No auto-remediations subtracted/excluded)
  const humanOperatorScore = findings.length === 0 
    ? 100 
    : Math.max(5, 100 - (criticalCount * 30 + highCount * 15 + mediumCount * 8 + lowCount * 4));

  // 2. Active secure posture with M2M Fix in the mix (Remediated findings are excluded/resolved)
  const activeCritical = findings.filter(f => f.risk_level === 'CRITICAL' && !f.remediated).length;
  const activeHigh = findings.filter(f => f.risk_level === 'HIGH' && !f.remediated).length;
  const activeMedium = findings.filter(f => f.risk_level === 'MEDIUM' && !f.remediated).length;
  const activeLow = findings.filter(f => f.risk_level === 'LOW' && !f.remediated).length;

  const m2mShieldScore = findings.length === 0
    ? 100
    : Math.max(5, 100 - (activeCritical * 30 + activeHigh * 15 + activeMedium * 8 + activeLow * 4));

  const postureUplift = m2mShieldScore - humanOperatorScore;

  const getRiskLabelColor = () => {
    switch (riskLevel) {
      case 'CRITICAL': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'LOW': return 'text-[#00FF41]';
      default: return 'text-[#00FF41]';
    }
  };

  const getRiskStatusPhrase = () => {
    switch (riskLevel) {
      case 'CRITICAL': return 'DEGRADED / ACTION REQUIRED';
      case 'HIGH': return 'SHIELD WARN / COMPLIANCE GAPS';
      case 'MEDIUM': return 'INSPECTION ADVISED';
      case 'LOW': return 'MINIMAL COMPLIANCE WARNINGS';
      default: return 'GOVERNANCE SECURE & NOMINAL';
    }
  };

  return (
    <div className="p-6 md:p-8 flex-1 border-b border-[#333] flex flex-col justify-between">
      <div>
        <h2 className="font-mono text-[11px] tracking-widest text-[#666] uppercase mb-6">02 / Enterprise Posture & Risk</h2>
        
        {/* Risk Assessment Block */}
        <div className="space-y-6">
          {/* Auditable Side-by-Side Posture Comparison Block */}
          <div className="bg-[#050505] border border-[#1b1b1b] rounded-sm divide-y divide-[#1b1b1b] overflow-hidden animate-[fadeIn_0.25s_ease-out]">
            {/* Header banner */}
            <div className="px-4 py-2.5 bg-neutral-900/60 flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Auditable Posture Ledger Delta</span>
              </span>
              <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${postureUplift > 0 ? 'bg-[#00FF41] animate-ping' : 'bg-neutral-600'}`} />
                <span>System: {postureUplift > 0 ? 'ACTIVE MITIGATION' : 'STANDBY'}</span>
              </span>
            </div>

            {/* Score cards side-by-side */}
            <div className="grid grid-cols-2 divide-x divide-[#1b1b1b] bg-[#020202]">
              {/* Left: Original Human Developer Score */}
              <div className="p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[8.5px] font-mono text-neutral-500 uppercase tracking-wider">01 / Raw Repo Posture</span>
                  </div>
                  <span className="text-[9.5px] font-sans text-neutral-400 block mt-0.5 leading-tight">
                    Code as-submitted by developer
                  </span>
                </div>
                
                <div className="flex items-baseline space-x-1.5">
                  <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    humanOperatorScore > 80 ? 'text-[#00FF41]' : humanOperatorScore > 40 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {humanOperatorScore}%
                  </span>
                  <span className="text-[9px] font-mono text-neutral-500">POSTURE</span>
                </div>
                
                {/* Visual bar */}
                <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      humanOperatorScore > 80 ? 'bg-[#00FF41]' : humanOperatorScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${humanOperatorScore}%` }}
                  />
                </div>
              </div>

              {/* Right: M2M Fix Shield Score */}
              <div className="p-4 flex flex-col justify-between space-y-3 bg-gradient-to-br from-black to-[#000d02]">
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[8.5px] font-mono text-[#00FF41] uppercase tracking-widest font-black">02 / M2M Fix Active</span>
                  </div>
                  <span className="text-[9.5px] font-sans text-neutral-400 block mt-0.5 leading-tight">
                    Real-time container shielded state
                  </span>
                </div>
                
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#00FF41] drop-shadow-[0_0_10px_rgba(0,255,65,0.2)]">
                    {m2mShieldScore}%
                  </span>
                  <span className="text-[9px] font-mono text-neutral-400">SHIELDED</span>
                </div>

                {/* Visual bar */}
                <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#00FF41] transition-all duration-500"
                    style={{ width: `${m2mShieldScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom summary and uplift comparison */}
            <div className="px-4 py-3 bg-[#040404] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10.5px]">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 font-mono text-[9px] uppercase tracking-wider">UPLIFT DELTA:</span>
                {postureUplift > 0 ? (
                  <span className="font-mono text-[#00FF41] font-black bg-[#00FF41]/10 px-2.5 py-1 rounded border border-[#00FF41]/25 flex items-center gap-1.5 text-[10px] tracking-wide animate-pulse">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00FF41]" />
                    <span>+{postureUplift}% Security Value Uplift</span>
                  </span>
                ) : (
                  <span className="font-mono text-gray-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 flex items-center gap-1 text-[9px]">
                    <Minus className="w-3 h-3" />
                    <span>0% Delta (Daemon Standby Mode)</span>
                  </span>
                )}
              </div>
              
              <div className="text-neutral-500 font-sans text-[10px] leading-relaxed max-w-sm">
                {postureUplift > 0 
                  ? "✓ M2M auto-agents mitigated active risks, securing local workloads."
                  : "ℹ Activate the M2M Fix Daemon on the left sidebar to neutralize active threat profiles."
                }
              </div>
            </div>
          </div>

          {/* 2x2 Enterprise Telemetry Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#080808] border border-[#181818] p-3 rounded">
              <span className="text-[8.5px] font-mono text-neutral-500 uppercase block tracking-wider">Active Run Token</span>
              <span className="text-[11px] font-mono text-neutral-300 font-bold mt-1 block">
                {runId ? `#${runId.replace(/^run_/i, '').toUpperCase()}` : 'AWAITING...'}
              </span>
            </div>
            
            <div className="bg-[#080808] border border-[#181818] p-3 rounded">
              <span className="text-[8.5px] font-mono text-neutral-500 uppercase block tracking-wider">Intercept Priority</span>
              <span className={`text-[11px] font-mono font-bold mt-1 block uppercase ${getRiskLabelColor()}`}>
                {riskLevel} RISK
              </span>
            </div>

            <div className="bg-[#080808] border border-[#181818] p-3 rounded">
              <span className="text-[8.5px] font-mono text-neutral-500 uppercase block tracking-wider">Policy Intercepts</span>
              <span className="text-[11px] font-mono text-neutral-300 font-bold mt-1 block">
                {findings.length} VIOLATIONS
              </span>
            </div>

            <div className="bg-[#080808] border border-[#181818] p-3 rounded">
              <span className="text-[8.5px] font-mono text-neutral-500 uppercase block tracking-wider">Security State</span>
              <span className="text-[11px] font-mono text-[#00ff41] font-bold mt-1 block uppercase">
                ACTIVE MONITOR
              </span>
            </div>
          </div>

          {/* Risk Comparison Summary Card */}
          {previousLevel && (
            <div className="bg-[#090909] p-3 border border-[#1b1b1b] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-[11px] animate-[fadeIn_0.2s_ease-out]">
              <div className="flex flex-col">
                <span className="text-[#666] uppercase text-[9px] tracking-wider font-bold">Risk Drift Delta</span>
                <span className="text-gray-400 mt-0.5">
                  vs Run #{previousRun.runId.replace(/^run_/i, '').toUpperCase()} ({previousLevel})
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

          {/* GPC Historical Sweep Telemetry Section with SOC2 Value-Added Remediation trend chart */}
          <div className="space-y-4 border-t border-[#222]/60 pt-5 animate-[fadeIn_0.35s_ease-out]">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-mono font-bold uppercase text-[#666] tracking-widest flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>03 / GPC Historical Sweep Telemetry</span>
              </h3>
              
              {onResetHistory && (
                <button
                  onClick={onResetHistory}
                  title="Reset sweep run statistics"
                  className="flex items-center space-x-1 px-2.5 py-1 border border-[#222] hover:border-[#FF6B00] hover:text-white bg-[#080808] text-gray-500 rounded-sm transition-colors cursor-pointer text-[9px] font-mono"
                >
                  <RotateCcw className="w-2.5 h-2.5 text-[#FF6B00]" />
                  <span className="tracking-widest uppercase text-[8px] font-black">Reset Trend Data</span>
                </button>
              )}
            </div>

            {/* Explanation card explaining *why* this historical data is valuable immediately */}
            <div className="p-4 bg-gradient-to-br from-[#060606] to-[#010a02] border border-[#1b2a1c]/45 rounded-sm flex flex-col md:flex-row gap-4 items-start select-none">
              <div className="p-2 bg-[#00ff41]/5 rounded border border-[#00ff41]/20 text-[#00ff41] mt-0.5 shrink-0">
                <Sparkles className="w-4 h-4 text-[#00ff41]" />
              </div>
              <div className="space-y-1">
                <span className="text-[10.5px] font-mono font-black text-[#00ff41] uppercase tracking-wider block">SOC2 compliance & audit-ready protection</span>
                <p className="text-[10px] leading-relaxed text-gray-400 font-sans">
                  Vulnerability audits shouldn&apos;t just show scary red errors. Real cybersecurity value is showing <strong>vulnerabilities neutralised without breaking live code</strong>. This ledger tracks passive blocks alongside <strong>Value-Added Remediations</strong> applied to keep your systems operational.
                </p>
              </div>
            </div>

            {/* Recharts Area Chart displaying Value-Added Remediation vs Policy Blocked */}
            <div className="p-4 bg-black border border-[#1b1b1b] rounded-sm flex flex-col gap-3 min-h-[260px]">
              <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider text-[#555]">
                <span>Active Protection Run Delta Trend</span>
                <span className="text-gray-400">Total Runs Logged: {history.length}</span>
              </div>

              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={history}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      {/* Remediated soft green glow gradient */}
                      <linearGradient id="remediatedColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF41" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#00FF41" stopOpacity={0.00}/>
                      </linearGradient>
                      {/* Blocked soft orange/red warning gradient */}
                      <linearGradient id="blockedColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#FF6B00" stopOpacity={0.00}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#121212" strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#444"
                      fontSize={9}
                      fontFamily="monospace"
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#444"
                      fontSize={9}
                      fontFamily="monospace"
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTelemetryTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={24} 
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{
                        fontFamily: 'monospace',
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        paddingBottom: '5px'
                      }}
                      formatter={(value) => {
                        const isRem = value === 'remediated';
                        const color = isRem ? 'text-[#00FF41] font-black' : 'text-[#FF6B00] font-black';
                        const label = isRem ? 'VALUE-ADDED REMEDIATION (Patched)' : 'POLICY BLOCKED (Contained)';
                        return <span className={color}>{label}</span>;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="remediated" 
                      stroke="#00FF41" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#remediatedColor)" 
                      activeDot={{ r: 5, stroke: '#00FF41', strokeWidth: 2 }}
                      dot={{ r: 2 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="blocked" 
                      stroke="#FF6B00" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#blockedColor)" 
                      activeDot={{ r: 5, stroke: '#FF6B00', strokeWidth: 2 }}
                      dot={{ r: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="border-t border-[#111] pt-2 flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-neutral-500 select-none">
                <span>← Older Commit Builds</span>
                <span className="text-[#888] font-bold text-center">X-Axis Labels: Repo Commit Revisions (e.g., 18FA, 2711)</span>
                <span>Newer Commit Builds →</span>
              </div>
            </div>
          </div>

          {/* Topology Governance Map */}
          <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-[11px] font-mono font-bold uppercase text-[#666] tracking-widest flex items-center space-x-1.5">
              <Network className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>04 / Governance Topology Map</span>
            </h3>
            <TopologyGraph 
              scannedFilesList={scannedFilesList} 
              findings={findings} 
              isScanning={isScanning} 
            />
          </div>

          {/* Verified Findings section */}
          <div className="border-l-4 border-[#FF6B00] pl-4">
            <h3 className="text-[14px] font-bold uppercase mb-4 text-white tracking-wider flex items-center justify-between">
              <span>Verified Findings ({findings.length})</span>
              {findings.length > 0 && (
                <span className="text-[9px] font-mono text-gray-500 normal-case font-normal">
                  (Click any finding card to expand detailed resolution blueprint)
                </span>
              )}
            </h3>

            {findings.length === 0 ? (
              <p className="text-[12px] text-gray-500 italic font-mono uppercase bg-[#090909] p-3 border border-[#1C1C1C] rounded">
                {isScanning ? '// Evaluating file architectures...' : '// No structural governance deviations found.'}
              </p>
            ) : (
              <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-[#333]">
                {findings.map((finding) => {
                  const isRemediated = !!finding.remediated;
                  const isExpanded = expandedFindingId === finding.id;
                  const details = getEducationalDetails(finding.matched_rule, finding.path);

                  return (
                    <div 
                      key={finding.id} 
                      className={`border text-[12px] flex flex-col transition-all duration-300 rounded-sm ${
                        isRemediated 
                          ? isExpanded
                            ? 'border-[#00FF41]/50 bg-[#000F05] shadow-[0_0_15px_rgba(0,255,65,0.06)]'
                            : 'border-[#00FF41]/20 bg-[#000802] hover:border-[#00FF41]/45' 
                          : isExpanded
                            ? 'border-[#FF6B00]/50 bg-[#0D0500] shadow-[0_0_15px_rgba(255,107,0,0.06)]'
                            : 'border-[#222] bg-[#0A0A0A] hover:border-neutral-700'
                      }`}
                    >
                      {/* Header (Always Visible & Clickable) */}
                      <div 
                        onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                        className="p-3 cursor-pointer flex items-center justify-between select-none"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                          {isRemediated ? (
                            <CheckCircle className="w-4 h-4 text-[#00FF41] shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-[#FF6B00] shrink-0" />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-gray-200 break-all text-[11.5px]">
                              {finding.path}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                              Rule: <span className="text-gray-400">{finding.matched_rule}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isRemediated && (
                            <span className="text-[8px] font-mono bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/35 px-1.5 py-0.5 rounded-xs font-bold uppercase tracking-wider">
                              Remediated
                            </span>
                          )}
                          <span className={`text-[9px] font-mono px-2 py-0.5 border rounded-xs uppercase font-bold ${
                            isRemediated 
                              ? 'border-[#00FF41]/30 text-[#00FF41] bg-[#00FF41]/10' 
                              : getRiskColorClass(finding.risk_level)
                          }`}>
                            {finding.risk_level}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {/* Summary text (Visible when collapsed) */}
                      {!isExpanded && (
                        <div className="px-3 pb-3 pt-0 border-t border-transparent text-gray-400 font-sans leading-relaxed text-[10.5px]">
                          {finding.reason}
                        </div>
                      )}

                      {/* Expandable Blueprint Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-3 border-t border-neutral-900/60 bg-black/40 font-mono text-[11px] space-y-4 animate-[fadeIn_0.25s_ease-out]">
                          
                          {/* 1. Why it Broke initially */}
                          <div className="space-y-1">
                            <h4 className="text-red-400/95 font-bold uppercase tracking-wider flex items-center space-x-1.5 text-[9.5px]">
                              <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span>01 / Root Cause Threat Assessment</span>
                            </h4>
                            <p className="text-gray-400 font-sans leading-relaxed pl-5 text-[10.5px]">
                              {details.whyItBroke}
                            </p>
                          </div>

                          {/* 2. Professional Correction Guide */}
                          <div className="space-y-1">
                            <h4 className="text-[#FF6B00] font-bold uppercase tracking-wider flex items-center space-x-1.5 text-[9.5px]">
                              <Wrench className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                              <span>02 / Professional Remediation Protocol</span>
                            </h4>
                            <p className="text-gray-400 font-sans leading-relaxed pl-5 text-[10.5px]">
                              {details.professionalFix}
                            </p>
                          </div>

                          {/* 3. Operational Step Checklist */}
                          <div className="space-y-1.5 pl-5">
                            <h5 className="text-gray-500 font-bold uppercase tracking-wider text-[8.5px]">
                              Recommended Action Items
                            </h5>
                            <div className="space-y-1 text-gray-300 font-sans text-[10.5px]">
                              {details.remediationSteps.map((step, idx) => (
                                <div key={idx} className="flex items-start space-x-2">
                                  <span className="text-[#FF6B00] font-mono select-none shrink-0 mt-0.5">[{idx + 1}]</span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                           {/* 4. M2M Fix Daemon Interventions */}
                           {isRemediated ? (
                             <div className="p-3 border border-[#00FF41]/20 bg-[#00FF41]/5 rounded-sm space-y-1.5">
                               <h4 className="text-[#00FF41] font-bold uppercase tracking-wider flex items-center space-x-1.5 text-[9.5px]">
                                 <Sparkles className="w-3.5 h-3.5 text-[#00FF41] shrink-0" />
                                 <span>03 / Autonomous M2M Intercept Response</span>
                               </h4>
                               <p className="text-gray-300 font-sans leading-relaxed pl-5 text-[10.5px]">
                                 {details.poltergeistAuto}
                               </p>
                               <div className="border-t border-[#00FF41]/10 pt-1.5 mt-1">
                                 <span className="text-[8px] font-mono text-[#00FF41]/65 block tracking-widest uppercase">
                                   AST MUTATION CODE_REWRITE SEAL
                                 </span>
                                 <span className="text-[10px] text-[#00ff41]/90 italic font-mono pl-5 block mt-0.5 normal-case">
                                   &quot;{finding.remediation_note || 'M2M multi-agent container patch applied successfully.'}&quot;
                                 </span>
                               </div>
                             </div>
                           ) : (
                             <div className="p-3 border border-red-500/20 bg-red-950/10 rounded-sm">
                               <h4 className="text-red-400 font-bold uppercase tracking-wider flex items-center space-x-1.5 text-[9.5px]">
                                 <Layers className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                 <span>03 / Core Gate Action Required</span>
                               </h4>
                               <p className="text-red-400/90 font-sans leading-relaxed pl-5 text-[10.5px]">
                                 Gate is currently blocked pending operator signature. You must manually apply the remediation protocol or authorize M2M Autonomous Fixer to run remediation steps.
                               </p>
                             </div>
                           )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
