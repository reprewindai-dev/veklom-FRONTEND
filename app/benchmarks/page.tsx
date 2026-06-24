export const dynamic = "force-dynamic";

export const metadata = {
  title: "Benchmarks — Veklom Control Plane",
  description: "Live performance benchmarks for the Veklom Sovereign AI Runtime.",
};

export default function BenchmarksPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
          Benchmarks
        </div>
        <p className="text-zinc-400 max-w-md">
          Live VNP performance metrics and SLA attestation data coming soon.
        </p>
      </div>
    </div>
  );
}
