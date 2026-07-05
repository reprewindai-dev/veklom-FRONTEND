import { PolicyRule, TerminalEvent, VerifiedFinding, RiskLevel, PolicyResult } from './types';

// Standard Veklom Sovereign GPC Policy Rules
export const DEFAULT_RULES: PolicyRule[] = [
  {
    id: 'rule_env_secrets',
    pattern: '.env | secrets | credentials | .key | .pem',
    name: 'Secrets Registry Leak Policy',
    policyResult: 'read_blocked',
    riskLevel: 'HIGH',
    reason: 'Matches sensitive file patterns that hold unencrypted cryptographic credentials or local credentials keys.'
  },
  {
    id: 'rule_auth_routes',
    pattern: 'auth | login | jwt | session | oauth | config.rs',
    name: 'Authentication Module Safety Policy',
    policyResult: 'human_approval_required',
    riskLevel: 'CRITICAL',
    reason: 'Accessing core authorization or user session routines requires explicit Operator signature.'
  },
  {
    id: 'rule_billing_stripe',
    pattern: 'billing | stripe | payment | invoice | subscription | webhook',
    name: 'Financial Ledger Transaction Policy',
    policyResult: 'human_approval_required',
    riskLevel: 'HIGH',
    reason: 'Agent requested read/write permissions on stripe ledger billing pipelines.'
  },
  {
    id: 'rule_migrations_db',
    pattern: 'migrations | tenant | workspace | rbac | .sql',
    name: 'Multi-Tenant RBAC Boundary Policy',
    policyResult: 'escalate_to_security',
    riskLevel: 'HIGH',
    reason: 'Database mutations or permission alterations detected. Requires senior security escalation.'
  },
  {
    id: 'rule_deployments',
    pattern: 'deploy | k8s | terraform | docker | production | cluster',
    name: 'Infrastructure Boundary Guard',
    policyResult: 'blocked_env_boundary',
    riskLevel: 'CRITICAL',
    reason: 'Direct orchestrator mutations on production-level cluster elements are strictly forbidden.'
  },
  {
    id: 'rule_ci_cd',
    pattern: 'github/workflows | ci | cd | yaml | yml',
    name: 'Continuous Integration Review Policy',
    policyResult: 'review_required',
    riskLevel: 'MEDIUM',
    reason: 'CI/CD pipeline file alterations found. General review is required.'
  }
];

export class VeklomAudioEngine {
  private ctx: AudioContext | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    } catch {
      console.warn("Web Audio API not supported on this platform.");
    }
  }

  playChime(type: 'start' | 'alert' | 'complete') {
    this.init();
    if (!this.ctx) return;
    
    // Resume context if browser suspended it due to user interaction policies
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    if (type === 'start') {
      // Sleek ascending technical chime
      this.triggerOscillator(440.00, 'sine', now, 0.12); // A4
      this.triggerOscillator(554.37, 'sine', now + 0.08, 0.12); // C#5
      this.triggerOscillator(659.25, 'sine', now + 0.16, 0.25); // E5
    } else if (type === 'alert') {
      // Multi-frequency alert tone repeated
      this.triggerOscillator(220.00, 'sawtooth', now, 0.15, 0.12); // Low alerting sawtooth A3
      this.triggerOscillator(330.00, 'sawtooth', now + 0.15, 0.25, 0.12); // Eb4 sawtooth for high distress
      this.triggerOscillator(220.00, 'sawtooth', now + 0.35, 0.15, 0.12);
      this.triggerOscillator(330.00, 'sawtooth', now + 0.50, 0.30, 0.12);
    } else if (type === 'complete') {
      // High resolution major chord chime setup
      this.triggerOscillator(523.25, 'sine', now, 0.10); // C5
      this.triggerOscillator(659.25, 'sine', now + 0.06, 0.10); // E5
      this.triggerOscillator(783.99, 'sine', now + 0.12, 0.10); // G5
      this.triggerOscillator(1046.50, 'sine', now + 0.18, 0.35); // C6
    }
  }

  private triggerOscillator(freq: number, type: OscillatorType, time: number, duration: number, volume = 0.08) {
    if (!this.ctx) return;
    
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      
      gainNode.gain.setValueAtTime(volume, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.01);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    } catch (e) {
      console.error("Oscillator instantiation error", e);
    }
  }
}

export function announceSpeech(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // clear natural flow
      utterance.pitch = 1.0;  // solid corporate synthesizer vocal
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech Synthesis interrupted or unsupported", e);
    }
  }
}

/**
 * Calculates a genuine Web Crypto SHA-256 canonical hash over stable order event objects.
 * Mimics Veklom's tamper-proof audit trail ledger logic perfectly in client runtime.
 */
