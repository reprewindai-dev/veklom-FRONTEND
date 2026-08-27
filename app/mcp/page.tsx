import { MachineSurface } from "@/components/machine/MachineSurface";

export const metadata = {
  title: "Veklom / MCP",
  description: "Web MCP for Veklom Capability OS",
};

export default function McpPage() {
  return (
    <div className="machine-wrapper" data-theme="machine">
      <MachineSurface />
    </div>
  );
}
