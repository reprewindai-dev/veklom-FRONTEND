// The shared Button relied on `btn`/`btn-primary` classes that no stylesheet
// defined, so Capability OS actions rendered as bare text. It must render a
// real, styled <button> and explain why it is disabled.

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Button } from "@/components/ui";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function render(node: React.ReactNode) {
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
  }
  container?.remove();
  root = null;
  container = null;
});

describe("Button", () => {
  it("renders an accessible, visibly bordered button", async () => {
    const onClick = jest.fn();
    const el = await render(<Button onClick={onClick}>Continue</Button>);
    const button = el.querySelector("button")!;

    expect(button.getAttribute("type")).toBe("button");
    expect(button.textContent).toBe("Continue");
    expect(button.disabled).toBe(false);
    const classes = button.className.split(/\s+/);
    for (const expected of ["border", "rounded-xl", "cursor-pointer", "border-cos-accent/70", "bg-cos-accent/20", "focus-visible:ring-2", "motion-reduce:transition-none"]) {
      expect(classes).toContain(expected);
    }
    // The undefined legacy classes are gone.
    expect(classes).not.toContain("btn");
    expect(classes).not.toContain("btn-primary");

    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the outline variant as glass", async () => {
    const el = await render(<Button variant="outline">Open evidence</Button>);
    const classes = el.querySelector("button")!.className.split(/\s+/);
    expect(classes).toContain("bg-cos-surface2/60");
    expect(classes).toContain("border-cos-accent/40");
  });

  it("explains why it is disabled, as a tooltip and to assistive technology", async () => {
    const el = await render(<Button disabled disabledReason="Bind a workspace first">Continue</Button>);
    const button = el.querySelector("button")!;

    expect(button.disabled).toBe(true);
    expect(button.className).toContain("disabled:cursor-not-allowed");
    expect(button.getAttribute("title")).toBe("Bind a workspace first");
    const describedBy = button.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(el.ownerDocument.getElementById(describedBy!)?.textContent).toBe("Bind a workspace first");
  });

  it("shows no hint while enabled", async () => {
    const el = await render(<Button disabledReason="Bind a workspace first">Continue</Button>);
    const button = el.querySelector("button")!;
    expect(button.getAttribute("title")).toBeNull();
    expect(button.getAttribute("aria-describedby")).toBeNull();
    expect(el.textContent).toBe("Continue");
  });
});