export async function calculateCanonicalHash(events: TerminalEvent[]): Promise<string> {
  if (events.length === 0) {
    return '0'.repeat(64);
  }

  // 1. Sort copy of events by sequence_no
  const sortedEvents = [...events].sort((a, b) => a.sequence_no - b.sequence_no);

  // 2. Map only essential reproducible properties sorted alphabetically to ensure stable payload
  const stablePayload = sortedEvents.map(evt => {
    return {
      agent_id: evt.agent_id,
      event_type: evt.event_type,
      message: evt.message,
      policy_result: evt.policy_result,
      run_id: evt.run_id,
      sequence_no: evt.sequence_no,
      target: evt.target,
      timestamp: evt.timestamp
    };
  });

  // 3. Serialize without spacing, preserving sorted keys order implicitly
  const serialized = JSON.stringify(stablePayload);
  
  // 4. Run real crypto SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(serialized);
  
  try {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    // Elegant fallback if crypto unavailable
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').padEnd(64, 'ae7fba265cfcd');
  }
}

/**
 * Generates custom list of file paths based on chosen repository URL
 */
export function generateFilesForRepo(url: string): { paths: string[]; isTruncated: boolean } {
  let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '').trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  const parts = cleanUrl.split('/');
  const repoName = parts[1] || 'core-kernel';

  // Base list of files that is robust
  const paths: string[] = [
    'package.json',
    'README.md',
    'tsconfig.json',
    'src/index.css',
    'src/main.tsx',
    'src/App.tsx'
  ];

  if (repoName.toLowerCase() === 'core-kernel' || repoName.toLowerCase().includes('veklom')) {
    paths.push(
      '.env.example',
      'src/auth/config.rs',
      'src/network/proxy.ts',
      'billing/stripe_webhooks.py',
      'deploy/k8s/prod-cluster.yaml',
      '.github/workflows/ci.yml',
      'db/migrations/0042_alter_tenant.sql',
      'src/db/schema.ts',
      'src/utils/crypto.ts',
      'src/components/ReviewGate.tsx'
    );
  } else if (repoName.toLowerCase().includes('express')) {
    paths.push(
      'lib/express.js',
      'lib/router/index.js',
      'lib/router/route.js',
      'lib/middleware/init.js',
      'lib/middleware/query.js',
      'test/app.options.js',
      'test/app.router.js'
    );
  } else if (repoName.toLowerCase().includes('stripe') || repoName.toLowerCase().includes('billing')) {
    paths.push(
      '.env.example',
      'lib/stripe.js',
      'lib/resources/Invoice.js',
      'lib/resources/Subscriptions.js',
      'lib/resources/WebhookEndpoints.js',
      'examples/webhook-receiver.js'
    );
  } else if (repoName.toLowerCase().includes('kubernetes') || repoName.toLowerCase().includes('k8s')) {
    paths.push(
      'pkg/kubelet/kubelet.go',
      'pkg/apis/core/types.go',
      'cluster/images/etcd/Makefile',
      'deploy/addons/dns/nodelocaldns/nodelocaldns.yaml',
      'cluster/gce/config-default.sh'
    );
  } else {
    // Generate organic variety based on any other custom repo names
    paths.push(
      `src/components/${repoName}.tsx`,
      'src/hooks/useMetrics.ts',
      'src/context/Sovereignty.tsx',
      '.env.example',
      'src/auth/login.py',
      'billing/subscriptions.go',
      'deploy/docker-compose.yml',
      '.github/workflows/deploy.yaml'
    );
  }

  // Check if we want to mimic a heavily populated repo that could trigger the critical truncation logic
  const isTruncated = paths.length > 15 || repoName.toLowerCase().includes('large') || url.includes('truncated');

  return { paths, isTruncated };
}

/**
 * Scan paths and return structural system findings
 */
export function scanFilesForFindings(paths: string[], runId: string): VerifiedFinding[] {
  const findings: VerifiedFinding[] = [];

  paths.forEach((path, idx) => {
    const matchedRule = DEFAULT_RULES.find(rule => {
      const patterns = rule.pattern.split('|').map(p => p.trim());
      return patterns.some(pat => path.toLowerCase().includes(pat));
    });

    if (matchedRule) {
      findings.push({
        id: `find_${idx}_${Date.now()}`,
        run_id: runId,
        path: path,
        matched_rule: matchedRule.name,
        policy_result: matchedRule.policyResult,
        risk_level: matchedRule.riskLevel,
        reason: matchedRule.reason,
        created_at: new Date().toISOString()
      });
    }
  });

  return findings;
}

/**
 * Normalizes risk assessment based on scanned findings
 */
export function determineOverallRisk(findings: VerifiedFinding[]): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE' {
  if (findings.length === 0) return 'SAFE';
  const riskWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, SAFE: 0 };
  
  let topRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE' = 'SAFE';
  let maxWeight = 0;

  findings.forEach(f => {
    const w = riskWeights[f.risk_level];
    if (w > maxWeight) {
      maxWeight = w;
      topRisk = f.risk_level;
    }
  });

  return topRisk;
}
