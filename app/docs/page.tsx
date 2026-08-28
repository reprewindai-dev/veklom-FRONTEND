import React from 'react';
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: 'Documentation | Veklom Capability OS' };

export default function DocsPage() {
  return (
    <HumanAppShell>
      <div className="max-w-4xl mx-auto px-6 py-16 w-full">
        <PageHeader title="Documentation" description="VEKLOM M2M Trust Infrastructure Documentation" />
        <div className="prose prose-invert max-w-none text-theme-inkDim">
          <h3>Installation Guide</h3>
          <p>VEKLOM M2M Trust Infrastructure can be installed directly from the GitHub Marketplace. It uses a combination of Webhooks and Device Flow to authorize headless clients.</p>
          
          <h3>GitHub App Setup</h3>
          <p>When installing, you authorize the App to read specific metadata. We do not require write access for default installations.</p>

          <h3>Device Flow Explanation</h3>
          <p>Veklom supports GitHub Device Flow for headless machines and CLI operators. A headless node will generate a user code, which an authorized operator must approve in the browser. <strong>Device Flow tokens are for identity only.</strong> They do not grant execution authority without Veklom governance.</p>
          
          <h3>Webhook Explanation</h3>
          <p>We receive GitHub events securely via verified webhooks to track installation state and repository events relevant to your capability boundaries.</p>

          <h3>WebMCP Discovery</h3>
          <p>Machine clients should query our discovery endpoints:</p>
          <ul>
            <li><a href="/mcp" className="text-theme-accent">WebMCP Machine Surface</a></li>
            <li><a href="/mcp/manifest.json" className="text-theme-accent">Manifest JSON</a></li>
          </ul>
        </div>
      </div>
    </HumanAppShell>
  );
}
