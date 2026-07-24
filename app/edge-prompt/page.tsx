"use client";

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function EdgePromptContent() {
  const searchParams = useSearchParams();
  const missing = searchParams.get('missing')?.split(',') || [];
  const returnTo = searchParams.get('returnTo') || '/';
  
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, this would exchange the raw keys for a secure PGL Session Token via CAPPO.
      // For this edge demo, we write them to the session cookie.
      
      const payload = {
        principal: "user-123",
        role: "user",
        permissions: [],
        capabilities: keys
      };

      // Set cookie in browser
      document.cookie = `vnp_execution_identity=${btoa(JSON.stringify(payload))}; path=/; max-age=3600`;

      // Redirect back to original destination
      window.location.href = returnTo;
    } catch (error) {
      console.error("Failed to inject capabilities", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div className="max-w-md w-full bg-[#111111] border border-[#222222] p-8 rounded-xl shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-center">Action Intercepted</h1>
          <p className="text-sm text-[#888888] text-center mt-2">
            The action you are trying to perform requires capabilities missing from your current Execution Identity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {missing.map((req) => (
              <div key={req}>
                <label className="block text-sm font-medium text-[#aaaaaa] mb-1 capitalize">
                  {req.replace(/_/g, ' ')}
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-black border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder={`Enter your ${req.replace(/_/g, ' ')}`}
                  onChange={(e) => setKeys(prev => ({ ...prev, [req]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? 'Injecting Capabilities...' : 'Inject Capabilities & Resume'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#222]">
          <p className="text-xs text-center text-[#555]">
            Veklom Ambient Interlink Edge (Node 1) &bull; Zero-Trust Enforcement
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EdgePrompt() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <EdgePromptContent />
    </Suspense>
  );
}
