"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceFlowStarted, setDeviceFlowStarted] = useState(false);
  const [deviceData, setDeviceData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/os');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
      setLoading(false);
    }
  };

  const handleDeviceFlowStart = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/auth/github/device/start', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start device flow');
      
      setDeviceData(data);
      setDeviceFlowStarted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate device flow');
    } finally {
      setLoading(false);
    }
  };

  if (deviceFlowStarted && deviceData) {
    return (
      <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded shadow-sm p-8 text-center">
        <h2 className="text-xl font-sans font-bold text-theme-ink mb-4">Authorize a headless Veklom node</h2>
        <p className="text-theme-inkDim text-sm mb-4">1. Go to <a href={deviceData.verification_uri} target="_blank" rel="noopener noreferrer" className="text-theme-accent hover:underline">{deviceData.verification_uri}</a></p>
        <p className="text-theme-inkDim text-sm mb-4">2. Enter code:</p>
        <div className="text-3xl font-mono font-bold text-theme-ink mb-6 tracking-widest">{deviceData.user_code}</div>
        <p className="text-xs text-theme-inkDim animate-pulse">3. Waiting for authorization...</p>
        <p className="text-[10px] text-theme-inkDim mt-6">4. Linked to Veklom workspace once approved.</p>
        <button onClick={() => setDeviceFlowStarted(false)} className="mt-6 text-xs text-theme-inkDim hover:text-theme-ink underline">Cancel</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded shadow-sm p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-sans font-bold text-theme-ink mb-2">Capability OS Access</h1>
        <p className="text-theme-inkDim text-sm">Sign in to enter your governed machine-action workspace.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-theme-danger/10 border border-theme-danger/20 text-theme-danger text-sm rounded">
          {error}
        </div>
      )}

      <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-theme-inkDim block">Email or Username</label>
          <input 
            type="text" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-theme-bg border border-theme-border rounded px-3 py-2 text-sm text-theme-ink focus:outline-none focus:border-theme-accent transition-colors"
            placeholder="operator@example.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-theme-inkDim block">Password</label>
            <Link href="/forgot-password" className="text-xs text-theme-accent hover:underline">Forgot password?</Link>
          </div>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-theme-bg border border-theme-border rounded px-3 py-2 text-sm text-theme-ink focus:outline-none focus:border-theme-accent transition-colors"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-theme-ink text-theme-bg font-bold py-2.5 rounded transition-opacity hover:opacity-90 mt-2 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-theme-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-theme-surface px-2 text-theme-inkDim uppercase tracking-widest font-mono font-bold">OR</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link 
          href="/api/auth/github/login" 
          className="w-full flex items-center justify-center gap-2 border border-theme-border bg-theme-bg hover:bg-theme-surface2 text-theme-ink font-bold py-2.5 rounded transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          Continue with GitHub
        </Link>
        <button 
          onClick={handleDeviceFlowStart}
          type="button"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-theme-border bg-theme-bg hover:bg-theme-surface2 text-theme-inkDim text-xs font-mono py-2 rounded transition-colors"
        >
          Authorize a headless Veklom node (Device Flow)
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link href="/signup" className="text-xs text-theme-inkDim hover:text-theme-ink transition-colors">
          Create account / request access
        </Link>
      </div>
    </div>
  );
}