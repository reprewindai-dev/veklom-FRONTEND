import type { ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { AttentionPanel } from "../AttentionCue";
import { approvalItems, rankAttention, runItems, summarizeAttention } from "@/lib/cos/attention";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => root.render(element));
  return container;
}

describe("AttentionPanel", () => {
  it("lists the most urgent item first, links to it, and shows its evidence", () => {
    const items = rankAttention([
      ...runItems([{ run_id: "r1", state: "ATTESTED", execution_identity: "ei_9" }], false),
      ...approvalItems({ items: [{ quarantine_id: "q1", status: "quarantined", reason: "prod write" }] }, false),
    ]);
    const container = render(
      <AttentionPanel items={items} summary={summarizeAttention(items, ["ok", "ok"])} reads={{ approvals: "ok", runs: "ok" }} />,
    );
    const links = Array.from(container.querySelectorAll("a"));
    expect(container.textContent).toContain("1 waiting for your approval");
    expect(links[0].getAttribute("href")).toBe("/os/tracker#approval-q1");
    expect(links[1].textContent).toContain("evidence ei_9");
  });

  it("says which sources could not be read instead of showing an empty all-clear", () => {
    const container = render(
      <AttentionPanel items={[]} summary={summarizeAttention([], ["unavailable", "ok"])} reads={{ approvals: "unavailable", runs: "ok" }} />,
    );
    expect(container.textContent).toContain("Nothing needs you in what could be read");
    expect(container.textContent).toContain("could not be read");
  });
});
