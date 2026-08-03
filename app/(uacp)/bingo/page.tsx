"use client";

import dynamic from 'next/dynamic';

// Disable SSR for the entire Bingo application since it relies on window, local state,
// and wagmi hooks that throw React hydration/prerender errors during build
const BingoAppDynamic = dynamic(() => import('./BingoApp'), {
  ssr: false,
});

export default function Page() {
  return <BingoAppDynamic />;
}
