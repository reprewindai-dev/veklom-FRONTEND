import React, { useState } from 'react';
import { AgentTask, PluginModule } from '@/lib/spine/types';
import { Bot, RefreshCw, Zap, Sliders, Sparkles, Terminal, CheckCircle2, Play, Code, Layers } from 'lucide-react';

interface HerdrAgentEngineProps {
  tasks: AgentTask[];
  plugins: PluginModule[];
  onTriggerAgentStep: (taskId: string, userPrompt?: string) => Promise<void>;
  onTogglePlugin: (pluginId: string, enabled: boolean) => void;
}

export const HerdrAgentEngine: React.FC<HerdrAgentEngineProps> = ({
  tasks,
  plugins,
  onTriggerAgentStep,
  onTogglePlugin,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || 'herdr-task-01');
  const [promptInput, setPromptInput] = useState<string>('');
  const [isStepping, setIsStepping] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'agent' | 'plugins'>('agent');

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const handleStep = async () => {
    setIsStepping(true);
    try {
      await onTriggerAgentStep(selectedTask.id, promptInput);
      setPromptInput('');
    } catch (err) {
      console.error('Agent step trigger failed:', err);
    } finally {
      setIsStepping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Explaining the Herdr Recursion Pattern */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                HERDR RECURSION OPERATOR
              </span>
              <span className="text-xs text-slate-400 font-mono">Self-Hosting Agent Runtime</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Herdr Autonomous Agent Environment &amp; Infinite Plugin Surface
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              <strong className="text-sky-300">Agents write Herdr &rarr; Herdr runs agents &rarr; agents drive Herdr &rarr; Herdr improves</strong>.
              Features a tiny frozen core (1 binary, 3 layers, 4 states) coupled with an infinite extensible plugin surface.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px]">PLUGINS ACTIVE</span>
              <span className="text-base font-bold text-sky-400">
                {plugins.filter((p) => p.enabled).length} / {plugins.length}
              </span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px]">RECURSION DEPTH</span>
              <span className="text-base font-bold text-emerald-400">
                {selectedTask?.recursionDepth || 0} / {selectedTask?.maxRecursionDepth || 10}
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex space-x-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'agent'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Agent Self-Hosting Loop</span>
          </button>
          <button
            onClick={() => setActiveTab('plugins')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'plugins'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Plugin Extensibility Surface ({plugins.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'agent' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Tasks Sidebar */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Herdr Agent Tasks ({tasks.length})
            </h3>

            <div className="space-y-3">
              {tasks.map((task) => {
                const isSelected = task.id === selectedTaskId;

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-slate-800/90 border-sky-500 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4 text-sky-400" />
                        <h4 className="font-semibold text-slate-100 text-sm">{task.name}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {task.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
                        <span className="text-slate-500 block text-[9px]">OPS/SEC</span>
                        <span className="text-slate-200 font-bold">{task.metrics.opsPerSec}</span>
                      </div>
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
                        <span className="text-slate-500 block text-[9px]">TASKS DRIVEN</span>
                        <span className="text-slate-200 font-bold">{task.metrics.tasksDriven}</span>
                      </div>
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
                        <span className="text-slate-500 block text-[9px]">SUCCESS %</span>
                        <span className="text-emerald-400 font-bold">{task.metrics.successRatePct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Agent Inspector & AI Optimizer */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                  <span>{selectedTask.name}</span>
                  <span className="text-xs text-sky-400 font-mono">Depth: {selectedTask.recursionDepth}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Last Self-Optimization: {selectedTask.lastOptimizedAt ? new Date(selectedTask.lastOptimizedAt).toLocaleTimeString() : 'Initial'}
                </p>
              </div>

              <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Gemini Substrate AI Active</span>
              </div>
            </div>

            {/* Prompt & Trigger Manual Step */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400">
                Trigger Self-Improvement Recursion Loop (Prompt Guidance Optional)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. Optimize latency weighting across local container enclave..."
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={handleStep}
                  disabled={isStepping}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isStepping ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isStepping ? 'Recursion...' : 'Run Step'}</span>
                </button>
              </div>
            </div>

            {/* Agent Execution Logs */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Terminal className="h-3.5 w-3.5 text-sky-400" />
                <span>Agent Self-Hosting Reflection &amp; Improvement Logs</span>
              </h4>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 max-h-72 overflow-y-auto text-xs font-mono text-slate-300">
                {selectedTask.logs.map((log, idx) => (
                  <div key={idx} className="flex space-x-2 border-b border-slate-900 pb-1.5 last:border-none">
                    <span className="text-sky-400 select-none">&gt;</span>
                    <span className="leading-relaxed">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Infinite Plugin Surface View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Extensible Plugin Modules ({plugins.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Closed Core + Infinite Surface</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                className={`p-5 rounded-xl border transition space-y-3 ${
                  plugin.enabled
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                    {plugin.category}
                  </span>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plugin.enabled}
                      onChange={(e) => onTogglePlugin(plugin.id, e.target.checked)}
                      className="h-4 w-4 accent-sky-500 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{plugin.enabled ? 'ACTIVE' : 'OFF'}</span>
                  </label>
                </div>

                <div>
                  <h4 className="font-semibold text-white text-base">{plugin.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{plugin.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>v{plugin.version}</span>
                  <span>{plugin.downloads.toLocaleString()} installs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
