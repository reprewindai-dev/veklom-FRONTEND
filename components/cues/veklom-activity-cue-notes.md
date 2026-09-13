# Veklom Activity Cue — handoff notes

Files:
- `VeklomActivityCue.tsx` — the component
- `VeklomActivityCue.css` — import once, globally
- This file — what it replaces, how to wire it, what's left

## What this replaces

- `PhaseTrace`'s generic Lucide icons (pulsing dot / clock / check / warning triangle)
- The Execute surface's plain `Loading...` text
- Any other spot in Capability OS currently showing a spinner or a boolean loading flag

## The rule that matters most

`condition`, `phase`, and `liveness` are always driven by real state — `useStageData`,
heartbeats, timeouts, CAPPO responses, HTTP status, proof classification. The component
has **no internal timer that advances these**. The only timer it runs updates the elapsed
/ heartbeat-age *text* once a second — it never changes color, shape, or condition on its
own. If you ever find yourself tempted to `setInterval` a condition change to make the UI
"feel alive," don't — that's exactly the failure mode this was built to avoid.

## Kind → shape → where it belongs

| `kind`      | Shape        | Use for |
|-------------|--------------|---------|
| `discovery` | Blink (eyes) | Searching capabilities, inspecting manifests, background discovery, checking providers |
| `authority` | V-pulse      | Authenticating, CAPPO evaluation, binding a lease, policy check, revocation |
| `execution` | Orb          | Materializing runtime, executing, waiting on a worker, observing consequence |
| `transport` | Status wave  | Network request, queue, VLink pairing, remote provider, streaming, retry/backoff |
| `system`    | Orb + V hybrid | Global "Veklom is working" indicator in the OS chrome, next to runtime/identity |

Discovery is the one place it's fine to have a little personality — the eyes blinking is
already slightly expressive. Keep authority, execution, and evidence/failure states
precise and restrained; don't add character there.

## Color contract (`condition`)

| `condition` | Color | Meaning |
|---|---|---|
| `unknown` | gray (`--unknown`) | idle / pending / not yet measured |
| `active` | cyan (`--info`) | currently live / in progress |
| `present` | steel (`--present`, falls back to `--accent-steel`) | **completed but not independently verified** |
| `verified` | green (`--verified`) | established / proven |
| `degraded` | amber (`--warn`) | waiting, retrying, outcome unknown |
| `failed` | red (`--danger`) | denied / failed / boundary violation / evidence conflict |

The important one is `present` vs `verified` — completed ≠ verified. An HTTP 200 gets you
`present`, not `verified`. Something only earns green once it's independently confirmed.

**Token addition needed:** none of your three theme docs currently define `--present`.
The component falls back to `--accent-steel` (dark/light) or `--mid-gray` (grayscale) so it
works today, but for a clean match to the color contract, add explicit values wherever
each theme's tokens live:

```
Dark sovereign:   --present: #B7C4D6;
Light:            --present: #64748B;
Machine/grayscale: --present: #E4E4E4;   /* sits between --info (#D0D0D0) and --verified (#F2F2F2) */
```

## Liveness (`liveness`) — motion, not color

| `liveness` | Effect |
|---|---|
| `healthy` | full-speed motion |
| `waiting` | motion slowed ~1.6x (expected pause, e.g. backoff) |
| `stalled` | motion slowed ~2.5x + desaturated (heartbeat overdue) |
| `disconnected` | **motion stops entirely** (heartbeat lost / timed out) |

Motion also stops automatically once `condition` is `verified` or `failed` — a terminal
result should look settled, not still pulsing. That's handled internally; you don't need
to also pass `liveness="disconnected"` once something resolves.

## Machine mode

Pass `showToken` on grayscale/machine-facing surfaces. It renders a literal
`DOMAIN.CONDITION` line (e.g. `EXECUTION.ACTIVE`, `AUTHORITY.BINDING`) below the glyph,
since brightness alone shouldn't carry state on that surface — the doc was right that
animation there is supplemental, the token text is the actual signal. Override the
left-hand side with the `domain` prop if it should read differently than `kind`
(e.g. `domain="OBSERVATION"` on an `execution`-kind glyph).

## Usage

```tsx
// Nav chrome — small, icon only
<VeklomActivityCue kind="system" condition="active" liveness="healthy" size={20} showCaption={false} />

// Execute flow, step by step — same instance, props change as real state changes
<VeklomActivityCue kind="authority" phase="authorizing" condition="active" liveness="healthy" />
<VeklomActivityCue kind="execution" phase="materializing" condition="active" liveness="healthy" startedAt={startedAt} lastHeartbeatAt={heartbeat} />
<VeklomActivityCue kind="transport" phase="observing" condition="degraded" liveness="waiting" startedAt={startedAt} />
<VeklomActivityCue kind="execution" label="Consequence established" condition="verified" liveness="healthy" />
<VeklomActivityCue kind="execution" label="Execution denied" condition="failed" liveness="disconnected" />

// Machine surface
<VeklomActivityCue kind="execution" condition="active" liveness="healthy" showToken domain="EXECUTION" />
```

## Not built yet (flagged, not forgotten)

- **Pointer-tracking eyes** for the discovery glyph (doc's "eyes subtly track the pointer"
  idea). Skipped for now — needs a decision on where it's safe to attach a mousemove
  listener without perf cost. Easy add later inside the `discovery` case in `Glyph`.
- **Auto-deriving `liveness` from heartbeat timestamps.** Right now the caller decides
  `liveness` explicitly. A `useLiveness(lastHeartbeatAt, thresholds)` hook that computes
  healthy/waiting/stalled/disconnected from elapsed time would remove that judgment call
  from call sites — worth adding once you know real timeout thresholds per phase.
- **`<ActivityDrawer>`** — the checklist view from the doc (resolved / bound / materializing
  / execute / observe / reconcile) is just a list of these cues with connecting lines; not
  built as its own component yet.
