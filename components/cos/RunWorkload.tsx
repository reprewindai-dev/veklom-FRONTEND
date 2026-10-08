"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { sealCredential } from "@/lib/fabric-seal";

/**
 * Run one governed workload on your own machines.
 *
 * Your session asks CAPPO for one single-use grant (compute.job@v1) for this job; the job is
 * placed on one of your workspace's machines; this browser seals the grant to that machine's
 * key (lib/fabric-seal.ts), so the website and COMPUTLESS only carry the sealed blob. The
 * machine claims its start with CAPPO, runs the workload with no network, and commits the
 * result through CAPPO, which records it in the results sink and ends the grant.
 */

interface MountResponse {
  decision: string;
  reason?: string;
  mount: { id: string };
  token: { token_id: string; nonce: string; ttl_seconds: number; single_use: boolean };
  holder_credential: string;
}
interface SealTo { worker_id: string; x25519_pub: string; hostname?: string }
interface JobView {
  job: {
    job_id: string;
    status: string;
    placement: { chosen: { worker_id: string; hostname: string } | null; summary: string } | null;
    result: { result_hash?: string; elapsed_s?: number; cappo_reason?: string } | null;
    events?: { at: string; status: string; detail?: string }[];
  };
  seal_to?: SealTo | null;
}

const TERMINAL = new Set(["completed", "failed", "cancelled", "refused", "denied"]);
const SIZES = [{ n: 1_000_000, label: "1 million" }, { n: 2_000_000, label: "2 million" }, { n: 5_000_000, label: "5 million" }];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Step = { text: string; tone: "active" | "ok" | "bad" };

