"use client";

import React, { useState, useEffect } from 'react';
import SwarmMap from "@/components/terminal/components/SwarmMap";
import { controlStore } from "@/components/terminal/data/simulation";
import { AgentNode } from "@/components/terminal/types";

export default function SwarmMapPage() {
  const [agents, setAgents] = useState<AgentNode[]>(controlStore.agents);

  useEffect(() => {
    return controlStore.subscribe(() => {
      setAgents([...controlStore.agents]);
    });
  }, []);

  const handleAgentUpdate = (id: string, updatedFields: Partial<AgentNode>) => {
    // Optionally update local store if needed, or update simulate state
    // The controlStore handles its own state updates usually, but we mirror it:
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updatedFields } : a));
  };

  return <SwarmMap agents={agents} onAgentUpdate={handleAgentUpdate} />;
}
