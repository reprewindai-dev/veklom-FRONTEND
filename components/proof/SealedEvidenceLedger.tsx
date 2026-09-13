import {
  readSealedBundlePayloads,
  type SealedBundleStatus,
} from "@/lib/proof/sealed-bundles";
import { StageLabel } from "@/components/brand/PremiumPrimitives";

function topLevelFieldCount(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return 0;
  return Object.keys(payload).length;
}

function MobilityLedgerSteps({
  entries,
}: {
  entries: Array<{ bundle: SealedBundleStatus; payload: unknown }>;
}) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      {entries.map(({ bundle, payload }) => (
        <div key={bundle.file} className="rounded-2xl border border-theme-border bg-theme-bg p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[.18em] text-theme-inkDim">{bundle.program}</div>
          <p className="mt-3 text-sm leading-6 text-theme-ink">
            Bundle parsed: {topLevelFieldCount(payload)} top-level fields
          </p>
        </div>
      ))}
    </div>
  );
}

export async function SealedEvidenceLedger({
  bundles,
}: {
  bundles: SealedBundleStatus[];
}) {
  const allPresent = bundles.length === 3 && bundles.every((bundle) => bundle.present);
  const parsedBundles = allPresent ? await readSealedBundlePayloads(bundles) : [];

  return (
    <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 sm:px-8 md:pb-28 lg:px-10">
      <div className="rounded-[28px] border border-theme-border bg-theme-surface p-5 shadow-[0_35px_100px_rgba(2,8,23,0.06)] sm:p-7 md:p-9">
        <div className="max-w-3xl">
          <StageLabel>Sealed evidence</StageLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-theme-ink md:text-5xl">Physical mobility evidence</h2>
          <p className="mt-4 text-sm leading-7 text-theme-inkDim">Sealed bundles from the P2-HOST and VDB-MOBILITY-P1 programs. Hashes are computed over the served bytes at request time; compare them against your own download to verify bit-for-bit.</p>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-theme-border text-[10px] font-semibold uppercase tracking-[.18em] text-theme-inkDim">
              <tr>
                <th className="pb-3 pr-4">Bundle</th>
                <th className="pb-3 pr-4">Program</th>
                <th className="pb-3 pr-4">File</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Bytes</th>
                <th className="pb-3">SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {bundles.map((bundle) => (
                <tr key={bundle.file} className="align-top text-sm text-theme-ink">
                  <td className="py-4 pr-4 font-medium">{bundle.label}</td>
                  <td className="py-4 pr-4 text-theme-inkDim">{bundle.program}</td>
                  <td className="py-4 pr-4 font-mono text-xs text-theme-inkDim">{bundle.file}</td>
                  <td className="py-4 pr-4">
                    {bundle.present ? (
                      <span className="inline-flex rounded-full border border-theme-verified/25 bg-theme-verified/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-theme-verified">Present</span>
                    ) : (
                      <span className="inline-flex flex-col items-start gap-1">
                        <span className="rounded-full border border-theme-border bg-theme-bg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-theme-inkDim">Needs proof{"\n"}</span>
                        <span className="text-xs text-theme-inkDim">Not published on this deployment</span>
                      </span>
                    )}
                  </td>
                  <td className="py-4 pr-4 font-mono text-xs text-theme-inkDim">{bundle.bytes ?? "—"}</td>
                  <td className="py-4">
                    {bundle.sha256 ? (
                      <code className="break-all font-mono text-xs text-theme-ink">{bundle.sha256}</code>
                    ) : (
                      <span className="text-theme-inkDim">—</span>
                    )}
                    {bundle.present && (
                      <div className="mt-2">
                        <a href={bundle.url} download className="text-xs font-medium text-theme-ink underline decoration-theme-border underline-offset-4 hover:decoration-theme-ink">Download bundle</a>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 border-t border-theme-border pt-8">
          <h3 className="text-xl font-semibold tracking-[-.03em] text-theme-ink">M0–M13 mobility ledger</h3>
          {allPresent ? (
            <MobilityLedgerSteps entries={parsedBundles} />
          ) : (
            <p className="mt-4 text-sm leading-7 text-theme-inkDim">Ledger steps render from the sealed bundles once they are published here.</p>
          )}
        </div>
      </div>
    </section>
  );
}
