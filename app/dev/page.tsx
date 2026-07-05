"use client";

import DevSidebar from "./components/DevSidebar";
import WhitepaperContent from "./components/WhitepaperContent";
import ArchitectureDiagram from "./components/ArchitectureDiagram";
import HostileAgentDemo from "./components/HostileAgentDemo";
import { GovernedExportDemo } from "./components/GovernedExportDemo";

export default function DevPortal() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#3EE7A2]/30 selection:text-white">
      
      <div className="flex max-w-[1600px] mx-auto pt-16">
        {/* Left Sidebar */}
        <DevSidebar />

        {/* Main Content Pane */}
        <div className="flex-1 min-w-0 flex flex-col items-center px-8 lg:px-12 pb-24">
          <div className="w-full max-w-5xl mt-8 flex flex-col gap-8">
            <HostileAgentDemo />
            <GovernedExportDemo />
          </div>
          <div className="w-full border-t border-[#242424] pt-16 mt-8 flex justify-center">
            <WhitepaperContent />
          </div>
        </div>

        {/* Right Flow Diagram */}
        <ArchitectureDiagram />
      </div>
    </main>
  );
}
