import React from 'react';
import { MachineAppShell } from "@/components/shell/MachineAppShell";
import { MachineSurface } from "@/components/machine/MachineSurface";

export const metadata = {
  title: "Veklom / Machine Protocol",
  description: "Machine-readable interface for Veklom Capability OS",
};

export default function MachinePage() {
  return (
    <MachineAppShell>
      <MachineSurface />
    </MachineAppShell>
  );
}
