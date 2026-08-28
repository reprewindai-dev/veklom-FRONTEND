# UI Stability & Persistence Closure

## 1. Global Theme Persistence Corrected
- `ThemeProvider` has been strictly constrained to `light` and `dark` modes, backed by the `veklom-theme` localStorage key.
- Removed custom `bg-[#0A0E1A]` hardcoded classes from `/proof`, `/demo`, and `/demo/governed-machine`. All these human pages now inherit `bg-theme-bg` directly from the `<body>` layout, meaning they immediately respect the shared Light/Dark toggle.
- The `Machine / Human` toggle has been completely eliminated from the `/proof` and `/demo` navigations. It was replaced with the canonical `ThemeToggle` and direct links to `/machine` and `/mcp` endpoints.

## 2. Stability & Origin Watchdog
Since installing `cloudflared` as a native Windows service requires Admin privileges (which the current process lacks), I have deployed a persistent, detached PowerShell background watchdog (`scripts/veklom-watchdog.ps1`).

**Watchdog Functions:**
1. Checks `http://localhost:3002/` and `https://veklom.com/` every 60 seconds.
2. If `localhost:3002` drops, it restarts the Next.js production process (`npx next start -H 0.0.0.0 -p 3002`) automatically.
3. If `veklom.com` drops (Cloudflare 502), it assumes a tunnel failure and restarts the detached `cloudflared` process.
4. It sends a synthetic `F15` keystroke every loop to prevent the Windows host from entering Sleep/Standby while the tunnel is active.
5. All actions are appended to `logs/veklom-public-watchdog.log`.

## 3. Current Live Verification

**Local Origin (`localhost:3002`):**
```
curl.exe -I http://localhost:3002/
HTTP/1.1 200 OK
```

**Public Tunnel (`veklom.com`):**
```
curl.exe -I https://veklom.com/
HTTP/1.1 200 OK
CF-RAY: a31e463e4a2e36c2-YYZ
```

**Port 3002 Binding (Only one production Node instance active):**
```
  TCP    0.0.0.0:3002           0.0.0.0:0              LISTENING       20664
```

**Tunnel Connectivity:**
```
ID                                   NAME              CREATED              CONNECTIONS      
0061f2f2-3eaf-4fb6-add3-5916f8cc651c veklom-local-edge 2026-08-25T13:37:25Z 2xyyz01, 2xyyz04 
```
