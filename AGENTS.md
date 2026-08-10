# AGENTS.md — READ FIRST

Before any work, read [`00_VEKLOM_BIBLE.md`](./00_VEKLOM_BIBLE.md).

The frontend must be an honest projection of backend/runtime state. Do not synthesize production health, trust, usage, evidence, settlement, topology, or compliance values.

Standalone Veklom products may have independent UIs; Capability OS consumes their underlying capabilities and rebuilds the OS surface natively.

Repo-local source and tests govern frontend implementation details only when they do not conflict with current runtime evidence or the Bible. Use Coolify UI/API/MCP for Coolify management; SSH is for direct host/container verification or operations. Host `8000` is currently Coolify-owned.
