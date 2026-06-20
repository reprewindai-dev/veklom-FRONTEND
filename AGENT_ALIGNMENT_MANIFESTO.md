# 🚨 VEKLOM AGENT ALIGNMENT MANIFESTO 🚨

> **CRITICAL INSTRUCTION FOR ALL AI AGENTS:**  
> Read this document in its entirety before taking ANY actions, modifying ANY files, or attempting to deploy ANY services. This is the **immutable source of truth** for the Veklom architecture.

---

## 1. The Canonical Source of Truth (Repositories)

Historically, this project suffered from extreme repository fragmentation (e.g., `veklom-byos-backend-old`, `-2`, etc.). **Those have been permanently deleted.** If you find any duplicate repositories, you are looking at stale data.

The ONLY valid repositories for this project are:
1. **Veklom Backend:** `C:\Users\antho\.windsurf\veklom-byos-backend`
   *This is the core FastAPI engine, MCP interface, and hosts the Next.js control plane via static mounts.*
2. **Cappo Backend:** `C:\Users\antho\.windsurf\cappo-backend`
   *This is the zero-trust governance authority (MCPAPI v2).*
3. **Veklom Control Plane:** `C:\Users\antho\.windsurf\veklom-control-plane`
   *This is the Next.js frontend code. It gets built and copied into the backend to be served.*

**RULE 1:** NEVER create duplicate repositories, `-old` copies, or backup folders. If you need to revert code, use Git.

---

## 2. Infrastructure & Deployment Architecture

### Server Environment
- **Provider:** Hetzner
- **Primary Server IP:** `5.78.135.11`
- **Orchestration:** Coolify

### Cloudflare Proxy Rules
Cloudflare sits in front of the infrastructure as a **DNS and SSL proxy ONLY**. 
- **RULE 2:** We do NOT use Cloudflare Pages. We do NOT use Cloudflare Workers. 
- All traffic routes directly through Cloudflare to the Hetzner Server via Coolify.
- SSL termination happens at Cloudflare (Full Mode) and Coolify handles internal routing.

### Coolify Services
The entire suite runs on Hetzner Server 1 (`5.78.135.11`) via Coolify:
1. **`veklom-byos-backend`** (Live on `api.veklom.com`)
   - The FastAPI backend server. 
2. **`veklom-control-plane`** (Live on `control.veklom.com`)
   - **Important:** The frontend and backend are completely decoupled. The Next.js control plane is deployed as a standalone Docker container via Coolify. It is NOT served by FastAPI.
3. **`cappo-backend`** (Live on Port `8000`)
   - Domain: `cappo.veklom.com`
   - This database (`cappodb`) is completely isolated from the main Veklom backend database.

---

**RULE 2:** We do NOT use Cloudflare Pages. All traffic routes directly through Cloudflare (DNS Only) to the Hetzner Server via Coolify.

## 3. Authentication & Access Keys

To prevent credential leakage in this document, all SSH keys, API tokens, and Coolify access keys are stored in the local environment variables.

- **For Coolify/Hetzner Access:** Read the `.env` variables or reference `coolify_deployment_reference.md` located in the artifacts directory.
- **For Database Access:** Use the `DATABASE_URL` found in the root `.env` files of each respective repository.

---

## 4. Agent Operating Protocol

When the user asks you to implement a feature, fix a bug, or check a deployment:
1. **Verify Context:** Confirm you are in the correct canonical repository (`veklom-byos-backend`, `cappo-backend`, or `veklom-control-plane`).
2. **Check Coolify:** The Next.js app is a separate service on Coolify. If you make code changes here, they must be pushed to GitHub to trigger a Coolify deployment.
3. **Frontend Edits:** Do NOT attempt to build and copy the `out/` folder into the backend repository. The backend does not serve the Next.js app anymore. Ensure `NEXT_PUBLIC_API_BASE_URL` is configured in Coolify pointing to `https://api.veklom.com`.

**END OF MANIFESTO**
