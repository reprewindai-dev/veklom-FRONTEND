# AGENTS.md — READ FIRST

Before any work, read [`00_VEKLOM_BIBLE.md`](./00_VEKLOM_BIBLE.md).

Before changing the Capability OS, read [`docs/capability-os/DESIGN_MODEL.md`](./docs/capability-os/DESIGN_MODEL.md). In short:
- **One product.** Workspaces are places; capabilities are things that open in a workspace. They can intentionally share names or appear in several views: check identifiers, roles, destinations and carried context before treating anything as a duplicate.
- **Five separate questions** for every action: Mode (playground/live), Location (where it runs), Containment (what the running agent can reach), Authority (the exact permitted action) and Evidence (what happened). Never let one stand in for another.
- **"Sandbox" has three meanings:**
  - the customer playground (same rules as live, never touches live state);
  - LockerPhycer execution containment (applies in both modes);
  - the deployment test copy (staging, never customer-facing).

  Keep them apart.

The frontend must be an honest projection of backend/runtime state. Do not synthesize production health, trust, usage, evidence, settlement, topology, or compliance values.

Standalone Veklom products may have independent UIs; Capability OS consumes their underlying capabilities and rebuilds the OS surface natively.

Repo-local source and tests govern frontend implementation details only when they do not conflict with current runtime evidence or the Bible. Live environment is a Windows host using Docker Desktop (WSL2). Do NOT assume 

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
