"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Fingerprint, Coins, ShieldCheck, Scale, AlertTriangle, ArrowRight, Activity, Clock, CheckCircle2 } from "lucide-react";
import { Card, Button } from "@/components/ui";

interface Incident {
  id: string;
  apiName: string;
  region: string;
  uptime: number;
  slashAmount: number;
  status: "open" | "challenged" | "resolved";
  timestamp: string;
}

export default function IncidentReviewPanel() {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "inc_01HXZ...",
      apiName: "OpenAI GPT-4 Turbo",
      region: "us-east-1",
      uptime: 94.2,
      slashAmount: 50.00,
      status: "open",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: "inc_02JBC...",
      apiName: "Anthropic Claude 3",
      region: "eu-west-1",
      uptime: 98.9,
      slashAmount: 50.00,
      status: "challenged",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    }
  ]);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [challengeState, setChallengeState] = useState<"idle" | "voting" | "completed">("idle");
  const [votes, setVotes] = useState({ uphold: 0, reject: 0 });

  // Simulate PGL voting
  useEffect(() => {
    if (challengeState === "voting") {
      const interval = setInterval(() => {
        setVotes(prev => {
          const total = prev.uphold + prev.reject;
          if (total >= 120) {
            clearInterval(interval);
            setTimeout(() => setChallengeState("completed"), 1000);
            return prev;
          }
          // Biased towards upholding the slash for the demo
          if (Math.random() > 0.3) {
            return { ...prev, uphold: prev.uphold + 1 };
          } else {
            return { ...prev, reject: prev.reject + 1 };
          }
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [challengeState]);

  const handleChallenge = () => {
    setChallengeState("voting");
    setVotes({ uphold: 0, reject: 0 });
    setIncidents(incidents.map(inc => 
      inc.id === selectedIncident?.id ? { ...inc, status: "challenged" } : inc
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            Live SLA Incidents & Slashing
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            VNP Treasury auto-enforces a $50 slash when regional uptime drops below 99.5%.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="col-span-1 space-y-4">
          {incidents.map((incident) => (
            <Card 
              key={incident.id}
              className={`cursor-pointer transition-all duration-200 border-l-4 ${
                selectedIncident?.id === incident.id ? 'border-l-blue-500 bg-gray-800' : 
                incident.status === 'open' ? 'border-l-red-500 hover:bg-gray-800' :
                'border-l-yellow-500 hover:bg-gray-800'
              }`}
              onClick={() => {
                setSelectedIncident(incident);
                setChallengeState(incident.status === "challenged" ? "completed" : "idle");
                if (incident.status === "challenged") {
                  setVotes({ uphold: 85, reject: 35 }); // Mock previous vote
                }
              }}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-mono text-gray-400">{incident.id.slice(0, 8)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    incident.status === 'open' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {incident.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-white">{incident.apiName}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    {incident.uptime}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-red-400" />
                    -${incident.slashAmount}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Incident Details & Challenge UI */}
        <div className="col-span-1 lg:col-span-2">
          {selectedIncident ? (
            <Card className="border border-gray-700 h-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedIncident.apiName}</h3>
                    <p className="text-gray-400 flex items-center gap-2 mt-1">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      SLA Breach in Region: <strong className="text-white">{selectedIncident.region}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-mono text-red-400">-${selectedIncident.slashAmount.toFixed(2)}</div>
                    <div className="text-xs text-gray-500 mt-1">Treasury Deduction</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                    <div className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                      <Fingerprint className="w-4 h-4" />
                      Cryptographic Evidence
                    </div>
                    <div className="font-mono text-xs text-green-400 break-all bg-black p-2 rounded">
                      sig_ed25519:a7f8b9...c3d4e5f6<br/>
                      <span className="text-gray-500">Verified by 120 nodes</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                    <div className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4" />
                      Window Metrics
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Uptime:</span>
                        <span className="text-red-400 font-mono">{selectedIncident.uptime}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">P99 Latency:</span>
                        <span className="text-yellow-400 font-mono">1450ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Challenge Section */}
                <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-blue-400" />
                    PGL Dispute Resolution
                  </h4>
                  
                  {challengeState === "idle" && (
                    <>
                      <p className="text-sm text-gray-400 mb-4">
                        As the provider, you can challenge this automated slash. This summons the 120-node Agent Fleet to review the cryptographic telemetry and vote. A 66% supermajority is required to overturn the slash.
                      </p>
                      <Button onClick={handleChallenge} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Challenge Penalty
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  )}

                  {challengeState === "voting" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-400 font-medium animate-pulse">Summoning 120 Agents...</span>
                        <span className="text-gray-400">{votes.uphold + votes.reject} / 120 Voted</span>
                      </div>
                      
                      <div className="h-4 bg-gray-900 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-red-500 transition-all duration-300"
                          style={{ width: `${(votes.uphold / 120) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${(votes.reject / 120) * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Uphold Slash ({votes.uphold})</span>
                        <span>Reject Slash ({votes.reject})</span>
                      </div>
                    </div>
                  )}

                  {challengeState === "completed" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <CheckCircle2 className="w-6 h-6" />
                        <div>
                          <div className="font-semibold">Slash Upheld by Consensus</div>
                          <div className="text-sm opacity-80">{votes.uphold} out of 120 agents verified the SLA breach. Penalty enforced.</div>
                        </div>
                      </div>
                      
                      <div className="h-4 bg-gray-900 rounded-full overflow-hidden flex opacity-50">
                        <div className="h-full bg-red-500" style={{ width: `${(votes.uphold / 120) * 100}%` }} />
                        <div className="h-full bg-green-500" style={{ width: `${(votes.reject / 120) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </Card>
          ) : (
            <Card className="border border-gray-700 h-full flex flex-col items-center justify-center text-center p-12 bg-gray-900/20">
              <ShieldAlert className="w-16 h-16 text-gray-700 mb-4" />
              <h3 className="text-xl font-medium text-gray-400">Select an Incident</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Choose an SLA breach from the list to view cryptographic evidence and initiate the PGL challenge workflow.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
