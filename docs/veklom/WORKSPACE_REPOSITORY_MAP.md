# WORKSPACE_REPOSITORY_MAP

VEKLOM WORKSPACE ALIGNMENT — MANDATORY

LOCAL TRACKING REF STATUS != CURRENT GITHUB STATUS
Always assume local ahead/behind counts are only relative to local tracking refs. Do not treat local "0 ahead / 0 behind" as confirmation the remote is identical without an explicit fetch/verification step.

This map records the classification of repository folders under C:\Users\antho\.windsurf for operational clarity. Classifications use the architect-supplied categories and preserve local state (do not remove or alter local commits or uncommitted changes).

Repository | Relative Path | Classification | Notes
---|---:|---|---
veklom-control-plane | veklom-control-plane | CURRENT WORKING COPY — STALE VS GITHUB — DIRTY | local HEAD: 6a3d2d0 ; canonical GitHub: b707f9c85ad04888c369aa95882b450123f36124 ; skip adding copilot-instructions.md until synced deliberately
cappo-backend | cappo-backend | CANONICAL / CAPPO | Role: CAPPO (sole consequence authority). Local branch is not assumed canonical.
cAPI | cAPI | CANONICAL / cAPI-Covenant | Connection, discovery, negotiation. Use this as canonical cAPI source.
gnomledger | gnomledger | CANONICAL / PGL | Durable evidence / provenance.
lockerphycer | lockerphycer | CANONICAL / execution containment | Keys/secrets + enforced containment.
veklom-byos-backend-2 | veklom-byos-backend-2 | CURRENT WORKING COPY — BYOS/main | This is the working BYOS copy; veklom-byos-backend-legacy remains LEGACY / DO NOT USE FOR NEW WORK.
veklom-byos-backend-legacy | veklom-byos-backend-legacy | LEGACY / DO NOT USE FOR NEW WORK | Do not promote or use for new development.
real-repo-gate-for-veklom | real-repo-gate-for-veklom | CURRENT WORKING COPY — RepoGate intake/security | Local copy is +3 commits ahead (preserve; do not push without reconciliation).
uacpv3 | uacpv3 | CURRENT WORKING SOURCE — GPC/UACP (VERIFY BEFORE PROMOTION) | Use C:\Users\antho.windsurf\uacpv3 as the working GPC/UACP source for alignment; verify before promotion to canonical.
COMPUTLESS | COMPUTLESS | CURRENT WORKING SOURCE / compute research | Integrate per Governed Compute contract.
UACPV5-TERMINAL | UACPV5-TERMINAL | REFERENCE / expert-terminal | Expert terminal work; not authority bypass.
veklom-sdk | veklom-sdk | REFERENCE / SDK | Reference only.
veklom-ops-command | veklom-ops-command | RESCUE / local rescue branch | Preserve, do not assume canonical.
veklom-vnp | veklom-vnp | REFERENCE / VNP docs | Reference documentation and methodology.
veklom-uch | veklom-uch | UNKNOWN / REVIEW REQUIRED | No remotes detected locally.
cappo-backend\.uv-cache\sdists-v9 | cappo-backend/.uv-cache/sdists-v9 | CACHE / IGNORE | Package/cache material — do not add canonical instructions here.
Other folders (abide, abide2, add-on-capi-control, AGENTDUALALL1, byos-main-promotion, capi-exec-boundary-hardening, cappo-backend-runtime-guard, cappo-http-boundary-hardening, cappo-main-promotion, co2router-site, codexecobeengine, poltergeist, etc.) | various | REFERENCE / EXPERIMENT / LEGACY / UNKNOWN | Preserve as reference; do not promote without explicit authorization.

Operational rules:
- Before editing any repository, identify the requested Veklom subsystem and its canonical repository per this map.
- Read repository-local alignment/handoff documentation first (per-repo docs and shared architecture files). For Capability OS, consult docs/capability-os/README.md and HANDOFF_CHECKLIST files in the canonical frontend repo.
- Report current folder, remote, branch, HEAD SHA and working-tree state before editing.
- Never replace newer architecture with code from a legacy/rescue/duplicate branch without explicit reconciliation.
- Do not classify dirty repos or local-ahead repos as safe-to-clean.

Preservation note: Do not delete or clean any local repositories listed above. Archive or remove only after explicit classification and archival steps.
