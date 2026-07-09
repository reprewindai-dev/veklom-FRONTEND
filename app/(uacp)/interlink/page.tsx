"use client";


import React from 'react';

export default function InterlinkPage() {
  return (
    <div className="w-full h-full bg-[#030303] overflow-hidden">
      <iframe 
        src="https://capi.veklom.com"
        className="w-full h-full border-0" 
        title="Interlink API Console" 
      />
    </div>
  );
}
