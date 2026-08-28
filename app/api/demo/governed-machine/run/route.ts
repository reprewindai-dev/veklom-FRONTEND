import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scenario_id = body.scenario_id;

    if (!scenario_id) {
      return NextResponse.json({ error: "scenario_id required" }, { status: 400 });
    }

    const runId = "run_" + Math.random().toString(36).substring(2, 10);
    const timestamp = new Date().toISOString();
    
    // Default response structure
    let response = {
      scenario_id,
      scenario_run_id: runId,
      decision: "UNKNOWN",
      backend_timestamp: timestamp,
      source: "backend",
      classification: "BACKEND_DEMO_HARNESS",
      evidence_id: "none",
      explanation: "",
      receipt: {},
      limitations: ["No real cryptographic PGL receipt produced in demo mode"]
    };

    switch (scenario_id) {
      case "normal_allowed_action":
        response.decision = "ALLOW";
        response.evidence_id = "ev_" + Math.random().toString(36).substring(2, 8);
        response.explanation = "Identity verified. Capability token valid. Policy allows this action. Budget not exceeded. ALLOW issued. Signed COSE evidence produced.";
        response.receipt = { decision: "ALLOW", execution_id: "exec_" + Math.random().toString(36).substring(2, 6), action: "contact.read", resource: "/contacts/123", biscuit_verified: true, evidence_produced: true };
        break;

      case "over_authority_attempt":
        response.decision = "DENY";
        response.evidence_id = "ev_" + Math.random().toString(36).substring(2, 8);
        response.explanation = "Token does not grant contact.delete. DENY before any consequence. Denial evidence produced. No side effect occurred.";
        response.receipt = { decision: "DENY", reason: "ACTION_NOT_IN_CAPABILITY", action: "contact.delete", authorized_actions: ["contact.read"], consequence_produced: false };
        break;

      case "evidence_tamper_attempt":
        response.decision = "INVALID";
        response.evidence_id = "ev_" + Math.random().toString(36).substring(2, 8);
        response.explanation = "Ed25519 signature over the COSE_Sign1 envelope fails. The verifier catches the tamper. This is verifiable offline - no network needed.";
        response.receipt = { verification: "INVALID", error: "SIGNATURE_MISMATCH", tampered_field: "execution_id", original_verified: true, tampered_verified: false };
        break;

      case "race_double_spend_attack":
        response.decision = "GOVERNED";
        response.evidence_id = "ev_" + Math.random().toString(36).substring(2, 8);
        response.explanation = "Veklom's governed path uses atomic token consumption. Worker B's attempt is denied after Worker A commits. No duplicate consequence.";
        response.receipt = { worker_a: "ALLOW - consumed token", worker_b: "DENY - token already consumed", duplicate_consequence: false, governed_path_held: true };
        break;

      case "unknown_outcome":
        response.decision = "OUTCOME_UNKNOWN";
        response.evidence_id = "ev_" + Math.random().toString(36).substring(2, 8);
        response.explanation = "Veklom never claims success without evidence. OUTCOME_UNKNOWN is the honest state. No fake success. No fake failure. The boundary is clear.";
        response.receipt = { decision: "ALLOW", execution_id: "exec_" + Math.random().toString(36).substring(2, 6), outcome: "OUTCOME_UNKNOWN", reason: "PROCESS_FAILED_BEFORE_PROOF", fake_success_claimed: false };
        break;

      case "post_termination_replay":
        response.decision = "REPLAY_DENIED";
        response.evidence_id = "ev_" + Math.random().toString(36).substring(2, 8);
        response.explanation = "The capability mount is in TERMINATED state. The old handle carries zero authority. No consequence possible. Denial evidence produced.";
        response.receipt = { decision: "DENY", reason: "TOKEN_REPLAY_EXPIRED", mount_status: "TERMINATED", replay_attempt: true, residual_agency: false };
        break;

      default:
        response.decision = "INVALID";
        response.explanation = "Unknown scenario_id requested.";
        response.receipt = { error: "Unknown scenario" };
        break;
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("API error: ", err);
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
