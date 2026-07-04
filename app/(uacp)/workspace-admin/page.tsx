"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ShieldAlert, Users, Server, Activity, FileLock, UserCheck, Search, Plus, Globe, Eye, AlertCircle } from "lucide-react";

export default function WorkspaceAdminPage() {
  const { me, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extremely strict RBAC Protection
  useEffect(() => {
    if (!loading && mounted) {
      if (!me) {
        router.replace("/login");
      } else if (me.role !== "admin" && !me.is_superuser) {
        // Kick them to the curb if they aren't a super user (either platform or workspace level)
        router.replace("/control-node");
      }
    }
  }, [me, loading, mounted, router]);

  if (loading || !mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-void-black text-white">
        <div className="w-8 h-8 rounded-full border-t-2 border-electric-cyan animate-spin" />
      </div>
    );
  }

  // Double check before rendering sensitive UI
  if (!me || (me.role !== "admin" && !me.is_superuser)) {
    return null; 
  }

  // RBAC Distinction: Platform Admin vs Workspace Admin
  const isUltimateOwner = me.email === "reprewindai@gmail.com" || me.is_superuser === true;

  // Replaced mock data with real empty state pending backend wiring
  const displayUsers: any[] = [];
  
  return (
    <div className="min-h-screen bg-void-black text-white p-8">
      {/* Header */}
      <div className="mb-10 border-b border-[#ffffff1a] pb-6">
        <div className="flex items-center gap-3 mb-2">
          {isUltimateOwner ? (
            <Globe className="w-8 h-8 text-electric-cyan" />
          ) : (
            <ShieldAlert className="w-8 h-8 text-[#b8860b]" />
          )}
          <h1 className={`text-3xl font-bold font-mono tracking-wider uppercase ${isUltimateOwner ? 'text-electric-cyan drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : 'text-[#b8860b] drop-shadow-[0_0_8px_rgba(184,134,11,0.5)]'}`}>
            {isUltimateOwner ? 'Ultimate Platform Console' : 'Super User Console'}
          </h1>
        </div>
        <p className="text-white/50 text-sm font-mono uppercase tracking-widest max-w-3xl">
          {isUltimateOwner 
            ? "OMNISCIENT MODE ACTIVE. You are the Ultimate Owner. You have legally binding telemetry access to all workspaces, users, and platform activity globally."
            : "Restricted Area. You are viewing this dashboard because you are the authenticated owner (`admin`) of this workspace. You only see users assigned to your workspace."}
        </p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className={`bg-black/40 border p-6 rounded-lg backdrop-blur-md relative overflow-hidden group ${isUltimateOwner ? 'border-electric-cyan/30' : 'border-[#b8860b]/30'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className={`w-16 h-16 ${isUltimateOwner ? 'text-electric-cyan' : 'text-[#b8860b]'}`} />
          </div>
          <div className={`${isUltimateOwner ? 'text-electric-cyan' : 'text-[#b8860b]'} text-xs font-bold font-mono tracking-widest mb-1`}>
            {isUltimateOwner ? 'Global Platform Users' : 'Total Workspace Workers'}
          </div>
          <div className="text-4xl font-bold font-mono text-white">--</div>
        </div>
        
        <div className={`bg-black/40 border p-6 rounded-lg backdrop-blur-md relative overflow-hidden group ${isUltimateOwner ? 'border-electric-cyan/30' : 'border-[#b8860b]/30'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className={`w-16 h-16 ${isUltimateOwner ? 'text-electric-cyan' : 'text-[#b8860b]'}`} />
          </div>
          <div className={`${isUltimateOwner ? 'text-electric-cyan' : 'text-[#b8860b]'} text-xs font-bold font-mono tracking-widest mb-1`}>
            {isUltimateOwner ? 'Global Active Sessions' : 'Active Sessions'}
          </div>
          <div className="text-4xl font-bold font-mono text-white">--</div>
        </div>

        <div className={`bg-black/40 border p-6 rounded-lg backdrop-blur-md relative overflow-hidden group ${isUltimateOwner ? 'border-electric-cyan/30' : 'border-[#b8860b]/30'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {isUltimateOwner ? <Eye className="w-16 h-16 text-electric-cyan" /> : <FileLock className="w-16 h-16 text-[#b8860b]" />}
          </div>
          <div className={`${isUltimateOwner ? 'text-electric-cyan' : 'text-[#b8860b]'} text-xs font-bold font-mono tracking-widest mb-1`}>
            {isUltimateOwner ? 'Surveillance Level' : 'Global Permissions'}
          </div>
          <div className="text-4xl font-bold font-mono text-white">{isUltimateOwner ? 'OMNISCIENT' : 'STRICT'}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-white/80 flex items-center gap-2">
            <UserCheck className={`w-4 h-4 ${isUltimateOwner ? 'text-electric-cyan' : 'text-matrix-emerald'}`} />
            {isUltimateOwner ? 'Global Platform Activity Log' : 'Workspace Operators (Workers)'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="bg-black/40 border border-white/10 rounded-md py-1.5 pl-9 pr-4 text-xs font-mono text-white focus:outline-none focus:border-electric-cyan transition-colors w-64"
              />
            </div>
            {!isUltimateOwner && (
              <button className="bg-electric-cyan text-black px-4 py-1.5 rounded-md text-xs font-bold font-mono uppercase tracking-wider hover:bg-white hover:text-black transition-colors flex items-center gap-2">
                <Plus className="w-3 h-3" /> Invite Worker
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-mono tracking-widest text-white/40">
                <th className="p-4 font-semibold">Identifier</th>
                <th className="p-4 font-semibold">Account</th>
                <th className="p-4 font-semibold">Assigned Role</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Location</th>
                {isUltimateOwner && <th className="p-4 font-semibold">Current Action</th>}
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
                {displayUsers.length === 0 && (
                  <tr>
                    <td colSpan={isUltimateOwner ? 7 : 6} className="p-8 text-center text-white/50 font-mono text-sm">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-white/40" />
                      Needs proof<br/>
                      <span className="text-xs">Awaiting telemetry. No users found.</span>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
