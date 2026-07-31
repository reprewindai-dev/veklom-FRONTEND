import React, { useEffect, useRef, useState } from 'react';
import { TerminalEvent, VerifiedFinding } from '../types';
import { 
  Terminal, 
  Database, 
  Activity, 
  Search,
  FileText,
  FileCode,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface TerminalTraceProps {
  events: TerminalEvent[];
  isScanning: boolean;
  dbPoolCount: number;
  scannedFilesList?: string[];
  currentStepIndex?: number;
  findings?: VerifiedFinding[];
  runId?: string;
  hideMatrixMonitor?: boolean;
}

export const TerminalTrace: React.FC<TerminalTraceProps> = ({ 
  events, 
  isScanning, 
  dbPoolCount,
  scannedFilesList = [],
  currentStepIndex = -1,
  findings = [],
  runId = 'N/A',
  hideMatrixMonitor = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [terminalHeight, setTerminalHeight] = useState<number>(450);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Auto-scroll logic as new events are streamed or filter/search query changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events, selectedLevelFilter, searchQuery, isScanning]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startYRef.current;
      const newHeight = Math.max(250, Math.min(1200, startHeightRef.current + deltaY));
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = terminalHeight;
  };

  const getLogLevel = (evt: TerminalEvent): 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' => {
    if (evt.log_level) return evt.log_level;
    
    // Fallback logic to determine log level dynamically
    if (evt.policy_result === 'blocked_env_boundary' || evt.event_type === 'file.access.blocked') {
      return 'CRITICAL';
    }
    if (evt.event_type === 'policy.gate.triggered' || evt.policy_result === 'escalate_to_security' || evt.policy_result === 'human_approval_required') {
      return 'ERROR';
    }
    if (evt.event_type === 'git.tree.warning' || evt.event_type === 'finding.alert') {
      return 'WARN';
    }
    return 'INFO';
  };

  const getFileIcon = (path: string) => {
    const lower = path.toLowerCase();
    if (lower.includes('env') || lower.includes('.env')) return <Settings className="w-3.5 h-3.5 text-yellow-500" />;
    if (lower.includes('deploy') || lower.includes('k8s') || lower.includes('.yaml') || lower.includes('.yml')) return <Settings className="w-3.5 h-3.5 text-cyan-400" />;
    if (lower.includes('db/') || lower.includes('.sql') || lower.includes('schema')) return <Database className="w-3.5 h-3.5 text-indigo-400" />;
    if (lower.includes('.tsx') || lower.includes('.ts') || lower.includes('.js')) return <FileCode className="w-3.5 h-3.5 text-[#00FF41]" />;
    return <FileText className="w-3.5 h-3.5 text-gray-500" />;
  };

  const filteredEvents = events.filter(e => {
    if (selectedLevelFilter !== 'ALL' && getLogLevel(e) !== selectedLevelFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const messageMatches = e.message?.toLowerCase().includes(query);
      const targetMatches = e.target?.toLowerCase().includes(query);
      return messageMatches || targetMatches;
    }
    return true;
  });

  return (
    <div className="w-full flex flex-col flex-1 min-h-[350px] md:min-h-[450px] bg-[#050505] border-t md:border-t-0 border-[#333]">
      {/* Terminal Title Bar */}
      <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222] gap-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#666]" />
          <h2 className="font-mono text-[11px] tracking-widest text-[#666] uppercase">01 / Terminal Trace</h2>
        </div>
        <div className="flex items-center justify-between sm:justify-end space-x-4">
          <span className="flex items-center text-[10px] text-[#00FF41] font-mono tracking-wider">
            <span className="w-2 h-2 bg-[#00FF41] rounded-full mr-2 animate-pulse"></span>
            AXUM_ROUTER_ACTIVE
          </span>
          <span className="flex items-center text-[10px] text-[#999] font-mono tracking-wider space-x-1">
            <Database className="w-3 h-3 text-[#666]" />
            <span>POSTGRES: {dbPoolCount}/15</span>
          </span>
        </div>
      </div>

      {/* Dynamic Log Level Diagnostic / Filter Bar */}
      <div className="px-4 md:px-5 py-2.5 bg-[#080808] border-b border-[#222] flex flex-col lg:flex-row lg:items-center justify-between text-[11px] font-mono select-none gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[#666] uppercase text-[9px] tracking-wider font-bold shrink-0">Filter Levels:</span>
          <div className="flex flex-wrap items-center gap-1">
            {(['ALL', 'INFO', 'WARN', 'ERROR', 'CRITICAL'] as const).map((level) => {
              const count = level === 'ALL' 
                ? events.filter(e => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return e.message?.toLowerCase().includes(query) || e.target?.toLowerCase().includes(query);
                  }).length 
                : events.filter(e => {
                    if (getLogLevel(e) !== level) return false;
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return e.message?.toLowerCase().includes(query) || e.target?.toLowerCase().includes(query);
                  }).length;
              
              const isSelected = selectedLevelFilter === level;
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevelFilter(level)}
                  className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected 
                      ? level === 'ALL' ? 'border-white text-white bg-white/5 font-bold'
                        : level === 'INFO' ? 'border-[#00FF41]/60 text-[#00FF41] bg-[#00FF41]/5 font-bold'
                        : level === 'WARN' ? 'border-[#FF6B00]/60 text-[#FF6B00] bg-[#FF6B00]/5 font-bold'
                        : level === 'ERROR' ? 'border-red-500/60 text-red-500 bg-red-500/5 font-bold'
                        : 'border-[#FF007F] text-[#FF007F] bg-[#FF007F]/15 font-black animate-pulse'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#111]'
                  }`}
                >
                  {level} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-4 text-[9px] text-[#555] uppercase tracking-widest font-bold">
          <span>Active Context: global_registry_gate</span>
        </div>
      </div>

      {/* Real-Time Terminal Search Bar */}
      <div className="px-4 md:px-5 py-2.5 bg-[#0A0A0A] border-b border-[#222] flex items-center gap-3">
        <Search className="w-3.5 h-3.5 text-[#555] shrink-0" />
        <input
          type="text"
          placeholder="SEARCH LOGS BY EVENT MESSAGE OR TARGET PATH..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-0 outline-none text-[10px] sm:text-[11px] font-mono text-[#00FF41] placeholder-neutral-700 w-full focus:ring-0 focus:outline-none uppercase tracking-wider font-bold"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[9px] font-mono text-[#FF6B00] hover:text-[#ff8533] uppercase tracking-widest px-2 py-0.5 border border-[#FF6B00]/30 hover:border-[#FF6B00]/60 bg-[#FF6B00]/5 transition-colors cursor-pointer select-none"
          >
            Clear
          </button>
        )}
      </div>

      {/* Visual Live Gate-Sweep Matrix Monitor */}
      {scannedFilesList && scannedFilesList.length > 0 && !hideMatrixMonitor && (
        <div className="hidden md:block px-4 md:px-5 py-3.5 bg-[#080808] border-b border-[#222]">
          <div className="flex items-center justify-between mb-2 md:mb-3 select-none">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#666] uppercase flex items-center space-x-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-amber-400 animate-ping' : events.length > 0 ? 'bg-[#00FF41]' : 'bg-gray-700'}`}></span>
              <span>Matrix Monitor: [File Tree Sweep Index]</span>
            </span>
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
              State: <span className="font-bold text-[#FF6B00]">{isScanning ? 'SWEEPING' : events.length > 0 ? 'SEALED' : 'READY'}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 max-h-[145px] overflow-y-auto pr-1">
            {scannedFilesList.map((path, idx) => {
              // Core scanning steps start from currentStepIndex = 3 (Step 0, 1, 2 are setup/initialization steps).
              const fileIndex = currentStepIndex - 3;
              const isCurrent = isScanning && idx === fileIndex;
              const isPast = (currentStepIndex === -1 && events.length > 0) || (currentStepIndex - 3 > idx);
              const pathFinding = findings.find(f => f.path === path);
              const hasFailure = !!pathFinding;

              let cellStyle = "border border-neutral-900 bg-[#070707] text-gray-500";
              let statusLabel = "QUEUED";
              let statusDot = <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />;

              if (isCurrent) {
                cellStyle = "border-[#FF6B00]/80 bg-[#FF6B00]/10 text-[#FF6B00] shadow-[0_0_8px_rgba(255,107,0,0.15)] animate-pulse font-bold";
                statusLabel = "SCANNING";
                statusDot = <Loader2 className="w-2.5 h-2.5 text-[#FF6B00] animate-spin" />;
              } else if (isPast) {
                if (hasFailure) {
                  cellStyle = "border-red-500/40 bg-red-950/20 text-red-400 font-bold";
                  statusLabel = "TRIGGERED";
                  statusDot = <AlertCircle className="w-2.5 h-2.5 text-red-500" />;
                } else {
                  cellStyle = "border-neutral-800 bg-[#090909]/60 text-emerald-500/80";
                  statusLabel = "PASSED";
                  statusDot = <CheckCircle className="w-2.5 h-2.5 text-[#00FF41]" />;
                }
              }

              const filename = path.split('/').pop() || path;

              return (
                <div 
                  key={path}
                  className={`p-2 transition-all duration-300 flex flex-col justify-between h-[52px] ${cellStyle}`}
                  title={`Path: ${path}\nStatus: ${statusLabel}`}
                >
                  <div className="flex items-center justify-between gap-1 overflow-hidden">
                    <span className="truncate text-[10px] tracking-tight">{filename}</span>
                    <span className="shrink-0">{getFileIcon(path)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-wider text-gray-600 mt-1">
                    <span className="truncate select-none">{statusLabel}</span>
                    {statusDot}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Terminal Logs View */}
      <div 
        ref={containerRef}
        id="terminal-container"
        className="flex-1 p-[14px] sm:p-5 md:p-6 font-mono text-xs md:text-[13px] leading-relaxed text-[#00FF41] overflow-y-auto space-y-2 select-text scrollbar-thin scrollbar-thumb-[#333]"
        style={{ height: `${terminalHeight}px` }}
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Activity className="w-8 h-8 text-[#222] mb-3 animate-pulse" />
            <span className="text-[#333] text-[11px] uppercase tracking-widest">// Awaiting scan start or operator review authorization</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Activity className="w-8 h-8 text-[#1E1E1E] mb-3 animate-pulse" />
            <span className="text-[#555] text-[11px] uppercase tracking-widest">// Zero telemetry lines found for current priority filter: {selectedLevelFilter}</span>
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const level = getLogLevel(evt);
            return (
              <div 
                key={evt.id || idx} 
                className="flex flex-col sm:flex-row sm:items-center py-1 px-2 hover:bg-[#111]/60 transition-colors rounded gap-1.5 sm:gap-2 animate-[fadeIn_0.15s_ease-out] group border-l-2 border-transparent hover:border-neutral-800"
              >
                {/* Timestamp & Type Badge Context info */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-gray-600 select-none text-[10px] font-mono whitespace-nowrap">
                    [{evt.timestamp.split('T')[1]?.slice(0, 8) || '00:00:00'}]
                  </span>
                  
                  {/* Dynamic Diagnostic Level Badge */}
                  <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest rounded border ${
                    level === 'INFO' ? 'bg-neutral-900 border-neutral-800/80 text-gray-400'
                    : level === 'WARN' ? 'bg-[#FF6B00]/10 border-[#FF6B00]/30 text-[#FF6B00] font-bold'
                    : level === 'ERROR' ? 'bg-red-500/10 border-red-500/30 text-red-400 font-extrabold'
                    : 'bg-pink-500/10 border-pink-500/40 text-pink-400 font-black animate-pulse'
                  }`}>
                    {level}
                  </span>

                  <span className="text-gray-500 group-hover:text-gray-400 text-[10px] uppercase font-mono max-w-[85px] truncate font-bold">
                    {evt.event_type}
                  </span>
                </div>

                {/* Message body with level-coded coloring */}
                <div className="flex-1 min-w-0 sm:pl-1 flex flex-wrap items-center">
                  <span className={`break-words ${
                    level === 'INFO' ? 'text-gray-300 font-normal'
                    : level === 'WARN' ? 'text-[#FF6B00] font-semibold'
                    : level === 'ERROR' ? 'text-red-400 font-bold'
                    : 'text-pink-500 font-extrabold shadow-pink-500/10 tracking-wide'
                  }`}>
                    {evt.message}
                  </span>

                  {evt.target && (
                    <span className="text-neutral-500 text-[10px] sm:text-[11px] ml-2 italic whitespace-normal font-mono group-hover:text-neutral-400 transition-colors">
                      ({evt.target})
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Floating animated loading line */}
        {isScanning && (
          <div className="flex items-center text-white text-[11px] space-x-1 pl-1 pt-2">
            <span className="animate-spin text-[#FF6B00]">✦</span>
            <span className="font-mono text-[#FF6B00] tracking-wider uppercase animate-pulse">Scanning file tree components...</span>
          </div>
        )}

        {/* Blinking block cursor */}
        {events.length > 0 && (
          <div className="pt-2 pl-1 flex items-center">
            <span className="w-2 h-4 bg-[#00FF41] animate-ping" style={{ animationDuration: '1s' }}></span>
          </div>
        )}
      </div>

      {/* Draggable bottom splitter / resize handle with corner triangle */}
      <div 
        onMouseDown={handleMouseDown}
        className={`h-5 border-t border-[#222] bg-[#080808] flex items-center justify-between px-4 select-none cursor-ns-resize transition-all duration-200 group relative ${
          isDragging ? 'bg-[#FF6B00]/10 border-[#FF6B00]/30 shadow-[inset_0_1px_0_rgba(255,107,0,0.1)]' : 'hover:bg-[#111]'
        }`}
        title="Drag up or down to resize terminal"
      >
        {/* Left diagnostic / instruction label */}
        <div className="flex items-center space-x-2 font-mono text-[9px] text-[#444] group-hover:text-[#FF6B00]/80 transition-colors uppercase font-bold">
          <span className={`${isDragging ? 'text-[#FF6B00]' : ''}`}>H: {terminalHeight}PX</span>
          <span className="opacity-30">|</span>
          <span>DRAG SPLITTER TO RESIZE PANEL</span>
        </div>

        {/* Center tactile grab dots */}
        <div className="flex space-x-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <span className={`w-1 h-1 rounded-full transition-colors duration-200 ${isDragging ? 'bg-[#FF6B00]' : 'bg-[#333] group-hover:bg-[#555]'}`}></span>
          <span className={`w-1 h-1 rounded-full transition-colors duration-200 ${isDragging ? 'bg-[#FF6B00]' : 'bg-[#333] group-hover:bg-[#555]'}`}></span>
          <span className={`w-1 h-1 rounded-full transition-colors duration-200 ${isDragging ? 'bg-[#FF6B00]' : 'bg-[#333] group-hover:bg-[#555]'}`}></span>
          <span className={`w-1 h-1 rounded-full transition-colors duration-200 ${isDragging ? 'bg-[#FF6B00]' : 'bg-[#333] group-hover:bg-[#555]'}`}></span>
          <span className={`w-1 h-1 rounded-full transition-colors duration-200 ${isDragging ? 'bg-[#FF6B00]' : 'bg-[#333] group-hover:bg-[#555]'}`}></span>
        </div>

        {/* Right Corner Resize Triangle */}
        <div className="flex items-center justify-end w-4 h-4 cursor-se-resize">
          <svg 
            className={`w-3 h-3 transition-colors duration-200 ${isDragging ? 'text-[#FF6B00]' : 'text-[#333] group-hover:text-[#FF6B00]'}`} 
            viewBox="0 0 10 10" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.75"
          >
            <line x1="8" y1="2" x2="2" y2="8" />
            <line x1="8" y1="5" x2="5" y2="8" />
          </svg>
        </div>
      </div>
    </div>
  );
};
