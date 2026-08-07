import type { Metadata } from "next";
import { WorkspaceScaffold } from "@/components/cos/WorkspaceScaffold";
import { PhaseTrace } from "@/components/cos/PhaseTrace";
import ExecutionIdentityV1Control from "@/components/cos/ExecutionIdentityV1Control";
import HashVerifier from "@/components/cos/HashVerifier";
import NotaryChat from "@/components/cos/NotaryChat";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Evidence",
  description: "Review unforgeable cryptographic logs and attestations tied to capability executions in the Veklom Capability OS.",
};

export default function EvidencePage() { 
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Veklom", href: "https://veklom.com" },
          { name: "Capability OS", href: "https://veklom.com/os" },
          { name: "Evidence" },
        ]}
      />
      <WorkspaceScaffold 
        stage="Evidence" 
        title="Evidence" 
        description="Review the unforgeable logs and attestations tied to this capability's execution."
      >
        <div className="flex flex-col gap-8 pb-12">
          <PhaseTrace phases={[
            { id: "execute", name: "Execute", status: "complete" },
            { id: "evidence", name: "Evidence", status: "pending" },
            { id: "measure", name: "Measure", status: "pending" },
            { id: "settle", name: "Settle", status: "pending" }
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-8">
              <ExecutionIdentityV1Control />
              <HashVerifier />
            </div>
            
            <div className="flex flex-col h-full">
              <NotaryChat />
            </div>
          </div>
        </div>
      </WorkspaceScaffold>
    </>
  ); 
}
