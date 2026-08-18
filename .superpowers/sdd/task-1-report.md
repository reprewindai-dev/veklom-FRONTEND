# Task 1 — Durable cAPI Registry Freshness

## Status

Completed locally and committed independently in all four service repositories. No deployment or push was performed.

## Scope delivered

- CAPPO, PGL/Gnomledger, BYOS, and Lockerphycer now maintain a cancellable cAPI registration task from their FastAPI lifespans.
- A successful registration is refreshed using `POST /api/v1/registry/heartbeat` at 80% of `CAPI_REGISTRY_TTL_MS` (default: 300,000 ms), so it refreshes before expiry.
- A heartbeat `404` is the only heartbeat response that transitions the maintainer back to registration. Other HTTP failures and transport failures remain fail-soft and do not re-register.
- Registration and heartbeat logs contain only service/status/exception-class information; bearer values and response bodies are not logged.
- Lifespan shutdown signals the stop event, cancels an in-flight task if needed, and awaits it while suppressing only expected `CancelledError`.
- No public routes or execution paths were added. Semantic authorization remains external to this liveness mechanism (CAPPO).

## Files and commits

| Service | Files | Commit |
|---|---|---|
| CAPPO | `cappo_backend/services/capi_registration.py`, `cappo_backend/main.py`, `tests/test_capi_registration.py` | `c287c48` — `feat: maintain cappo capi registration` |
| PGL/Gnomledger | `backend/app/services/capi_registration.py`, `backend/app/main.py`, `backend/tests/test_capi_registration.py` | `9c16ccf` — `feat: maintain pgl capi registration` |
| BYOS | `backend/core/services/capi_registration.py`, `backend/apps/api/main.py`, `backend/tests/test_byos_protocol_registration.py` | `076f1270` — `feat: maintain byos capi registration` |
| Lockerphycer | `core/utils/capi_registration.py`, `apps/api/main.py`, `tests/test_capi_registration.py` | `9b84cee` — `feat: maintain lockerphycer capi registration` |

## TDD evidence

Focused tests were added before production changes. The RED runs failed because `maintain_capi_registration` did not exist:

- CAPPO: `ImportError: cannot import name 'maintain_capi_registration'`.
- PGL: same expected import error, run with `PYTHONPATH=backend --noconftest` because the repository conftest requires a non-default import path.
- BYOS: same expected import error, run with `--noconftest` because the repository conftest eagerly imports unavailable `asyncpg` in this workspace.
- Lockerphycer: same expected import error after supplying the test-only required `SECRET_KEY` environment value.

## Fresh GREEN verification

All of the following passed after implementation and immediately before commit:

```text
C:\Users\antho\.windsurf\cappo-backend
  .venv\Scripts\python.exe -m pytest tests/test_capi_registration.py -q
  1 passed (one unrelated websockets deprecation warning)
  .venv\Scripts\python.exe -m ruff check cappo_backend/services/capi_registration.py tests/test_capi_registration.py
  All checks passed

C:\Users\antho\.windsurf\gnomledger
  PYTHONPATH=backend py -m pytest --noconftest backend/tests/test_capi_registration.py -q
  1 passed
  py -m ruff check backend/app/services/capi_registration.py backend/tests/test_capi_registration.py
  All checks passed

C:\Users\antho\.windsurf\veklom-byos-backend-2
  py -m pytest --noconftest backend/tests/test_byos_protocol_registration.py -q
  4 passed
  py -m ruff check backend/core/services/capi_registration.py backend/tests/test_byos_protocol_registration.py
  All checks passed

C:\Users\antho\.windsurf\lockerphycer
  py -m pytest tests/test_capi_registration.py -q
  1 passed
  py -m ruff check core/utils/capi_registration.py tests/test_capi_registration.py
  All checks passed
```

`compileall` succeeded for every changed registration/lifespan module. Scoped `git diff --check` passed before every commit. CAPPO contained pre-existing unrelated unstaged work, which was not staged or committed. BYOS contained an unrelated untracked `fix_discovery.py`, which was not staged or committed.

## Concerns / environment limitations

- PGL's normal test conftest only imports when `backend` is on `PYTHONPATH`; focused verification uses that setting and disables conftest because the test does not require database fixtures.
- BYOS's normal conftest imports `asyncpg`, which is absent from the available global Python environment; its legacy `.venv` points to a removed Python 3.11 installation. Its focused protocol-registration suite passes under the available interpreter with `--noconftest`.
- Whole-file Ruff on BYOS and Lockerphycer lifespan modules reports many pre-existing import/format issues outside this task. Changed registration modules and focused tests are Ruff-clean; `compileall` validates the changed lifespans.
- A requested automated review agent could not start because the configured reviewer model is unsupported in this Codex account. A manual requirement-by-requirement diff review was completed instead.

## Follow-up — cAPI heartbeat authentication

The cAPI heartbeat mutation route now uses the same shared `checkRegistryAuth` helper as registration. When `CAPI_REGISTRY_TOKEN` is configured, missing or incorrect bearer credentials return `401` before `heartbeatService` is called. When the token is absent outside `local`, `development`, or `test`, both registration and heartbeat return `503` with the same fail-closed configuration error. Valid Bearer credentials retain the existing `200` heartbeat behavior.

### RED evidence

Before the change, `npx vitest run src/app/api/v1/registry/register/route.test.ts --reporter=verbose` produced two expected failures:

```text
requires the registry bearer before heartbeating a registered service
  expected 200 to be 401
fails closed before heartbeating when registry authentication is absent in production
  expected 404 to be 503
```

### GREEN evidence

After extracting the shared helper and applying it before the heartbeat engine mutation:

```text
npx vitest run src/app/api/v1/registry/register/route.test.ts --reporter=verbose
  Test Files  1 passed (1)
  Tests  13 passed (13)

npx tsc --noEmit
  exit 0
```

The new route test spies on `getEngine().heartbeatService`: missing and wrong bearers return `401` with zero engine calls; a valid bearer returns `200` with exactly one call. No route was added and no deployment/push was performed.

Committed in `C:\Users\antho\.windsurf\cAPI` as `d0c4d7e` (`fix: protect capi registry heartbeats`). The repository's ESLint 10 invocation is currently blocked by the absence of an `eslint.config.*` flat-config file; this is independent of the change. TypeScript verification and the focused route suite pass.

## Follow-up — explicit 404 recovery coverage

Each registration-client focused suite now includes a `[201, 404, 201]` transport scenario. It asserts the exact sequence `register → heartbeat → register`, sets the stop event immediately after the third call, and awaits the maintainer task to prove clean cancellation.

The maintainer behavior was implemented and committed before this coverage gap was identified (`c287c48`, `9c16ccf`, `076f1270`, `9b84cee`), so the newly added test passed immediately rather than producing a legitimate new RED failure. The original RED evidence remains the prior missing-maintainer import failures documented above; no working runtime behavior was intentionally regressed to manufacture a failure.

Fresh verification:

```text
CAPPO: .venv\Scripts\python.exe -m pytest tests/test_capi_registration.py -q
  2 passed (one unrelated websockets deprecation warning)
PGL: PYTHONPATH=backend py -m pytest --noconftest backend/tests/test_capi_registration.py -q
  2 passed
BYOS: py -m pytest --noconftest backend/tests/test_byos_protocol_registration.py -q
  5 passed
Lockerphycer: py -m pytest tests/test_capi_registration.py -q
  2 passed
```

Focused Ruff checks passed for every changed test file. Commits: CAPPO `5fc18c8`, PGL `0354e44`, BYOS `cdd8a378`, Lockerphycer `7693db0`. No deployment or push was performed.
