"use client";

import { useState, useEffect, useCallback } from "react";
import { Server, Github, Pause, Trash2, Code2 } from "lucide-react";
import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { PageHeader, Card, Table, Button, Spinner, ErrorBox, GithubButton } from "@/components/ui";
import { ModuleHeader, Pill } from "@/components/telemetry";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";

interface Deployment {
  id: string;
  name: string;
  deployment_type?: string;
  endpoint_url?: string;
  status: string;
  created_at?: string;
}

interface GithubRepo {
  id: number;
  full_name: string;
  private: boolean;
}

export default function DeploymentsPage() {
  const [deps, setDeps] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // GitHub integration states
  const [githubLoading, setGithubLoading] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [githubError, setGithubError] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  // Deployment creation states
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState("");

  const loadDeps = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<Deployment[]>("/api/v1/deployments");
      setDeps(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Failed to load deployments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeps();
  }, [loadDeps]);

  async function handleConnectGithub() {
    setGithubLoading(true);
    setGithubError("");
    try {
      const res = await api<GithubRepo[]>("/api/v1/auth/github/repos").catch(() => null);
      if (res && Array.isArray(res) && res.length > 0) {
        setRepos(res);
      } else {
        // If GitHub OAuth is not connected yet, redirect to GitHub login
        window.location.href = "/api/v1/auth/github/login";
      }
    } catch (e: any) {
      setGithubError(e.message || "Failed to connect to GitHub. Try again.");
    } finally {
      setGithubLoading(false);
    }
  }

  async function handleDeploy() {
    if (!selectedRepo) return;
    setDeploying(true);
    setDeployError("");
    try {
      await api<Deployment>("/api/v1/deployments", {
        method: "POST",
        body: {
          name: selectedRepo,
          type: "byos",
          status: "deploying",
          endpoint: `https://${selectedRepo.split("/")[1]}.veklom.run`,
        },
      });
      setModalOpen(false);
      setSelectedRepo(null);
      setRepos([]);
      loadDeps();
    } catch (e: any) {
      setDeployError(e.message || "Failed to deploy repository.");
    } finally {
      setDeploying(false);
    }
  }

  async function deleteDep(id: string) {
    if (!confirm("Delete this deployment? This cannot be undone.")) return;
    try {
      await api(`/api/v1/deployments/${id}`, { method: "DELETE" });
      loadDeps();
    } catch {
      alert("Failed to delete deployment.");
    }
  }

  function openModal() {
    setModalOpen(true);
    setRepos([]);
    setSelectedRepo(null);
    setDeployError("");
    setGithubError("");
  }

  return (
    <Shell>
      <TierGate required="pro" feature="Deployments">
        <ModuleHeader
          breadcrumb="Infrastructure · Deployments"
          title="Bring Your Own Source"
          subtitle="Connect a GitHub repository, wrap it in the Sovereign Sandbox, and deploy it as a governed endpoint — all without leaving the control plane."
          pills={<><Pill tone="green" dot>Sovereign Sandbox</Pill><Pill tone="amber">BYOS</Pill><Pill tone="cyan">GitHub Connect</Pill></>}
          actions={<Button onClick={openModal}><Server size={14} /> New Deployment</Button>}
        />

        {error && <div className="mb-4"><ErrorBox message={error} /></div>}

        {loading ? (
          <Card className="flex items-center justify-center p-12">
            <div className="flex items-center gap-3 text-ink-400 text-sm">
              <Spinner /> Loading deployments…
            </div>
          </Card>
        ) : (
          <Table<Deployment>
            rows={deps}
            rowKey={(r) => r.id}
            empty="No active deployments yet. Connect a GitHub repository to get started."
            columns={[
              {
                key: "name",
                header: "Source / Name",
                render: (r) => (
                  <div>
                    <div className="font-medium text-ink-50 flex items-center gap-2">
                      <Server size={14} className="text-brand-400 shrink-0" />
                      {r.name}
                    </div>
                    <div className="text-[11px] text-ink-400 mt-0.5 font-mono">{r.id}</div>
                  </div>
                ),
              },
              {
                key: "endpoint",
                header: "Endpoint",
                render: (r) => (
                  <code className="text-xs text-ink-300 bg-bg-800 rounded px-2 py-1 block truncate max-w-[220px]">
                    {r.endpoint_url || "Pending…"}
                  </code>
                ),
              },
              {
                key: "type",
                header: "Type",
                render: (r) => (
                  <Pill tone="neutral">{r.deployment_type || "byos"}</Pill>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (r) => {
                  const tone =
                    r.status === "active" ? "green" :
                    r.status === "deploying" ? "amber" : "neutral";
                  return <Pill tone={tone} dot={r.status === "active" || r.status === "deploying"}>{r.status}</Pill>;
                },
              },
              {
                key: "actions",
                header: "",
                width: "100px",
                render: (r) => (
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 text-ink-400 hover:text-ink-50 transition" title="View Logs">
                      <Code2 size={14} />
                    </button>
                    <button className="p-1.5 text-ink-400 hover:text-brand-400 transition" title="Pause">
                      <Pause size={14} />
                    </button>
                    <button
                      onClick={() => deleteDep(r.id)}
                      className="p-1.5 text-ink-400 hover:text-accent-red transition"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}

        {/* BYOS Modal */}
        <Modal
          open={modalOpen}
          onClose={() => !deploying && setModalOpen(false)}
          title="New Deployment"
          subtitle="Connect a GitHub repository to deploy it as a governed sovereign endpoint."
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={deploying}>
                Cancel
              </Button>
              <Button
                className="ml-auto"
                onClick={handleDeploy}
                disabled={!selectedRepo || deploying}
                loading={deploying}
              >
                Deploy as endpoint
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {githubError && <ErrorBox message={githubError} />}
            {deployError && <ErrorBox message={deployError} />}

            {repos.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-border flex items-center justify-center mx-auto mb-4 text-ink-400">
                  <Github size={24} />
                </div>
                <h3 className="text-sm font-semibold mb-2">Connect GitHub</h3>
                <p className="text-xs text-ink-400 mb-6 max-w-[280px] mx-auto">
                  Authorize Veklom to access your repositories so we can build and deploy your source code as a governed endpoint.
                </p>
                <GithubButton
                  onClick={handleConnectGithub}
                  disabled={githubLoading}
                  label={githubLoading ? "Connecting…" : "Continue with GitHub"}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-400 block">
                  Select Repository
                </label>
                <div className="border border-border rounded-lg overflow-hidden divide-y divide-border/60 max-h-[280px] overflow-y-auto scroll-thin">
                  {repos.map((r) => (
                    <button
                      key={r.full_name}
                      onClick={() => setSelectedRepo(r.full_name)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${
                        selectedRepo === r.full_name
                          ? "bg-brand-500/10"
                          : "hover:bg-bg-800"
                      }`}
                    >
                      <Github
                        size={16}
                        className={selectedRepo === r.full_name ? "text-brand-400" : "text-ink-400"}
                      />
                      <span className="text-sm font-medium flex-1 text-left">{r.full_name}</span>
                      {r.private && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-ink-400 uppercase">
                          Private
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {selectedRepo && (
                  <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-lg text-xs text-brand-400/90 leading-relaxed">
                    <span className="font-semibold block mb-0.5">Ready to deploy: {selectedRepo}</span>
                    Your repo will be wrapped in the Sovereign Sandbox. Secrets and API keys will be injected automatically.
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      </TierGate>
    </Shell>
  );
}
