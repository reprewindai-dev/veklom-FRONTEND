/**
 * GPC Test/Deploy UI Components
 * Visual preview mode + GitHub Actions export dialog
 * 
 * Generated for: veklom-control-plane/components/gpc/
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Play,
  GitHub,
  Copy,
  ExternalLink,
  Loader,
  X,
} from 'lucide-react';
import { PreviewData, ExecutionEvent } from '@/types/gpc';
import { useGpc } from '@/lib/gpc/useGpc';

// ============================================================================
// TEST PREVIEW PANEL
// ============================================================================

interface TestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: string;
  onApprove?: () => void;
}

export const TestPreviewModal: React.FC<TestPreviewModalProps> = React.memo(
  ({ isOpen, onClose, pipelineId, onApprove }) => {
    const [testMode, setTestMode] = useState<'dry_run' | 'sample' | 'full'>(
      'sample'
    );
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<
      Array<{
        nodeId: string;
        nodeType: string;
        status: 'success' | 'failure' | 'pending';
        rows: number;
        columns: string[];
        sample: any[][];
        error?: string;
      }>
    >([]);
    const [testRunId, setTestRunId] = useState<string | null>(null);
    const [canDeploy, setCanDeploy] = useState(false);

    const handleTestRun = useCallback(async () => {
      setIsRunning(true);
      setResults([]);
      setTestRunId(null);
      setCanDeploy(false);

      try {
        const token = localStorage.getItem('token') || '';
        const eventSource = new EventSource(
          `/api/v1/gpc/test?pipeline_id=${pipelineId}&mode=${testMode}`,
          {
            withCredentials: true,
          }
        );

        eventSource.addEventListener('message', (event) => {
          const data: ExecutionEvent = JSON.parse(event.data);

          if (data.event === 'compiled') {
            console.log('Pipeline compiled:', data);
          } else if (data.event === 'node_preview' && data.preview) {
            setResults((prev) => [
              ...prev,
              {
                nodeId: data.node_id || 'unknown',
                nodeType: 'Transform',
                status: 'success',
                rows: data.preview.rows,
                columns: data.preview.columns,
                sample: data.preview.sample,
              },
            ]);
          } else if (data.event === 'complete') {
            setTestRunId(data.event); // Mock
            setCanDeploy = data.success && data.approval === 'ready_to_deploy';
            eventSource.close();
          } else if (data.error) {
            setResults((prev) => [
              ...prev,
              {
                nodeId: 'error',
                nodeType: 'System',
                status: 'failure',
                rows: 0,
                columns: [],
                sample: [],
                error: data.error,
              },
            ]);
            eventSource.close();
          }
        });

        eventSource.addEventListener('error', () => {
          eventSource.close();
          setIsRunning(false);
        });

        // Timeout after 60s
        setTimeout(() => {
          if (isRunning) {
            eventSource.close();
            setIsRunning(false);
          }
        }, 60000);
      } catch (err) {
        console.error('Test run failed:', err);
        setIsRunning(false);
      }
    }, [pipelineId, testMode, isRunning]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Test Pipeline</h2>
              <p className="text-sm text-gray-500 mt-1">
                Run on sample data to verify correctness before deployment
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="p-6 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Test Mode
            </label>
            <div className="flex gap-3">
              {(['dry_run', 'sample', 'full'] as const).map((mode) => (
                <label
                  key={mode}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={mode}
                    checked={testMode === mode}
                    onChange={(e) =>
                      setTestMode(e.target.value as typeof mode)
                    }
                    className="w-4 h-4"
                    disabled={isRunning}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {mode === 'dry_run'
                      ? '🔍 Dry Run (compile only)'
                      : mode === 'sample'
                      ? '📊 Sample (first 100 rows)'
                      : '⚡ Full (complete dataset)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="p-6">
            {results.length === 0 && !isRunning && (
              <div className="text-center py-12">
                <Play size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">
                  Click "Start Test" to run pipeline on sample data
                </p>
              </div>
            )}

            {isRunning && (
              <div className="flex items-center justify-center py-12 gap-3">
                <Loader size={24} className="animate-spin text-blue-600" />
                <span className="text-gray-700">Running test execution...</span>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 ${
                      result.status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.status === 'success' ? (
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900">
                          {result.nodeId}
                        </h4>
                        {result.status === 'success' ? (
                          <div className="mt-2 text-sm text-gray-700">
                            <p>
                              <strong>Output:</strong> {result.rows} rows,{' '}
                              {result.columns.length} columns
                            </p>
                            {result.sample.length > 0 && (
                              <div className="mt-2 bg-white rounded p-2 text-xs overflow-x-auto">
                                <pre className="font-mono">
                                  {JSON.stringify(result.sample[0], null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-red-700">
                            {result.error || 'Unknown error'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleTestRun}
              disabled={isRunning}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Play size={16} />
              {isRunning ? 'Running...' : 'Start Test'}
            </button>
            {canDeploy && onApprove && (
              <button
                onClick={onApprove}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Approve & Deploy
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

TestPreviewModal.displayName = 'TestPreviewModal';

// ============================================================================
// GITHUB ACTIONS EXPORT DIALOG
// ============================================================================

interface GitHubExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: string;
  pipelineName: string;
}

export const GitHubExportDialog: React.FC<GitHubExportDialogProps> = React.memo(
  ({ isOpen, onClose, pipelineId, pipelineName }) => {
    const [repoOwner, setRepoOwner] = useState('');
    const [repoName, setRepoName] = useState('');
    const [githubToken, setGithubToken] = useState('');
    const [schedule, setSchedule] = useState('0 0 * * *'); // daily midnight
    const [isExporting, setIsExporting] = useState(false);
    const [exportResult, setExportResult] = useState<any>(null);

    const handleExport = useCallback(async () => {
      if (!repoOwner || !repoName || !githubToken) {
        alert('Please fill in all fields');
        return;
      }

      setIsExporting(true);

      try {
        const response = await fetch('/api/v1/gpc/export-github', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: JSON.stringify({
            pipeline_id: pipelineId,
            repo_owner: repoOwner,
            repo_name: repoName,
            github_token: githubToken,
            schedule,
          }),
        });

        const result = await response.json();
        setExportResult(result);
      } catch (err) {
        console.error('Export failed:', err);
        setExportResult({ status: 'failed', error: String(err) });
      } finally {
        setIsExporting(false);
      }
    }, [pipelineId, repoOwner, repoName, githubToken, schedule]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4">
          {/* Header */}
          <div className="border-b border-gray-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitHub size={24} className="text-gray-900" />
              <h2 className="text-xl font-bold text-gray-900">
                Export to GitHub Actions
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {!exportResult ? (
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Automatically deploy your pipeline on every commit to main
                branch with approval gates.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Username/Org
                </label>
                <input
                  type="text"
                  value={repoOwner}
                  onChange={(e) => setRepoOwner(e.target.value)}
                  placeholder="e.g., acme-corp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isExporting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="e.g., data-pipelines"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isExporting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  disabled={isExporting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  <a
                    href="https://github.com/settings/tokens/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Create a token
                  </a>{' '}
                  with repo access
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Execution Schedule (cron)
                </label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="0 0 * * * (daily at midnight)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isExporting}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                ℹ️ Your workflow will:
                <ul className="mt-2 space-y-1 ml-4">
                  <li>✅ Compile on every commit</li>
                  <li>✅ Test on staging automatically</li>
                  <li>✅ Require manual approval to deploy to production</li>
                  <li>✅ Run on schedule (if configured)</li>
                </ul>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting || !repoOwner || !repoName}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <GitHub size={16} />
                      Export Workflow
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {exportResult.status === 'success' ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-900">
                      Workflow Exported!
                    </h3>
                    <p className="text-sm text-green-800 mt-1">
                      Your pipeline is now deployed via GitHub Actions
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <strong>Repository:</strong>{' '}
                      <code className="bg-white px-2 py-1 rounded text-xs">
                        {repoOwner}/{repoName}
                      </code>
                    </div>
                    <div>
                      <strong>Workflow File:</strong>{' '}
                      <code className="bg-white px-2 py-1 rounded text-xs">
                        .github/workflows/gpc-{pipelineId}.yml
                      </code>
                    </div>
                    <div>
                      <strong>Next Steps:</strong>
                      <ol className="mt-2 ml-4 space-y-1">
                        <li>1. Commit changes to main branch</li>
                        <li>2. Workflow runs automatically</li>
                        <li>3. Approve deployment in GitHub</li>
                        <li>4. Pipeline deploys to production</li>
                      </ol>
                    </div>
                  </div>

                  {exportResult.workflow_url && (
                    <a
                      href={exportResult.workflow_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-2 text-center text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={16} />
                      View Workflow
                    </a>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <AlertCircle size={32} className="text-red-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-red-900">Export Failed</h3>
                    <p className="text-sm text-red-800 mt-2">
                      {exportResult.error}
                    </p>
                  </div>

                  <button
                    onClick={() => setExportResult(null)}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

GitHubExportDialog.displayName = 'GitHubExportDialog';
