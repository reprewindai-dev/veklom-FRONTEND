import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PGL Studio | Veklom Control Node",
  description: "Programmable Governance Ledger onboarding and identity shell.",
};

export default function PGLStudioPage() {
  // Use the local Vite dev server port (5173) in development, or the real domain in production
  const PGL_URL = process.env.NODE_ENV === "production" 
    ? "https://pgl.veklom.com" 
    : "http://localhost:5173";

  return (
    <div className="w-full h-full min-h-[calc(100vh-4rem)] flex flex-col -m-6">
      <div className="bg-bg-900 border-b border-border p-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-50">PGL Studio</h1>
          <p className="text-sm text-ink-400">Programmable Governance Ledger (Seamless Embed)</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center rounded-md border border-brand-500/30 bg-brand-500/10 px-2 h-7 text-[10px] font-semibold uppercase tracking-wider text-brand-400">
            Connected to Spine
          </span>
        </div>
      </div>
      
      <iframe
        src={PGL_URL}
        className="flex-1 w-full border-none bg-black"
        title="PGL Studio Embedded Shell"
        allow="clipboard-write; clipboard-read"
      />
    </div>
  );
}
