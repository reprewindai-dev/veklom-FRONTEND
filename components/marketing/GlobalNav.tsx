"use client";

import Link from"next/link";
import React, { useEffect, useState } from"react";
import { useUIStore } from"@/lib/store/ui-store";

interface GlobalNavProps {
 rightSlot?: React.ReactNode;
 isMachineOverride?: boolean;
}

export function GlobalNav({ rightSlot, isMachineOverride }: GlobalNavProps) {
 const { isMachine: storedIsMachine, toggleMachine, setIsRawOpen } = useUIStore();
 const isMachine = isMachineOverride ?? storedIsMachine;
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 }, []);

 return (
 <nav 
 className="flex justify-between items-center p-6 lg:px-12 border-b transition-colors duration-500 border-rule data-[machine=true]:border-wire relative z-20" 
 data-machine={isMachine}
 >
 <div className="flex items-center gap-6">
 <Link href="/">
 <img src="/veklom-wordmark.svg" alt="Veklom Wordmark" className="h-8 w-auto" />
 </Link>
 <div className="hidden md:flex gap-6 text-sm font-medium text-cos-text/80 transition-colors" data-machine={isMachine}>
 <Link href="/vnp" className="hover:text-cos-text data-[machine=true]:hover:text-cos-accent transition-colors" data-machine={isMachine}>VNP</Link>
 <Link href="/eee" className="hover:text-cos-text data-[machine=true]:hover:text-cos-accent transition-colors" data-machine={isMachine}>EEE</Link>
 <Link href="/vcgb" className="hover:text-cos-text data-[machine=true]:hover:text-cos-accent transition-colors" data-machine={isMachine}>VCGB</Link>
 <Link href="/docs" className="hover:text-cos-text data-[machine=true]:hover:text-cos-accent transition-colors" data-machine={isMachine}>Doc Hub</Link>
 <Link href="/directory" className="hover:text-cos-text data-[machine=true]:hover:text-cos-accent transition-colors" data-machine={isMachine}>Directory</Link>
 <Link href="/status" className="hover:text-cos-text data-[machine=true]:hover:text-cos-accent transition-colors" data-machine={isMachine}>Status</Link>
 </div>
 </div>
 <div className="flex items-center gap-4 text-xs font-mono">
 {rightSlot}
 {mounted && (
 <div className="flex items-center gap-4">
 <button onClick={() => setIsRawOpen(true)} className="hover:opacity-70 transition-opacity hidden sm:flex items-center gap-2 text-xs font-mono border border-wire px-3 py-1.5 rounded-full text-cos-accent-dim hover:text-cos-accent hover:border-cos-accent">
 <span className="opacity-50">&lt;/&gt;</span> View as an agent would fetch it
 </button>
 {isMachineOverride === undefined && <button onClick={toggleMachine} className="hover:opacity-70 transition-opacity flex items-center gap-2 text-xs font-mono border border-cos-text px-4 py-2 rounded-full text-cos-text hover:bg-cos-text hover:text-paper data-[machine=true]:border-cos-accent data-[machine=true]:text-cos-accent data-[machine=true]:hover:bg-cos-accent data-[machine=true]:hover:text-void" data-machine={isMachine}>
 <span className="w-1.5 h-1.5 rounded-full bg-cos-accent flex-shrink-0 shadow-[0_0_8px_var(--cyan)]"></span>
 Switch to {isMachine ? 'human view' : 'machine view'}
 </button>}
 </div>
 )}
 </div>
 </nav>
 );
}
