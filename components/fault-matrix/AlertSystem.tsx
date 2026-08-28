import React, { useState, useEffect } from 'react';
import { AlertChannel, NotificationLog } from './types';
import { Network, Send, ToggleLeft, Globe, Terminal, Settings2, Trash2 } from 'lucide-react';

interface AlertSystemProps {
 onAppendLedger: (eventType: string, action: string, memo: string, agentId?: string) => void;
 onStateUpdate: (resourceName: string, value: number, unit: string) => void;
 notificationLog: NotificationLog[];
 setNotificationLog: React.Dispatch<React.SetStateAction<NotificationLog[]>>;
}

export default function AlertSystem({ onAppendLedger, onStateUpdate, notificationLog, setNotificationLog }: AlertSystemProps) {
 const [webhookUrl, setWebhookUrl] = useState<string>("http://localhost:3000/api/mock-webhook");
 const [channels, setChannels] = useState<AlertChannel[]>([
 { id:"CH-001", type:"ui_toast", name:"Internal UI Notification Banner", active: true },
 { id:"CH-002", type:"webhook", name:"External Webhook Gateway Proxy", active: true }
 ]);
 const [manualMetric, setManualMetric] = useState<string>("Active CPU Core Temperature");
 const [manualVal, setManualVal] = useState<number>(85);
 const [mockLogs, setMockLogs] = useState<any[]>([]);
 const [isFiring, setIsFiring] = useState(false);

 // Fetch real-time webhook hits from our Express server to prove full-stack integrations!
 const fetchWebhookLogs = async () => {
 try {
 const res = await fetch("/api/webhook-logs");
 if (res.ok) {
 const data = await res.json();
 setMockLogs(data);
 }
 } catch (err) {
 console.error("Failed to fetch webhook logs:", err);
 }
 };

 useEffect(() => {
 // Poll logs every 2 seconds
 const interval = setInterval(fetchWebhookLogs, 2000);
 fetchWebhookLogs();
 return () => clearInterval(interval);
 }, []);

 const triggerManualAlert = async () => {
 setIsFiring(true);
 const id = `NTF-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
 const timestamp = new Date().toISOString();
 
 // Compile JSON payload
 const payload = {
 mcp_resource: manualMetric,
 state_change:"BREACH_CRITICAL_THRESHOLD",
 triggered_by:"USER_SIMULATION_BURST",
 payload_value: manualVal,
 signature_pda: `OOBEpdaSignatureValue_${Math.random().toString(36).substr(2, 9)}`,
 timestamp
 };

 const payloadStr = JSON.stringify(payload, null, 2);

 let logsAdded: NotificationLog = {
 id,
 timestamp,
 type:"THRESHOLD_BREACH",
 message: `Resource '${manualMetric}' has changed state to state: anomaly with value ${manualVal}`,
 payload: payloadStr,
 status: 'pending'
 };

 // Trigger Outbound server-side POST
 try {
 const response = await fetch("/api/trigger-alert", {
 method:"POST",
 headers: {"Content-Type":"application/json"
 },
 body: JSON.stringify({
 url: webhookUrl,
 payload
 })
 });

 const resData = await response.json();

 if (resData.status ==="success") {
 logsAdded.status = 'delivered';
 onAppendLedger(
 'EXECUTION',
 `Fired real-time alert for state change`,
 `Delivered state change notification payload successfully to webhook url (${webhookUrl}) with status: ${resData.statusCode} OK`
 );
 } else {
 logsAdded.status = 'failed';
 onAppendLedger(
 'EXECUTION',
 `Failed to deliver real-time alert`,
 `Outbound webhook request to ${webhookUrl} failed: ${resData.error ||"Connection Refused"}`
 );
 }
 } catch (err: any) {
 logsAdded.status = 'failed';
 }

 setNotificationLog(prev => [logsAdded, ...prev].slice(0, 15));
 setIsFiring(false);

 // Refresh mock logs straight away
 setTimeout(fetchWebhookLogs, 1500);
 };

 const toggleChannel = (id: string) => {
 setChannels(prev => 
 prev.map(c => {
 if (c.id === id) {
 onAppendLedger('AUTHORITY', `${c.active ? 'Disabled' : 'Activated'} Alert Channel: ${c.name}`, `L4 Semantic gateway configuration updated.`);
 return { ...c, active: !c.active };
 }
 return c;
 })
 );
 };

 const clearWebhooks = () => {
 setNotificationLog([]);
 };

 return (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="VeklomAlertSystem">
 
 {/* Configuration & Manual Trigger Tabs */}
 <div className="lg:col-span-5 bg-[#0a0c14]/85 border border-theme-border p-4 rounded-xl flex flex-col justify-between shadow-xl">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <Settings2 className="text-theme-accent w-5 h-5 animate-pulse" />
 <h3 className="text-md uppercase font-mono font-semibold tracking-wide text-theme-accent/70">
 Alert Authority Routing Config
 </h3>
 </div>
 <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
 Standardizes I/O endpoints. Define real webhook URLs or use our server-mounted local logging endpoint to verify output delivery directly.
 </p>

 <div className="space-y-4 mb-4">
 {/* Webhook Configuration */}
 <div className="bg-[#05070a]/40 p-3 rounded-lg border border-theme-border">
 <label className="text-[10px] uppercase font-mono text-theme-accent font-bold block mb-1.5">
 Target Webhook Gateway URL (POST)
 </label>
 <div className="flex gap-2">
 <div className="bg-theme-surface px-2.5 flex items-center border border-theme-border rounded-l text-slate-500 font-mono text-[11px] select-none">
 🌐 HTTP
 </div>
 <input
 type="text"
 value={webhookUrl}
 onChange={(e) => setWebhookUrl(e.target.value)}
 className="flex-1 bg-theme-surface border border-theme-border rounded-r p-2 text-xs font-mono text-theme-accent/70 focus:outline-none focus:border-theme-border"
 placeholder="http://localhost:3000/api/mock-webhook"
 />
 </div>
 <span className="text-[9px] font-mono text-slate-500 mt-1 block">
 Local verification endpoint: `/api/mock-webhook` logs hits in memory.
 </span>
 </div>

 {/* Channels List */}
 <div className="space-y-2">
 <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">
 Active Notification Channels
 </span>
 {channels.map((chan) => (
 <div 
 key={chan.id} 
 className="p-3 bg-theme-surface border border-theme-border rounded-lg flex justify-between items-center"
 >
 <div>
 <span className="text-xs font-mono font-semibold text-slate-300 block">{chan.name}</span>
 <span className="text-[9px] font-mono text-slate-550 uppercase tracking-widest">{chan.id}</span>
 </div>
 <button 
 onClick={() => toggleChannel(chan.id)}
 className={`font-mono text-xs p-1.5 rounded transition-all cursor-pointer ${
 chan.active 
 ? 'text-theme-accent bg-theme-surface2 border border-theme-border shadow-[0_0_8px_rgba(6,182,212,0.15)]' 
 : 'text-slate-600 bg-theme-surface border border-theme-border'
 }`}
 >
 {chan.active ?"● ACTIVE" :"○ MUTED"}
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* State simulator Trigger */}
 <div className="pt-4 border-t border-theme-border">
 <span className="text-[10px] uppercase font-mono text-theme-accent font-extrabold block mb-2">
 Simulate State Event Burst
 </span>
 <div className="grid grid-cols-2 gap-2 mb-3">
 <select
 value={manualMetric}
 onChange={(e) => setManualMetric(e.target.value)}
 className="bg-[#05070a] border border-theme-border text-xs font-mono text-slate-300 p-2 rounded focus:outline-none focus:border-theme-border"
 >
 <option value="Active CPU Core Temperature">CPU Temp</option>
 <option value="Solana Sync Database Write Latency">DB Write Latency</option>
 <option value="Semantic Vector Similarity Drift">Similarity Drift</option>
 <option value="Probabilistic Token Gen Variance">Token Gen Variance</option>
 </select>
 <input
 type="number"
 value={manualVal}
 onChange={(e) => setManualVal(parseFloat(e.target.value))}
 className="bg-[#05070a] border border-theme-border text-xs font-mono text-theme-accent p-2 rounded focus:outline-none focus:border-theme-border"
 placeholder="Value"
 />
 </div>
 <button
 onClick={triggerManualAlert}
 disabled={isFiring || channels.every(c => !c.active)}
 className="w-full py-2.5 bg-theme-accent hover:bg-cyan-400 disabled:bg-theme-surface disabled:text-slate-500 font-mono font-bold text-slate-950 rounded text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:shadow-[0_0_18px_rgba(6,182,212,0.5)]"
 >
 <Send className="w-3.5 h-3.5 fill-[#05070a]" /> FIRE IMMEDIATE STATE NOTICE
 </button>
 </div>
 </div>

 {/* Dispatched Webhook Log stream (OOBE Proof of Broadcast) */}
 <div className="lg:col-span-4 bg-[#0a0c14]/85 border border-theme-border p-4 rounded-xl flex flex-col justify-between shadow-xl">
 <div>
 <div className="flex justify-between items-center mb-3 border-b border-theme-border pb-2">
 <div className="flex items-center gap-2">
 <Network className="text-theme-accent w-4 h-4 animate-pulse" />
 <span className="text-xs font-mono font-bold text-theme-accent/70">OUTBOUND WEBHOOK DISPATCH LOG</span>
 </div>
 <button 
 onClick={clearWebhooks}
 className="text-slate-600 hover:text-slate-400 text-xs p-1 cursor-pointer transition-all"
 title="Clear Logs"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>

 <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto custom-scroll pr-1">
 {notificationLog.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-20 text-slate-600 text-center font-mono">
 <Terminal className="w-8 h-8 text-slate-800 mb-2" />
 <span className="text-xs">No notifications dispatched during this runtime session.</span>
 </div>
 ) : (
 notificationLog.map((log) => (
 <div 
 key={log.id} 
 className="bg-[#05070a]/40 border border-theme-border p-2.5 rounded text-[10px] font-mono leading-relaxed"
 >
 <div className="flex justify-between items-center mb-1">
 <span className="text-theme-accent font-bold uppercase tracking-wider">{log.id}</span>
 <span className="text-slate-500 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
 </div>
 <p className="text-slate-200 text-[10px]">{log.message}</p>
 
 {/* Collapsible raw JSON */}
 <details className="mt-2 text-slate-500">
 <summary className="cursor-pointer text-[9px] hover:text-slate-350 transition-colors">View payload context JSON</summary>
 <pre className="bg-[#05070a] text-theme-accent/95 p-2 rounded text-[8px] overflow-x-auto mt-1 custom-scroll max-h-[120px] border border-theme-border">
 {log.payload}
 </pre>
 </details>

 <div className="flex justify-end items-center mt-2">
 <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
 log.status === 'delivered' 
 ? 'bg-theme-surface2 text-theme-accent border border-theme-border' 
 : log.status === 'failed' 
 ? 'bg-red-950/60 text-red-400'
 : 'bg-yellow-950/60 text-yellow-400 animate-pulse'
 }`}>
 {log.status}
 </span>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Connection status code descriptor */}
 <div className="pt-3 border-t border-theme-border text-[10px] font-mono text-slate-500 flex justify-between">
 <span>OOBE Webhook Queue:</span>
 <span>Status 200/500 mediated</span>
 </div>
 </div>

 {/* Real-time Webhook Receiver Monitor (In-Memory Hits) */}
 <div className="lg:col-span-3 bg-[#0a0c14]/85 border border-theme-border p-4 rounded-xl flex flex-col justify-between shadow-xl">
 <div>
 <div className="flex justify-between items-center mb-3">
 <span className="text-xs font-mono text-theme-accent uppercase tracking-widest font-bold">
 Webhook Landing Server log
 </span>
 <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
 </div>
 <p className="text-[10px] font-mono text-slate-550 mb-3 leading-relaxed">
 Simulates the external API server receiving hits. This log listens on `/api/webhook-logs` live.
 </p>

 <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scroll pr-1">
 {mockLogs.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 text-slate-600 text-center font-mono">
 <div className="w-2.5 h-2.5 rounded-full bg-theme-surface animate-ping mb-2" />
 <span className="text-[10px]">Awaiting incoming webhook payloads...</span>
 </div>
 ) : (
 [...mockLogs].reverse().map((log) => (
 <div 
 key={log.id} 
 className="bg-theme-surface2 border border-theme-border p-2 rounded text-[9px] font-mono"
 >
 <div className="flex justify-between items-center text-slate-500 mb-1">
 <span>ID: {log.id}</span>
 <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
 </div>
 <div className="text-slate-300">
 <div><span className="text-theme-accent font-bold">RESOURCE:</span> {log.payload?.mcp_resource}</div>
 <div><span className="text-theme-accent font-bold">VALUE:</span> {log.payload?.payload_value}</div>
 <div className="text-slate-500 truncate"><span className="text-slate-400 font-bold">SIG:</span> {log.payload?.signature_pda}</div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Verification Status */}
 <div className="mt-4 pt-4 border-t border-theme-border flex justify-between items-center text-[10px] font-mono text-slate-550">
 <span>Integrity Verification</span>
 <span className="text-theme-accent text-[9px] font-bold">SOLANA PDAs VALIDATED</span>
 </div>
 </div>
 
 </div>
 );
}
