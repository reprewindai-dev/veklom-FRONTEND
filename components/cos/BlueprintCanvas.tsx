'use client';

import React, { useState, useMemo } from "react";
import { Globe } from "lucide-react";

// Types extracted from ABIDE
export interface Domain {
  name: string;
  description: string;
  products?: string[];
}
export interface Product {
  name: string;
  domain: string;
  businessValue?: string;
}
export interface CanonicalSystem {
  name: string;
  purpose: string;
}
export interface CompanyGraph {
  domains: Domain[];
  products: Product[];
  canonicalSystems: CanonicalSystem[];
}
export interface Capability {
  id: string;
  name: string;
  purpose: string;
  lifecycleState?: string;
  verificationState?: string;
  canonicalSystem?: string;
  canonicalServiceSystem?: string;
  canonicalDataDomain?: string;
  owner?: string;
  pricingModel?: {
    priceFloor: number;
  };
  dependencies?: string[];
}

interface BlueprintCanvasProps {
  companyGraph: CompanyGraph;
  capabilities: Capability[];
}

export default function BlueprintCanvas({ companyGraph, capabilities }: BlueprintCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [visualizeMode, setVisualizeMode] = useState<"type" | "status" | "cost" | "verification">("type");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Dynamic coordinate generation for nodes based on compiled blueprint
  const viewBoxWidth = 500;

  const domainNodes = (companyGraph?.domains || []).map((dom, idx, arr) => {
    const count = arr.length;
    const x = count > 1 ? 60 + (idx * (viewBoxWidth - 120)) / (count - 1) : viewBoxWidth / 2;
    const id = `dom-${dom.name.toLowerCase().replace(/\s+/g, "-")}`;
    return { id, rawId: dom.name, label: dom.name, type: "domain", x, y: 50, color: "#BF5AF2", desc: dom.description };
  });

  const productNodes = (companyGraph?.products || []).map((prod, idx, arr) => {
    const count = arr.length;
    const x = count > 1 ? 100 + (idx * (viewBoxWidth - 200)) / (count - 1) : viewBoxWidth / 2;
    const id = `prod-${prod.name.toLowerCase().replace(/\s+/g, "-")}`;
    return { id, rawId: prod.name, label: prod.name, type: "product", x, y: 120, color: "#0A84FF", desc: prod.businessValue };
  });

  const capabilityNodes = (capabilities || []).map((cap, idx, arr) => {
    const count = arr.length;
    const x = count > 1 ? 50 + (idx * (viewBoxWidth - 100)) / (count - 1) : viewBoxWidth / 2;
    return { id: cap.id, rawId: cap.id, label: cap.name, type: "capability", x, y: 220, color: "#00E5FF", details: cap.purpose };
  });

  const systemNodes = (companyGraph?.canonicalSystems || []).map((sys, idx, arr) => {
    const count = arr.length;
    const x = count > 1 ? 120 + (idx * (viewBoxWidth - 240)) / (count - 1) : viewBoxWidth / 2;
    const id = `sys-${sys.name.toLowerCase().replace(/\s+/g, "-")}`;
    return { id, rawId: sys.name, label: sys.name, type: "system", x, y: 310, color: "#FF375F", desc: sys.purpose };
  });

  const abideNodes = [
    { id: "abide-node-a", rawId: "Abide-Node-A", label: "Abide Node A", type: "abide", x: 100, y: 390, color: "#FFAB00", desc: "Lockerphycer physical security isolation enclave." },
    { id: "abide-node-b", rawId: "Abide-Node-B", label: "Abide Node B", type: "abide", x: 250, y: 390, color: "#00FF66", desc: "Cappo-backend & BYOS capability verification router." },
    { id: "abide-node-c", rawId: "Abide-Node-C", label: "Abide Node C", type: "abide", x: 400, y: 390, color: "#0A84FF", desc: "Gnomledger decentralized peer lineage witness anchor." }
  ];

  const nodes = [...domainNodes, ...productNodes, ...capabilityNodes, ...systemNodes, ...abideNodes];
  const links: { source: string; target: string; dashed?: boolean }[] = [];

  // Link Domain -> Product
  (companyGraph?.products || []).forEach(prod => {
    const pNode = productNodes.find(pn => pn.rawId === prod.name);
    const dNode = domainNodes.find(dn => dn.rawId === prod.domain);
    if (pNode && dNode) links.push({ source: dNode.id, target: pNode.id });
  });

  // Link Product -> Capability
  (capabilities || []).forEach((cap, idx) => {
    const capNode = capabilityNodes.find(cn => cn.id === cap.id);
    if (capNode) {
      let matchedProd = productNodes.find(pn => pn.rawId === cap.canonicalDataDomain);
      if (!matchedProd && productNodes.length > 0) matchedProd = productNodes[idx % productNodes.length];
      if (matchedProd) links.push({ source: matchedProd.id, target: capNode.id });
    }
  });

  // Link Capability -> System
  (capabilities || []).forEach(cap => {
    const capNode = capabilityNodes.find(cn => cn.id === cap.id);
    if (capNode) {
      const targetSysName = cap.canonicalServiceSystem || cap.canonicalSystem;
      if (targetSysName) {
        const sysNode = systemNodes.find(sn => sn.rawId.toLowerCase().includes(targetSysName.toLowerCase()));
        if (sysNode) links.push({ source: capNode.id, target: sysNode.id });
      } else if (systemNodes.length > 0) {
        links.push({ source: capNode.id, target: systemNodes[0].id });
      }
    }
  });

  // Link Inter-Capability dependencies
  (capabilities || []).forEach(cap => {
    const capNode = capabilityNodes.find(cn => cn.id === cap.id);
    if (capNode && cap.dependencies) {
      cap.dependencies.forEach(depId => {
        const depNode = capabilityNodes.find(cn => cn.id === depId);
        if (depNode) links.push({ source: depNode.id, target: capNode.id, dashed: true });
      });
    }
  });

  // Link System -> Abide Micro-Nodes
  systemNodes.forEach(sn => {
    if (sn.rawId.includes("Router")) links.push({ source: sn.id, target: "abide-node-b" });
    else if (sn.rawId.includes("Ledger") || sn.rawId.includes("Gnomledger")) links.push({ source: sn.id, target: "abide-node-c" });
  });
  if (systemNodes[0]) links.push({ source: systemNodes[0].id, target: "abide-node-a" });

  const getNodeVisuals = (node: any) => {
    if (node.type !== "capability") return { color: node.color, extraLabel: "" };
    const cap = capabilities.find(c => c.id === node.id);
    if (!cap) return { color: node.color, extraLabel: "" };

    let color = node.color;
    let extraLabel = "";

    if (visualizeMode === "status") {
      const state = cap.lifecycleState?.toLowerCase() || "";
      if (state.includes("production")) { color = "#00FF66"; extraLabel = "PROD"; }
      else if (state.includes("simulated")) { color = "#FFAB00"; extraLabel = "SIM"; }
      else { color = "#0A84FF"; extraLabel = "CONCEPT"; }
    } else if (visualizeMode === "cost") {
      const price = cap.pricingModel?.priceFloor || 0;
      if (price === 0) { color = "#00FF66"; extraLabel = "FREE"; }
      else if (price < 0.02) { color = "#00E5FF"; extraLabel = `$${price}`; }
      else if (price < 0.1) { color = "#FFAB00"; extraLabel = `$${price}`; }
      else { color = "#FF4D4D"; extraLabel = `$${price}`; }
    } else if (visualizeMode === "verification") {
      const state = cap.verificationState?.toLowerCase() || "";
      if (state.includes("verified")) { color = "#00FF66"; extraLabel = "SAFE"; }
      else if (state.includes("drift")) { color = "#FF4D4D"; extraLabel = "DRIFT"; }
      else { color = "#6B7280"; extraLabel = "UNVERIFIED"; }
    }

    return { color, extraLabel };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-cos-border pb-3">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-cos-accent" />
          <h3 className="text-xl font-black text-cos-text uppercase tracking-tight">Interactive Blueprint Graph</h3>
        </div>
        <span className="text-[9px] bg-cos-verified/10 text-cos-verified px-2 py-0.5 font-bold border border-cos-verified/30 uppercase tracking-widest rounded-sm">
          Dynamic state trace active
        </span>
      </div>

      <p className="text-xs font-mono text-cos-muted uppercase leading-relaxed max-w-4xl">
        Rendered from the latest blueprint compile. Select an overlay filter to project unit cost, implementation maturity, or ledger audit status onto the physical nodes.
      </p>

      {/* Dynamic Graph Visualizer Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-cos-surface border border-cos-border p-3 rounded-lg text-xs font-mono uppercase">
        <span className="text-cos-muted font-black text-[10px] tracking-wider block">[ Visualization Overlay filter ]</span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "type", label: "Capability Type", desc: "Color by domain, product, capability, or system" },
            { id: "status", label: "Status", desc: "Color by maturity" },
            { id: "cost", label: "Cost", desc: "Highlight by unit pricing tier" },
            { id: "verification", label: "Verification", desc: "Color by certified verification state" }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setVisualizeMode(opt.id as any)}
              className={`px-3 py-1.5 border font-bold transition-all cursor-pointer text-[10px] uppercase tracking-wider rounded-md ${
                visualizeMode === opt.id
                  ? "bg-cos-accent/15 border-cos-accent text-cos-accent font-black shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                  : "bg-black border-cos-border text-cos-muted hover:text-cos-text hover:border-cos-steel/50"
              }`}
              title={opt.desc}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Interactive SVG Canvas */}
        <div className="lg:col-span-8 p-4 bg-cos-bg border border-cos-border relative rounded-xl overflow-hidden h-[460px] shadow-[inset_0_4px_24px_rgba(0,0,0,0.6)]">
          <svg className="w-full h-full" viewBox="0 0 500 440">
            <defs>
              <pattern id="graph-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
              <marker id="arrow" viewBox="0 0 10 10" refX="14" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.2)" />
              </marker>
              <marker id="arrow-dashed" viewBox="0 0 10 10" refX="14" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#FFAB00" />
              </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#graph-grid)" />

            {/* Render Links */}
            {links.map((link, i) => {
              const src = nodes.find(n => n.id === link.source);
              const tgt = nodes.find(n => n.id === link.target);
              if (!src || !tgt) return null;

              const midY = (src.y + tgt.y) / 2;
              const pathData = `M ${src.x} ${src.y} C ${src.x} ${midY}, ${tgt.x} ${midY}, ${tgt.x} ${tgt.y}`;

              const isHoveredNetwork = hoveredNode ? (link.source === hoveredNode || link.target === hoveredNode) : false;
              let opacity = hoveredNode ? (isHoveredNetwork ? "1" : "0.15") : "0.4";
              let strokeColor = isHoveredNetwork ? "#00E5FF" : (link.dashed ? "#FFAB00" : "rgba(255,255,255,0.15)");
              let strokeWidth = isHoveredNetwork ? "2.5" : "1.5";

              return (
                <g key={i} style={{ opacity, transition: "opacity 0.2s" }}>
                  <path
                     d={pathData}
                     fill="none"
                     stroke={strokeColor}
                     strokeWidth={strokeWidth}
                     strokeDasharray={link.dashed ? "4 4" : "0"}
                     markerEnd={link.dashed ? "url(#arrow-dashed)" : "url(#arrow)"}
                  />
                  <circle r={isHoveredNetwork ? "3" : "1.5"} fill={isHoveredNetwork ? "#FFAB00" : "#00E5FF"}>
                    <animateMotion dur={isHoveredNetwork ? "1.5s" : "4s"} repeatCount="indefinite" path={pathData} />
                  </circle>
                </g>
              );
            })}

            {/* Render Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode === node.id;
              const isRelated = hoveredNode ? (hoveredNode === node.id || links.some(l => (l.source === hoveredNode && l.target === node.id) || (l.target === hoveredNode && l.source === node.id))) : false;
              
              let opacity = hoveredNode ? (isRelated ? "1" : "0.3") : "1";
              const { color, extraLabel } = getNodeVisuals(node);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer group"
                  style={{ opacity, transition: "all 0.2s" }}
                >
                  <circle
                    r={node.type === "domain" ? "12" : node.type === "product" ? "10" : "8"}
                    fill={color}
                    stroke={isSelected ? "#FFF" : (isHovered ? "#00E5FF" : "#111827")}
                    strokeWidth="2"
                    className="group-hover:scale-125 transition-transform duration-200"
                  />
                  <circle
                    r={node.type === "domain" ? "16" : "12"}
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    opacity={isSelected || isHovered ? "0.8" : "0.2"}
                    className={isSelected || isHovered ? "animate-ping" : ""}
                    style={{ animationDuration: "3s" }}
                  />
                  <text
                    y="-16"
                    textAnchor="middle"
                    fill={isSelected || isHovered ? "#00E5FF" : "rgba(255,255,255,0.8)"}
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="uppercase select-none transition-colors"
                  >
                    {node.label}
                  </text>
                  {extraLabel && (
                    <g transform="translate(0, 16)">
                      <rect x="-24" y="-6" width="48" height="11" fill="#111827" stroke={color} strokeWidth="0.5" rx="2" />
                      <text textAnchor="middle" fill={color} fontSize="5.5" fontFamily="monospace" fontWeight="black" y="1">
                        {extraLabel}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details Panel */}
        <div className="lg:col-span-4 border border-cos-border bg-cos-surface p-5 flex flex-col justify-between rounded-xl min-h-[400px]">
          {selectedNode ? (
            <div className="space-y-5 text-xs font-mono uppercase">
              <div className="border-b border-cos-border pb-3">
                <span className="text-[9px] text-cos-accent font-black tracking-widest uppercase block">[ NODE ARCHITECTURE DRILLDOWN ]</span>
                <h4 className="text-sm font-black text-cos-text mt-1 uppercase tracking-tight">{selectedNode.label}</h4>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[8px] px-1.5 py-0.5 bg-cos-surface2 border border-cos-border text-cos-muted font-black tracking-widest uppercase rounded-sm">
                    TYPE: {selectedNode.type}
                  </span>
                  {selectedNode.type === "capability" && (() => {
                    const cap = capabilities.find(c => c.id === selectedNode.id);
                    if (!cap) return null;
                    return (
                      <span className="text-[8px] px-1.5 py-0.5 bg-cos-verified/10 text-cos-verified border border-cos-verified/20 font-black uppercase rounded-sm">
                        {cap.lifecycleState || "DRAFT"}
                      </span>
                    );
                  })()}
                </div>
              </div>
              
              <div className="space-y-4">
                {selectedNode.desc && (
                  <div>
                    <span className="text-[10px] text-cos-muted block mb-1">Description</span>
                    <p className="text-[11px] text-cos-text normal-case leading-relaxed">{selectedNode.desc}</p>
                  </div>
                )}
                {selectedNode.details && (
                  <div>
                    <span className="text-[10px] text-cos-muted block mb-1">Purpose / Details</span>
                    <p className="text-[11px] text-cos-text normal-case leading-relaxed">{selectedNode.details}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full flex-col text-cos-muted opacity-50 space-y-3">
              <Globe size={32} />
              <span className="text-[10px] font-mono tracking-widest uppercase">Select a node in the graph</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
