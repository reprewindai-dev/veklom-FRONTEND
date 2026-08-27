import React from "react";

export function MachineSurface() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-ink font-mono py-12 px-6">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Back to Human UI */}
        <div className="mb-12">
          <a href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-theme-inkDim hover:text-theme-ink transition-colors border border-theme-border bg-theme-surface px-4 py-2 rounded-sm shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Return to Human Surface
          </a>
        </div>

        <header className="mb-12 border-b border-theme-border pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-theme-ink uppercase">Veklom / Machine Protocol</h1>
            <p className="text-theme-inkDim text-xs mt-2">v1.0.0 &middot; capability-os-governance-engine</p>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-theme-surface border border-theme-border text-[10px] text-theme-accent font-bold uppercase">STATUS: ONLINE</span>
            <span className="px-2 py-1 bg-theme-surface border border-theme-border text-[10px] text-theme-verified font-bold uppercase">P5/C0 VERIFIED</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Section title="Discovery">
            <Link href="/machine/manifest.json">/machine/manifest.json</Link>
            <Link href="/machine/openapi.json">/machine/openapi.json</Link>
            <Link href="/.well-known/veklom.json">/.well-known/veklom.json</Link>
            <Link href="/llms.txt">/llms.txt</Link>
            <Link href="/llms-full.txt">/llms-full.txt</Link>
          </Section>

          <Section title="Governance State">
            <Link href="/machine/claims.json">/machine/claims.json</Link>
            <Link href="/machine/conformance.json">/machine/conformance.json</Link>
            <Link href="/machine/evidence-index.json">/machine/evidence-index.json</Link>
          </Section>

          <Section title="Web MCP Server">
            <Link href="/mcp">/mcp</Link>
            <Link href="/mcp/manifest.json">/mcp/manifest.json</Link>
            <Link href="/mcp/tools.json">/mcp/tools.json</Link>
          </Section>
        </div>

        <div className="mt-12 bg-theme-surface border border-theme-border rounded-sm relative shadow-inner overflow-hidden">
          <div className="w-full px-4 py-2 bg-theme-bg border-b border-theme-border flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-theme-inkDim font-bold">Terminal / WebMCP Logs</span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-theme-border"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-theme-border"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-theme-border"></span>
            </div>
          </div>
          <div className="p-4 h-64 overflow-y-auto font-mono text-xs text-theme-inkDim space-y-2">
            <p className="text-theme-ink font-bold">[sys] WebMCP Interface Initialized</p>
            <p>[auth] Validating physical signature... <span className="text-theme-verified">OK</span></p>
            <p>[net] Establishing secure RPC tunnel... <span className="text-theme-verified">OK</span></p>
            <p>[mcp] 10 capability tools loaded and mapped.</p>
            <p className="animate-pulse text-theme-ink">_</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-theme-ink mb-2 border-b border-theme-border pb-2">{title}</h3>
      <div className="flex flex-col gap-2 text-[11px]">
        {children}
      </div>
    </div>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-theme-inkDim hover:text-theme-ink hover:underline transition-colors flex items-center gap-2 before:content-['>'] before:text-theme-accent">
      {children}
    </a>
  );
}
