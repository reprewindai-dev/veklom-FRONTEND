"use client";

import { HonestEmpty, Pillar } from"@/components/cos/SectionPillars";
import { SectionShell } from"@/components/cos/SectionShell";
import { StageDefinition } from"@/lib/cos/stages";

const settingsStage: StageDefinition = {
 id:"settings",
 label:"Settings",
 route:"/os/settings",
 purpose:"Workspace settings are not yet migrated into the Capability OS.",
 owner:"Workspace Admin",
 endpoints: [],
};

export default function SettingsPage() {
 return (
 <SectionShell stage={settingsStage} proof="Needs proof" records={[]}>
 <div className="xl:col-span-2 space-y-4">
 <Pillar title="Configuration" proof="Needs proof">
 <HonestEmpty title="Legacy Settings" route="/workspace-admin" detail="Workspace settings have not been migrated to the Capability OS." />
 </Pillar>
 </div>
 </SectionShell>
 );
}

