"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, ShieldCheck } from "lucide-react";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { JsonPanel, PaymentChallenge } from "@/components/cos/StageParts";
import { Button } from "@/components/ui/button";

export default function SettlePage() {
  const stage = getStage("settle");
  const data = useStageData("settle");
  
  useEffect(() => {
    for (const e of stage.endpoints) {
      if (e.method === "GET" && !e.path.includes("{")) void data.call(e);
    }
  }, [data.call, stage.endpoints]);

  const discovery = data.payloads[`GET ${stage.endpoints[0].path}`];
  const pricing = data.payloads[`GET ${stage.endpoints[1].path}`];

  // Implement 402 detection via transport fact
  const challengeRecord = data.records.find((r) => r.paymentRequired);
  const challenge = challengeRecord ? data.payloads[`${challengeRecord.method} ${challengeRecord.path}`] : undefined;

  // Implement receipt verification flow
  const [receipt, setReceipt] = useState<string>("");
  const verifyEndpoint = stage.endpoints.find((e) => e.path === "/api/v1/x402/verify");
  
  const handleVerify = () => {
    if (verifyEndpoint && receipt) {
      void data.call(verifyEndpoint, { receipt_id: receipt });
    }
  };

  const verifyRecord = data.records.find((r) => r.path === "/api/v1/x402/verify");
  const verificationResult = verifyRecord ? data.payloads[`POST /api/v1/x402/verify`] : null;

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <Pillar
          title="Work"
          proof={discovery ? data.records[0]?.proof ?? "Needs proof" : "Needs proof"}
          detail="Settlement binding is shown only from returned discovery and pricing documents."
        >
          <div className="flex items-center gap-3">
            <CircleDollarSign className="text-cos-accent" size={19} />
            <span className="text-sm text-cos-text">M2M settlement discovery</span>
          </div>
          <div className="mt-4">
            {challenge ? (
              <PaymentChallenge value={challenge} />
            ) : (
              <JsonPanel value={discovery} empty={`GET ${stage.endpoints[0].path} has not returned a discovery document.`} />
            )}
          </div>
        </Pillar>
      </div>
      <Pillar title="Telemetry" proof={pricing ? data.records[1]?.proof ?? "Needs proof" : "Needs proof"}>
        <JsonPanel value={pricing} empty={`GET ${stage.endpoints[1].path} has not returned pricing.`} />
      </Pillar>
      <Pillar title="Authority" proof="Needs proof">
        <HonestEmpty
          title="No settlement authority returned"
          route="GET /api/v1/pricing"
          detail="The pricing manifest does not itself grant authority or expose private payment credentials."
        />
      </Pillar>
      <Pillar title="Evidence" proof={verifyRecord?.proof ?? "Needs proof"}>
        {verifyRecord ? (
          <div className="space-y-4">
            <JsonPanel value={verificationResult} empty="Verification response empty" />
          </div>
        ) : (
          <div className="space-y-4">
            <HonestEmpty
              title="Receipt verification is operator-initiated"
              route="POST /api/v1/x402/verify"
              detail="Enter a receipt ID to verify settlement."
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Receipt ID"
                className="flex h-9 w-full rounded-md border border-cos-border bg-cos-surface px-3 py-1 text-sm text-cos-text shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-cos-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cos-accent disabled:cursor-not-allowed disabled:opacity-50"
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
              />
              <Button size="sm" onClick={handleVerify} disabled={!receipt || data.loading[`POST /api/v1/x402/verify`]}>
                <ShieldCheck size={14} className="mr-2" /> Verify
              </Button>
            </div>
          </div>
        )}
      </Pillar>
      <Pillar title="Drift" proof="Needs proof">
        <HonestEmpty
          title="No settlement/execution join"
          route="GET /api/v1/pricing"
          detail="Balances, receipts, and confirmations are not inferred from a pricing manifest."
        />
      </Pillar>
    </SectionShell>
  );
}
