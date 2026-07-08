import { NextResponse } from 'next/server';

// Mock in-memory state for our pipeline error scenarios
let mockErrorState = {
  error_id: "err_999812",
  timestamp: new Date().toISOString(),
  pipeline_id: "pipe_alpha_44",
  failing_node: {
    node_id: "node_llm_01",
    node_type: "SovereignLLMNode",
    inputs: { prompt: "Analyze PII", strict: true },
    outputs: null
  },
  error_reason: "Validation failed: 'strict' mode requires 'temperature' < 0.3",
  retry_count: 0,
  max_retries: 3,
  human_handoff_status: "not_triggered",
  suggested_fix: "Set inputs.temperature = 0.1 to comply with strict mode"
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query || "";
    
    // Simulate: query getPipelineErrorState
    if (query.includes("getPipelineErrorState")) {
      return NextResponse.json({
        data: {
          getPipelineErrorState: mockErrorState
        }
      });
    }

    // Simulate: mutation triggerSelfHeal
    if (query.includes("triggerSelfHeal")) {
      if (mockErrorState.retry_count < mockErrorState.max_retries) {
        mockErrorState.retry_count += 1;
        
        // If we hit the max, transition state to pending human handoff
        if (mockErrorState.retry_count === mockErrorState.max_retries) {
          mockErrorState.human_handoff_status = "pending";
        }
      }
      
      return NextResponse.json({
        data: {
          triggerSelfHeal: mockErrorState
        }
      });
    }

    // Simulate: mutation resolveHumanHandoff
    if (query.includes("resolveHumanHandoff")) {
      mockErrorState.human_handoff_status = "resolved";
      mockErrorState.retry_count = 0; // Reset counter
      
      // Simulate applying the human's fix
      mockErrorState.failing_node.inputs = {
        ...mockErrorState.failing_node.inputs,
        temperature: 0.1
      };
      mockErrorState.error_reason = "Resolved by operator";

      return NextResponse.json({
        data: {
          resolveHumanHandoff: mockErrorState
        }
      });
    }

    // Default fallback
    return NextResponse.json({ errors: [{ message: "Unknown mock query" }] });
  } catch (error) {
    return NextResponse.json({ errors: [{ message: "Internal mock error" }] }, { status: 500 });
  }
}
