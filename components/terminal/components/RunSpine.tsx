"use client";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { VeklomRun, SpineStep } from '../types';
import { ShieldCheck, Database, Key, HelpCircle, ChevronRight, CheckCircle2, Play, Copy, Activity } from 'lucide-react';
import { useLockSound } from '../hooks/useLockSound';
import AttestationRing from './AttestationRing';

interface RunSpineProps {
  runs: VeklomRun[];
  selectedRunId: string | null;
  onSelectRun: (id: string) => void;
}

export default function RunSpine({ runs, selectedRunId, onSelectRun }: RunSpineProps) {
  // Grab the selected run or default to the first one
  const selectedRun = runs.find(r => r.id === selectedRunId) || runs[0];

  const stepsDetails = [
    { name: 'Intent' as SpineStep, icon: HelpCircle, color: '#00E5FF', label: 'EVAL_INTENT' },
    { name: 'Plan' as SpineStep, icon: Activity, color: '#00E5FF', label: 'GEN_SEQUENCE' },
    { name: 'ArbiterOS' as SpineStep, icon: ShieldCheck, color: '#FFAB00', label: 'GOV_ARBITER_POLICY' },
    { name: 'Redis Lua' as SpineStep, icon: Database, color: '#FFAB00', label: 'LUA_STATE_LOCK' },
    { name: 'Attestation' as SpineStep, icon: Key, color: '#00FF66', label: 'STATE_ATTEST_SEAL' },
  ];

  // Helper check for attestation states
  const isCompleted = selectedRun.status === 'completed';
  const isFailed = selectedRun.status === 'failed';
  const isRunning = selectedRun.status === 'running';

  const [lastCommittedId, setLastCommittedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const playLockSound = useLockSound();

  useEffect(() => {
    if (isCompleted && selectedRun.id !== lastCommittedId) {
      setLastCommittedId(selectedRun.id);
      playLockSound();
    }
  }, [selectedRun.id, isCompleted, lastCommittedId]);

  return (
    <div className="w-full h-full flex bg-[#030303] select-none">
      
      {/* LEFT PANEL: Dense Runs Tick Ledger List */}
      <div className="w-80 h-full border-r border-white/10 bg-black flex flex-col justify-between shrink-0 font-mono">
        <div className="p-3.5 border-b border-white/10 bg-black/60">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">PROOFS LEDGER FEED</div>
          <div className="text-white text-xs font-bold font-sans">VeklomRun Proof Pipelines</div>
        </div>

        <div className="flex-grow overflow-y-auto divide-y divide-white/5 max-h-[calc(100vh-100px)]">
          {runs.map((run) => {
            const isSel = run.id === selectedRun.id;
            return (
              <button
                key={run.id}
                onClick={() => onSelectRun(run.id)}
                className={`w-full p-3.5 text-left transition-all duration-200 block border-l-2 relative cursor-pointer ${
                  isSel ? 'bg-white/[0.03] border-l-electric-cyan' : 'border-l-transparent hover:bg-white/[0.015]'
                }`}
                style={{ contentVisibility: 'auto' }}
              >
                <div className="flex items-center justify-between text-[10px] mb-1.5 string-content">
                  <span className="text-white font-bold">{run.id}</span>
                  <span className={`px-1.5 py-0.5 rounded-none text-[8.5px] uppercase font-bold flex items-center gap-1 ${
                    run.status === 'completed' ? 'text-matrix-emerald bg-matrix-emerald/10 border border-matrix-emerald/20' :
                    run.status === 'failed' ? 'text-laser-red bg-laser-red/10 border border-laser-red/20' :
                    'text-electric-cyan bg-electric-cyan/10 border border-electric-cyan/20 animate-pulse'
                  }`}>
                    {run.status === 'running' && <span className="w-1 h-1 bg-electric-cyan animate-ping" />}
                    {run.status}
                  </span>
                </div>
                
                <h4 className="text-white/80 font-sans text-xs line-clamp-2 leading-relaxed mb-2 tracking-tight">
                  {run.intent}
                </h4>

                <div className="flex items-center justify-between text-[9px] text-white/35 font-mono">
                  <span>{run.duration}</span>
                  <span>{run.timestamp.substring(11, 19)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL: Cinematic PGL Proof Spine & Attestation Ring */}
      <div className="flex-grow h-full flex flex-col md:flex-row p-6 overflow-y-auto max-h-full font-mono gap-6 justify-center items-center">
        
        {/* Detail Pipeline timelines */}
        <div className="w-full max-w-lg space-y-4">
          <div className="mb-2">
            <div className="group/id flex items-center gap-2.5 mb-1.5 min-h-[18px]">
              <span className={`text-[10px] tracking-widest uppercase font-bold transition-all duration-300 ${
                copiedId ? 'text-matrix-emerald font-extrabold animate-pulse' : 'text-electric-cyan'
              }`}>
                {selectedRun.id} <span className="text-white/40 font-normal">• PGL CONVENIENCE TRAIL</span>
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedRun.id);
                  setCopiedId(true);
                  setTimeout(() => setCopiedId(false), 1500);
                }}
                className="opacity-0 group-hover/id:opacity-100 transition-opacity duration-200 bg-white/5 hover:bg-white/10 border border-white/10 px-1.5 py-0.5 text-[8px] tracking-widest text-white/80 uppercase font-mono cursor-pointer flex items-center gap-1 select-none"
                title="Copy Run ID"
              >
                <Copy className="w-2.5 h-2.5" />
                Copy ID
              </button>
            </div>
            <h2 className="text-white text-base font-bold font-sans tracking-tight mb-2 leading-snug">
              {selectedRun.intent}
            </h2>
            <div className="flex gap-4 text-[10px] text-white/50 border-b border-white/10 pb-3.5">
              <span>Duration: <strong className="text-white">{selectedRun.duration}</strong></span>
              <span>Evidence hashes: <strong className="text-matrix-emerald">{selectedRun.evidenceCount} Sealed</strong></span>
              <span>Consensus Slot: <strong className="text-white">#{selectedRun.hash.substring(3, 10)}</strong></span>
            </div>
          </div>

          {/* Spine Steps */}
          <div className="relative pl-7 space-y-5">
            {/* Timeline backbone trail wire */}
            <div className="absolute left-2.5 top-2.5 bottom-2.5 w-[2px] bg-white/[0.05]" />
            {/* Glowing active wire overlays */}
            <div 
              className="absolute left-2.5 top-2.5 bg-gradient-to-b from-electric-cyan to-matrix-emerald w-[2px] transition-all duration-500" 
              style={{
                height: `${
                  selectedRun.currentStep === 'Intent' ? '0%' :
                  selectedRun.currentStep === 'Plan' ? '25%' :
                  selectedRun.currentStep === 'ArbiterOS' ? '50%' :
                  selectedRun.currentStep === 'Redis Lua' ? '75%' : '100%'
                }`
              }}
            />

            {stepsDetails.map((step, idx) => {
              const runStepObj = selectedRun.steps.find(s => s.name === step.name) || selectedRun.steps[idx];
              const isStepCompleted = runStepObj.status === 'completed';
              const isStepActive = runStepObj.status === 'active';
              const isStepFailed = runStepObj.status === 'failed';
              const StepIcon = step.icon;

              return (
                <motion.div
                  key={step.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative p-3.5 rounded-none border ${
                    isStepActive ? 'bg-black/60 border-electric-cyan/40 shadow-[0_0_15px_rgba(0,229,255,0.04)]' :
                    isStepFailed ? 'bg-laser-red/[0.03] border-laser-red/40' :
                    isStepCompleted ? 'bg-[#0A0A0C] border-white/5' : 'bg-transparent border-white/[0.02] opacity-40'
                  }`}
                >
                  {/* Spine core pin circle */}
                  <div
                    className={`absolute -left-[24px] top-4.5 w-3 h-3 rounded-none border-2 transition-all duration-300 flex items-center justify-center ${
                      isStepFailed ? 'bg-laser-red border-laser-red shadow-[0_0_8px_#ff003c]' :
                      isStepCompleted ? 'bg-matrix-emerald border-matrix-emerald shadow-[0_0_8px_#00ff66]' :
                      isStepActive ? 'bg-electric-cyan border-electric-cyan shadow-[0_0_8px_#00e5ff] scale-110' :
                      'bg-black border-white/20'
                    }`}
                  >
                    {isStepCompleted && <div className="w-1 h-1 bg-black" />}
                  </div>

                  <div className="flex items-center justify-between text-[10px] mb-1 font-mono tracking-wider">
                    <span className="text-white/40 uppercase">{step.label}</span>
                    <span className={`font-bold uppercase ${
                      isStepFailed ? 'text-laser-red-glow text-laser-red' :
                      isStepCompleted ? 'text-matrix-emerald' :
                      isStepActive ? 'text-electric-cyan animate-pulse' : 'text-white/20'
                    }`}>
                      {runStepObj.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <StepIcon className={`w-3.5 h-3.5 ${
                      isStepFailed ? 'text-laser-red' :
                      isStepCompleted ? 'text-matrix-emerald' :
                      isStepActive ? 'text-electric-cyan' : 'text-white/30'
                    }`} />
                    <h5 className="text-white font-sans text-xs font-bold tracking-tight">{step.name}</h5>
                  </div>

                  <p className="text-[11px] text-white/60 leading-normal font-sans">
                    {runStepObj.details}
                  </p>

                  {runStepObj.hash && (
                    <div className="mt-2 text-[9px] text-[#ffffff33] font-mono select-all truncate break-all selection:bg-electric-cyan/20 selector-all">
                      Hash Seal: {runStepObj.hash}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right column widgets */}
        <div className="w-full max-w-xl flex flex-col gap-6 select-text">
          <div className="flex justify-center">
            <AttestationRing
              isCompleted={isCompleted}
              isFailed={isFailed}
              isRunning={isRunning}
            />
          </div>

          <BYOAgentHub isCompleted={isCompleted} />
        </div>

      </div>

    </div>
  );
}

interface BYOAgentHubProps {
  isCompleted: boolean;
}

export function BYOAgentHub({ isCompleted }: BYOAgentHubProps) {
  const [activeFramework, setActiveFramework] = useState<'crewai' | 'langchain' | 'autogen' | 'vercel'>('crewai');
  const [activeMainTab, setActiveMainTab] = useState<'byo' | 'deploy'>('byo');
  const [copiedAction, setCopiedAction] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  const pythonWrappers = {
    crewai: `from crewai import Crew
from veklom import PGLAgentWrapper

# 1. Wrap your existing Crew in 1 line
crew = PGLAgentWrapper(
    Crew(agents=[auditor, disburser]),
    workspace_id="0x7fca4b76a086...",
    vnp_stake_bond="0.05 VNP" # Auto-bound SLA
)

# 2. Kick off agent operations as usual
crew.kickoff()`,
    langchain: `from langchain.agents import AgentExecutor
from veklom import PGLAgentWrapper

# 1. Seamlessly intercept existing LangChain Agents
agent = PGLAgentWrapper(
    AgentExecutor(agent=llm_chain, tools=tools),
    gateway="https://api.veklom.com",
    zero_trust_rules="Article-12"
)

# 2. Run agent safely under ArbiterOS
agent.run("Sync and disburse payroll sheets")`,
    autogen: `from autogen import ConversableAgent
from veklom import PGLAgentWrapper

# 1. Route Conversable Agent conversations via PGL
user_proxy = PGLAgentWrapper(
    ConversableAgent("user_proxy", ...),
    enforce_pgl=True,
    receipt_id="X-Veklom-Receipt-ID-91"
)

# 2. Start chats under zero-trust auditing
user_proxy.initiate_chat(assistant, message="Verify ledger")`,
    vercel: `import { generateText } from 'ai';
import { pglMiddleware } from '@veklom/sdk';

// 1. Inbound zero-trust audit wrapper for Vercel AI SDK
const { text } = await generateText({
  model: openai('gpt-4o'),
  middleware: pglMiddleware({
    workspaceId: '0x7fca4b76a086',
    enforceSLA: true
  }),
  prompt: 'Release payroll payload to AWS'
});`
  };

  const githubWorkflow = `name: Veklom CI/CD Agent Deployment
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Deploy to Veklom Hetzner Node
        uses: appleboy/ssh-action@master
        with:
          host: 5.78.135.11
          username: root
          key: \${{ secrets.HETZNER_SSH_KEY }}
          script: |
            cd /data/coolify/applications/n13gp1nhrcdp0hvazvbnlxru
            git pull origin main
            docker build -t veklom-local:latest .
            docker stop n13gp1nhrcdp0hvazvbnlxru-213557155694 || true
            docker rm n13gp1nhrcdp0hvazvbnlxru-213557155694 || true
            docker run -d \\
              --name n13gp1nhrcdp0hvazvbnlxru-213557155694 \\
              --network coolify \\
              --env-file /data/coolify/applications/n13gp1nhrcdp0hvazvbnlxru/.env \\
              -p 8088:8088 \\
              veklom-local:latest`;

  const handleTriggerBuild = () => {
    setIsBuilding(true);
    setBuildLogs([]);
    const steps = [
      '[GITHUB-CI] Fetching repository commit 1a2b3c4d...',
      '[GITHUB-CI] Verified local configuration, authenticating with Veklom Server (5.78.135.11)...',
      '[HETZNER-SSH] Opening secure tunnel using veklom-deploy SSH key... Connected.',
      '[HETZNER-SSH] Pulling latest main branch changes from GitHub...',
      '[HETZNER-SSH] Executing Docker container build: veklom-local:latest...',
      '[DOCKER-BUILD] Building layers... (Step 1/4) FROM python:3.11-slim... Done.',
      '[DOCKER-BUILD] Building layers... (Step 2/4) COPY requirements.txt... Done.',
      '[DOCKER-BUILD] Building layers... (Step 3/4) RUN pip install @veklom/sdk... Done.',
      '[DOCKER-BUILD] Building layers... (Step 4/4) CMD ["python", "main.py"]... Done.',
      '[DOCKER-RUN] Stopping existing container n13gp1nhrcdp0hvazvbnlxru-213557155694...',
      '[DOCKER-RUN] Initializing fresh container under Traefik Reverse Proxy...',
      '[TRAEFIK-PROXY] Hot-swapping routing config: api.veklom.com -> container:8088...',
      '[HEALTH-CHECK] Pinging container health endpoint... GET /health... 200 OK (Healthy)',
      '[VNP-STAKE] Initializing off-path SLA Performance Ledger...',
      '[STATUS] DEPLOYMENT COMPLETED SUCCESSFULLY! 🚀 Your agent is now live at api.veklom.com!'
    ];

    let delay = 0;
    steps.forEach((logMsg, idx) => {
      setTimeout(() => {
        setBuildLogs(prev => [...prev, logMsg]);
        if (idx === steps.length - 1) {
          setIsBuilding(false);
        }
      }, delay);
      delay += idx === steps.length - 1 ? 1200 : 400;
    });
  };

  if (!isCompleted) {
    return (
      <div className="border border-white/5 bg-white/[0.01] p-5 rounded-xl flex items-center justify-center text-center py-10 w-full">
        <div className="max-w-xs space-y-2">
          <div className="w-10 h-10 rounded-full border border-dashed border-white/10 flex items-center justify-center mx-auto text-white/20 animate-pulse">
            🚀
          </div>
          <h4 className="text-white/40 text-xs font-bold uppercase tracking-wider">CI/CD Engine Sleeping</h4>
          <p className="text-[10px] text-white/25 leading-normal">
            Awaiting successful completion of the active Spine Journey to activate bringing-your-own-agents and automated GitHub deployment tools.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border border-[#b8860b]/30 bg-black/40 rounded-xl p-5 space-y-4 shadow-[0_0_20px_rgba(184,134,11,0.05)] relative overflow-hidden flex flex-col font-mono text-xs select-text">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#b8860b]/2 rounded-full blur-2xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3 shrink-0 select-none">
        <div>
          <h3 className="text-white text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
            <span className="text-[#b8860b]">🚀</span> BYO AGENT & DEPLOYMENT HUB
          </h3>
          <p className="text-[9px] text-white/40">Bring your own agents and deploy them straight to your mainnet VPS</p>
        </div>
        <div className="flex bg-black border border-white/10 rounded overflow-hidden text-[9px] font-bold">
          <button
            onClick={() => setActiveMainTab('byo')}
            className={`px-2.5 py-1 uppercase cursor-pointer ${activeMainTab === 'byo' ? 'bg-[#b8860b] text-black font-extrabold' : 'text-white/50 hover:text-white'}`}
          >
            1. Wrappers
          </button>
          <button
            onClick={() => setActiveMainTab('deploy')}
            className={`px-2.5 py-1 uppercase cursor-pointer ${activeMainTab === 'deploy' ? 'bg-[#b8860b] text-black font-extrabold' : 'text-white/50 hover:text-white'}`}
          >
            2. CI/CD Build
          </button>
        </div>
      </div>

      {activeMainTab === 'byo' ? (
        <div className="space-y-3 flex-grow">
          <p className="text-[10.5px] text-white/60 leading-relaxed font-sans select-none">
            Bringing your own agent code over to Veklom is **100% painless and easier than ABC**. Just wrap your existing CrewAI, LangChain, or AutoGen agent definitions with the Veklom SDK. All authorization, stakes, and ledgering are intercepted seamlessly.
          </p>

          {/* Subtabs */}
          <div className="flex gap-1.5 border-b border-white/5 pb-2 text-[9px] font-bold select-none">
            {(['crewai', 'langchain', 'autogen', 'vercel'] as const).map(fw => (
              <button
                key={fw}
                onClick={() => setActiveFramework(fw)}
                className={`px-2 py-0.5 border rounded-sm uppercase cursor-pointer transition-all ${activeFramework === fw ? 'bg-[#b8860b]/10 border-[#b8860b] text-[#b8860b] font-bold' : 'border-white/5 text-white/40 hover:text-white/70'}`}
              >
                {fw === 'vercel' ? 'Vercel AI SDK' : fw}
              </button>
            ))}
          </div>

          {/* Code display */}
          <div className="p-3 bg-black/60 border border-white/5 rounded text-[10px] text-[#00E5FF] select-all overflow-x-auto font-mono whitespace-pre max-h-56 leading-relaxed custom-scrollbar">
            {pythonWrappers[activeFramework]}
          </div>

          <div className="flex justify-between items-center text-[9px] text-white/30 uppercase mt-1 select-none">
            <span>Interlinked Framework Support</span>
            <span className="text-[#00FF66] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" /> SDK Active
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3 flex-grow">
          <p className="text-[10.5px] text-white/60 leading-relaxed font-sans select-none">
            Push code directly to your GitHub repository to trigger automated mainnet deployments to your Hetzner VPS node (`5.78.135.11`) under Traefik.
          </p>

          <div className="grid grid-cols-2 gap-3.5 my-2">
            {/* Left side actions */}
            <div className="space-y-2 select-none">
              <div className="text-[9px] text-white/30 uppercase tracking-widest font-black">ACTIONS CONFIGURATION</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(githubWorkflow);
                  setCopiedAction(true);
                  setTimeout(() => setCopiedAction(false), 1500);
                }}
                className="w-full p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] tracking-wider uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {copiedAction ? (
                  <span className="text-[#00FF66] font-bold">✓ COPIED WORKFLOW!</span>
                ) : (
                  <span>COPY WORKFLOW YAML</span>
                )}
              </button>

              <button
                onClick={handleTriggerBuild}
                disabled={isBuilding}
                className={`w-full p-2.5 ${isBuilding ? 'bg-[#b8860b]/20 text-[#b8860b] animate-pulse' : 'bg-[#b8860b] text-black hover:bg-[#b8860b]/80'} font-black text-[10px] tracking-widest uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-2`}
              >
                {isBuilding ? 'BUILDING WORKSPACE LIVE...' : 'TEST GITHUB BUILD WORKFLOW'}
              </button>
            </div>

            {/* Right side config summary info */}
            <div className="p-3 bg-black/40 border border-white/5 rounded space-y-1.5 text-[9px] select-none">
              <div className="text-white/30 uppercase">MAINNET METADATA</div>
              <div>SSH AUTH: <strong className="text-white">root@5.78.135.11</strong></div>
              <div>DEPLOY KEY: <strong className="text-white">~/.ssh/veklom-deploy</strong></div>
              <div>PROXY ROUTING: <strong className="text-white">Traefik (api.veklom.com)</strong></div>
              <div>CONTAINER PORT: <strong className="text-white">8088 (FastAPI Standalone)</strong></div>
            </div>
          </div>

          {/* Build Output logs terminal */}
          {(buildLogs.length > 0 || isBuilding) && (
            <div className="p-3 bg-[#030303] border border-white/5 rounded text-[9px] text-white/60 font-mono space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              {buildLogs.map((log, i) => (
                <div key={i} className={log.includes('SUCCESS') ? 'text-[#00FF66] font-bold' : log.includes('ATTACK') ? 'text-laser-red' : ''}>
                  {log}
                </div>
              ))}
              {isBuilding && <div className="text-[#00E5FF] animate-pulse">■ Writing build manifest...</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
