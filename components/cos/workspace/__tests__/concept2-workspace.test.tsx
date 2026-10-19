import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { HorizontalExecutionDAG } from "../HorizontalExecutionDAG";
import { ActionApprovalCard } from "../ActionApprovalCard";
import { InspectorPanel } from "../InspectorPanel";
import { ActiveTaskCard } from "../ActiveTaskCard";
import { initialTaskState } from "@/lib/cos/tasks/task-reducer";
import type { TaskState, WorkspacePlan } from "@/lib/cos/tasks/task-types";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function mount(node: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(node);
  });
  return container;
}

afterEach(async () => {
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
});

const mockPlan: WorkspacePlan = {
  planId: "contract-sales-oct",
  canonicalHash: "8e4b7c12f019a3d4e5f6789012345678",
  intent: "Prepare the monthly sales summary and email it to the sales team.",
  verdict: "ready_for_mount",
  shape: "contract",
  steps: [
    {
      stepId: "step-1",
      sequence: 1,
      clause: "send report email to sales team",
      coverage: "write",
      action: "email.send",
      packageRef: "pkg-email-corp",
      reason: "Permitted under sales operations policy",
      requiresApproval: true,
      bindable: true,
      operation: {
        package_ref: "pkg-email-corp",
        target_ref: "target-exchange",
        resource: "sales-leads@company.internal",
        action: "email.send",
        arguments: { recipients: 6, format: "pdf" },
      },
    },
  ],
};

const mockReviewState: TaskState = {
  ...initialTaskState,
  phase: "needs_review",
  intent: "Prepare the monthly sales summary and email it to the sales team.",
  plan: mockPlan,
  activeStepId: "step-1",
};

describe("Concept 2 Workspace Revamp Components", () => {
  describe("HorizontalExecutionDAG", () => {
    it("renders all 5 horizontal pipeline nodes", async () => {
      const el = await mount(<HorizontalExecutionDAG state={mockReviewState} />);
      expect(el.textContent).toContain("Input Data");
      expect(el.textContent).toContain("Summarize");
      expect(el.textContent).toContain("Report draft");
      expect(el.textContent).toContain("email.send");
      expect(el.textContent).toContain("Evidence");
    });

    it("highlights Node 4 with Approval required when state is in needs_review", async () => {
      const el = await mount(<HorizontalExecutionDAG state={mockReviewState} />);
      expect(el.textContent).toContain("Approval required");
    });

    it("transitions Node 4 to Verified when execution is complete", async () => {
      const verifiedState: TaskState = {
        ...mockReviewState,
        phase: "done",
        readback: { proof: "Verified" },
      };
      const el = await mount(<HorizontalExecutionDAG state={verifiedState} />);
      expect(el.textContent).toContain("Verified");
    });
  });

  describe("ActionApprovalCard", () => {
    it("renders the confirmation card with recipient count and binding disclaimer", async () => {
      const onApprove = jest.fn();
      const el = await mount(
        <ActionApprovalCard
          state={mockReviewState}
          workspace="ws-sales-ops"
          busy={false}
          onBind={jest.fn()}
          onApprove={onApprove}
        />
      );

      expect(el.textContent).toContain("Send this report to the sales team?");
      expect(el.textContent).toContain("6 recipients");
      expect(el.textContent).toContain("sales-summary.pdf");
      expect(el.textContent).toContain("Approval applies only to this email and these recipients");

      const approveBtn = el.querySelector("button.shadow-\\[0_0_12px_rgba\\(6\\,182\\,212\\,0\\.3\\)\\]") as HTMLButtonElement;
      expect(approveBtn).not.toBeNull();
      await act(async () => {
        approveBtn.click();
      });
      expect(onApprove).toHaveBeenCalledTimes(1);
    });
  });

  describe("InspectorPanel", () => {
    it("displays the telemetry matrix reflecting the active task state", async () => {
      const el = await mount(<InspectorPanel state={mockReviewState} project="sales-ops" />);
      expect(el.textContent).toContain("Inspector");
      expect(el.textContent).toContain("email.send");
      expect(el.textContent).toContain("Approval required");
      expect(el.textContent).toContain("Not issued");
      expect(el.textContent).toContain("Not executed");
      expect(el.textContent).toContain("Pending");
      expect(el.textContent).toContain("Scope and recipients");
      expect(el.textContent).toContain("Receipt and readback");
      expect(el.textContent).toContain("View task evidence");
    });
  });

  describe("ActiveTaskCard", () => {
    it("renders the task header, document preview card, DAG, and footer breadcrumb", async () => {
      const el = await mount(
        <ActiveTaskCard
          state={mockReviewState}
          workspace="ws-sales-ops"
          busy={false}
          onBind={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      expect(el.textContent).toContain("Monthly sales summary");
      expect(el.textContent).toContain("Waiting for your approval");
      expect(el.textContent).toContain("sales-summary.pdf");
      expect(el.textContent).toContain("Draft available · Email not sent");
      expect(el.textContent).toContain("Awaiting approval");
    });
  });
});
