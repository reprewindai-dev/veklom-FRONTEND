export function MachineSurface() {
  return (
    <div className="bg-theme-bg text-theme-ink font-mono py-12 px-6">
      <div className="max-w-[1000px] mx-auto">
        <header className="mb-12 border-b border-theme-border pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-theme-ink uppercase">Veklom / Machine Protocol</h1>
            <p className="text-theme-inkDim text-xs mt-2">v1.0.0 &middot; capability-os-governance-engine</p>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-theme-surface border border-theme-border text-[10px] text-theme-accent">STATUS: ONLINE</span>
            <span className="px-2 py-1 bg-theme-surface border border-theme-border text-[10px] text-theme-verified">P5/C0 VERIFIED</span>
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

        <div className="mt-12 p-6 border border-theme-border bg-theme-surface rounded-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-theme-accent">Terminal Log</h2>
          <div className="text-[11px] text-theme-inkDim space-y-1">
            <p>[SYSTEM] Boot sequence initialized.</p>
            <p>[AUTH] Checking token... NO_TOKEN.</p>
            <p>[SEC] Loaded zero-trust execution boundary.</p>
            <p>[INFO] Capability OS is ready to mount machine payloads.</p>
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
    <a href={href} className="text-theme-inkDim hover:text-theme-accent transition-colors flex items-center gap-2 before:content-['>'] before:text-theme-accent">
      {children}
    </a>
  );
}
