import { spineStages } from "./stages";

/**
 * The Capability OS navigation, as specified in docs/capability-os/CANONICAL_HANDOFF.md §3-4 and
 * docs/capability-os/DESIGN_MODEL.md: one shell, one lifecycle spine. Primary navigation uses functional names only; internal
 * service names belong in diagnostics and developer views.
 */
export type NavItem = {
  id: string;
  label: string;
  /** In-OS route. Absent for actions such as the Terminal overlay. */
  route?: string;
  action?: "terminal";
  hint?: string;
};

export type NavGroup = { id: string; label: string; items: NavItem[] };

const lifecycle: NavItem[] = spineStages
  .filter((stage) => stage.id !== "capabilities")
  .map((stage) => ({ id: stage.id, label: stage.label, route: stage.route }));

export const navGroups: NavGroup[] = [
  // One shell (CANONICAL_HANDOFF §3-4, owner 2026-10-10): the home catalog, the lifecycle spine,
  // where it runs, and the operator's Terminal overlay and Settings. Marketplace is the home
  // catalog; harness and contracts live inside Mount and Blueprint; ledger checks live inside
  // Evidence. There is no second group of tool pages.
  { id: "home", label: "Home", items: [{ id: "capabilities", label: "Capabilities", route: "/os" }] },
  { id: "lifecycle", label: "Lifecycle", items: lifecycle },
  { id: "cloud", label: "Where it runs", items: [{ id: "computeless", label: "Private Cloud", route: "/os/computeless" }] },
  {
    id: "operator",
    label: "Operator",
    items: [
      { id: "terminal", label: "Terminal", action: "terminal", hint: "Ctrl+`" },
      { id: "settings", label: "Settings", route: "/os/settings" },
    ],
  },
];

export function isActiveRoute(pathname: string, route: string): boolean {
  if (route === "/os") return pathname === "/os";
  return pathname === route || pathname.startsWith(route + "/");
}
