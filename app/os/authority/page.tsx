import { WorkspaceScaffold } from "@/components/cos/WorkspaceScaffold";
import { KeyAuthorityCard } from "@/components/cos/KeyAuthorityCard";
import { AlertList } from "@/components/cos/AlertList";

export default function AuthorityPage() { 
  return (
    <WorkspaceScaffold stage="Authority" title="Authority" description="Inspect key identifiers, permissions, caps, leases, and revocation state without exposing private keys.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <KeyAuthorityCard title="Primary Governance Key" keyId="veklom_pub_..." role="UACP Admin" status="Not started" />
          <KeyAuthorityCard title="Execution Lease Key" keyId="veklom_exe_..." role="Ephemeral Worker" status="Not started" />
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-cos-text">Active Security Advisories</h3>
          <AlertList alerts={[
            { id: "1", type: "info", message: "Key provisioning simulated. Real identities require hardware vault.", time: "System Notice" }
          ]} />
        </div>
      </div>
    </WorkspaceScaffold>
  ); 
}
