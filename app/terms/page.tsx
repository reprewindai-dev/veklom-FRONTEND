import React from 'react';
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: 'Terms of Service | Veklom Capability OS' };

export default function TermsPage() {
  return (
    <HumanAppShell>
      <div className="max-w-4xl mx-auto px-6 py-16 w-full">
        <PageHeader title="Terms of Service" description="Terms for VEKLOM M2M Trust Infrastructure." />
        <div className="prose prose-invert max-w-none text-theme-inkDim">
          <h3>Intended Use</h3>
          <p>VEKLOM is intended for governed machine action. You agree to use the service to bind machine capabilities to identity, policy, and budget.</p>
          
          <h3>Limitations</h3>
          <p>We provide the infrastructure for governance. We are not liable for the consequences of authorized machine execution within your defined boundaries.</p>
          
          <h3>Early Access & Free Plan</h3>
          <p>During Early Access, the free plan is provided "as is" without SLA guarantees.</p>
          
          <h3>User Responsibilities</h3>
          <p>You are responsible for safeguarding your credentials and defining accurate policies.</p>

          <h3>No Compliance Guarantee</h3>
          <p>While Veklom aids in compliance (e.g. Law 25), you remain ultimately responsible for your regulatory obligations.</p>

          <h3>No Blank-Check Machine Authority</h3>
          <p>VEKLOM explicitly forbids and actively mitigates blank-check machine execution. All actions must be cryptographically governed.</p>
        </div>
      </div>
    </HumanAppShell>
  );
}
