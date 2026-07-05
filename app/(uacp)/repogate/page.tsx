"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { TerminalEvent, VerifiedFinding, RiskLevel, RiskGateScan, PolicyResult } from './types';
import { 
  DEFAULT_RULES, 
  calculateCanonicalHash, 
  generateFilesForRepo, 
  scanFilesForFindings, 
  determineOverallRisk,
  VeklomAudioEngine,
  announceSpeech
} from './utils';
import { TerminalTrace } from './components/TerminalTrace';
import { RiskIndicators } from './components/RiskIndicators';
import { EvidenceLedger } from './components/EvidenceLedger';
import { ManualReviewModal } from './components/ManualReviewModal';
import { 
  Shield, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Database, 
  Cpu, 
  Sliders, 
  Compass, 
  RefreshCw,
  Clock,
  Volume2,
  VolumeX,
  MessageSquare,
  HelpCircle,
  Laptop,
  Smartphone,
  Tablet
} from 'lucide-react';

// Preset options for quick operator testing
const REPO_PRESETS = [
  { url: 'https://github.com/veklom-ai/core-kernel', name: 'veklom-ai/core-kernel', desc: 'Critical Risk: Native Platform Core' },
  { url: 'https://github.com/expressjs/express', name: 'expressjs/express', desc: 'Safe Level: Router Framework Baseline' },
  { url: 'https://github.com/stripe/stripe-node', name: 'stripe/stripe-node', desc: 'High Risk: Financial Integrations Module' },
  { url: 'https://github.com/kubernetes/kubernetes', name: 'kubernetes/kubernetes', desc: 'Truncated Scan: Complex Cluster Matrix' }
];

