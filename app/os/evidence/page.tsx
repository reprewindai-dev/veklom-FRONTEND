import { WorkspaceScaffold } from "@/components/cos/WorkspaceScaffold";
import { PhaseTrace } from "@/components/cos/PhaseTrace";
import ExecutionIdentityV1Control from "@/components/cos/ExecutionIdentityV1Control";
import HashVerifier from "@/components/cos/HashVerifier";
import NotaryChat from "@/components/cos/NotaryChat";

export default function EvidencePage() { 
  return (
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
  ); 
}
