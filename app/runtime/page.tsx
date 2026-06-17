'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Lock,
  Terminal,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface ExecutionStep {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration_ms: number;
  hash: string;
  details: string;
}

interface Agent {
  id: string;
  name: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  instructions: string;
  safety_level: 'low' | 'medium' | 'high';
}

interface ExecutionAuthorization {
  token: string;
  issued_at: string;
  signature: string;
  valid_until: string;
  authorized_by: string;
}

const SCENARIOS = [
  {
    id: 'rogue_db',
    name: 'Rogue Database',
    description: 'Agent attempts unauthorized database modification',
    threat_level: 'CRITICAL',
  },
  {
    id: 'prompt_injection',
    name: 'Prompt Injection',
    description: 'Malicious prompt injection attack simulation',
    threat_level: 'HIGH',
  },
  {
    id: 'repo_mutation',
    name: 'Repository Mutation',
    description: 'Unauthorized code repository changes',
    threat_level: 'HIGH',
  },
  {
    id: 'budget_loop',
    name: 'Budget Loop',
    description: 'Runaway spending without cost controls',
    threat_level: 'MEDIUM',
  },
  {
    id: 'quarantine',
    name: 'Quarantine Protocol',
    description: 'Test containment and isolation procedures',
    threat_level: 'MEDIUM',
  },
];

const EXECUTION_PIPELINE = [
  {
    name: 'Received',
    description: 'Request validated at ingress',
    icon: '📨',
  },
  {
    name: 'Governing',
    description: 'Policy engine applies rules',
    icon: '⚖️',
  },
  {
    name: 'Compiled',
    description: 'AI behavior compiled to safe IR',
    icon: '🔨',
  },
  {
    name: 'Committed',
    description: 'Execution plan committed to ledger',
    icon: '📝',
  },
  {
    name: 'Routed',
    description: 'Request routed to appropriate handler',
    icon: '🛣️',
  },
  {
    name: 'Executing',
    description: 'Safe execution with monitoring',
    icon: '⚡',
  },
  {
    name: 'Sealed',
    description: 'Evidence sealed in cryptographic proof',
    icon: '🔐',
  },
];

