"use client";

import type { useStageData } from "@/lib/cos/useStageData";
import { HonestEmpty } from "./SectionPillars";

/**
 * Govern's human-approval queue. Closed for now, and said so plainly: the authority layer takes
 * an approver's trust score from the request itself and does not scope the queue per workspace,
 * so the gateway does not forward these routes until approver identity and trust are derived
 * server-side. Nothing here calls the backend; the panel reopens when that lands.
 */
type StageData = ReturnType<typeof useStageData>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept so the Govern page wiring is unchanged
export function QuarantineQueue(_props: { stageData: StageData }) {
  return (
    <div className="space-y-3" data-testid="quarantine-queue-closed">
      <HonestEmpty
        title="Human approval queue: not available yet"
        route="GET /v1/governance/v2/quarantine"
        detail="Held requests will appear here once approver identity and trust come from the identity service and each workspace sees only its own queue. Until then this route is closed at the gateway, so no one can approve or deny on anyone's behalf."
      />
    </div>
  );
}
