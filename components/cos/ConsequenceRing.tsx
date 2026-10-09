"use client";

import { useEffect, useMemo, useState } from "react";
import {
  arcProven,
  formatRemaining,
  leaseRemainingMs,
  observationForHeldLease,
  positionState,
  provenTransitionCount,
  ringClosed,
  ringPositions,
  ringProof,
  totalTransitions,
  writeBackProven,
  type RingLease,
  type RingObservation,
  type RingPosition,
  type RingState,
} from "@/lib/cos/consequence-ring";
import { readSessionCapabilityLease } from "@/lib/cos/lease-session";
import { useAuth } from "@/lib/auth-context";
import { ApiError, api } from "@/lib/api";
import { classifyPayload } from "@/lib/cos/proof";
import { isCappoProxyPath } from "@/lib/cappo-proxy-paths";
import type { MaturityStatus } from "@/lib/cos/maturity";

// Palette is local and deliberate: `signal` is spent only on proven transitions
// and the write-back edge, so an estate with little evidence renders nearly
// monochrome. `brass` carries authority, which expires and is revoked and is
// therefore never drawn as a healthy state.
const VOID = "#07090B";
const SLATE = "#10162B";
const WIRE = "#232B4A";
const SIGNAL = "#4CF2D6";
const BRASS = "#B5772E";
const PAPER = "#EDE4D3";

const stateColor: Record<RingState, string> = {
  VERIFIED: SIGNAL,
  LIVE: PAPER,
  DEGRADED: BRASS,
  FAILED: "#C2564B",
  "SIGN IN REQUIRED": "#5A6484",
  "NEEDS PROOF": "#5A6484",
  UNKNOWN: "#5A6484",
  "NOT IN SESSION": "#5A6484",
  "NOT SERVED": "#5A6484",
};

// Recorded proof, the stable answer a visitor reads first. Distinct from session state.
const proofColor: Record<MaturityStatus, string> = {
  "Proven in production": SIGNAL,
  "Proven on staging": "#9FE8DA",
  "Partly proven": "#C9A46A",
  "Needs proof": "#5A6484",
};

const SIZE = { w: 720, h: 420 };
const CENTER = { x: 360, y: 210 };
const RADIUS = 150;

function pointAt(index: number, radius = RADIUS) {
  const degrees = -90 + (index - 1) * 60;
  const radians = (degrees * Math.PI) / 180;
  return {
    x: CENTER.x + radius * Math.cos(radians),
    y: CENTER.y + radius * Math.sin(radians),
  };
}

function arcPath(fromIndex: number, toIndex: number) {
  const from = pointAt(fromIndex);
  const to = pointAt(toIndex);
  return `M ${from.x} ${from.y} A ${RADIUS} ${RADIUS} 0 0 1 ${to.x} ${to.y}`;
}

function describeObservation(position: RingPosition): string {
  const { observation } = position;
  switch (observation.kind) {
    case "unobserved":
      return "Reading this position.";
    case "not-observable":
      return observation.reason;
    case "route-absent":
      return "Nothing serves this route.";
    case "failed":
      return observation.detail
        || `${position.probe?.path ?? "This route"} answered ${observation.status ?? "with a transport failure"}.`;
    case "sign-in-required":
      return "This check needs a signed-in workspace. Sign in to see it for your account.";
    case "unproven":
      return observation.detail || "The service answered and reported that this is not yet proven.";
    case "reachable":
      return position.probe?.proves ?? "Authority is held right now.";
    case "attested":
      return position.probe?.proves ?? "Attested.";
  }
}

async function observe(path: string, attestable: boolean): Promise<RingObservation> {
  const transportPath = isCappoProxyPath(path) ? `/api/cappo${path}` : path;
  try {
    const payload = await api.get(transportPath);
    const { observation } = classifyPayload(payload);
    if (observation.kind === "no-route") return { kind: "route-absent" };
    if (observation.kind === "failed") {
      return { kind: "failed", status: observation.status, detail: "The route reported a degraded payload." };
    }
    // The service itself said "needs proof": never present that as live.
    if (observation.kind === "unproven") {
      const signal = payload && typeof payload === "object" ? (payload as Record<string, unknown>).proofSignal : undefined;
      return { kind: "unproven", status: 200, detail: typeof signal === "string" ? signal : undefined };
    }
    if (observation.kind === "source-of-truth" && attestable && observation.signed) {
      return { kind: "attested", status: observation.status };
    }
    return { kind: "reachable", status: 200 };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { kind: "route-absent" };
    }
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return { kind: "sign-in-required", status: error.status };
    }
    return {
      kind: "failed",
      status: error instanceof ApiError ? error.status : undefined,
      detail: error instanceof Error ? error.message : undefined,
    };
  }
}

function StateWord({ state }: { state: RingState }) {
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-[0.14em]"
      style={{ color: stateColor[state] }}
    >
      {state}
    </span>
  );
}

