import { NextRequest, NextResponse } from "next/server";

interface RetentionPayload {
  path: string;
  articleSlug?: string;
  scrollDepthPct: number;
  readingDurationSeconds: number;
  engagedTimeSeconds: number;
  deviceType?: string;
  timestamp: string;
}

// In-memory ring buffer of retention telemetry for operator inspection
const RETENTION_BUFFER: RetentionPayload[] = [];
const MAX_BUFFER = 200;

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as RetentionPayload;
    
    // Validate minimum telemetry schema
    if (typeof payload.scrollDepthPct !== "number" || typeof payload.readingDurationSeconds !== "number") {
      return NextResponse.json({ error: "Invalid telemetry payload" }, { status: 400 });
    }

    const entry: RetentionPayload = {
      path: payload.path || "/",
      articleSlug: payload.articleSlug,
      scrollDepthPct: Math.min(100, Math.max(0, Math.round(payload.scrollDepthPct))),
      readingDurationSeconds: Math.max(0, Math.round(payload.readingDurationSeconds)),
      engagedTimeSeconds: Math.max(0, Math.round(payload.engagedTimeSeconds || payload.readingDurationSeconds)),
      deviceType: payload.deviceType || "desktop",
      timestamp: new Date().toISOString(),
    };

    RETENTION_BUFFER.unshift(entry);
    if (RETENTION_BUFFER.length > MAX_BUFFER) {
      RETENTION_BUFFER.pop();
    }

    return NextResponse.json({
      ok: true,
      recordedAt: entry.timestamp,
      totalEventsRecorded: RETENTION_BUFFER.length,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record telemetry" }, { status: 500 });
  }
}

export async function GET() {
  const total = RETENTION_BUFFER.length;
  const avgScroll = total > 0 ? Math.round(RETENTION_BUFFER.reduce((acc, e) => acc + e.scrollDepthPct, 0) / total) : 0;
  const avgDuration = total > 0 ? Math.round(RETENTION_BUFFER.reduce((acc, e) => acc + e.readingDurationSeconds, 0) / total) : 0;

  return NextResponse.json({
    metrics: {
      totalVisitsAudited: total,
      averageScrollDepthPct: avgScroll,
      averageReadingDurationSeconds: avgDuration,
      highRetentionVisits: RETENTION_BUFFER.filter(e => e.scrollDepthPct >= 75 && e.readingDurationSeconds >= 30).length,
    },
    recentEvents: RETENTION_BUFFER.slice(0, 20),
  });
}
