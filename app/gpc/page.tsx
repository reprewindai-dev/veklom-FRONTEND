/**
 * GPC Page (Replacement for placeholder)
 * Full pipeline generator with canvas, compiler, execution, preview
 * 
 * Generated for: veklom-control-plane/app/gpc/page.tsx
 */

'use client';

import React, { useState, useCallback } from 'react';
import Shell from '@/components/Shell';
import { useGpc } from '@/lib/gpc/useGpc';
import { GpcCanvas, GpcPropertyPanel } from '@/components/gpc/GpcCanvas';
import { useExecutionStore, usePreviewStore } from '@/lib/gpc/stores';
import { ModuleHeader, Pill } from '@/components/telemetry';
import { BookOpen, Play, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface CompilationModal {
  isOpen: boolean;
  pythonCode: string;
  nodeCount: number;
  warnings: string[];
}

interface PreviewModal {
  isOpen: boolean;
  rows: number;
  columns: string[];
  sample: any[][];
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

  // UI state
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const [intentInput, setIntentInput] = useState('');
  const [compilationModal, setCompilationModal] = useState<CompilationModal>({
    isOpen: false,
    pythonCode: '',
    nodeCount: 0,
    warnings: [],
  });
  const [previewModal, setPreviewModal] = useState<PreviewModal>({
    isOpen: false,
    rows: 0,
    columns: [],
    sample: [],
  });
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

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

  return (
    <Shell>
      {/* Header */}
      <ModuleHeader
        breadcrumb="GPC · Generative Pipeline Compiler"
        title="Pipeline Generator"
        subtitle="Convert messy intent into deterministic, executed pipelines."
        pills={
          <>
            <Pill tone="green" dot>
              Backend live
            </Pill>
            <Pill tone="cyan">Compile → Execute</Pill>
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

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setShowIntentDialog(true)}
          disabled={isExecuting || isLoading}
          className="px-4 py-2 text-sm font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <BookOpen size={16} />
          Generate from Intent
        </button>
        <button
          onClick={handleCompile}
          disabled={isExecuting || isLoading}
          className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Compiling...' : 'Compile'}
        </button>
        <button
          onClick={handleExecute}
          disabled={isExecuting || isLoading}
          className="px-4 py-2 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Play size={16} />
          {isExecuting ? 'Running...' : 'Execute'}
        </button>
      </div>

      {/* Main layout: Canvas + Property Panel + Preview */}
      <div className="flex gap-4 h-[calc(100vh-300px)] rounded-xl overflow-hidden border border-border shadow-md">
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

      {/* Compilation Modal */}
      {compilationModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Compiled Pipeline</h2>

            {compilationModal.warnings.length > 0 && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Warnings:</strong>
                    <ul className="mt-1 space-y-1">
                      {compilationModal.warnings.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Nodes:</strong> {compilationModal.nodeCount}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Generated Python:</p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                {compilationModal.pythonCode}
              </pre>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(compilationModal.pythonCode);
                  setToast({ message: 'Copied to clipboard', type: 'success' });
                }}
                className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
              >
                Copy Code
              </button>
              <button
                onClick={() => setCompilationModal({ ...compilationModal, isOpen: false })}
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