export function RunWorkload({ hasMachines }: { hasMachines: boolean }) {
  const [n, setN] = useState(SIZES[1].n);
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [final, setFinal] = useState<JobView["job"] | null>(null);
  const [mountId, setMountId] = useState<string | null>(null);
  const push = (s: Step) => setSteps((all) => [...all, s]);

  const run = async () => {
    setBusy(true); setSteps([]); setFinal(null); setMountId(null);
    const jobId = `job-${crypto.randomUUID().slice(0, 8)}`;
    const spec = { workload: "dataset-digest", params: { n }, dataset: null, cpus: 1, mem_gb: 0.5 };
    try {
      const me = await api<{ workspace_id?: string | null }>("/api/v1/auth/me");
      if (!me.workspace_id) throw new Error("Create your workspace first");

      push({ text: "Asking CAPPO for one single-use grant for this job…", tone: "active" });
      const m = await api<MountResponse>("/api/cappo/v1/capability/mounts", {
        method: "POST",
        body: {
          package_ref: "compute.job@v1",
          execution_scope: { workspace: me.workspace_id, project: "private-cloud" },
          requested_action_scope: { reads: [], writes: ["job.commit"] },
          ttl_seconds: 900,
          execution_id: jobId,
        },
      });
      if (m.decision !== "allow") throw new Error(`CAPPO refused the grant: ${m.reason ?? m.decision}`);
      setMountId(m.mount.id);
      push({ text: `CAPPO granted ${m.mount.id}: single use, ${Math.round(m.token.ttl_seconds / 60)} minutes, may only commit this job's result.`, tone: "ok" });
      // Held in memory only until it is sealed below; never stored or sent in clear.
      let holder: string | null = m.holder_credential;

      const submitted = await api<JobView>("/api/computless/fabric/jobs", {
        method: "POST",
        body: { job_id: jobId, spec, authority: { mount_id: m.mount.id, execution_id: jobId } },
      });
      let sealTo = submitted.seal_to ?? null;
      let machine = submitted.job.placement?.chosen?.hostname;
      push({ text: `Submitted ${jobId} to your workspace.`, tone: "ok" });
      for (let i = 0; !sealTo && i < 30; i += 1) {
        await sleep(2000);
        const polled = await api<JobView>(`/api/computless/fabric/jobs/${jobId}`);
        sealTo = polled.seal_to ?? null;
        machine = polled.job.placement?.chosen?.hostname ?? machine;
      }
      if (!sealTo) {
        holder = null;
        throw new Error("None of your machines is available; the job stays queued and its grant expires unused.");
      }

      const sealed = sealCredential(sealTo.x25519_pub, jobId, {
        holder: holder as string, token_id: m.token.token_id, nonce: m.token.nonce, mount_id: m.mount.id, job_id: jobId,
      });
      holder = null;
      await api(`/api/computless/fabric/jobs/${jobId}/credential`, { method: "POST", body: { sealed } });
      push({ text: `Placed on ${machine ?? sealTo.worker_id} (${sealTo.worker_id}); grant sealed to that machine in this browser.`, tone: "ok" });

      push({ text: "Waiting for the machine to claim its start, run, and commit through CAPPO…", tone: "active" });
      let view: JobView["job"] | null = null;
      for (let i = 0; i < 90; i += 1) {
        await sleep(2000);
        view = (await api<JobView>(`/api/computless/fabric/jobs/${jobId}`)).job;
        if (TERMINAL.has(view.status)) break;
      }
      setFinal(view);
      push(view && view.status === "completed"
        ? { text: `Committed through CAPPO (${view.result?.cappo_reason ?? "allowed"}). The grant is now used up.`, tone: "ok" }
        : { text: `Ended as ${view?.status ?? "unknown"}: ${view?.result?.cappo_reason ?? "see the job's events"}.`, tone: "bad" });
    } catch (cause) {
      push({ text: (cause as Error).message || "The workload did not run", tone: "bad" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-4 text-sm">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
        <dt className="text-cos-steel">Workload</dt><dd className="text-cos-text">dataset-digest: counts primes up to N (deterministic, so anyone can recompute it)</dd>
        <dt className="text-cos-steel">Runs on</dt><dd className="text-cos-text">one of your workspace&apos;s machines, in a container with no network</dd>
        <dt className="text-cos-steel">Resources</dt><dd className="text-cos-text">1 CPU, 0.5 GB memory</dd>
        <dt className="text-cos-steel">Authority</dt><dd className="text-cos-text">one CAPPO grant: single use, short-lived (CAPPO sets the limit, never more than 15 minutes), may only commit this job&apos;s result; the machine must claim its start first</dd>
        <dt className="text-cos-steel">Result</dt><dd className="text-cos-text">recorded once in the results sink, where it can be re-run and checked independently</dd>
      </dl>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-cos-steel" htmlFor="workload-n">N</label>
        <select id="workload-n" value={n} disabled={busy} onChange={(e) => setN(Number(e.target.value))}
          className="rounded-md border border-cos-border bg-cos-bg px-2 py-1 text-xs text-cos-text">
          {SIZES.map((s) => <option key={s.n} value={s.n}>{s.label}</option>)}
        </select>
        <button type="button" disabled={busy || !hasMachines} onClick={() => void run()}
          className="rounded-lg bg-cos-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-bg disabled:opacity-40">
          {busy ? "Running…" : "Request authority and run"}
        </button>
        {!hasMachines && <span className="text-xs text-cos-warn">Connect a machine first.</span>}
      </div>
      {steps.length > 0 && (
        <ol className="space-y-1 text-xs">
          {steps.map((s, i) => (
            <li key={i} className={s.tone === "ok" ? "text-cos-verified" : s.tone === "bad" ? "text-cos-danger" : "text-cos-accent"}>{s.text}</li>
          ))}
        </ol>
      )}
      {final && final.status === "completed" && (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-lg border border-cos-border p-3 font-mono text-[11px] sm:grid-cols-2">
          <dt className="text-cos-steel">Job</dt><dd className="break-all">{final.job_id}</dd>
          <dt className="text-cos-steel">CAPPO grant</dt><dd className="break-all">{mountId}</dd>
          <dt className="text-cos-steel">Ran on</dt><dd>{final.placement?.chosen?.hostname ?? "—"}</dd>
          <dt className="text-cos-steel">Result hash</dt><dd className="break-all">{final.result?.result_hash ?? "—"}</dd>
          <dt className="text-cos-steel">Elapsed</dt><dd>{final.result?.elapsed_s != null ? `${final.result.elapsed_s}s` : "—"}</dd>
        </dl>
      )}
    </div>
  );
}
