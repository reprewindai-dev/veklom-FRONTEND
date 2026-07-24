"use client";

import DevSidebar from "./components/DevSidebar";
import WhitepaperContent from "./components/WhitepaperContent";
import ArchitectureDiagram from "./components/ArchitectureDiagram";
import HostileAgentDemo from "./components/HostileAgentDemo";
import GovernedExportDemo from "./components/GovernedExportDemo";

export default function DevPortal() {
  return (
    <main 
      className="min-h-screen text-white selection:bg-[#f05a70]/30 selection:text-white"
      style={{
        background: "radial-gradient(circle at 48% -8%, rgba(240, 90, 112, 0.08), transparent 34rem), radial-gradient(circle at 86% 12%, rgba(59, 130, 246, 0.06), transparent 30rem), #070a10"
      }}
    >
      
      <div className="flex max-w-[1600px] mx-auto pt-16">
        {/* Left Sidebar */}
        <DevSidebar />

        {/* Main Content Pane */}
        <div className="flex-1 min-w-0 flex flex-col items-center px-6 lg:px-12 pb-24">
          <div className="w-full max-w-4xl mt-8 flex flex-col gap-8">
            <HostileAgentDemo />
            <GovernedExportDemo />
          </div>
          <div className="w-full border-t border-[#2a2630] mt-8 flex justify-center">
            <WhitepaperContent />
          </div>
        </div>

        {/* Right Flow Diagram */}
        <ArchitectureDiagram />
      </div>
    </main>
  );
}
