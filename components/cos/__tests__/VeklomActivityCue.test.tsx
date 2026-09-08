import type { ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { getActivityToken, VeklomActivityCue } from "../VeklomActivityCue";
import type { ActivityCondition } from "../VeklomActivityCue";
import { PhaseTrace } from "../PhaseTrace";

function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => root.render(element));

  return {
    container,
    unmount: () => {
      flushSync(() => root.unmount());
      container.remove();
    },
  };
}

describe("VeklomActivityCue", () => {
  it("renders every activity condition", () => {
    const conditions: ActivityCondition[] = ["unknown", "active", "present", "verified", "degraded", "failed"];

    for (const condition of conditions) {
      const { container, unmount } = render(
        <VeklomActivityCue kind="execution" condition={condition} size={18} showCaption={false} />,
      );

      expect(container.querySelector("svg")).not.toBeNull();
      unmount();
    }
  });

  it("exposes machine-readable activity tokens", () => {
    expect(getActivityToken("execution", "active")).toBe("EXECUTION.ACTIVE");

    const { container } = render(
      <VeklomActivityCue kind="execution" condition="active" showToken />,
    );

    expect(container.textContent).toContain("EXECUTION.ACTIVE");
    container.remove();
  });

  it("freezes failed activity cues", () => {
    const { container } = render(
      <VeklomActivityCue kind="execution" condition="failed" showCaption={false} />,
    );

    expect(container.querySelector(".vac-ring")).toBeNull();
    expect(container.querySelector(".vac-dot")).toBeNull();
    container.remove();
  });

  it("uses present for completed phase connectors", () => {
    const { container } = render(
      <PhaseTrace
        phases={[
          { id: "compile", name: "Compile", status: "complete" },
          { id: "review", name: "Review", status: "pending" },
        ]}
      />,
    );

    expect(container.querySelector(".bg-cos-present")).not.toBeNull();
    container.remove();
  });
});
