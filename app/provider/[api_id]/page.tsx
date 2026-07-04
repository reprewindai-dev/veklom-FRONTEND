'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '@/lib/api';
const Card = ({children, className}: any) => <div className={`border rounded-lg p-4 bg-zinc-900 ${className}`}>{children}</div>;
const CardHeader = ({children, className}: any) => <div className={`mb-4 ${className}`}>{children}</div>;
const CardTitle = ({children, className}: any) => <h3 className={`text-xl font-bold ${className}`}>{children}</h3>;
const CardDescription = ({children, className}: any) => <p className={`text-sm text-zinc-400 ${className}`}>{children}</p>;
const CardContent = ({children, className}: any) => <div className={className}>{children}</div>;
const Button = ({children, className, ...props}: any) => <button className={`px-4 py-2 rounded-md font-medium flex items-center justify-center ${className}`} {...props}>{children}</button>;
const Alert = ({children, className}: any) => <div className={`p-4 rounded-md border ${className}`}>{children}</div>;
const AlertTitle = ({children, className}: any) => <h4 className={`font-bold mb-1 ${className}`}>{children}</h4>;
const AlertDescription = ({children, className}: any) => <div className={`text-sm ${className}`}>{children}</div>;
import { Terminal, Shield, Activity, Clock, Zap } from 'lucide-react';

interface ScoreData {
  api_id: string;
  region: string;
  score: number;
  p99: number;
  uptime: number;
  measured_at: string;
}

export default function ProviderDashboard({ params }: { params: Promise<{ api_id: string }> }) {
  const resolvedParams = React.use(params);
  const [data, setData] = useState<any>(null);
  const [liveScore, setLiveScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/benchmarks/leaderboard');
        const item = response.find((r: any) => r.id === resolvedParams.api_id);
        if (!item) {
          setError('API not found in VNP Registry');
        } else {
          setData(item);
          setLiveScore(item.govScore);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch provider data');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [resolvedParams.api_id]);

  // Real-time SSE Connection
  useEffect(() => {
    // Only connect SSE if we have initial data
    if (!data) return;

    // Use absolute URL to backend to avoid Next.js rewriting proxy issues with SSE
    // Fallback to local if env is missing
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088';
    const sse = new EventSource(`${backendUrl}/api/v1/benchmarks/stream`);

    sse.addEventListener('score_update', (event) => {
      try {
        const payload: ScoreData = JSON.parse(event.data);
        // Only update if it matches our API
        if (payload.api_id === resolvedParams.api_id) {
          setLiveScore(payload.score);
          
          // Optionally push to a history array for the line chart here
        }
      } catch (e) {
        console.error("Error parsing SSE data", e);
      }
    });

    sse.onerror = (err) => {
      console.error("SSE connection error", err);
      // EventSource auto-reconnects, but we can log it.
    };

    return () => {
      sse.close();
    };
  }, [data, resolvedParams.api_id]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="h-12 w-12 text-orange-500 mb-4" />
          <p>Loading VNP Telemetry for {resolvedParams.api_id}...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Alert variant="destructive" className="max-w-md bg-zinc-900 border-red-900 text-white">
          <Shield className="h-4 w-4 text-red-500" />
          <AlertTitle>VNP Sinkhole</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Mock Radar Data from seeds since we don't have all dimensions in the db yet
  const radarData = [
    { dimension: 'p99 Latency', score: data.p99 < 50 ? 95 : 60 },
    { dimension: 'Uptime', score: data.uptime24h },
    { dimension: 'Compliance', score: data.complianceLabels.length * 30 },
    { dimension: 'Drift', score: 100 - (data.drift * 1000) },
    { dimension: 'Security', score: data.govScore },
    { dimension: 'DevEx', score: data.devScore },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase flex items-center gap-3">
              <Terminal className="text-orange-500" />
              {data.name}
            </h1>
            <p className="text-zinc-500 mt-2 font-mono text-sm">{resolvedParams.api_id}</p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              LIVE TELEMETRY
            </div>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Composite Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-orange-500">
                {liveScore.toFixed(1)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Real-time Trust Index</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">p99 Latency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold flex items-baseline gap-1">
                {data.p99.toFixed(0)} <span className="text-sm font-normal text-zinc-500">ms</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Global edge average</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">24h Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold flex items-baseline gap-1 text-green-400">
                {data.uptime24h.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Throughput</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold flex items-baseline gap-1">
                {(data.throughput / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-zinc-500 mt-1">req / sec</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Dimensional Scoring</CardTitle>
              <CardDescription>Multi-axis evaluation</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#71717a' }} />
                  <Radar name="Score" dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Certification Badge</CardTitle>
              <CardDescription>Embed real-time VNP trust signal on your docs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-zinc-950 rounded-lg border border-zinc-800 flex justify-center items-center h-32">
                 <img src={`http://localhost:8088/api/v1/badges/${resolvedParams.api_id}.svg`} alt="VNP Badge Preview" className="max-w-full" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Markdown:</p>
                <code className="block p-3 bg-black rounded border border-zinc-800 text-xs text-zinc-300 overflow-x-auto whitespace-nowrap">
                  [![VNP Certified](https://api.veklom.com/api/v1/badges/{resolvedParams.api_id}.svg)](https://vnp.io/provider/{resolvedParams.api_id})
                </code>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