export function ConsequenceRing({ subject }: { subject: string }) {
  const [observations, setObservations] = useState<Record<string, RingObservation>>({});
  const [lease, setLease] = useState<RingLease | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<string>("identity");
  const { me } = useAuth();
  const signedIn = Boolean(me);

  useEffect(() => {
    setLease(readSessionCapabilityLease());
  }, []);

  useEffect(() => {
    let cancelled = false;
    ringPositions.forEach((definition) => {
      if (!definition.probe) return;
      void observe(definition.probe.path, definition.probe.attestable).then((observation) => {
        if (cancelled) return;
        setObservations((current) => ({ ...current, [definition.id]: observation }));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  // The lease countdown is the only motion on this surface, and it is
  // truth-bearing rather than decorative, so it also runs under reduced motion.
  useEffect(() => {
    if (!lease?.expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lease?.expiresAt]);

  const positions: RingPosition[] = useMemo(
    () => ringPositions.map((definition) => {
      if (definition.id === "authority") {
        return { ...definition, observation: observationForHeldLease(lease, now) };
      }
      if (definition.id === "compute") {
        return {
          ...definition,
          observation: { kind: "not-observable", reason: definition.unobservableReason! },
        };
      }
      const observed = observations[definition.id] ?? { kind: "unobserved" };
      // A signed-in operator whose session the service rejects is a real failure, not a sign-in prompt.
      if (observed.kind === "sign-in-required" && signedIn) {
        return { ...definition, observation: { kind: "failed", status: observed.status, detail: "You are signed in, but this service did not accept your session." } };
      }
      return { ...definition, observation: observed };
    }),
    [observations, lease, now, signedIn],
  );

  const proven = provenTransitionCount(positions);
  const closed = ringClosed(positions);
  const writeBack = writeBackProven(positions);
  const remaining = leaseRemainingMs(lease, now);
  const executorLive = Boolean(lease) && (remaining === null || remaining > 0);
  const active = positions.find((position) => position.id === selected) ?? positions[0];

  return (
    <section
      aria-label="Consequence ring"
      className="mt-10 overflow-hidden rounded-2xl border"
      style={{ borderColor: WIRE, background: `linear-gradient(180deg, ${SLATE} 0%, ${VOID} 78%)` }}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b px-6 py-4" style={{ borderColor: WIRE }}>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: BRASS }}>
            One machine action
          </div>
          <h2 className="mt-1 text-lg" style={{ fontFamily: "var(--font-fraunces)", color: PAPER }}>
            {subject}
          </h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: closed ? SIGNAL : "#5A6484" }}>
          This session: {proven} of {totalTransitions} transitions observed
          {closed ? " · ring closed" : " · ring open"}
        </p>
      </header>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        {/* The drawing is decoration-free geometry: every stroke is a claim. It is
            hidden from assistive tech because the list beside it carries the same
            state as text, and is hidden on small screens where the list stands alone. */}
        <div className="hidden lg:block">
          <svg viewBox={`0 0 ${SIZE.w} ${SIZE.h}`} className="h-auto w-full" role="presentation">
            <circle cx={CENTER.x} cy={CENTER.y} r={RADIUS} fill="none" stroke={WIRE} strokeWidth={1} strokeDasharray="2 6" />

            {positions.slice(0, -1).map((position, i) => {
              const next = positions[i + 1];
              if (!arcProven(position, next)) return null;
              return (
                <path
                  key={`arc-${position.id}`}
                  d={arcPath(position.index, next.index)}
                  fill="none"
                  stroke={SIGNAL}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              );
            })}

            {writeBack ? (
              <line
                x1={pointAt(6, RADIUS - 22).x}
                y1={pointAt(6, RADIUS - 22).y}
                x2={CENTER.x - 86}
                y2={CENTER.y + 22}
                stroke={SIGNAL}
                strokeWidth={1.5}
                markerEnd="url(#ring-inward)"
              />
            ) : null}
            <defs>
              <marker id="ring-inward" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill={SIGNAL} />
              </marker>
            </defs>

            <rect
              x={CENTER.x - 92}
              y={CENTER.y - 44}
              width={184}
              height={88}
              rx={10}
              fill={SLATE}
              stroke={WIRE}
            />
            <text x={CENTER.x} y={CENTER.y - 20} textAnchor="middle" fontSize={11} fill="#5A6484" style={{ letterSpacing: "0.18em" }} fontFamily="var(--font-mono)">
              PERSISTS
            </text>
            <text x={CENTER.x} y={CENTER.y + 4} textAnchor="middle" fontSize={17} fill={PAPER} fontFamily="var(--font-fraunces)">
              Capability
            </text>
            <text x={CENTER.x} y={CENTER.y + 26} textAnchor="middle" fontSize={10} fill="#5A6484" fontFamily="var(--font-mono)">
              mount · policy · lease terms
            </text>

            {positions.map((position) => {
              const point = pointAt(position.index);
              const state = positionState(position.observation);
              const proof = ringProof[position.id];
              const label = pointAt(position.index, RADIUS + 34);
              const anchor = Math.abs(label.x - CENTER.x) < 12
                ? "middle"
                : label.x > CENTER.x
                  ? "start"
                  : "end";
              return (
                <g key={position.id} opacity={position.id === selected ? 1 : 0.82}>
                  <circle cx={point.x} cy={point.y} r={position.id === selected ? 8 : 6} fill={VOID} stroke={stateColor[state]} strokeWidth={1.5} />
                  <text x={label.x} y={label.y - 5} textAnchor={anchor} fontSize={11} fill={PAPER} fontFamily="var(--font-mono)" style={{ letterSpacing: "0.12em" }}>
                    {position.index}. {position.label.toUpperCase()}
                  </text>
                  <text x={label.x} y={label.y + 9} textAnchor={anchor} fontSize={10} fill={proofColor[proof.status]} fontFamily="var(--font-mono)" style={{ letterSpacing: "0.12em" }}>
                    {proof.status.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* The executor is drawn inside position 4 only while a lease is live,
                and leaves the drawing when it expires. */}
            {executorLive ? (
              <g>
                <circle cx={pointAt(4).x} cy={pointAt(4).y} r={14} fill="none" stroke={BRASS} strokeWidth={1} strokeDasharray="3 4" />
                <text x={pointAt(4).x} y={pointAt(4).y - 22} textAnchor="middle" fontSize={9} fill={BRASS} fontFamily="var(--font-mono)" style={{ letterSpacing: "0.14em" }}>
                  EXECUTOR {remaining !== null ? formatRemaining(remaining) : "HELD"}
                </text>
              </g>
            ) : null}
          </svg>
        </div>

        <div className="flex flex-col gap-1">
          <ul className="flex flex-col">
            {positions.map((position) => {
              const state = positionState(position.observation);
              const proof = ringProof[position.id];
              const isActive = position.id === selected;
              return (
                <li key={position.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(position.id)}
                    aria-current={isActive}
                    className="flex w-full flex-col gap-1 rounded px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                      // @ts-expect-error CSS custom property for the focus ring color
                      "--tw-ring-color": SIGNAL,
                    }}
                  >
                    <span className="flex w-full items-baseline justify-between gap-3">
                      <span className="font-mono text-[11px] tracking-[0.1em]" style={{ color: isActive ? PAPER : "#8A93AD" }}>
                        {position.index}. {position.label.toUpperCase()}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: proofColor[proof.status] }}>
                        {proof.status}
                      </span>
                    </span>
                    <span className="flex w-full items-baseline justify-end gap-2 font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: "#5A6484" }}>
                      This session: <StateWord state={state} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 rounded-lg border px-4 py-4" style={{ borderColor: WIRE, background: "rgba(255,255,255,0.02)" }}>
            <p className="text-sm leading-6" style={{ color: PAPER }}>{active.role}</p>
            <p className="mt-3 text-xs leading-5" style={{ color: PAPER }}>
              <span className="font-semibold" style={{ color: proofColor[ringProof[active.id].status] }}>{ringProof[active.id].status}. </span>
              {ringProof[active.id].summary}
            </p>
            {ringProof[active.id].evidence ? (
              <p className="mt-1 text-[11px] leading-5" style={{ color: "#8A93AD" }}>Evidence: {ringProof[active.id].evidence}</p>
            ) : null}
            <p className="mt-2 text-xs leading-5" style={{ color: "#8A93AD" }}>This session: {describeObservation(active)}</p>
            <dl className="mt-3 flex flex-col gap-1 font-mono text-[10px]" style={{ color: "#5A6484" }}>
              <div className="flex gap-2">
                <dt className="uppercase tracking-[0.14em]">Owner</dt>
                <dd>{active.owner}</dd>
              </div>
              {active.probe ? (
                <div className="flex gap-2">
                  <dt className="uppercase tracking-[0.14em]">Route</dt>
                  <dd>{active.probe.method} {active.probe.path}</dd>
                </div>
              ) : null}
            </dl>
            <a
              href={active.route}
              className="mt-4 inline-flex font-mono text-[10px] uppercase tracking-[0.16em] underline-offset-4 hover:underline"
              style={{ color: SIGNAL }}
            >
              Work on {active.label.toLowerCase()} →
            </a>
          </div>
        </div>
      </div>

      <footer className="border-t px-6 py-3 text-xs leading-5" style={{ borderColor: WIRE, color: "#5A6484" }}>
        Each position states what recorded runs have proven, with its evidence. Arcs light up only when this browser session attests both ends, so a new visitor sees an open ring until they mount and execute something themselves.
      </footer>
    </section>
  );
}
