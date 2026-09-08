"use client";

import React, { useEffect, useState } from "react";

/**
 * VeklomActivityCue
 * ------------------
 * The single visual-liveness glyph for Capability OS.
 *
 * IMPORTANT — read before wiring this up:
 * `condition`, `phase`, and `liveness` must always come from real system
 * state (useStageData, heartbeats, timeouts, CAPPO responses, etc).
 * This component never advances, cycles, or fakes progress on its own.
 * The only internal timer it runs is a 1s re-render tick used purely to
 * display elapsed wall-clock time / heartbeat age — it never changes
 * color, shape, or condition by itself.
 */

// ---- Semantic API -----------------------------------------------------

export type ActivityKind =
  | "discovery"   // Blink — inspection / background discovery / checking providers
  | "authority"   // V-pulse — auth, CAPPO evaluation, lease binding, policy check
  | "execution"   // Orb — compute alive, materializing, executing, observing
  | "transport"   // Status wave — traveling/waiting across a boundary (network, queue, VLink, retry)
  | "system";     // Orb + V hybrid — global "Veklom is working" chrome indicator

export type ActivityCondition =
  | "unknown"   // gray   — idle / pending / not yet measured
  | "active"    // cyan   — currently live / in progress
  | "present"   // steel  — completed but NOT independently verified
  | "verified"  // green  — established / proven
  | "degraded"  // amber  — waiting, retrying, outcome unknown
  | "failed";   // red    — denied / failed / boundary violation / evidence conflict

export type ActivityLiveness =
  | "healthy"       // heartbeat current — full-speed motion
  | "waiting"       // expected, slower cadence (e.g. backoff) — slowed motion
  | "stalled"       // heartbeat overdue — further slowed + desaturated
  | "disconnected"; // heartbeat lost / timed out — motion stops entirely

export interface VeklomActivityCueProps {
  kind: ActivityKind;
  condition?: ActivityCondition;      // default "unknown"
  liveness?: ActivityLiveness;        // default "healthy"
  phase?: string;                     // machine phase key, e.g. "observing"
  label?: string;                     // human copy override, e.g. "Observing target consequence"
  startedAt?: number | Date;          // when the current phase began
  lastHeartbeatAt?: number | Date;    // last confirmed liveness signal
  size?: number;                      // glyph size in px (default 28)
  showCaption?: boolean;              // render label/elapsed/heartbeat text (default true)
  showToken?: boolean;                // render machine-readable TOKEN.CONDITION line (default false; use on machine/grayscale surfaces)
  domain?: string;                    // left side of the machine token, default = kind
  className?: string;
  style?: React.CSSProperties;
}

// ---- Color contract -----------------------------------------------------
// Maps straight onto the tokens already defined per theme (--info, --verified,
// --warn, --danger, --unknown, --accent-steel). Falls back gracefully if a
// token isn't defined yet in the current theme scope.

const CONDITION_VAR: Record<ActivityCondition, string> = {
  unknown: "rgb(var(--theme-unknown))",
  active: "rgb(var(--theme-info))",
  present: "rgb(var(--theme-present))",
  verified: "rgb(var(--theme-verified))",
  degraded: "rgb(var(--theme-warn))",
  failed: "rgb(var(--theme-danger))",
};

const STEEL_VAR = "rgb(var(--theme-accent-steel))";
const EYE_INK = "#0B0E14";

const DEFAULT_PHASE_LABEL: Record<string, string> = {
  discovering: "Discovering capabilities",
  authorizing: "Binding authority",
  materializing: "Materializing execution",
  executing: "Executing",
  observing: "Observing consequence",
  reconciling: "Reconciling outcome",
  settling: "Settling evidence",
};

const BASE_DURATION: Record<ActivityKind, number> = {
  discovery: 3.2,
  authority: 2.2,
  execution: 1.7,
  transport: 2.4,
  system: 1.9,
};

// ---- Helpers --------------------------------------------------------------

function toMs(v: number | Date): number {
  return typeof v === "number" ? v : v.getTime();
}

function formatElapsed(ms: number): string {
  const s = Math.max(0, ms) / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.floor(s % 60);
  return `${m}m ${rem.toString().padStart(2, "0")}s`;
}

