"use client";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Terminal,
  Activity,
  GitCommit,
  Users,
  Server,
  Radio,
  Database,
  ShieldAlert,
  LayoutGrid,
  GitBranch,
  FlaskConical,
  ShieldCheck,
  Network,
  AlertTriangle,
  Coins,
  Sword,
  Fingerprint,
  Scale,
  FileLock,
  Wallet,
  Map,
  ExternalLink,
  Crown,
  Search,
  Gamepad2,
  KeyRound,
  Webhook,
  Settings
} from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface SidebarProps {
  mcpHeartbeat: string;
  throughput: number;
  agentsCount: number;
}

interface MenuItem {
  id: string;
  name: string;
  icon: any;
  href: string;
  isLive?: boolean;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

export default function Sidebar({ mcpHeartbeat, throughput, agentsCount }: SidebarProps) {
  const pathname = usePathname();
  const { me } = useAuth();

  const TERMINAL_URL = 'https://terminal.veklom.com';

  const sections: MenuSection[] = [
    {
      items: [
        { id: 'overview', name: 'Control Node', icon: LayoutGrid, href: '/control-node', isLive: true },
        { id: 'swarm-map', name: 'Swarm Map', icon: Map, href: '/swarm-map', isLive: true },
      ]
    },
    {
      title: 'BUILD',
      items: [
        { id: 'spine', name: 'Pipelines & GPC', icon: GitBranch, href: '/pipelines', isLive: true },
        { id: 'repo-risk', name: 'Repo Risk Gate', icon: ShieldAlert, href: '/repogate', isLive: true },
      ]
    },
    {
      title: 'RUN',
      items: [
        { id: 'playground', name: 'Playground', icon: FlaskConical, href: '/playground', isLive: true },
        { id: 'runtime', name: 'Runtime Enforcement', icon: ShieldCheck, href: '/runtime', isLive: true },
      ]
    },
    {
      title: 'VEKLOM NEXUS',
      items: [
        { id: 'nexus', name: 'Nexus Protocol', icon: Network, href: '/nexus', isLive: true },
        { id: 'runs', name: 'Incidents & Slashing', icon: AlertTriangle, href: '/incidents' },
      ]
    },
    {
      title: 'STAKING & PROTOCOL',
      items: [
        { id: 'staking', name: 'Staking Protocol', icon: Coins, href: '/staking' },
        { id: 'duel', name: 'Agent Duel', icon: Sword, href: '/agent-duel' },
        { id: 'id', name: 'Veklom ID', icon: Fingerprint, href: '/veklom-id' },
        { id: 'veklom-discovery', name: 'Veklom Discovery', icon: Search, href: '/benchmarks/discovery', isLive: true },
        { id: 'bingo', name: 'Bingo 2060', icon: Gamepad2, href: '/bingo' },
      ]
    },
    {
      title: 'ZERO-TRUST',
      items: [
        { id: 'committee', name: 'Governance & Identity', icon: Scale, href: '/governance', isLive: true },
        { id: 'interlink', name: 'Interlink Console', icon: FileLock, href: '/interlink' },
      ]
    },
    {
      title: 'TREASURY',
      items: [
        { id: 'treasury', name: 'Workspace Treasury', icon: Wallet, href: '/treasury' },
        { id: 'api-keys', name: 'API Keys', icon: KeyRound, href: '/treasury?tab=keys' },
        { id: 'webhooks', name: 'Webhooks', icon: Webhook, href: '/treasury?tab=webhooks' },
        { id: 'integrations', name: 'Integrations & Settings', icon: Settings, href: '/treasury?tab=settings' },
      ]
    }
  ];

  if (me?.role === 'admin' || me?.is_superuser) {
    sections.push({
      title: 'SUPER USER CONTROL',
      items: [
        { id: 'workspace-admin', name: 'Super User Dashboard', icon: Crown, href: '/workspace-admin', isLive: true },
      ]
    });
  }

  return (
    <aside className="w-64 h-full border-r border-[#ffffff0a] bg-void-black flex flex-col justify-between shrink-0 select-none z-30 overflow-y-auto scrollbar-hide">
      <div className="pb-8">
        {/* Cinematic Branding */}
        <div className="p-5 border-b border-[#ffffff0a]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-none bg-black/80 border border-electric-cyan/40 flex items-center justify-center shadow-[0_0_8px_rgba(0,229,255,0.3)] animate-pulse-glow">
                <Radio className="w-4.5 h-4.5 text-electric-cyan stroke-[2]" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-matrix-emerald border border-void-black" />
            </div>
            <div>
              <div className="text-xs font-bold font-sans tracking-widest text-[#ffffffaa] uppercase flex items-center gap-1">
                UACP <span className="text-electric-cyan font-mono text-[10px]">V5.0</span>
              </div>
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Control Plane NOC</div>
            </div>
          </div>
        </div>
 
        {/* Navigation Items */}
        <nav className="p-3.5 space-y-6">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div className="px-2.5 mb-2 text-[10px] uppercase font-mono tracking-widest text-white/30">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const IsActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`w-full group relative flex items-center gap-3 px-3 py-1.5 rounded-lg text-left transition-all duration-300 pointer border border-transparent ${IsActive ? 'bg-[#b8860b22] border-[#b8860b44]' : 'hover:bg-white/5'}`}
                  >
                    {IsActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#b8860b] rounded-r-full shadow-[0_0_8px_#b8860b]" />
                    )}

