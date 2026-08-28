import React from 'react';
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: 'Support | Veklom Capability OS' };

export default function SupportPage() {
  return (
    <HumanAppShell>
      <div className="max-w-4xl mx-auto px-6 py-16 w-full">
        <PageHeader title="Support" description="Contact us for help with VEKLOM M2M Trust Infrastructure." />
        <div className="prose prose-invert max-w-none text-theme-inkDim">
          <h3>Contact Information</h3>
          <p><strong>General Support:</strong> support@veklom.com</p>
          <p><strong>Security Inquiries:</strong> security@veklom.com</p>
          
          <h3>GitHub Marketplace Support</h3>
          <p>If you are installing VEKLOM M2M Trust Infrastructure via the GitHub Marketplace, please include your Installation ID and GitHub Username in your request.</p>
          
          <h3>Expected Response Time</h3>
          <p>We provide support in English. Expected response time for standard inquiries is 24-48 business hours.</p>
        </div>
      </div>
    </HumanAppShell>
  );
}
