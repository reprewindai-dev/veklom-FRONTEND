import React, { useState, useEffect } from "react";
import { Server, Zap, Cpu, Award, HardDrive, RefreshCw, Layers, TrendingUp, Info } from "lucide-react";

export default function K8sAutoscalingPanel() {
  const [targetLoad, setTargetLoad] = useState(2400); // Requests per second
  const [podsCount, setPodsCount] = useState(3);
  const [cpuUsage, setCpuUsage] = useState(42);
  const [memoryUsage, setMemoryUsage] = useState(54);
  const [unhealthyPods, setUnhealthyPods] = useState(0);
  const [isThrottling, setIsThrottling] = useState(false);
  const [selectedPodIndex, setSelectedPodIndex] = useState<number | null>(0);

  // Simulate Kubernetes HPA Autoscale logic
  useEffect(() => {
    // Calculate desired pods relative to concurrent RPS
    const calculatedPods = Math.min(12, Math.max(2, Math.ceil(targetLoad / 700)));
    
    // Simulate delayed physical server scaling response
    const timer = setTimeout(() => {
      setPodsCount(calculatedPods);
      
      // Calculate realistic cpu load distributed across pods
      const rawCpu = (targetLoad / (calculatedPods * 800)) * 100;
      const roundedCpu = Math.min(100, Math.round(Math.max(10, rawCpu)));
      setCpuUsage(roundedCpu);
      setMemoryUsage(Math.min(100, Math.round(38 + (targetLoad / 140))));
      
      // If CPU exceeds 80%, flag throttling and potential pod congestions
      if (roundedCpu > 80) {
        setIsThrottling(true);
        if (Math.random() > 0.4) {
          setUnhealthyPods(1);
        } else {
          setUnhealthyPods(0);
        }
      } else {
        setIsThrottling(false);
        setUnhealthyPods(0);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [targetLoad]);

  const pods = Array.from({ length: podsCount });

  // Compute thermal indicators based on active workload CPU
  const getWorkloadTheme = (cpu: number) => {
    if (cpu > 80) {
      return {
        bg: "bg-red-950/20 text-red-400 border-red-500/50",
        fanSpeed: "0.2s",
        ledPower: "bg-red-500 animate-ping",
        glowingBar: "bg-red-500",
        stateMsg: "CRITICAL THRESHOLD"
      };
    }
    if (cpu > 55) {
      return {
        bg: "bg-amber-950/15 text-amber-400 border-amber-500/40",
        fanSpeed: "0.4s",
        ledPower: "bg-amber-400 animate-pulse",
        glowingBar: "bg-amber-400",
        stateMsg: "HEAVY INGESTION"
      };
    }
    return {
      bg: "bg-[#0a0f18]/90 text-emerald-400 border-slate-900",
      fanSpeed: "1s",
      ledPower: "bg-emerald-500",
      glowingBar: "bg-emerald-500",
      stateMsg: "OPTIMAL COMMITTED"
    };
  };

  const sysTheme = getWorkloadTheme(cpuUsage);

  return (
    <div id="vnp-k8s-simulation-root" className="grid grid-cols-1 lg:grid-cols-12 gap-7">
      
      {/* Stylesheet injector for hardware animations */}
      <style>{`
        @keyframes fanRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .cooling-fan-svg {
          animation: fanRotate linear infinite;
        }
        .ethernet-flash {
          animation: pulse 0.15s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* LEFT INPUT CONTROLLER: Load spike reactor, stats meters */}
      <div className="lg:col-span-4 bg-[#0b1017] border border-slate-900 rounded-2xl p-5 space-y-5 flex flex-col justify-between">
        
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-mono font-bold uppercase tracking-wider">
            <Zap className="text-amber-500 w-4 h-4 animate-pulse" />
            <span>Load Concurrent Reactor</span>
          </div>

          <h3 className="text-md font-black text-white tracking-tight leading-tight">Kubernetes Cluster Stress Console</h3>
          <p className="text-[11px] text-slate-400 leading-normal">
            Slide the concurrency register below to simulate heavy traffic spikes. The Horizontal Pod Autoscaler (HPA) programmatically spins up additional hardware blades as requests rise.
          </p>

          {/* Interactive Concurrency Slider */}
          <div className="space-y-3 pt-2 bg-slate-950/60 p-4 border border-slate-900 rounded-xl">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">Target Load:</span>
              <span className="text-emerald-400 font-extrabold">{targetLoad.toLocaleString()} req/sec</span>
            </div>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={targetLoad}
              onChange={(e) => setTargetLoad(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[8.5px] text-slate-500 font-mono">
              <span>100 RPS (IDLE)</span>
              <span>10,000 RPS (PEAK HIGH)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Gauges */}
        <div className="bg-[#070a10] p-4 border border-slate-900 rounded-xl space-y-4 font-mono text-[11px]">
          <div className="flex items-center gap-2 text-xs border-b border-slate-900 pb-2.5 text-slate-300 font-bold">
            <Layers className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Prometheus Node Exporter metrics</span>
          </div>

          <div className="space-y-3">
            {/* Avg CPU */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Aggregate Pod CPU:</span>
                <span className={`font-bold ${cpuUsage > 80 ? "text-red-400 animate-pulse" : "text-slate-300"}`}>{cpuUsage}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${cpuUsage > 80 ? "bg-red-500" : "bg-emerald-500"}`} 
                  style={{ width: `${cpuUsage}%` }}
                />
              </div>
            </div>

            {/* Agg Memory */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Shared Memory Footprint:</span>
                <span className="text-slate-300 font-bold">{memoryUsage}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300" 
                  style={{ width: `${memoryUsage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[9.5px] text-slate-500 border-t border-slate-900 pt-2.5">
            <span>Core Auto-Scaling Range:</span>
            <span className="text-slate-300 font-bold">2 to 12 Pods</span>
          </div>
        </div>

      </div>

      {/* RIGHT PANE: HARDWARE CHASSIS SERVER RACK (THE WOW EXPERIENCE!) */}
      <div className="lg:col-span-8 border border-slate-900 bg-slate-950 rounded-2xl p-5 flex flex-col justify-between">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Server className="w-4.5 h-4.5 text-emerald-400" />
              <span>Chassis Blade Rack-mount (SLA Enclosure #A1)</span>
            </h3>
            
            <div className="flex items-center gap-2">
              <span className="text-[8.5px] bg-[#111927] border border-slate-800 text-slate-400 font-bold font-mono px-2.5 py-0.5 rounded">
                Zone: US-EAST-1A
              </span>
              <span className={`text-[8.5px] font-mono border px-2.5 py-0.5 rounded font-black uppercase ${sysTheme.bg}`}>
                {sysTheme.stateMsg}
              </span>
            </div>
          </div>

          {/* Grid of hardware blades */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[310px] overflow-y-auto pr-1">
            {pods.map((_, index) => {
              const podNumber = 101 + index;
              const isSelected = selectedPodIndex === index;
              const isFirstPod = index === 0;
              const isUnhealthy = unhealthyPods > 0 && index === podsCount - 1;
              const podCpu = isUnhealthy ? 96 : Math.round(cpuUsage * (0.9 + (index % 3) * 0.1));
              const podTheme = getWorkloadTheme(podCpu);

              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedPodIndex(index)}
                  className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 relative select-none ${
                    isUnhealthy 
                      ? "bg-red-950/20 border-red-500/50 text-red-300" 
                      : isSelected
                      ? "bg-[#0b1018] border-emerald-500/50 text-slate-300 shadow-md"
                      : "bg-[#0e1420]/50 border-slate-900/80 hover:border-slate-800 text-slate-400"
                  }`}
                >
                  {/* Left Side: Server Blade Ports & Indicators */}
                  <div className="flex items-center gap-3">
                    
                    {/* Small Spinning Cooling Fan Drawing */}
                    <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-900 flex items-center justify-center shrink-0">
                      <svg 
                        viewBox="0 0 24 24" 
                        className="w-5.5 h-5.5 text-slate-500 cooling-fan-svg"
                        style={{ 
                          animationDuration: isUnhealthy ? "0.15s" : podTheme.fanSpeed,
                          color: isUnhealthy ? "#ef4444" : podCpu > 60 ? "#f59e0b" : "#10b981"
                        }}
                      >
                        <path 
                          fill="currentColor" 
                          d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-9.5A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5zm0-2.5a1 1 0 1 1-1 1 1 1 0 0 1 1-1zm0 8a1 1 0 1 1-1 1 1 1 0 0 1 1-1zm-4-4a1 1 0 1 1-1 1 1 1 0 0 1 1-1zm8 0a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"
                        />
                      </svg>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-200">blade-0{podNumber}</span>
                        {isFirstPod && (
                          <span className="text-[7.5px] bg-[#111c2a] border border-slate-800 text-slate-400 rounded px-1 uppercase font-bold font-mono">
                            MASTER
                          </span>
                        )}
                      </div>
                      <div className="font-sans text-[9px] text-slate-500 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-slate-500" />
                        <span>Workload: {isUnhealthy ? "94% LOCK" : `${Math.round(targetLoad / podsCount)} rps`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: LEDs & indicators */}
                  <div className="flex items-center gap-2">
                    <div className="text-right font-mono text-[9px]">
                      <span className={`block font-bold ${podCpu > 75 ? "text-amber-400" : "text-emerald-400"}`}>
                        {podCpu}% CPU
                      </span>
                      <span className="text-slate-600 block text-[8px]">mem: {isUnhealthy ? "91%" : `${Math.round(35 + (index * 2))}%`}</span>
                    </div>

                    {/* Small glowing led points stack */}
                    <div className="flex flex-col gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isUnhealthy ? "bg-red-500 animate-pulse" : podTheme.ledPower}`} title="Power state LED" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" title="Network strobe LED" />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Details sub-panel showing container internals of SELECTED Pod */}
        {selectedPodIndex !== null && selectedPodIndex < podsCount && (
          <div className="mt-4 bg-[#0d131f]/50 p-4 border border-slate-900 rounded-xl space-y-2 font-mono text-[9.5px] text-slate-400 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1">
              <span className="text-slate-200 font-bold uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                Internals log: blade-0{101 + selectedPodIndex}
              </span>
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                IP: 10.244.4.{8 + selectedPodIndex}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <div>Container State: <strong className="text-slate-300">Running (uptime 4h25m)</strong></div>
              <div>Runtime: <strong className="text-[#a78bfa]">Docker / containerd v1.7.2</strong></div>
              <div>Memory Heap Limit: <strong className="text-slate-300">1.28GB of 2.0GB</strong></div>
              <div>K8s Readiness Probe: <strong className="text-emerald-400">✓ PASS (http-get :9918/health)</strong></div>
            </div>
          </div>
        )}

        {/* Microservice specification block */}
        <div className="mt-4 bg-[#0d121b] border border-slate-900 p-3.5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs leading-none">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Kubernetes HorizontalPodAutoscaler Specifications</span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
              Target CPU Utilization configured inside deployment manifest at 75%. Stabilization period set to 60s cooldown to prevent replica thrashing.
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto font-mono text-[9px] shrink-0">
            <span className="bg-slate-950 border border-slate-900 text-slate-400 px-3 py-2 rounded text-center">
              Target: 75% CPU
            </span>
            <span className="bg-slate-950 border border-slate-900 text-slate-400 px-3 py-2 rounded text-center">
              Cooldown: 60s
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