                    <Icon className={`w-4 h-4 z-10 transition-colors duration-200 ${IsActive ? 'text-[#b8860b]' : 'text-white/40 group-hover:text-white/75'}`} />

                    <div className="z-10 flex-grow">
                      <div className={`text-[11px] font-medium ${IsActive ? 'text-white font-semibold' : 'text-white/60 group-hover:text-white/90'}`}>
                        {item.name}
                      </div>
                    </div>

                    {item.isLive && (
                      <div className="flex items-center gap-1 text-[8px] font-bold text-matrix-emerald">
                        <div className="w-1 h-1 rounded-full bg-matrix-emerald animate-pulse" />
                        LIVE
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Swarm Terminal — External Service */}
        <div className="px-4 pb-4">
          <a
            href={TERMINAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full group flex items-center gap-3 px-3 py-2 rounded-lg border border-electric-cyan/20 bg-electric-cyan/5 hover:bg-electric-cyan/10 hover:border-electric-cyan/40 transition-all duration-300"
          >
            <Terminal className="w-4 h-4 text-electric-cyan" />
            <div className="flex-grow">
              <div className="text-[11px] font-medium text-electric-cyan/90 group-hover:text-electric-cyan">Swarm Terminal</div>
              <div className="text-[9px] font-mono text-white/30">terminal.veklom.com</div>
            </div>
            <ExternalLink className="w-3 h-3 text-electric-cyan/40 group-hover:text-electric-cyan/80" />
          </a>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="p-4 border-t border-[#ffffff0a] font-mono bg-void-charcoal/[0.4] sticky bottom-0">
        <div className="space-y-2.5">
          {/* Heartbeat system state */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/40 flex items-center gap-1 uppercase">
              <Database className="w-3 h-3 text-white/30" /> MCP-IO STATUS:
            </span>
            <span className={`flex items-center gap-1.5 font-bold ${mcpHeartbeat === 'online' ? 'text-matrix-emerald' : 'text-laser-red'}`}>
              <span className={`w-1.5 h-1.5 ${mcpHeartbeat === 'online' ? 'bg-matrix-emerald animate-fast-pulse' : 'bg-laser-red'} `} />
              {mcpHeartbeat.toUpperCase()}
            </span>
          </div>

          {/* Core Telemetry Speed throughput */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/40 uppercase">THROUGHPUT:</span>
            <span className="text-electric-cyan font-bold">{throughput} KB/S</span>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/40 uppercase">Consensus Rate:</span>
            <span className="text-white/80 font-bold">99.98%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
