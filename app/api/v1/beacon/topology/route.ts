import { NextResponse } from 'next/server';

const VNP_URL = process.env.VNP_URL || 'http://localhost:8089';

export async function GET() {
  try {
    // Fetch nodes from real VNP backend
    const res = await fetch(`${VNP_URL}/api/v1/nexus/nodes`, {
      next: { revalidate: 5 } // Cache for 5s
    });
    
    if (!res.ok) {
      console.error("VNP backend failed:", await res.text());
      throw new Error(`VNP Backend returned ${res.status}`);
    }

    const data = await res.json();
    
    // Fallback if data isn't an array
    const backendNodes = Array.isArray(data) ? data : (data.items || []);

    // Transform backend VNP nodes into the UI topology format
    const nodes = backendNodes.map((n: any, i: number) => {
      // Calculate a rough circle layout for x,y if not provided by backend
      const angle = (i / Math.max(1, backendNodes.length)) * Math.PI * 2;
      const radius = 200;
      
      // Map VNP status to UI status ("LEADER" | "ATTESTING" | "CHALLENGED" | "STANDBY")
      let status = "STANDBY";
      if (n.status === "ACTIVE") status = "ATTESTING";
      if (i === 0) status = "LEADER"; // First node is leader in demo UI
      if (n.trust_score < 80) status = "CHALLENGED";

      return {
        id: n.id,
        name: n.name || `Node-${n.id.substring(0, 4)}`,
        region: n.region || "us-east-1",
        status: status,
        status_str: n.status,
        x: 400 + Math.cos(angle) * radius,
        y: 250 + Math.sin(angle) * radius,
        stakeUsd: n.total_staked || 0,
        cpuMs: Math.random() * 10 + 5, // Simulated latency
        poolUtilization: Math.random() * 40 + 20, // Simulated util
        version: "1.0.0",
        tenantLock: "Unassigned"
      };
    });

    const responseFormat = {
      topology: {
        nodes: nodes,
        eventsLog: [`[SYS] Fetched ${nodes.length} nodes from VNP ${VNP_URL}`],
        ledgerFeed: [],
        totalSettledUsd: nodes.reduce((sum: number, n: any) => sum + (n.stakeUsd || 0), 0),
        isActiveStorm: false,
        safetyGuardActive: true
      }
    };

    return NextResponse.json(responseFormat);
  } catch (error) {
    console.error("VNP Topology Error:", error);
    // Return graceful fallback
    return NextResponse.json({
      topology: {
        nodes: [],
        eventsLog: ["[ERR] Connection to VNP backend failed"],
        ledgerFeed: [],
        totalSettledUsd: 0,
        isActiveStorm: false,
        safetyGuardActive: true
      }
    }, { status: 502 });
  }
}
