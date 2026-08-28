import React from 'react';
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: 'Privacy Policy | Veklom Capability OS' };

export default function PrivacyPage() {
  return (
    <HumanAppShell>
      <div className="max-w-4xl mx-auto px-6 py-16 w-full">
        <PageHeader title="Privacy Policy" description="How we handle your data securely." />
        <div className="prose prose-invert max-w-none text-theme-inkDim">
          <h3>GitHub Data Processed</h3>
          <p>VEKLOM processes only the minimum data required to establish cryptographic identity and verify webhook events. We store GitHub user IDs, usernames, and installation metadata.</p>
          
          <h3>Token Handling</h3>
          <p>We never expose raw GitHub access tokens to the browser. All GitHub OAuth and Device Flow token exchanges happen securely server-side. Tokens are stored encrypted at rest.</p>
          
          <h3>Webhook and Event Metadata</h3>
          <p>Event metadata is queued for auditing and compliance processing. We do not store raw source code unless explicitly provided as context to a governed capability.</p>
          
          <h3>No Secret Exposure</h3>
          <p>Your client secrets, webhook secrets, and private keys are never exposed in our interfaces or logs.</p>
          
          <h3>Contact</h3>
          <p>For privacy concerns, email privacy@veklom.com.</p>
        </div>
      </div>
    </HumanAppShell>
  );
}
