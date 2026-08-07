'use client';

import React, { useState } from 'react';
import { WorkspaceScaffold } from "@/components/cos/WorkspaceScaffold";
import { PhaseTrace } from "@/components/cos/PhaseTrace";
import GovernCanvas from "@/components/cos/GovernCanvas";
import PipelinePropertyPanel from "@/components/cos/PipelinePropertyPanel";

// Mock data for the govern canvas
const initialNodes = [
  {
    id: "g-1",
    position: { x: 50, y: 150 },
    data: {
      label: "Intent Parser",
      node_type: "ingress",
      status: "success",
      config: { model: "claude-3-5-sonnet", confidence: 0.98 }
    }
  },
  {
    id: "g-2",
    position: { x: 300, y: 100 },
    data: {
      label: "AST Security Analysis",
      node_type: "verification",
      status: "success",
      config: { sdi_threshold: 0.05, dynamic_eval: "blocked" }
    }
  },
  {
    id: "g-3",
    position: { x: 300, y: 250 },
    data: {
      label: "Budget & Quota Gate",
      node_type: "policy",
      status: "running",
      config: { max_spend: 0.15, current_burn: 0.02 }
    }
  },
  {
    id: "g-4",
    position: { x: 600, y: 175 },
    data: {
      label: "Issue Execution Lease",
      node_type: "authorization",
      status: "idle",
      config: { ttl_seconds: 3600, required_quorum: 1 }
    }
  }
];

const initialEdges = [
  { id: "e-1", source: "g-1", target: "g-2" },
  { id: "e-2", source: "g-1", target: "g-3" },
  { id: "e-3", source: "g-2", target: "g-4" },
  { id: "e-4", source: "g-3", target: "g-4" }
];

export default function GovernPage() { 
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const handleNodeClick = (event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
  };

  return (
    <WorkspaceScaffold 
      stage="Govern" 
      title="Govern" 
      description="Review automated Zero-Trust Middleware policy decisions before granting execution authority."
    >
      <div className="flex flex-col gap-8 pb-12">
        <PhaseTrace phases={[
          { id: "mount", name: "Mount", status: "complete" },
          { id: "blueprint", name: "Blueprint", status: "complete" },
          { id: "govern", name: "Govern", status: "pending" }
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <GovernCanvas 
              nodes={initialNodes} 
              edges={initialEdges} 
              onNodeClick={handleNodeClick}
              isExecuting={true}
            />
          </div>
          <div className="lg:col-span-1 border border-cos-border rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <PipelinePropertyPanel selectedNode={selectedNode} />
          </div>
        </div>
      </div>
    </WorkspaceScaffold>
  ); 
}
