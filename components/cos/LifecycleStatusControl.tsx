"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

interface IdentityLifecycle {
  status: "PROBATIONARY" | "ACTIVE" | "RENEWAL_DUE" | "EXPIRED";
  probation_ends_at: string | null;
  renewal_due_at: string | null;
  can_execute: boolean;
  warning: string | null;
}

interface IdentityStatusResponse {
  pgl_id: string;
  workspace_id: string;
  human_id: string | null;
  lifecycle: IdentityLifecycle;
  can_execute: boolean;
  warning: string | null;
}

export function LifecycleStatusControl() {
  const [status, setStatus] = useState<IdentityStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await api<IdentityStatusResponse>("/api/v1/pgl/identity/status");
        setStatus(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch identity status.");
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-slate-400">
            <Activity className="h-4 w-4 animate-spin" />
            <span>Verifying lifecycle...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900 border-red-900/50">
        <CardContent className="p-6 text-red-400 flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5" />
          <span>{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const { lifecycle } = status;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3 border-b border-slate-800">
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Identity Lifecycle</span>
          </span>
          {status.can_execute ? (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Execution Allowed
            </Badge>
          ) : (
            <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
              Execution Blocked
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current State</p>
            <div className="flex items-center space-x-2 text-slate-200">
              {lifecycle.status === "ACTIVE" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              {lifecycle.status === "PROBATIONARY" && <Activity className="h-4 w-4 text-cyan-500" />}
              {lifecycle.status === "EXPIRED" && <XCircle className="h-4 w-4 text-red-500" />}
              <span className="font-mono">{lifecycle.status}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">PGL ID</p>
            <p className="text-slate-300 font-mono text-sm truncate">{status.pgl_id}</p>
          </div>
        </div>

        {lifecycle.warning && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded text-sm text-cyan-400 flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{lifecycle.warning}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
