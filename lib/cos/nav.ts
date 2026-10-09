import { spineStages } from "./stages";

/**
 * The Capability OS navigation, as specified in docs/design-brief/02_NAVIGATION_MAP.md and
 * docs/capability-os/DESIGN_MODEL.md. Primary navigation uses functional names only; internal
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
  { id: "home", label: "Home", items: [{ id: "capabilities", label: "Capabilities", route: "/os" }] },
  { id: "lifecycle", label: "Lifecycle", items: lifecycle },
  {
    id: "tools",
    label: "Capability tools",
    items: [
      { id: "registry", label: "Registry", route: "/os/registry" },
      { id: "marketplace", label: "Marketplace", route: "/os/marketplace" },
      { id: "harnesses", label: "Harnesses", route: "/os/harnesses" },
      { id: "contracts", label: "Contracts", route: "/os/contracts" },
      { id: "verification", label: "Verification", route: "/os/verification" },
    ],
  },
  { id: "cloud", label: "Where it runs", items: [{ id: "computeless", label: "Private Cloud", route: "/os/computeless" }] },
  {
    id: "operator",
    label: "Operator",
    items: [
      { id: "terminal", label: "Terminal", route: "/os/terminal", hint: "Ctrl+`" },
      { id: "settings", label: "Settings", route: "/os/settings" },
    ],
  },
];

export function isActiveRoute(pathname: string, route: string): boolean {
  if (route === "/os") return pathname === "/os";
  return pathname === route || pathname.startsWith(route + "/");
}
