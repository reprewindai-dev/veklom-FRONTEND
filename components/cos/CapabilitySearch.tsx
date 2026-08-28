"use client";

import { Search, SlidersHorizontal } from"lucide-react";

export function CapabilitySearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
 return (
 <div className="flex items-center gap-3 rounded-xl border border-cos-border bg-cos-surface px-4 py-3.5 shadow-[0_20px_70px_-45px_rgba(0,229,255,0.6)] focus-within:border-cos-accent/60">
 <Search size={20} className="text-cos-accent" />
 <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search Capabilities" className="min-w-0 flex-1 bg-transparent text-base text-cos-text outline-none placeholder:text-cos-muted" />
 <SlidersHorizontal size={16} className="text-cos-steel" />
 <kbd className="hidden rounded border border-cos-border px-2 py-1 font-mono text-[10px] text-cos-steel sm:inline">⌘ K</kbd>
 </div>
 );
}
