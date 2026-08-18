# Capability OS Runtime Wiring Implementation Plan

**Goal:** Wire Capability OS to existing governed runtime contracts and remove legacy fabricated runtime status from the OS path.

**Architecture:** Browser calls remain same-origin. The control plane authenticates the requester and proxies bounded CAPPO requests with server-held credentials. `/v1/exec` remains the only consequence-bearing execution route; UI renders only returned execution and evidence fields.

## Constraints

- Never create frontend health, trust, usage, evidence, settlement, provider, or metric values.
- `401` requires identity; `403` is terminal; `503` is unavailable; neither is success.
- cAPI discovers/connects; CAPPO governs; BYOS executes; PGL evidences.

## Task 1 — Governed transport

Files: `lib/cos/useStageData.ts`, `lib/__tests__/cos-mount-transport.test.ts`.

1. Write a failing test asserting that `resolveStageTransportPath("execute", "/v1/exec")` is `/api/v1/exec` and `resolveStageBaseUrl("execute", false, "https://cappo.example")` is undefined.
2. Run `npm test -- --runTestsByPath lib/__tests__/cos-mount-transport.test.ts`; confirm red.
3. Map the execution stage to `/api/v1/exec` and make it same-origin.
4. Rerun the test; confirm green.
5. Commit `fix: route OS execution through governed boundary`.

## Task 2 — Execution result parser and harness

Files: new `lib/cos/execution-result.ts`, new `lib/__tests__/cos-execution-result.test.ts`, `components/cos/ExecuteHarness.tsx`.

1. Write a failing parser test: a response with `{ execution_id: "exec_1", status: "denied" }` produces only its returned ID, status, and an empty attempt list.
2. Run the single Jest file; confirm red.
3. Add a minimal defensive parser for returned execution ID, outcome, attempt evidence, and evidence reference.
4. Have the harness submit through `api.post("/api/v1/exec", envelope)`, remove browser API-key entry and fixed provider/model promises, and render actual HTTP authority states.
5. Rerun tests; confirm green. Commit `fix: render governed execution evidence only`.

## Task 3 — Evidence-bound shell

Files: `app/os/page.tsx`, `components/cos/AppShell.tsx`, `components/cos/TerminalConsole.tsx`, new `lib/__tests__/cos-runtime-shell.test.ts`.

1. Write a failing test that the home surface does not call missing `/v1/platform/pulse` and never displays a fixed verified runtime verdict.
2. Run it red.
3. Use runtime reachability only when CAPPO returns it; preserve explicit `UNVERIFIED`, `IDENTITY_REQUIRED`, `DENIED`, and `UNAVAILABLE` states. Disable terminal input until an authenticated governed execution envelope exists.
4. Run it green. Commit `fix: make Capability OS runtime status evidence-bound`.

## Task 4 — Verification

1. Run the focused Jest tests and `npm run typecheck`.
2. Read-only production proof: `curl.exe -sS -i https://cappo.veklom.com/health` and unauthenticated catalog response.
3. Push only verified commits to `main`; use Coolify to redeploy and repeat the same checks.
