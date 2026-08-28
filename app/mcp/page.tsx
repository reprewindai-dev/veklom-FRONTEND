import React from 'react';
import Link from 'next/link';
import { MachineAppShell } from "@/components/shell/MachineAppShell";

export const metadata = {
  title: "Veklom / MCP",
  description: "Web MCP Surface for Veklom Capability OS",
};

function Panel({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="border border-theme-border bg-theme-surface p-6">
      <h2 className="text-[10px] font-bold tracking-widest text-theme-accent uppercase mb-4 border-b border-theme-border pb-2">{title}</h2>
      {children}
    </div>
  );
}

export default function McpPage() {
  return (
    <MachineAppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-theme-ink tracking-tight uppercase">WEB_MCP_DISCOVERY</h1>
        <p className="text-xs text-theme-inkDim mt-2 max-w-2xl">
          This is the human-readable index for the Veklom Web MCP protocol surface. 
          Agents and machines should parse the JSON manifests directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Panel title="SERVER_IDENTITY">
          <ul className="text-xs font-mono text-theme-inkDim space-y-2">
            <li><strong className="text-theme-ink">Name:</strong> veklom-web-mcp</li>
            <li><strong className="text-theme-ink">Version:</strong> 1.0.0</li>
            <li><strong className="text-theme-ink">Surface:</strong> machine</li>
            <li><strong className="text-theme-ink">Product:</strong> Veklom Capability OS</li>
          </ul>
        </Panel>

        <Panel title="CAPABILITY_OS_CONTEXT">
          <p className="text-xs font-mono text-theme-inkDim leading-relaxed">
            Machine-readable discovery surface for governed machine action. This server publishes
            available tools, resources, and claims for autonomous clients attempting to interface
            with the Veklom infrastructure. 
          </p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Panel title="ROUTES">
          <ul className="text-[10px] font-mono text-theme-inkDim space-y-2">
            <li><Link href="/mcp" className="text-theme-accent hover:underline">/mcp</Link> (HTML)</li>
            <li><Link href="/mcp/manifest.json" className="text-theme-accent hover:underline">/mcp/manifest.json</Link> (JSON)</li>
            <li><Link href="/mcp/tools.json" className="text-theme-accent hover:underline">/mcp/tools.json</Link> (JSON)</li>
          </ul>
        </Panel>
        
        <Panel title="EVIDENCE_LINKS">
          <ul className="text-[10px] font-mono text-theme-inkDim space-y-2">
            <li><Link href="/machine/claims.json" className="hover:text-theme-ink transition-colors">/machine/claims.json</Link></li>
            <li><Link href="/machine/conformance.json" className="hover:text-theme-ink transition-colors">/machine/conformance.json</Link></li>
            <li><Link href="/machine/evidence-index.json" className="hover:text-theme-ink transition-colors">/machine/evidence-index.json</Link></li>
          </ul>
        </Panel>

        <Panel title="AUTH_REQUIREMENTS">
          <ul className="text-[10px] font-mono text-theme-inkDim space-y-2">
            <li><strong className="text-theme-ink">Discovery:</strong> Public</li>
            <li><strong className="text-theme-ink">Tool Execution:</strong> Bearer Token Required</li>
            <li><strong className="text-theme-ink">Payment:</strong> X-402 headers required where governed</li>
          </ul>
        </Panel>
      </div>

      <div className="mb-6">
        <Panel title="TOOL_REGISTRY">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] font-mono whitespace-nowrap">
              <thead className="text-theme-inkDim border-b border-theme-border">
                <tr>
                  <th className="px-4 py-2">NAME</th>
                  <th className="px-4 py-2">AUTH_REQUIRED</th>
                  <th className="px-4 py-2">STATUS</th>
                  <th className="px-4 py-2">DESCRIPTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border text-theme-ink">
                <tr className="hover:bg-theme-bg">
                  <td className="px-4 py-3 font-bold text-theme-accent">read_manifest</td>
                  <td className="px-4 py-3">false</td>
                  <td className="px-4 py-3 text-theme-verified">active</td>
                  <td className="px-4 py-3 text-theme-inkDim">Returns the primary WebMCP manifest JSON.</td>
                </tr>
                <tr className="hover:bg-theme-bg">
                  <td className="px-4 py-3 font-bold text-theme-accent">read_claims</td>
                  <td className="px-4 py-3">false</td>
                  <td className="px-4 py-3 text-theme-verified">active</td>
                  <td className="px-4 py-3 text-theme-inkDim">Reads the cryptographic claims registry.</td>
                </tr>
                <tr className="hover:bg-theme-bg">
                  <td className="px-4 py-3 font-bold text-theme-accent">run_governed_machine_demo</td>
                  <td className="px-4 py-3">true</td>
                  <td className="px-4 py-3 text-theme-verified">active</td>
                  <td className="px-4 py-3 text-theme-inkDim">Executes the interactive P5 governed machine demo.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs font-mono">
            <Link href="/mcp/tools.json" className="text-theme-accent hover:underline flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              View full JSON tools registry
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="LIMITATIONS">
          <ul className="list-disc pl-4 text-xs font-mono text-theme-inkDim space-y-1">
            <li>Read-only context length bounded at 32k tokens</li>
            <li>Rate limits enforced per IP / Tenant</li>
            <li>No dynamic execution capabilities without Proof-of-Graph</li>
          </ul>
        </Panel>

        <Panel title="EXAMPLE_CLIENT_READS">
          <div className="bg-theme-bg border border-theme-border p-3 text-[10px] text-theme-ink font-mono overflow-x-auto rounded">
            <span className="text-theme-inkDim"># Fetch the manifest</span><br/>
            curl -s https://veklom.com/mcp/manifest.json | jq .<br/><br/>
            <span className="text-theme-inkDim"># Fetch available tools</span><br/>
            curl -s https://veklom.com/mcp/tools.json | jq .
          </div>
        </Panel>
      </div>

    </MachineAppShell>
  );
}
