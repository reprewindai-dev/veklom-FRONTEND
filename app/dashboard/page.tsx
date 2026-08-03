"use client";

import React, { useState, useEffect } from 'react';
import { HeaderNav } from '../../components/HeaderNav';
import { ThesisEvaluationView } from '../../components/ThesisEvaluationView';
import { CapiSandboxView } from '../../components/CapiSandboxView';
import { AbideBlueprintView } from '../../components/AbideBlueprintView';
import { SkillRegistryView } from '../../components/SkillRegistryView';
import { GnomledgerExplorerView } from '../../components/GnomledgerExplorerView';
import { VnpTelemetryView } from '../../components/VnpTelemetryView';
import { RbacPolicyView } from '../../components/RbacPolicyView';
import { ApiDocsView } from '../../components/ApiDocsView';
import { GlobalQuickActionModal } from '../../components/GlobalQuickActionModal';
import { SystemMode, UserRole, SkillSpec, OllamaStatus } from '../../types';
import { INITIAL_SKILLS_REGISTRY } from '../../server/repogate-scanner';

export default function DashboardPage() {
  const [mode, setMode] = useState<SystemMode>('production');
  const [role, setRole] = useState<UserRole>('admin');
  const [activeTab, setActiveTab] = useState<string>('eval');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [skills, setSkills] = useState<SkillSpec[]>(INITIAL_SKILLS_REGISTRY);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState<boolean>(false);

  const checkOllama = async () => {
    try {
      const response = await fetch('/api/v1/ollama/status');
      if (response.ok) {
        const data: OllamaStatus = await response.json();
        setOllamaStatus(data);
      }
    } catch (e) {
      setOllamaStatus({
        connected: false,
        endpoint: 'http://localhost:11434',
        availableModels: ['llama3.2:latest', 'deepseek-r1:8b', 'codellama:latest'],
        latencyMs: 0,
        error: 'Daemon unreachable'
      });
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/v1/skills');
      if (response.ok) {
        const data: SkillSpec[] = await response.json();
        setSkills(data);
      }
    } catch (e) {
      console.warn('Using initial skills registry fallback');
    }
  };

  useEffect(() => {
    checkOllama();
    fetchSkills();
    const interval = setInterval(checkOllama, 8000);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard Listener for Cmd+K / Ctrl+K Quick Action Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickActionOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isQuickActionOpen) {
        setIsQuickActionOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickActionOpen]);

  const handleSkillAdded = (newSkill: SkillSpec) => {
    setSkills((prev) => [newSkill, ...prev]);
  };

  return (
    <>
      <HeaderNav
        mode={mode}
        setMode={setMode}
        role={role}
        setRole={setRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ollamaStatus={ollamaStatus}
        refreshOllama={checkOllama}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
      />

      <main className="pb-16">
        {activeTab === 'eval' && <ThesisEvaluationView />}
        {activeTab === 'capi' && (
          <CapiSandboxView
            mode={mode}
            skills={skills}
            ollamaStatus={ollamaStatus}
            refreshOllama={checkOllama}
          />
        )}
        {activeTab === 'abide' && <AbideBlueprintView />}
        {activeTab === 'registry' && (
          <SkillRegistryView skills={skills} onSkillAdded={handleSkillAdded} />
        )}
        {activeTab === 'pgl' && <GnomledgerExplorerView />}
        {activeTab === 'vnp' && <VnpTelemetryView />}
        {activeTab === 'rbac' && <RbacPolicyView currentRole={role} setRole={setRole} />}
        {activeTab === 'docs' && <ApiDocsView />}
      </main>

      <GlobalQuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mode={mode}
        setMode={setMode}
        role={role}
        setRole={setRole}
        refreshOllama={checkOllama}
        onSkillsRefreshed={(refreshedSkills) => setSkills(refreshedSkills)}
      />

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Veklom Multi-Agent Control Plane & cAPI Capability Engine © 2026 Reprewind AI
          </div>
          <div className="flex items-center gap-4 text-3xs text-slate-400">
            <span>gnomledger (PGL)</span>
            <span>•</span>
            <span>veklom-vnp</span>
            <span>•</span>
            <span>real-repo-gate</span>
            <span>•</span>
            <span>abide</span>
            <span>•</span>
            <span>lockerphycer</span>
          </div>
        </div>
      </footer>
    </>
  );
}
