import { spineStages } from "./stages";

/**
 * The Capability OS navigation, aligned strictly with the approved product architecture:
 * Clean, focused 7 core surfaces without developer drawer clutter on the persistent left rail.
 *
 * Invariant: Zero broken wiring. All developer routes (/os/mount, /os/blueprint, etc.)
 * remain fully active and accessible via Command Palette (Ctrl+K), Terminal (Ctrl+`), and direct URLs.
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

export const navGroups: NavGroup[] = [
  // Primary Product Cockpit (The 7 essential product areas matching approved architecture)
  {
    id: "product",
    label: "Core Product",
    items: [
      { id: "workspace", label: "Workspace", route: "/os", hint: "Cockpit" },
      { id: "capabilities", label: "Capabilities", route: "/os/catalog", hint: "Catalog" },
      { id: "govern", label: "Governed", route: "/os/govern", hint: "Policy" },
      { id: "evidence", label: "Evidence Vault", route: "/os/evidence", hint: "Ledger" },
      { id: "measure", label: "Measure", route: "/os/measure", hint: "SLA" },
      { id: "computeless", label: "Private Cloud", route: "/os/computeless", hint: "Substrate" },
      { id: "settings", label: "Settings", route: "/os/settings" },
    ],
  },
];

export function isActiveRoute(pathname: string, route: string): boolean {
  if (route === "/os") return pathname === "/os" || pathname === "/os/workspace";
  return pathname === route || pathname.startsWith(route + "/");
}