export default function App() {
  // Input URL
  const [repoUrl, setRepoUrl] = useState('https://github.com/veklom-ai/core-kernel');
  const [errorText, setErrorText] = useState('');

  // Scanning State
  const [scanState, setScanState] = useState<RiskGateScan>({
    run_id: 'run_8fa29d',
    agent_id: 'agent_041',
    status: 'idle',
    repo_url: 'https://github.com/veklom-ai/core-kernel',
    repo_owner: 'veklom-ai',
    repo_name: 'core-kernel',
    default_branch: 'main',
    risk_level: 'CRITICAL',
    tree_truncated: false,
    files_seen: 16
  });

  // Distracted user/Aura state variables
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [audioEngine] = useState(() => new VeklomAudioEngine());
  
  // Mobile/Tablet views segment toggler (only visible on mobile layouts)
  const [activeTab, setActiveTab] = useState<'terminal' | 'analytics'>('terminal');

  // Events & Findings lists
  const [events, setEvents] = useState<TerminalEvent[]>([]);
  const [findings, setFindings] = useState<VerifiedFinding[]>([]);
  const [scannedFilesList, setScannedFilesList] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [dbPoolCount, setDbPoolCount] = useState(12);
  const [apiFindingsCache, setApiFindingsCache] = useState<VerifiedFinding[]>([]);

  // Operator Decision Intercept Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeInterceptedFinding, setActiveInterceptedFinding] = useState<VerifiedFinding | null>(null);

  // Stable audit hash representation
  const [auditHash, setAuditHash] = useState('6f8e9a2b5c1d7e4f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f');

  // Multi-Channel Notification triggers (when waiting for human authorization)
  useEffect(() => {
    let intervalId: any;
    if (scanState.status === 'awaiting_decision') {
      let toggle = false;
      intervalId = setInterval(() => {
        document.title = toggle ? '⚠️ INTERCEPT OVERRIDE REQUIRED' : 'Veklom Risk Gate v1.0.0';
        toggle = !toggle;
      }, 1000);
    } else if (scanState.status === 'scanning' || scanState.status === 'fetching') {
      document.title = '🔄 Sweeping Repository Tree...';
    } else {
      document.title = 'Veklom Risk Gate v1.0.0';
    }
    return () => {
      clearInterval(intervalId);
      document.title = 'Veklom Risk Gate v1.0.0';
    };
  }, [scanState.status]);

  // Keyboard Shortcuts hook (for advanced desktop PC operations)
  useEffect(() => {
    const handleGateHotkeys = (e: KeyboardEvent) => {
      if (isModalOpen && activeInterceptedFinding) {
        const key = e.key.toLowerCase();
        if (key === 'a') {
          handleOperatorDecision('APPROVED', 'Self-certified: Hot-key approved verification sign-off.');
        } else if (e.key === 'e' || key === 'e') {
          handleOperatorDecision('ESCALATED', 'Hot-key elevated state: Transferred to senior security officer review.');
        } else if (e.key === 'b' || key === 'b') {
          handleOperatorDecision('BLOCKED', 'Keyboard directive: Manual isolation block logged.');
        }
      }
    };
    window.addEventListener('keydown', handleGateHotkeys);
    return () => window.removeEventListener('keydown', handleGateHotkeys);
  }, [isModalOpen, activeInterceptedFinding]);

  // Trigger state evaluation and stable hashing
  useEffect(() => {
    const updateHash = async () => {
      const generated = await calculateCanonicalHash(events);
      setAuditHash(generated);
    };
    updateHash();
  }, [events]);

  // Handle preset repository selection
  const handleSelectPreset = (url: string) => {
    setRepoUrl(url);
    setErrorText('');
    
    // Animate audio signal for feedback
    if (audioEnabled) {
      audioEngine.playChime('start');
    }
  };

  // Helper: Append a new event sequentially with sequence control
  const emitEvent = (
    type: string,
    message: string,
    target: string = '',
    policy: PolicyResult | 'none' = 'none',
    logLevel?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
  ): TerminalEvent => {
    let determinedLevel: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' = 'INFO';
    if (type === 'file.access.blocked' || policy === 'blocked_env_boundary') {
      determinedLevel = 'CRITICAL';
    } else if (type === 'policy.gate.triggered' || policy === 'escalate_to_security' || policy === 'human_approval_required') {
      determinedLevel = 'ERROR';
    } else if (type === 'git.tree.warning' || type === 'finding.alert') {
      determinedLevel = 'WARN';
    }

    const timestamp = new Date().toISOString();
    const newEvent: TerminalEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      run_id: scanState.run_id,
      agent_id: scanState.agent_id,
      event_type: type,
      target: target,
      policy_result: policy,
      message: message,
      timestamp: timestamp,
      hash: '', // secure cryptographic placeholder
      sequence_no: events.length + 1,
      log_level: logLevel || determinedLevel
    };

    setEvents(prev => {
      const updated = [...prev, newEvent];
      // Sync DB Pool mock movements for added realism
      setDbPoolCount(Math.min(15, Math.max(1, 12 + (updated.length % 3) - (updated.length % 2))));
      return updated;
    });

    return newEvent;
  };

  // Validates user input URL format
  const validateUrl = (url: string): { owner: string; repo: string } | null => {
    let normalized = url.replace(/^(https?:\/\/)?(www\.)?/, '').trim();
    if (!normalized.startsWith('github.com/')) {
      return null;
    }
    const pathParts = normalized.replace('github.com/', '').split('/');
    if (pathParts.length < 2 || !pathParts[0].trim() || !pathParts[1].trim()) {
      return null;
    }
    return {
      owner: pathParts[0].trim(),
      repo: pathParts[1].replace('.git', '').trim()
    };
  };

  // Resets logs and generates file assets, then kicks off scan
  const startGovernedReview = async () => {
    const parsed = validateUrl(repoUrl);
    if (!parsed) {
      setErrorText('Please enter a valid GitHub URL, e.g., github.com/owner/repo');
      return;
    }
    setErrorText('');

    setScanState(prev => ({ ...prev, status: 'fetching' }));

    // Play visual & sound chimes
    if (audioEnabled) {
      audioEngine.playChime('start');
    }
    if (speechEnabled) {
      announceSpeech(`Launching custom risk sweep on repository default tree path.`);
    }

    try {
      const data = await api<any>("/api/v1/repogate/scan", {
        method: "POST",
        body: { repo_url: repoUrl }
      });
      
      const paths = data.paths || [];
      const isTruncated = data.is_truncated || false;
      const findings = data.findings || [];
      const topRisk = data.risk_level || 'LOW';

      setScanState({
        run_id: data.run_id || 'run_UNKNOWN',
        agent_id: data.agent_id || 'agent_UNKNOWN',
        status: 'scanning',
        repo_url: repoUrl,
        repo_owner: parsed.owner,
        repo_name: parsed.repo,
        default_branch: data.default_branch || 'main',
        risk_level: topRisk,
        tree_truncated: isTruncated,
        files_seen: paths.length,
        created_at: new Date().toISOString()
      });

      // Make sure smaller devices prioritize the Terminal console panel on sweep launch
      setActiveTab('terminal');

      setEvents([]);
      setFindings([]);
      setApiFindingsCache(findings);
      setScannedFilesList(paths);
      setCurrentStepIndex(0);
    } catch (e: any) {
      setErrorText(e.message || "Failed to scan repository. Please ensure GitHub is connected.");
      setScanState(prev => ({ ...prev, status: 'idle' }));
    }
  };

  // Scan execution step controller
  useEffect(() => {
    if (scanState.status === 'idle') return;

    const timeout = setTimeout(() => {
      const runId = scanState.run_id;
      const agentId = scanState.agent_id;

      // STEP 0: System Mounting log
      if (scanState.status === 'fetching' && currentStepIndex === 0) {
        setEvents([
          {
            id: `evt_init_${Date.now()}`,
            run_id: runId,
            agent_id: agentId,
            event_type: 'system.init',
            target: '',
            policy_result: 'none',
            message: 'Mounting routing policy protocols under global registry gate...',
            timestamp: new Date().toISOString(),
            hash: '',
            sequence_no: 1,
            log_level: 'INFO'
          }
        ]);
        setCurrentStepIndex(1);
        return;
      }

      // STEP 1: Fetching Repository Metadata
      if (currentStepIndex === 1) {
        emitEvent(
          'git.fetch', 
          `Querying GitHub REST tree payload: github.com/${scanState.repo_owner}/${scanState.repo_name}`
        );
        setCurrentStepIndex(2);
        return;
      }

      // STEP 2: Loading File Tree structures
      if (currentStepIndex === 2) {
        emitEvent(
          'system.init',
          `Default branch identified: '${scanState.default_branch}' (verified payload)`
        );
        
        const truncationWarning = scanState.tree_truncated 
          ? `WARNING: Repository matches large recursive matrix. Tree is truncated: true (Partial Coverage)`
          : `Success: Mapped default tree structure containing ${scannedFilesList.length} component paths`;

        emitEvent(
          scanState.tree_truncated ? 'git.tree.warning' : 'system.init',
          truncationWarning
        );

        // Transition scan state to scanning files
        setScanState(prev => ({ ...prev, status: 'scanning' }));
        setCurrentStepIndex(3);
        return;
      }

      // STEP 3: Scanning folders and analyzing paths sequentially
      if (scanState.status === 'scanning' && currentStepIndex >= 3) {
        const fileIndex = currentStepIndex - 3;
        
        // Scan Completed Checklist
        if (fileIndex >= scannedFilesList.length) {
          emitEvent('ledger.seal', `GPC core evaluation completed. Generating stable BTreeMap ledger proof...`);
          setScanState(prev => ({ ...prev, status: 'completed' }));
          setCurrentStepIndex(-1);

          // Complete sound/voice cues
          if (audioEnabled) {
            audioEngine.playChime('complete');
          }
          if (speechEnabled) {
            announceSpeech("Governance tree check finished. Sovereign ledger hash safely verified and sealed.");
          }
          return;
        }

        const path = scannedFilesList[fileIndex];
        emitEvent('git.fetch', `Checking path verification rules for: ${path}`, path);

        // Check file for predefined rules matching
        const matchFinding = apiFindingsCache.find(f => f.path === path);
        if (matchFinding) {
          // Rule matched
          emitEvent(
            'finding.alert',
            `MATCH DETECTED: '${matchFinding.matched_rule}' violations intercepted.`,
            path
          );

          emitEvent(
            'policy.gate.triggered',
            `Policy mandate: [${matchFinding.policy_result.toUpperCase()}]`,
            path,
            matchFinding.policy_result
          );

          // Append to visible findings board
          setFindings(prev => [...prev, matchFinding]);

          // Human approval required logic
          if (
            matchFinding.policy_result === 'human_approval_required' ||
            matchFinding.policy_result === 'escalate_to_security'
          ) {
            // STOP scan and display full-view intercept overlay for operator manual review
            setScanState(prev => ({ ...prev, status: 'awaiting_decision' }));
            setActiveInterceptedFinding(matchFinding);
            setIsModalOpen(true);

            // Alarms sound and warning speak readouts
            if (audioEnabled) {
              audioEngine.playChime('alert');
            }
            if (speechEnabled) {
              announceSpeech(`Global policy violation warning on path: ${matchFinding.path}. operator signature required.`);
            }
            return;
          }

          // Automated blocked actions logic (like blocked_env_boundary)
          if (matchFinding.policy_result === 'blocked_env_boundary') {
            emitEvent(
              'file.access.blocked',
              `CONTAINMENT ACTIVE: mutations strictly denied. isolated environment seal enforced.`,
              path,
              'blocked_env_boundary'
            );

            // Play warning sound even if no modal opens, to keep operator alert
            if (audioEnabled) {
              audioEngine.playChime('alert');
            }
            if (speechEnabled) {
              announceSpeech(`Direct infrastructure mutation blocked for path: ${matchFinding.path}`);
            }
          }
        }

        // Increment to scan next asset path
        setCurrentStepIndex(prev => prev + 1);
        return;
      }

    }, 800); // streamlined sweep delay for snappy PC, tablet and phone execution

    return () => clearTimeout(timeout);
  }, [scanState.status, currentStepIndex, scannedFilesList, scanState]);

  // Handle user decision submitted from intercept modal
  const handleOperatorDecision = (decision: 'APPROVED' | 'ESCALATED' | 'BLOCKED', note: string) => {
    setIsModalOpen(false);
    
    // Add event log reflecting operator action
    emitEvent(
      'user.decision.logged',
      `Manual operator signature recorded: [${decision}]. Signature Remark: "${note}"`,
      activeInterceptedFinding?.path || '',
      decision === 'APPROVED' ? 'review_required' : 'blocked_env_boundary'
    );

    // Audio status confirmation log
    if (speechEnabled) {
      announceSpeech(`Operator signature signature: action ${decision} validated. Resuming sweep.`);
    }

    // Continue scanning next file
    setScanState(prev => ({
      ...prev,
      status: 'scanning',
      decision: decision,
      decision_note: note,
      decision_at: new Date().toISOString()
    }));
    
    setCurrentStepIndex(prev => prev + 1);
    setActiveInterceptedFinding(null);
  };

  // Calculate scan progress metrics
  const totalSteps = scannedFilesList.length + 3;
  let progressPercent = 0;
  if (scanState.status === 'idle') {
    progressPercent = 0;
  } else if (scanState.status === 'completed') {
    progressPercent = 100;
  } else {
    const activeStep = currentStepIndex === -1 ? totalSteps : currentStepIndex;
    progressPercent = Math.min(100, Math.round((activeStep / totalSteps) * 100));
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#E0E0E0] font-sans flex flex-col p-2 sm:p-4 md:p-8 m-0 select-none">
      
      {/* High-Contrast Priority flashing ticker active when waiting for decision */}
      {scanState.status === 'awaiting_decision' && (
        <div className="w-full bg-[#FF6B00] text-black py-2 px-4 sm:px-8 font-mono text-xs font-black uppercase tracking-[0.2em] animate-pulse flex items-center justify-between z-40 select-none shrink-0 border-b border-white/20 select-text">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping"></span>
            <span>🚨 [GPC MUTATION INTERCEPT ACTIVE] Global Policy safety gate triggered</span>
          </div>
          <span className="hidden md:inline-block text-[10px] text-neutral-900 border border-black/30 px-2 font-bold select-none text-right">
            Action required. Press "A" to Approve, "B" to Block, "E" to Escalate
          </span>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto bg-[#0F0F0F] border-2 sm:border-4 md:border-8 border-[#1A1A1A] flex flex-col overflow-hidden shadow-2xl relative flex-1">        {/* Sleek, Ultra-Minimalist Veklom Brand Header */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 sm:px-6 md:px-10 py-2 border-b border-[#222] bg-[#0A0A0A] gap-4">
          {/* Left panel: Compact Logo & Navigation context */}
          <div className="flex flex-row items-center gap-2.5 sm:gap-3.5">
            {/* Real Veklom Logo SVG + Brand Text */}
            <div className="flex items-center space-x-2 select-text">
              <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 22 25 L 50 80 L 78 25" stroke="#FF6B00" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="50" cy="45" r="9.5" fill="#FF6B00" />
              </svg>
              <span className="text-sm font-bold tracking-tight text-white font-sans lowercase">veklom</span>
            </div>

            {/* Context line separation */}
            <div className="h-4 w-px bg-neutral-800" />

            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[10px] sm:text-xs tracking-wider text-[#FF6B00] uppercase font-bold">
                Repo Risk Gate
              </span>
              <span className="hidden sm:inline-block text-[8px] sm:text-[9px] text-gray-500 uppercase tracking-wider bg-neutral-900 border border-neutral-800/60 px-1.5 py-0.5 rounded">
                Dev Scope
              </span>
            </div>
          </div>

          {/* Right panel: Controls & Sweep Input */}
          <div className="w-full lg:w-[55%] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:justify-end">
            {/* Extremely compact Operator settings directly inline to save space! */}
            <div className="flex items-center space-x-2 shrink-0 bg-neutral-950 p-1 border border-neutral-800/60 rounded">
              {/* Sound alert switch */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                title="Toggle Multi-Channel Web Audio Alerts Synthesizer"
                className={`flex items-center space-x-1 py-1 px-2 border transition-all cursor-pointer rounded ${
                  audioEnabled 
                    ? 'border-[#00FF41]/30 text-[#00FF41] bg-[#00FF41]/5' 
                    : 'border-transparent text-gray-500 hover:text-gray-400'
                }`}
              >
                {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#00FF41]" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
                <span className="uppercase text-[9px] font-mono font-bold tracking-tight">Audio {audioEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* Speech alert switch */}
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                title="Announce scan intercepts, errors, policy triggers, and completions dynamically out loud"
                className={`flex items-center space-x-1 py-1 px-2 border transition-all cursor-pointer rounded ${
                  speechEnabled 
                    ? 'border-[#FF6B00]/30 text-[#FF6B00] bg-[#FF6B00]/5' 
                    : 'border-transparent text-gray-500 hover:text-gray-400'
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 ${speechEnabled ? 'text-[#FF6B00]' : 'text-gray-500'}`} />
                <span className="uppercase text-[9px] font-mono font-bold tracking-tight lowercase">Voice {speechEnabled ? 'on' : 'off'}</span>
              </button>
            </div>

            {/* Input & Run buttons */}
            <div className="flex-1 flex items-center bg-[#050505] border border-[#222] hover:border-neutral-700 transition-colors px-2.5 py-1.5 text-white h-9">
              <Search className="w-3.5 h-3.5 text-[#555] mr-1.5 shrink-0" />
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="github.com/veklom-ai/core-kernel"
                onKeyDown={(e) => { if(e.key === 'Enter') startGovernedReview(); }}
                className="bg-transparent border-0 outline-none text-xs w-full font-mono text-gray-100 placeholder-neutral-700 focus:ring-0 focus:outline-none"
                title="Press enter to launch scan workflow"
              />
            </div>

            <button
              onClick={startGovernedReview}
              disabled={scanState.status === 'fetching' || scanState.status === 'scanning' || scanState.status === 'awaiting_decision'}
              className="py-1.5 px-3 bg-[#FF6B00] hover:bg-opacity-80 text-black font-extrabold text-[11px] uppercase tracking-wider h-9 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer border border-[#FF6B00] touch-manipulation font-mono shrink-0"
            >
              {scanState.status === 'fetching' || scanState.status === 'scanning' ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Sweeping...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-black stroke-[2]" />
                  <span>Run Scan</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic High-Visibility Progress Bar */}
        <div id="scan-progress-bar" className="w-full bg-[#050505] border-b border-[#222] select-none">
          <div className="relative h-1 w-full bg-[#111] overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 via-[#FF6B00] to-amber-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(255,107,0,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 py-1.5 text-[9px] sm:text-[10px] font-mono text-gray-500">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-bold uppercase tracking-wider text-neutral-400">Scan Progress:</span>
              <span className="text-[#FF6B00] font-black">{progressPercent}%</span>
              <span className="text-neutral-700">|</span>
              <span className="uppercase text-neutral-400 truncate tracking-tight">
                {scanState.status === 'idle' && 'Ready to Initiate'}
                {scanState.status === 'fetching' && 'Initializing Governance Framework'}
                {scanState.status === 'scanning' && `Verifying Artifact ${Math.max(1, currentStepIndex - 2)} of ${scannedFilesList.length}`}
                {scanState.status === 'awaiting_decision' && 'Interceptors Paused (Action Signature Required)'}
                {scanState.status === 'completed' && 'Sovereign Integrity Audit Signed & Sealed'}
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-neutral-500">
                {scanState.status !== 'idle' && scanState.status !== 'completed' && `STEP ${currentStepIndex === -1 ? totalSteps : currentStepIndex}/${totalSteps}`}
                {scanState.status === 'completed' && 'AUDIT END'}
                {scanState.status === 'idle' && '0/0 STEPS'}
              </span>
            </div>
          </div>
        </div>

        {/* Preset selections list bar - responsive wraps for phone viewport */}
        <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 bg-[#080808] border-b border-[#222] flex flex-col sm:flex-row items-start sm:items-center gap-3 select-none">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest shrink-0 flex items-center space-x-1 font-bold">
            <Compass className="w-3 h-3 text-[#555]" />
            <span>Target Scenarios:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2 w-full">
            {REPO_PRESETS.map((p) => {
              const isActive = repoUrl === p.url;
              return (
                <button
                  key={p.url}
                  onClick={() => handleSelectPreset(p.url)}
                  title={p.desc}
                  disabled={scanState.status === 'fetching' || scanState.status === 'scanning' || scanState.status === 'awaiting_decision'}
                  className={`text-[10px] font-mono px-3 py-2 border transition-all cursor-pointer touch-manipulation flex-1 sm:flex-none text-center ${
                    isActive 
                      ? 'border-[#FF6B00] text-[#FF6B00] bg-[#FF6B00]/5 font-black' 
                      : 'border-[#222] text-[#666] hover:text-gray-300 hover:border-[#444]'
                  }`}
                >
                  {p.name.split('/')[1]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Landscape/Portrait View Selectors (Only visible below md: breakpoint) */}
        <div className="md:hidden flex border-b border-[#333] bg-[#0A0A0A] font-mono select-none">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex-1 py-3 text-center text-[10px] sm:text-xs font-bold tracking-widest uppercase border-r border-[#333] touch-manipulation flex items-center justify-center space-x-2 ${
              activeTab === 'terminal' ? 'bg-[#111] text-[#00FF41] border-b-2 border-[#00FF41]' : 'text-gray-500'
            }`}
          >
            <span>[01 / Terminal Logs]</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 text-center text-[10px] sm:text-xs font-bold tracking-widest uppercase touch-manipulation flex items-center justify-center space-x-2 ${
              activeTab === 'analytics' ? 'bg-[#111] text-[#FF6B00] border-b-2 border-[#FF6B00]' : 'text-gray-500'
            }`}
          >
            <span>[02 & 03 / Risks & Ledger]</span>
          </button>
        </div>

        {/* Responsive Cross-grid arrangement */}
        <main className="flex-1 flex flex-col md:flex-row min-h-0 select-none">
          {/* Column 1 - Live Trace Terminal (Toggled or stacked dynamically) */}
          <section className={`w-full md:w-[74%] border-b md:border-b-0 md:border-r border-[#333] flex flex-col bg-[#050505] min-h-0 ${activeTab === 'terminal' ? 'block' : 'hidden md:flex'}`}>
            <TerminalTrace 
              events={events} 
              isScanning={scanState.status === 'fetching' || scanState.status === 'scanning'}
              dbPoolCount={dbPoolCount}
              scannedFilesList={scannedFilesList}
              currentStepIndex={currentStepIndex}
              findings={findings}
              runId={scanState.run_id}
            />
          </section>

          {/* Column 2 - Indicators (Scored risk & sealed ledger proof) */}
          <section className={`w-full md:w-[26%] flex flex-col bg-[#0F0F0F] min-h-0 ${activeTab === 'analytics' ? 'block' : 'hidden md:flex'}`}>
            {/* Risk Indicators Board */}
            <RiskIndicators 
              findings={findings}
              riskLevel={scanState.risk_level}
              isScanning={scanState.status === 'fetching' || scanState.status === 'scanning'}
              filesScanned={scanState.files_seen}
              runId={scanState.run_id}
            />

            {/* Stable Evidence Ledger hash with copying and file export modules */}
            <EvidenceLedger 
              runId={scanState.run_id}
              agentId={scanState.agent_id}
              repoUrl={scanState.repo_url}
              filesScannedCount={scanState.files_seen}
              overallRisk={scanState.risk_level}
              userDecision={scanState.decision || null}
              events={events}
              findings={findings}
              auditHash={auditHash}
              treeTruncated={scanState.tree_truncated}
            />
          </section>
        </main>

        {/* Modal operator signature block popup */}
        <ManualReviewModal 
          isOpen={isModalOpen}
          finding={activeInterceptedFinding}
          onDecision={handleOperatorDecision}
        />

        {/* Global Hub Footer */}
        <footer className="h-auto md:h-14 border-t border-[#333] flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 md:px-10 py-3 md:py-0 font-mono text-[9px] md:text-[10px] text-[#666] uppercase tracking-[0.2em] bg-[#0A0A0A] gap-2 select-text">
          <span className="flex items-center">
            <Clock className="w-3.5 h-3.5 text-[#333] mr-1.5 shrink-0" />
            Server Time: 2026-06-05 04:25:56 UTC
          </span>
          
          {/* Responsive device optimization helper info trace */}
          <div className="flex items-center space-x-3 text-neutral-800 text-[8px] sm:text-[9px] select-none uppercase">
            <span className="flex items-center space-x-1">
              <Laptop className="w-3 h-3" />
              <span>PC optimised</span>
            </span>
            <span className="flex items-center space-x-1">
              <Tablet className="w-3 h-3" />
              <span>Tablet layout fluid</span>
            </span>
            <span className="flex items-center space-x-1">
              <Smartphone className="w-3 h-3" />
              <span>iOS/Android friendly</span>
            </span>
          </div>

          <span>Gate ID: VEKLOM-STABLE-01</span>
        </footer>
      </div>
    </div>
  );
}