function describeHeartbeat(ageMs: number, liveness: ActivityLiveness): string {
  if (liveness === "disconnected") return `heartbeat lost \u00b7 ${formatElapsed(ageMs)} ago`;
  if (ageMs < 2000) return "heartbeat live";
  if (liveness === "stalled" || liveness === "waiting") return `no heartbeat \u00b7 ${formatElapsed(ageMs)}`;
  return `heartbeat ${formatElapsed(ageMs)} ago`;
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

export function getActivityToken(domain: string, condition: ActivityCondition): string {
  return `${domain.toUpperCase()}.${condition.toUpperCase()}`;
}

// ---- Glyph shapes -----------------------------------------------------

function Glyph({
  kind,
  color,
  animate,
  duration,
  size,
}: {
  kind: ActivityKind;
  color: string;
  animate: boolean;
  duration: number;
  size: number;
}) {
  const eyeStyle = animate ? { animationDuration: `${duration}s` } : undefined;
  const eyeClass = animate ? "vac-eye" : undefined;
  const hexClass = animate ? "vac-hex" : undefined;
  const ringClass = animate ? "vac-ring" : undefined;
  const dotClass = animate ? "vac-dot" : undefined;
  const ringStyle = animate ? { animationDuration: `${duration}s` } : undefined;
  const dotStyle = animate ? { animationDuration: `${duration}s` } : undefined;

  switch (kind) {
    case "discovery":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
          <rect x="6" y="12" width="36" height="26" rx="13" fill={color} />
          <ellipse className={eyeClass} style={eyeStyle} cx="18" cy="25" rx="3" ry="4.5" fill={EYE_INK} />
          <ellipse
            className={eyeClass}
            style={eyeStyle ? { ...eyeStyle, animationDelay: "0.15s" } : undefined}
            cx="30"
            cy="25"
            rx="3"
            ry="4.5"
            fill={EYE_INK}
          />
        </svg>
      );

    case "authority":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
          <g className={hexClass} style={eyeStyle}>
            <polygon points="24,3 42,14 42,35 24,45 6,35 6,14" fill="none" stroke={STEEL_VAR} strokeWidth={1.5} />
            <path
              d="M15,15 L24,34 L33,15"
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      );

    case "execution":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
          <circle className={ringClass} style={ringStyle} cx="24" cy="24" r="9" fill="none" stroke={STEEL_VAR} strokeWidth={1.5} />
          <circle
            className={ringClass ? `${ringClass} vac-ring-delay` : undefined}
            style={ringStyle}
            cx="24"
            cy="24"
            r="9"
            fill="none"
            stroke={STEEL_VAR}
            strokeWidth={1.5}
          />
          <circle cx="24" cy="24" r="7" fill={color} />
        </svg>
      );

    case "transport":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
          {[7, 19, 31, 43].map((cx, i) => (
            <circle
              key={cx}
              className={dotClass ? `${dotClass}${i > 0 ? ` vac-dot-${i + 1}` : ""}` : undefined}
              style={dotStyle}
              cx={cx}
              cy="24"
              r="4.5"
              fill={color}
            />
          ))}
        </svg>
      );

    case "system":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
          <circle className={ringClass} style={ringStyle} cx="24" cy="24" r="11" fill="none" stroke={STEEL_VAR} strokeWidth={1.5} />
          <circle
            className={ringClass ? `${ringClass} vac-ring-delay` : undefined}
            style={ringStyle}
            cx="24"
            cy="24"
            r="11"
            fill="none"
            stroke={STEEL_VAR}
            strokeWidth={1.5}
          />
          <path
            d="M15,17 L24,32 L33,17"
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return null;
  }
}

// ---- Main component -----------------------------------------------------

export function VeklomActivityCue({
  kind,
  condition = "unknown",
  liveness = "healthy",
  phase,
  label,
  startedAt,
  lastHeartbeatAt,
  size = 28,
  showCaption = true,
  showToken = false,
  domain,
  className,
  style,
}: VeklomActivityCueProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt && !lastHeartbeatAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt, lastHeartbeatAt]);

  const isTerminal = condition === "verified" || condition === "failed";
  const frozen = isTerminal || liveness === "disconnected";
  const speedScale = liveness === "stalled" ? 2.5 : liveness === "waiting" ? 1.6 : 1;
  const duration = BASE_DURATION[kind] * speedScale;

  const color = CONDITION_VAR[condition];
  const elapsed = startedAt ? formatElapsed(now - toMs(startedAt)) : null;
  const heartbeatText = lastHeartbeatAt ? describeHeartbeat(now - toMs(lastHeartbeatAt), liveness) : null;
  const defaultLabel = label ?? (phase ? DEFAULT_PHASE_LABEL[phase] ?? capitalize(phase) : capitalize(kind));
  const token = getActivityToken(domain ?? kind, condition);

  const rootClass = [
    "vac-root",
    frozen && "vac-frozen",
    liveness === "stalled" && "vac-stalled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} style={{ display: "inline-flex", alignItems: "center", gap: 10, ...style }}>
      <Glyph kind={kind} color={color} animate={!frozen} duration={duration} size={size} />
      {showCaption && (
        <div className="vac-caption" style={{ color: "var(--theme-text, currentColor)" }}>
          <div>{defaultLabel}</div>
          {(elapsed || heartbeatText) && (
            <div className="vac-caption-sub">{[elapsed, heartbeatText].filter(Boolean).join(" \u00b7 ")}</div>
          )}
          {showToken && <div className="vac-token">{token}</div>}
        </div>
      )}
    </div>
  );
}

export default VeklomActivityCue;
