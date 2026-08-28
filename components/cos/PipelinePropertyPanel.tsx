import React from 'react';

interface PipelinePropertyPanelProps {
 selectedNode: any;
}

export default function PipelinePropertyPanel({ selectedNode }: PipelinePropertyPanelProps) {
 if (!selectedNode) {
 return (
 <div className="h-full flex items-center justify-center p-6 border-l border-cos-border bg-cos-bg">
 <span className="text-[10px] font-mono tracking-widest text-cos-muted uppercase text-center">
 Select a pipeline node to view execution policies and properties
 </span>
 </div>
 );
 }

 const { data } = selectedNode;
 const config = data?.config || {};

 return (
 <div className="h-full border-l border-cos-border bg-cos-surface flex flex-col">
 <div className="p-4 border-b border-cos-border bg-cos-surface2">
 <span className="text-[9px] text-cos-accent font-black tracking-widest uppercase block mb-1">
 [ PIPELINE NODE INSPECTOR ]
 </span>
 <h3 className="text-sm font-black text-cos-text uppercase tracking-tight">
 {data.label || data.node_type ||"Unknown Node"}
 </h3>
 <div className="flex gap-2 mt-2">
 <span className="text-[8px] bg-cos-bg border border-cos-border text-cos-muted px-1.5 py-0.5 rounded-sm uppercase tracking-widest font-black">
 TYPE: {data.node_type ||"N/A"}
 </span>
 <span className={`text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-widest font-black border ${
 data.status === 'success' ? 'bg-cos-verified/10 text-cos-verified border-cos-verified/30' :
 data.status === 'failure' ? 'bg-cos-danger/10 text-cos-danger border-cos-danger/30' :
 data.status === 'running' ? 'bg-cos-accent/10 text-cos-accent border-cos-accent/30' :
 'bg-cos-bg text-cos-muted border-cos-border'
 }`}>
 STATE: {data.status ||"IDLE"}
 </span>
 </div>
 </div>

 <div className="p-4 flex-1 overflow-y-auto space-y-4">
 {Object.keys(config).length === 0 ? (
 <div className="text-[10px] font-mono text-cos-muted uppercase tracking-wider">
 No properties configured for this node.
 </div>
 ) : (
 Object.entries(config).map(([key, value]) => (
 <div key={key} className="space-y-1">
 <label className="text-[9px] font-black text-cos-muted tracking-widest uppercase block">
 {key}
 </label>
 {typeof value === 'object' ? (
 <div className="bg-cos-bg border border-cos-border p-2 rounded-md font-mono text-[10px] text-cos-text whitespace-pre-wrap">
 {JSON.stringify(value, null, 2)}
 </div>
 ) : (
 <div className="bg-cos-bg border border-cos-border p-2 rounded-md font-mono text-[10px] text-cos-text">
 {String(value)}
 </div>
 )}
 </div>
 ))
 )}
 </div>

 <div className="p-4 border-t border-cos-border bg-cos-surface2">
 <button className="w-full bg-cos-accent/10 hover:bg-cos-accent/20 text-cos-accent border border-cos-accent/30 transition-colors py-2 rounded-md text-[10px] font-black tracking-widest uppercase">
 Override Policy
 </button>
 </div>
 </div>
 );
}
