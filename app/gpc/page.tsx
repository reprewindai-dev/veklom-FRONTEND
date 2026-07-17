/**
 * GPC Page (UPDATED) — Full Pipeline Lifecycle
 * Compile → Test (sample data) → Approve → Deploy (GitHub Actions)
 * 
 * Generated for: veklom-control-plane/app/gpc/page.tsx
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Shell from '@/components/Shell';
import { useGpc } from '@/lib/gpc/useGpc';
import { GpcCanvas, GpcPropertyPanel } from '@/components/gpc/GpcCanvas';
import {
  TestPreviewModal,
  GitHubExportDialog,
} from '@/components/gpc/GpcTestDeployUI';
import { useExecutionStore, usePreviewStore } from '@/lib/gpc/stores';
import { ModuleHeader, Pill } from '@/components/telemetry';
import {
  BookOpen,
  Play,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  TestTube2,
  Github,
  Copy,
} from 'lucide-react';

interface CompilationModal {
  isOpen: boolean;
  pythonCode: string;
  nodeCount: number;
  warnings: string[];
}

export default function GpcPage() {
  const { compile, execute, generateFromIntent, isLoading, error } = useGpc({
    onSuccess: (msg) => setToast({ message: msg, type: 'success' }),
    onError: (msg) => setToast({ message: msg, type: 'error' }),
  });

  const isExecuting = useExecutionStore((state) => state.isRunning);
  const progress = useExecutionStore((state) => state.getRunProgress());
  const selectedPreview = usePreviewStore((state) => {
    const nodeId = state.selectedPreviewNodeId;
    return nodeId ? state.previews.get(nodeId) : undefined;
  });

  // Protocol status
  const [protocolStatus, setProtocolStatus] = React.useState<{loaded: boolean; count: number} | null>(null);

  useEffect(() => {
    fetch('https://api.veklom.com/protocol.json')
      .then(r => r.json())
      .then(d => setProtocolStatus({ loaded: true, count: Object.keys(d.capabilities || {}).length }))
      .catch(() => setProtocolStatus({ loaded: false, count: 0 }));
  }, []);

  // UI state
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const [intentInput, setIntentInput] = useState('');
  const [compilationModal, setCompilationModal] = useState<CompilationModal>({
    isOpen: false,
    pythonCode: '',
    nodeCount: 0,
    warnings: [],
  });
  const [showTestModal, setShowTestModal] = useState(false);
  const [showGitHubDialog, setShowGitHubDialog] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(
    null
  );
  const [pipelineName, setPipelineName] = useState('Untitled Pipeline');
  const [deploymentStatus, setDeploymentStatus] = useState<string | null>(null);

  // Compile pipeline
  const handleCompile = useCallback(async () => {
    const result = await compile();
    if (result) {
      setCompilationModal({
        isOpen: true,
        pythonCode: result.python_code,
        nodeCount: result.node_count,
        warnings: result.warnings || [],
      });
    }
  }, [compile]);

  // Execute pipeline
  const handleExecute = useCallback(async () => {
    await execute();
  }, [execute]);

  // Generate from intent
  const handleGenerateIntent = useCallback(async () => {
    if (!intentInput.trim()) {
      setToast({ message: 'Please describe your pipeline intent', type: 'error' });
      return;
    }
    await generateFromIntent(intentInput);
    setShowIntentDialog(false);
    setIntentInput('');
  }, [intentInput, generateFromIntent]);

  // Approve test and prepare for deployment
  const handleApproveTest = useCallback(async () => {
    setToast({
      message: '✅ Test passed! Ready for deployment.',
      type: 'success',
    });
    setShowTestModal(false);
    setDeploymentStatus('tested');
  }, []);

  return (
    <Shell>
      {/* Protocol Status Badge */}
      {protocolStatus && (
        <a
          href="https://api.veklom.com/protocol.json"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px',
            background: protocolStatus.loaded ? 'rgba(0,255,128,0.1)' : 'rgba(255,60,60,0.1)',
            border: `1px solid ${protocolStatus.loaded ? 'rgba(0,255,128,0.3)' : 'rgba(255,60,60,0.3)'}`,
            color: protocolStatus.loaded ? '#00ff80' : '#ff3c3c',
            fontSize: '11px', fontFamily: 'monospace', textDecoration: 'none',
            position: 'absolute', top: '16px', right: '16px', zIndex: 10
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
          {protocolStatus.loaded ? `${protocolStatus.count} capabilities live` : 'protocol offline'}
        </a>
      )}

      {/* Header */}
      <ModuleHeader
        breadcrumb="GPC · Generative Pipeline Compiler"
        title="Pipeline Generator"
        subtitle="Visual intent → Executable pipeline → Auto-deployed to production"
        pills={
          <>
            <Pill tone="green" dot>
              Backend live
            </Pill>
            <Pill tone="cyan">Test → Deploy</Pill>
            {deploymentStatus && (
              <Pill tone="amber">
                {deploymentStatus === 'tested' ? '✅ Ready to deploy' : deploymentStatus}
              </Pill>
            )}
            <Pill tone="amber" dot={isExecuting}>
              {isExecuting ? 'Running' : 'Ready'}
            </Pill>
          </>
        }
      />

      {/* Toast notification */}
      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span className="text-sm">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Progress bar during execution */}
      {isExecuting && (
        <div className="mb-4 bg-gray-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Executing: {progress.completed}/{progress.total} nodes
            </span>
            <span className="text-sm text-gray-600">
              {progress.percent.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Pipeline Workflow Toolbar */}
      <div className="mb-4 space-y-3">
        {/* Top row: Generation & Compilation */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowIntentDialog(true)}
            disabled={isExecuting || isLoading}
            className="px-4 py-2 text-sm font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <BookOpen size={16} />
            Generate from Intent
          </button>
          <button
            onClick={handleCompile}
            disabled={isExecuting || isLoading}
            className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⌛</span>
                Compiling...
              </>
            ) : (
              <>
                📋 Compile
              </>
            )}
          </button>
        </div>

        {/* Second row: Operational stages (Test & Deploy) */}
        <div className="flex gap-2 flex-wrap bg-gray-50 p-2 rounded-lg border border-border">
          <button
            onClick={() => setShowTestModal(true)}
            disabled={isExecuting || isLoading}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1.5"
          >
            <TestTube2 size={14} />
            Run Test Preview
          </button>

          <button
            onClick={() => setShowGitHubDialog(true)}
            disabled={deploymentStatus !== 'tested' || isExecuting}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Github size={14} />
            Export to GitHub Actions
          </button>
        </div>
      </div>

      {/* Main layout: Canvas + Panels */}
      <div className="flex gap-4 h-[calc(100vh-320px)] rounded-xl overflow-hidden border border-border shadow-md">
        {/* Canvas (left) */}
        <div className="flex-1">
          <GpcCanvas onCompile={handleCompile} onExecute={handleExecute} />
        </div>

        {/* Property Panel (right) */}
        <GpcPropertyPanel />

        {/* Preview Panel (far right, if data exists) */}
        {selectedPreview && (
          <div className="w-80 border-l border-border bg-gray-50 overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm mb-1">Data Preview</h3>
              <p className="text-xs text-gray-500">
                {selectedPreview.rows} rows, {selectedPreview.columns.length} columns
              </p>
            </div>
            <div className="p-4">
              {/* Simple table preview */}
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      {selectedPreview.columns.slice(0, 3).map((col) => (
                        <th
                          key={col}
                          className="border border-gray-300 px-2 py-1 bg-gray-100 font-medium text-left"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPreview.sample.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {row.slice(0, 3).map((val, j) => (
                          <td
                            key={j}
                            className="border border-gray-300 px-2 py-1 text-gray-700"
                          >
                            {String(val).slice(0, 20)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* Intent Dialog */}
      {showIntentDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">Generate Pipeline from Intent</h2>
            <p className="text-sm text-gray-600 mb-4">
              Describe what you want your pipeline to do. Use natural language.
            </p>
            <textarea
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              placeholder="E.g., 'Load sales.csv, filter for completed orders, group by customer, and save to results.parquet'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm mb-4 h-24"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowIntentDialog(false)}
                className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateIntent}
                disabled={isLoading}
                className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compilation Result Modal */}
      {compilationModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Compilation Result</h2>
              <Pill tone="green">{compilationModal.nodeCount} nodes compiled</Pill>
            </div>

            {/* Warnings */}
            {compilationModal.warnings.length > 0 && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex flex-col gap-1 text-sm">
                <span className="font-semibold flex items-center gap-1">
                  <AlertTriangle size={16} />
                  Warnings:
                </span>
                <ul className="list-disc pl-5">
                  {compilationModal.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Generated Python Code:</p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-64 overflow-y-auto">
                {compilationModal.pythonCode}
              </pre>
            </div>

            <div className="flex gap-2 justify-end mt-auto">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(compilationModal.pythonCode);
                  setToast({ message: 'Code copied to clipboard', type: 'success' });
                }}
                className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy size={16} />
                Copy Code
              </button>
              <button
                onClick={() => setCompilationModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Preview Modal */}
      <TestPreviewModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        pipelineId="pipeline_123"
        onApprove={handleApproveTest}
      />

      {/* GitHub Export Dialog */}
      <GitHubExportDialog
        isOpen={showGitHubDialog}
        onClose={() => setShowGitHubDialog(false)}
        pipelineId="pipeline_123"
        pipelineName={pipelineName}
      />
    </Shell>
  );
}