export default function RuntimePage() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  const [showAgentCreator, setShowAgentCreator] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'agent_1',
      name: 'GPT-4 Safe',
      model: 'gpt-4-turbo',
      temperature: 0.7,
      max_tokens: 2048,
      system_prompt: 'You are a helpful AI assistant that follows safety guidelines.',
      instructions: 'Execute tasks within defined parameters.',
      safety_level: 'high',
    },
  ]);
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);

  const [executionAuth, setExecutionAuth] = useState<ExecutionAuthorization | null>(null);
  const [showEvidenceLedger, setShowEvidenceLedger] = useState(false);

  // Initialize pipeline steps
  useEffect(() => {
    const initialSteps: ExecutionStep[] = EXECUTION_PIPELINE.map((step, idx) => ({
      step: idx,
      name: step.name,
      status: 'pending',
      duration_ms: 0,
      hash: `hash_${idx}_pending`,
      details: step.description,
    }));
    setSteps(initialSteps);
  }, []);

  // Run execution simulation
  const runExecution = async () => {
    setIsRunning(true);
    setTerminalOutput([
      `[${new Date().toLocaleTimeString()}] Starting execution for scenario: ${selectedScenario.name}`,
      `[${new Date().toLocaleTimeString()}] Using agent: ${selectedAgent.name}`,
      `[${new Date().toLocaleTimeString()}] Safety level: ${selectedAgent.safety_level}`,
    ]);
    setCurrentStep(0);

    // Simulate step-by-step execution
    for (let i = 0; i < EXECUTION_PIPELINE.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const stepName = EXECUTION_PIPELINE[i].name;
      const duration = Math.floor(Math.random() * 500) + 100;
      const hash = `sha256:${Math.random().toString(16).slice(2, 10)}`;

      setSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.step === i
            ? {
                ...step,
                status: 'completed',
                duration_ms: duration,
                hash,
              }
            : step
          )
      );

      setCurrentStep(i + 1);

      // Add terminal output
      setTerminalOutput((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✓ ${stepName} completed in ${duration}ms`,
        `[${new Date().toLocaleTimeString()}]   Hash: ${hash}`,
      ]);
    }

    // Generate execution authorization
    const token = `EAT_${Date.now().toString(16).toUpperCase()}`;
    const signature = `sig_${Math.random().toString(16).slice(2, 10)}`;
    setExecutionAuth({
      token,
      issued_at: new Date().toISOString(),
      signature,
      valid_until: new Date(Date.now() + 3600000).toISOString(),
      authorized_by: selectedAgent.id,
    });

    setTerminalOutput((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 🎉 Execution completed successfully`,
      `[${new Date().toLocaleTimeString()}] EAT issued: ${token}`,
      `[${new Date().toLocaleTimeString()}] All evidence sealed in ledger`,
    ]);

    setIsRunning(false);
  };

  // Reset execution
  const resetExecution = () => {
    setCurrentStep(0);
    setSteps(
      EXECUTION_PIPELINE.map((step, idx) => ({
        step: idx,
        name: step.name,
        status: 'pending',
        duration_ms: 0,
        hash: `hash_${idx}_pending`,
        details: step.description,
      }))
    );
    setTerminalOutput([]);
    setExecutionAuth(null);
  };

  // Add agent
  const addAgent = () => {
    const newAgent: Agent = {
      id: `agent_${Date.now()}`,
      name: `Agent ${agents.length + 1}`,
      model: 'gpt-4-turbo',
      temperature: 0.7,
      max_tokens: 2048,
      system_prompt: 'You are a helpful AI assistant.',
      instructions: 'Execute tasks safely.',
      safety_level: 'high',
    };
    setAgents([...agents, newAgent]);
    setSelectedAgent(newAgent);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ⚡ RUNTIME ENFORCEMENT LAB
          </h1>
          <p className="text-slate-400">
            7-step deterministic execution pipeline with cryptographic proof
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Scenario Selector */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 sticky top-8">
              <h3 className="text-white font-semibold mb-4">Threat Scenario</h3>
              <div className="space-y-2">
                {SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`w-full text-left p-3 rounded transition ${
                      selectedScenario.id === scenario.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <p className="font-semibold text-sm">{scenario.name}</p>
                    <p className="text-xs opacity-75">{scenario.description}</p>
                    <p
                      className={`text-xs mt-1 font-semibold ${
                        scenario.threat_level === 'CRITICAL'
                          ? 'text-red-400'
                          : scenario.threat_level === 'HIGH'
                          ? 'text-amber-400'
                          : 'text-yellow-400'
                      }`}
                    >
                      {scenario.threat_level}
                    </p>
                  </button>
                ))}
              </div>

              {/* Controls */}
              <div className="mt-6 pt-6 border-t border-slate-700 space-y-2">
                <button
                  onClick={runExecution}
                  disabled={isRunning}
                  className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-semibold rounded transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {isRunning ? 'Running...' : 'Run Execution'}
                </button>
                <button
                  onClick={resetExecution}
                  disabled={isRunning}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-semibold rounded transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Execution Pipeline */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
              <h3 className="text-white font-semibold mb-6">
                Deterministic Execution Pipeline
              </h3>

              {/* Pipeline Visualization */}
              <div className="space-y-4">
                {EXECUTION_PIPELINE.map((step, idx) => {
                  const stepData = steps[idx];
                  const isCompleted = currentStep > idx;
                  const isRunning = currentStep === idx + 1;
                  const isPending = currentStep <= idx;

                  return (
                    <div key={idx}>
                      <div
                        className={`p-4 rounded-lg border-2 transition ${
                          isCompleted
                            ? 'bg-emerald-900 border-emerald-500'
                            : isRunning
                            ? 'bg-blue-900 border-blue-500 animate-pulse'
                            : 'bg-slate-700 border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{step.icon}</span>
                            <div>
                              <p
                                className={`font-semibold ${
                                  isCompleted || isRunning
                                    ? 'text-white'
                                    : 'text-slate-300'
                                }`}
                              >
                                {idx + 1}. {step.name}
                              </p>
                              <p
                                className={`text-xs ${
                                  isCompleted || isRunning
                                    ? 'text-emerald-200'
                                    : 'text-slate-400'
                                }`}
                              >
                                {step.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {isCompleted && (
                              <div className="text-emerald-300">
                                <CheckCircle className="w-5 h-5 inline mr-2" />
                                <p className="text-xs">
                                  {stepData?.duration_ms}ms
                                </p>
                              </div>
                            )}
                            {isRunning && (
                              <Clock className="w-5 h-5 text-blue-300 animate-spin" />
                            )}
                          </div>
                        </div>

                        {/* Hash Display */}
                        {isCompleted && stepData && (
                          <div className="mt-3 pt-3 border-t border-emerald-600">
                            <p className="text-xs text-emerald-300 font-mono break-all">
                              {stepData.hash}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      {idx < EXECUTION_PIPELINE.length - 1 && (
                        <div className="flex justify-center py-2">
                          <ChevronRight className="w-5 h-5 text-slate-600 rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Execution Authorization Token */}
              {executionAuth && (
                <div className="mt-8 p-4 bg-emerald-900 border border-emerald-600 rounded-lg">
                  <h4 className="text-emerald-300 font-semibold mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Execution Authorization Token (EAT)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <p>
                      <span className="text-emerald-400">Token:</span>
                      <span className="text-white font-mono ml-2">
                        {executionAuth.token}
                      </span>
                    </p>
                    <p>
                      <span className="text-emerald-400">Signature:</span>
                      <span className="text-white font-mono ml-2">
                        {executionAuth.signature}
                      </span>
                    </p>
                    <p>
                      <span className="text-emerald-400">Valid Until:</span>
                      <span className="text-white ml-2">
                        {new Date(executionAuth.valid_until).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agent Management & Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Creator */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Agents</h3>
              <button
                onClick={addAgent}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center gap-1 transition"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-4 cursor-pointer transition ${
                    selectedAgent.id === agent.id
                      ? 'bg-blue-900 border-l-4 border-blue-500'
                      : 'hover:bg-slate-700'
                  }`}
                >
                  <p className="text-white font-semibold text-sm mb-1">
                    {agent.name}
                  </p>
                  <p className="text-xs text-slate-400 mb-2">{agent.model}</p>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded">
                      {agent.safety_level}
                    </span>
                    <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded">
                      {agent.max_tokens} tokens
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Output */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Execution Trace
              </h3>
            </div>
            <div className="flex-1 p-4 font-mono text-sm text-slate-300 overflow-y-auto bg-black bg-opacity-50">
              {terminalOutput.length === 0 ? (
                <p className="text-slate-500">Run a scenario to see execution trace...</p>
              ) : (
                terminalOutput.map((line, idx) => (
                  <p key={idx} className="mb-1">
                    {line}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Evidence Ledger */}
        {steps.some((s) => s.status === 'completed') && (
          <div className="mt-6 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Cryptographic Evidence Ledger
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 text-slate-300 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Step</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-center">Duration</th>
                    <th className="px-6 py-3 text-left">Hash (SHA256)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {steps.map((step) => (
                    <tr key={step.step} className="hover:bg-slate-700 transition">
                      <td className="px-6 py-4 text-white font-semibold">
                        {step.name}
                      </td>
                      <td className="px-6 py-4">
                        {step.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-900 text-emerald-300 rounded text-xs font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-400">
                        {step.duration_ms > 0 ? `${step.duration_ms}ms` : '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs break-all">
                        {step.hash}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
