### Task 1: Keep live cAPI registration truthful

**Files:**
- Modify: `C:\Users\antho\.windsurf\cappo-backend\cappo_backend\services\capi_registration.py`
- Modify: `C:\Users\antho\.windsurf\gnomledger\backend\app\services\capi_registration.py`
- Modify: `C:\Users\antho\.windsurf\veklom-byos-backend-2\backend\core\services\capi_registration.py`
- Modify: `C:\Users\antho\.windsurf\lockerphycer\core\utils\capi_registration.py`
- Test: each repository's existing registration test module, or a new focused `test_capi_registration.py` beside the module.

**Interfaces:**
- Consumes: `POST /api/v1/registry/register` and `POST /api/v1/registry/heartbeat` on cAPI.
- Produces: a running task that re-registers after a missing record and refreshes each accepted registration before `CAPI_REGISTRY_TTL_MS` expires.

- [ ] **Step 1: Write failing tests**

```python
async def test_heartbeat_refreshes_an_existing_registration() -> None:
    transport = RecordingTransport(statuses=[201, 200])
    stop = asyncio.Event()
    task = asyncio.create_task(maintain_capi_registration(settings, stop, transport))
    await transport.wait_for_calls(2)
    stop.set()
    await task
    assert transport.paths == ["/api/v1/registry/register", "/api/v1/registry/heartbeat"]
```

- [ ] **Step 2: Run each focused test and verify it fails because the maintainer does not exist.**

- [ ] **Step 3: Implement the minimal maintainer**

```python
async def maintain_capi_registration(settings: Settings, stop: asyncio.Event) -> None:
    while not stop.is_set():
        registered = await register_with_capi(settings)
        if registered:
            await heartbeat_until_missing(settings, stop)
        else:
            await asyncio.sleep(RETRY_SECONDS)
```

The heartbeat must re-register only on `404`, must never log the bearer value, and must be cancelled in each FastAPI lifespan shutdown.

- [ ] **Step 4: Run the focused tests and each repository's relevant suite.**

- [ ] **Step 5: Commit each repository independently and deploy only through Coolify.**

