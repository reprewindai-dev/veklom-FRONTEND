import React from 'react';
import Link from 'next/link';

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="border border-theme-border bg-theme-surface p-6 flex flex-col gap-4">
      <h2 className="text-[10px] font-bold tracking-widest text-theme-ink uppercase border-b border-theme-border pb-2">{title}</h2>
      <div className="flex flex-col gap-3 text-xs">
        {children}
      </div>
    </div>
  );
}

export function MachineSurface() {
  return (
    <div className="flex flex-col gap-8 w-full">
      {/* WEB_MCP_SERVER huge section */}
      <div className="border border-theme-border bg-theme-surface p-6">
        <h2 className="text-sm font-bold tracking-widest text-theme-ink uppercase mb-6 border-b border-theme-border pb-4">WEB_MCP_SERVER</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-[10px] font-bold text-theme-accent uppercase mb-2">SERVER_STATUS</h3>
              <div className="bg-theme-bg border border-theme-border px-3 py-2 text-xs text-theme-ink font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-theme-verified inline-block"></span> ONLINE / ACTIVE
              </div>
            </div>
            
            <div>
              <h3 className="text-[10px] font-bold text-theme-accent uppercase mb-2">AUTH_REQUIREMENTS</h3>
              <div className="bg-theme-bg border border-theme-border p-3 text-xs text-theme-inkDim font-mono space-y-2">
                <p><strong className="text-theme-ink">Discovery:</strong> Public (No Auth)</p>
                <p><strong className="text-theme-ink">Execution:</strong> Bearer Token (CAPPO V2)</p>
                <p><strong className="text-theme-ink">Payment:</strong> X-402 headers required where governed</p>
                <p><strong className="text-theme-ink">Device Flow:</strong> Supported for headless/CLI identity</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-[10px] font-bold text-theme-accent uppercase mb-2">VERIFIED_LIMITATIONS</h3>
              <ul className="list-disc pl-4 text-xs text-theme-inkDim font-mono space-y-1">
                <li>Read-only context length bounded at 32k tokens</li>
                <li>Rate limits enforced per IP / Tenant</li>
                <li>No dynamic execution capabilities without Proof-of-Graph</li>
                <li>Device Flow tokens DO NOT grant execution authority by themselves</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-[10px] font-bold text-theme-accent uppercase mb-2">MANIFEST</h3>
              <div className="bg-theme-bg border border-theme-border p-3 text-xs text-theme-ink font-mono flex flex-col gap-2">
                <div><span className="text-theme-inkDim">Name:</span> veklom-web-mcp</div>
                <div><span className="text-theme-inkDim">Version:</span> 1.0.0</div>
                <div><Link href="/mcp/manifest.json" className="text-theme-accent hover:underline">View JSON &rarr;</Link></div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-theme-accent uppercase mb-2">TOOLS</h3>
              <div className="bg-theme-bg border border-theme-border p-3 text-xs text-theme-ink font-mono flex flex-col gap-2">
                <div>7 Tools Registered</div>
                <div>Includes governed & public operations</div>
                <div><Link href="/mcp/tools.json" className="text-theme-accent hover:underline">View Registry &rarr;</Link></div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-theme-accent uppercase mb-2">CONTENT_TYPES</h3>
              <div className="bg-theme-bg border border-theme-border p-3 text-[10px] text-theme-ink font-mono space-y-1">
                <div><span className="text-theme-inkDim">Discovery:</span> application/json</div>
                <div><span className="text-theme-inkDim">Protocol:</span> application/json (MCP)</div>
                <div><span className="text-theme-inkDim">Surface:</span> text/html (Machine Grayscale)</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-[10px] font-bold text-theme-accent uppercase mb-2">CALL_EXAMPLES</h3>
              <div className="bg-theme-bg border border-theme-border p-3 text-[10px] text-theme-ink font-mono overflow-x-auto">
                <span className="text-theme-inkDim"># Discover tools</span><br/>
                curl -s https://veklom.com/mcp/tools.json | jq .<br/><br/>
                <span className="text-theme-inkDim"># Fetch manifest</span><br/>
                curl -s https://veklom.com/mcp/manifest.json | jq .
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-theme-accent uppercase mb-2">DISCOVERY_LINKS</h3>
              <ul className="bg-theme-bg border border-theme-border p-3 text-xs text-theme-inkDim font-mono space-y-2">
                <li><Link href="/machine/claims.json" className="hover:text-theme-ink transition-colors">/machine/claims.json</Link></li>
                <li><Link href="/machine/conformance.json" className="hover:text-theme-ink transition-colors">/machine/conformance.json</Link></li>
                <li><Link href="/machine/evidence-index.json" className="hover:text-theme-ink transition-colors">/machine/evidence-index.json</Link></li>
                <li><Link href="/machine/openapi.json" className="hover:text-theme-ink transition-colors">/machine/openapi.json</Link></li>
                <li><Link href="/llms.txt" className="hover:text-theme-ink transition-colors">/llms.txt</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-theme-accent uppercase mb-2">ROUTE_TABLE</h3>
          <div className="overflow-x-auto border border-theme-border rounded">
            <table className="w-full text-left text-[10px] font-mono whitespace-nowrap">
              <thead className="bg-theme-surface2 border-b border-theme-border text-theme-inkDim">
                <tr>
                  <th className="px-4 py-2">ROUTE</th>
                  <th className="px-4 py-2">METHOD</th>
                  <th className="px-4 py-2">CONTENT-TYPE</th>
                  <th className="px-4 py-2">AUTH</th>
                  <th className="px-4 py-2">STATUS</th>
                  <th className="px-4 py-2">PURPOSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border text-theme-ink">
                <tr className="hover:bg-theme-bg">
                  <td className="px-4 py-3"><Link href="/mcp" className="text-theme-accent hover:underline">/mcp</Link></td>
                  <td className="px-4 py-3">GET</td>
                  <td className="px-4 py-3">text/html</td>
                  <td className="px-4 py-3 text-theme-inkDim">public read unless changed intentionally.</td>
                  <td className="px-4 py-3 text-theme-verified">LIVE</td>
                  <td className="px-4 py-3 text-theme-inkDim truncate max-w-[300px]" title="Human-readable machine-mode WebMCP discovery surface.">Human-readable machine-mode WebMCP discovery surface.</td>
                </tr>
                <tr className="hover:bg-theme-bg">
                  <td className="px-4 py-3"><Link href="/mcp/manifest.json" className="text-theme-accent hover:underline">/mcp/manifest.json</Link></td>
                  <td className="px-4 py-3">GET</td>
                  <td className="px-4 py-3">application/json</td>
                  <td className="px-4 py-3 text-theme-inkDim">public read unless changed intentionally.</td>
                  <td className="px-4 py-3 text-theme-verified">LIVE</td>
                  <td className="px-4 py-3 text-theme-inkDim truncate max-w-[300px]" title="Machine-readable MCP/WebMCP manifest.">Machine-readable MCP/WebMCP manifest.</td>
                </tr>
                <tr className="hover:bg-theme-bg">
                  <td className="px-4 py-3"><Link href="/mcp/tools.json" className="text-theme-accent hover:underline">/mcp/tools.json</Link></td>
                  <td className="px-4 py-3">GET</td>
                  <td className="px-4 py-3">application/json</td>
                  <td className="px-4 py-3 text-theme-inkDim">public read unless changed intentionally.</td>
                  <td className="px-4 py-3 text-theme-verified">LIVE</td>
                  <td className="px-4 py-3 text-theme-inkDim truncate max-w-[300px]" title="Machine-readable MCP tool registry.">Machine-readable MCP tool registry.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
