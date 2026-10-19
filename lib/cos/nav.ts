import { spineStages } from "./stages";

/**
 * The Capability OS navigation, revamped to an executive product hierarchy:
 * 1. Core Product: Workspace (Cockpit), Evidence Vault (Ledger), Private Cloud (Substrate), Settings.
 * 2. Advanced / Inspect: Encapsulated developer stages and diagnostic tools (Mount, Blueprint, Govern, Authority, Execute, Measure, Settle, Terminal).
 *
 * Invariant: Zero broken wiring. All routes and backend endpoints remain fully connected.
 */
export type NavItem = {
  id: string;
  label: string;
  /** In-OS route. Absent for actions such as the Terminal overlay. */
  route?: string;
  action?: "terminal";
  hint?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  items: NavItem[];
};

// Intermediate developer stages (tucked cleanly into the Inspect drawer)
const inspectStages: NavItem[] = spineStages
  .filter((stage) => stage.id !== "evidence") // Evidence is elevated to a primary product surface
  .map((stage) => ({ id: stage.id, label: stage.label, route: stage.route }));

export const navGroups: NavGroup[] = [
  // Primary Product Cockpit (The 7 essential product areas)
  {
    id: "product",
    label: "Core Product",
    items: [
      { id: "workspace", label: "Workspace", route: "/os/workspace", hint: "Cockpit" },
      { id: "capabilities", label: "Capabilities", route: "/os", hint: "Catalog" },
      { id: "connectors", label: "Connectors", route: "/os/connectors", hint: "MCP Hub" },
      { id: "govern", label: "Governed", route: "/os/govern", hint: "Policy" },
      { id: "evidence", label: "Evidence Vault", route: "/os/evidence", hint: "Ledger" },
      { id: "measure", label: "Measure", route: "/os/measure", hint: "SLA" },
      { id: "computeless", label: "Private Cloud", route: "/os/computeless", hint: "Substrate" },
      { id: "settings", label: "Settings", route: "/os/settings" },
    ],
  },
  // Advanced / Inspect Mode (Tucked away, collapsible, fully connected)
  {
    id: "inspect",
    label: "Advanced / Inspect",
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { id: "terminal", label: "Live Terminal", action: "terminal", hint: "Ctrl+`" },
      { id: "mount", label: "Mount", route: "/os/mount" },
      { id: "blueprint", label: "Blueprint", route: "/os/blueprint" },
      { id: "authority", label: "Authority", route: "/os/authority" },
      { id: "execute", label: "Execute", route: "/os/execute" },
      { id: "settle", label: "Settle", route: "/os/settle" },
      { id: "tracker", label: "Tracker", route: "/os/tracker" },
    ],
  },
];

export function isActiveRoute(pathname: string, route: string): boolean {
  if (route === "/os") return pathname === "/os";
  return pathname === route || pathname.startsWith(route + "/");
}
