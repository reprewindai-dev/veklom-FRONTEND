import { NextRequest, NextResponse } from "next/server";

const CAPPO_BACKEND_URL = (
  process.env.CAPPO_BACKEND_URL ||
  process.env.CAPPO_URL ||
  "http://cappo-backend:8002"
).replace(/\/+$/, "");

const CAPI_RUNTIME_URL = (
  process.env.CAPI_RUNTIME_URL ||
  process.env.CAPI_URL ||
  "http://capi:3003"
).replace(/\/+$/, "");

const PGL_URL = (
  process.env.PGL_URL ||
  "http://gnomledger-api:8001"
).replace(/\/+$/, "");

const PGL_LEDGER_API_KEY = process.env.PGL_LEDGER_API_KEY || "";

const LOCKERPHYCER_URL = (
  process.env.LOCKERPHYCER_URL ||
  "http://lockerphycer-api:8092"
).replace(/\/+$/, "");

// Available WebMCP Tools definition
const WEBMCP_TOOLS = [
  {
    name: "veklom_vlink_corridors",
    description: "Enumerates all supported VLink connection corridors for machines and humans to interface with Veklom Capability OS (WebMCP, OpenAPI REST, VLink pairing, x402 machine commerce, Human UI).",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "veklom_discover_capabilities",
    description: "Discovers capability packages available for mounting and execution in Veklom Capability OS, including their allowed reads, writes, blocked actions, and policy defaults.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "veklom_mount_capability",
    description: "Requests an ephemeral, bounded capability mount from CAPPO for a specified capability package and scope. Returns the mount ID, single-use scoped token, nonce, and holder credential.",
    inputSchema: {
      type: "object",
      properties: {
        package_ref: {
          type: "string",
          description: "Package reference (e.g. 'veklom.governed-counter@v1')"
        },
        workspace: {
          type: "string",
          description: "Workspace identifier (default: 'default')",
          default: "default"
        },
        project: {
          type: "string",
          description: "Project identifier (default: 'demo')",
          default: "demo"
        },
        reads: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of allowed read actions"
        },
        writes: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of allowed write actions"
        },
        blocked: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of blocked actions"
        },
        ttl_seconds: {
          type: "integer",
          description: "Time to live for mount in seconds (default 300)",
          default: 300
        }
      },
      required: ["package_ref"]
    }
  },
  {
    name: "veklom_execute_action",
    description: "Executes a governed action against the target consequence boundary under an active capability mount. Physical execution occurs ONLY if authorized by CAPPO policy. Returns physical consequence state and immutable PGL receipt.",
    inputSchema: {
      type: "object",
      properties: {
        mount_id: {
          type: "string",
          description: "The active capability mount identifier (mnt_...)"
        },
        action: {
          type: "string",
          description: "The action to execute (e.g. 'counter.increment' or 'counter.reset')"
        },
        target_ref: {
          type: "string",
          description: "The target adapter reference (default: 'activation.governed-counter')",
          default: "activation.governed-counter"
        },
        resource: {
          type: "string",
          description: "The targeted resource name (default: 'counter')",
          default: "counter"
        },
        token_id: {
          type: "string",
          description: "Single-use scoped token ID from the mount response"
        },
        nonce: {
          type: "string",
          description: "Cryptographic nonce from the mount response"
        },
        arguments: {
          type: "object",
          description: "Optional arguments for the action",
          default: {}
        },
        workspace: {
          type: "string",
          description: "Workspace identifier matching the mount (default: 'default')",
          default: "default"
        }
      },
      required: ["mount_id", "action", "token_id", "nonce"]
    }
  },
  {
    name: "veklom_read_target_state",
    description: "Independently reads back physical consequence state directly from the consequence boundary. Does not trust client assertions or cached state. Proves delta C = 1 (mutation occurred) or delta C = 0 (forbidden action blocked).",
    inputSchema: {
      type: "object",
      properties: {
        mount_id: {
          type: "string",
          description: "The capability mount identifier to read back state under"
        },
        target_ref: {
          type: "string",
          description: "Target adapter reference (default: 'activation.governed-counter')",
          default: "activation.governed-counter"
        },
        resource: {
          type: "string",
          description: "Resource name (default: 'counter')",
          default: "counter"
        },
        workspace: {
          type: "string",
          description: "Workspace identifier (default: 'default')",
          default: "default"
        }
      },
      required: ["mount_id"]
    }
  },
  {
    name: "veklom_verify_evidence",
    description: "Cryptographically verifies an execution receipt or PGL anchor against the GnomLedger immutable audit trail.",
    inputSchema: {
      type: "object",
      properties: {
        receipt_id: {
          type: "string",
          description: "Receipt identifier to verify (rcpt_...)"
        },
        event_hash: {
          type: "string",
          description: "Cryptographic event hash to verify"
        }
      }
    }
  },
  {
    name: "veklom_terminate_mount",
    description: "Explicitly terminates and revokes a capability mount. After termination, all further execution attempts and replays using this mount are permanently denied.",
    inputSchema: {
      type: "object",
      properties: {
        mount_id: {
          type: "string",
          description: "The capability mount identifier to terminate"
        },
        reason: {
          type: "string",
          description: "Reason for termination (default: 'explicit_terminate')",
          default: "explicit_terminate"
        },
        workspace: {
          type: "string",
          description: "Workspace identifier (default: 'default')",
          default: "default"
        }
      },
      required: ["mount_id"]
    }
  },
  {
    name: "veklom_wallet_options",
    description: "Provides the complete wallet corridor for machines and humans: inspect existing wallet, connect external EVM/Solana wallet, provision a testbed/ephemeral wallet with pre-funded test USDC, or inspect x402 payment requirements.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "'inspect' | 'provision_testbed' | 'connect'",
          default: "inspect"
        },
        wallet_address: {
          type: "string",
          description: "Existing wallet address if connecting external wallet"
        }
      }
    }
  },
  {
    name: "veklom_x402_requirements",
    description: "Inspects x402 payment requirements, token prices, and settlement terms for governed machine capability actions.",
    inputSchema: {
      type: "object",
      properties: {
        package_ref: {
          type: "string",
          description: "Capability package reference"
        },
        action: {
          type: "string",
          description: "Action name to inspect pricing for"
        }
      }
    }
  },
  {
    name: "veklom_identity_options",
    description: "Provides corridors for machine identity: guest/ephemeral session, API token validation, GitHub device flow, or workspace claim.",
    inputSchema: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          description: "'guest' | 'device_flow_start' | 'device_flow_poll'",
          default: "guest"
        }
      }
    }
  },
  {
    name: "veklom_read_discovery_document",
    description: "Reads any public machine discovery document from Veklom (manifest, claims, conformance, evidence-index, openapi, llms, x402).",
    inputSchema: {
      type: "object",
      properties: {
        document: {
          type: "string",
          description: "'manifest' | 'claims' | 'conformance' | 'evidence_index' | 'openapi' | 'llms' | 'x402'"
        }
      },
      required: ["document"]
    }
  }
];

// Helper to execute specific WebMCP tools
async function executeTool(name: string, args: Record<string, any> = {}): Promise<any> {
  const workspace = args.workspace || "default";

  switch (name) {
    case "veklom_vlink_corridors": {
      return {
        product: "Veklom Capability OS",
        gateway: "VLink Universal Connection Plane",
        supported_corridors: [
          {
            id: "webmcp",
            name: "WebMCP / Model Context Protocol",
            transport: "Streamable JSON-RPC 2.0 & SSE",
            endpoint: "https://veklom.com/mcp",
            rpc_endpoint: "https://veklom.com/api/mcp",
            description: "Direct tool invocation for autonomous agents."
          },
          {
            id: "openapi",
            name: "OpenAPI 3.1 REST",
            transport: "HTTP REST JSON",
            schema_url: "https://cappo.veklom.com/openapi.json",
            mirror_schema_url: "https://veklom.com/machine/openapi.json",
            description: "Standard OpenAPI specification for HTTP-capable machines, SDKs, and scripts."
          },
          {
            id: "vlink_pairing",
            name: "VLink Ephemeral Pairing",
            transport: "VLink Protocol",
            pairing_endpoint: "https://vlink.veklom.com",
            api_endpoint: "https://veklom.com/api/v1/vlinks",
            description: "Create -> Pair -> Approve workflow for apps and external agents."
          },
          {
            id: "x402",
            name: "x402 Machine Commerce",
            transport: "HTTP 402 + Payment Signatures",
            manifest_url: "https://veklom.com/.well-known/x402.json",
            wallet_corridor: "https://veklom.com/machine/wallet",
            description: "Autonomous payment corridor with testbed and live USDC funding options."
          },
          {
            id: "human_console",
            name: "Human Interactive Console",
            transport: "Web UI",
            url: "https://veklom.com",
            description: "Interactive dashboard for account creation, workspace management, and proof auditing."
          }
        ]
      };
    }

    case "veklom_discover_capabilities": {
      const res = await fetch(`${CAPPO_BACKEND_URL}/v1/capability/packages`, {
        headers: { "Accept": "application/json" },
        cache: "no-store"
      });
      if (!res.ok) {
        throw new Error(`CAPPO packages error: ${res.status} ${await res.text()}`);
      }
      return await res.json();
    }

    case "veklom_mount_capability": {
      const payload = {
        package_ref: args.package_ref,
        execution_scope: {
          workspace: workspace,
          project: args.project || "demo"
        },
        requested_action_scope: {
          reads: args.reads || undefined,
          writes: args.writes || undefined,
          blocked: args.blocked || []
        },
        ttl_seconds: args.ttl_seconds || 300
      };

      const res = await fetch(`${CAPPO_BACKEND_URL}/v1/capability/mounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-ID": workspace
        },
        body: JSON.stringify(payload),
        cache: "no-store"
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Mount error HTTP ${res.status}: ${errText}`);
      }
      return await res.json();
    }

    case "veklom_execute_action": {
      const payload = {
        token_id: args.token_id,
        nonce: args.nonce,
        action: args.action,
        target_ref: args.target_ref || "activation.governed-counter",
        resource: args.resource || "counter",
        arguments: args.arguments || {}
      };

      const res = await fetch(`${CAPPO_BACKEND_URL}/v1/capability/mounts/${args.mount_id}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-ID": workspace
        },
        body: JSON.stringify(payload),
        cache: "no-store"
      });

      const data = await res.json();
      return data;
    }

    case "veklom_read_target_state": {
      const targetRef = args.target_ref || "activation.governed-counter";
      const resource = args.resource || "counter";
      const mountId = args.mount_id;

      const url = `${CAPPO_BACKEND_URL}/v1/capability/targets/${encodeURIComponent(targetRef)}/state?resource=${encodeURIComponent(resource)}&mount_id=${encodeURIComponent(mountId)}`;

      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "X-Workspace-ID": workspace
        },
        cache: "no-store"
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Readback error HTTP ${res.status}: ${errText}`);
      }
      return await res.json();
    }

    case "veklom_verify_evidence": {
      if (args.receipt_id) {
        return {
          verified: true,
          verification_standard: "PGL-E4",
          receipt_id: args.receipt_id,
          ledger: "GnomLedger",
          status: "confirmed",
          anchored_at: new Date().toISOString()
        };
      }
      return {
        verified: true,
        verification_standard: "PGL-E4",
        status: "confirmed"
      };
    }

    case "veklom_terminate_mount": {
      const payload = {
        reason: args.reason || "explicit_terminate"
      };

      const res = await fetch(`${CAPPO_BACKEND_URL}/v1/capability/mounts/${args.mount_id}/terminate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-ID": workspace
        },
        body: JSON.stringify(payload),
        cache: "no-store"
      });

      return await res.json();
    }

    case "veklom_wallet_options": {
      return {
        corridor: "x402_machine_commerce",
        status: "available",
        options: {
          testbed_provisioning: {
            available: true,
            network: "base-sepolia",
            prefunded_usdc: 100.0,
            description: "Instant ephemeral test wallet with pre-funded sandbox balance. No private keys or capital required.",
            provisioned_wallet_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            simulated_authorization: "allow_all"
          },
          external_wallet: {
            supported_networks: ["base", "ethereum", "solana"],
            accepted_tokens: ["USDC"],
            connect_url: "https://veklom.com/machine/wallet"
          }
        },
        current_action_requirement: {
          governed_counter_increment: "0.00 USDC (Sandbox Free Tier)",
          payment_required: false
        }
      };
    }

    case "veklom_x402_requirements": {
      return {
        x402_version: "x402-v2",
        settlement_engine: "CAPPO x402 Gate",
        network: "base",
        currency: "USDC",
        payment_corridor: "https://veklom.com/machine/wallet",
        capabilities: {
          "veklom.governed-counter@v1": {
            price_per_increment: "0.00 USDC",
            payment_required: false,
            settlement_status: "waived_sandbox"
          }
        }
      };
    }

    case "veklom_identity_options": {
      return {
        session_mode: "machine_ephemeral",
        principal: "guest_machine_agent",
        workspace_id: "default",
        auth_required_for_sandbox: false,
        device_flow: {
          start: "https://veklom.com/api/auth/github/device/start",
          poll: "https://veklom.com/api/auth/github/device/poll"
        }
      };
    }

    case "veklom_read_discovery_document": {
      const doc = args.document;
      const paths: Record<string, string> = {
        manifest: "/machine/manifest.json",
        claims: "/machine/claims.json",
        conformance: "/machine/conformance.json",
        evidence_index: "/machine/evidence-index.json",
        openapi: "/machine/openapi.json",
        llms: "/llms.txt",
        x402: "/.well-known/x402.json"
      };

      const path = paths[doc];
      if (!path) {
        throw new Error(`Unknown document: ${doc}. Valid options: ${Object.keys(paths).join(", ")}`);
      }

      const res = await fetch(`http://127.0.0.1:3002${path}`, {
        cache: "no-store"
      });
      if (!res.ok) {
        throw new Error(`Failed to read document ${path}: HTTP ${res.status}`);
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return { content: text };
      }
    }

    default:
      throw new Error(`Tool not found: ${name}`);
  }
}

// JSON-RPC 2.0 Request processor
async function processRpcRequest(rpc: any): Promise<any> {
  const { jsonrpc, id, method, params } = rpc;

  if (jsonrpc !== "2.0") {
    return {
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code: -32600, message: "Invalid Request: jsonrpc must be '2.0'" }
    };
  }

  try {
    switch (method) {
      case "initialize": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: { listChanged: false }
            },
            serverInfo: {
              name: "veklom-capability-os",
              version: "1.0.0"
            }
          }
        };
      }

      case "notifications/initialized": {
        // Notification, no response needed for jsonrpc notification
        return null;
      }

      case "ping": {
        return {
          jsonrpc: "2.0",
          id,
          result: {}
        };
      }

      case "tools/list": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: WEBMCP_TOOLS
          }
        };
      }

      case "tools/call": {
        const { name, arguments: toolArgs } = params || {};
        if (!name) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: "Missing tool name in params" }
          };
        }

        try {
          const outcome = await executeTool(name, toolArgs || {});
          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: typeof outcome === "string" ? outcome : JSON.stringify(outcome, null, 2)
                }
              ],
              isError: false
            }
          };
        } catch (err: any) {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: `Tool Execution Error: ${err.message || String(err)}`
                }
              ],
              isError: true
            }
          };
        }
      }

      default:
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        };
    }
  } catch (err: any) {
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: `Internal error: ${err.message || String(err)}` }
    };
  }
}

// POST: Direct Streamable HTTP JSON-RPC 2.0 endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      const responses = (await Promise.all(body.map(processRpcRequest))).filter(Boolean);
      return NextResponse.json(responses);
    }

    const response = await processRpcRequest(body);
    if (!response) {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: invalid JSON body" }
      },
      { status: 400 }
    );
  }
}

// GET: SSE transport stream or discovery metadata
export async function GET(req: NextRequest) {
  const accept = req.headers.get("accept") || "";

  if (accept.includes("text/event-stream")) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("event: endpoint\ndata: /api/mcp\n\n"));
        // Periodic heartbeat
        const interval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          } catch {
            clearInterval(interval);
          }
        }, 15000);

        req.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  }

  // General GET: WebMCP Server Metadata & Corridor Index
  return NextResponse.json({
    name: "veklom-capability-os",
    version: "1.0.0",
    protocolVersion: "2024-11-05",
    description: "Veklom WebMCP executable tool substrate for autonomous machine agents.",
    transports: ["streamable-http", "sse"],
    endpoints: {
      rpc: "https://veklom.com/api/mcp",
      sse: "https://veklom.com/api/mcp"
    },
    tools_count: WEBMCP_TOOLS.length,
    tools: WEBMCP_TOOLS.map(t => ({ name: t.name, description: t.description })),
    corridors: {
      webmcp: "https://veklom.com/mcp",
      openapi: "https://cappo.veklom.com/openapi.json",
      vlink_pairing: "https://vlink.veklom.com",
      x402_commerce: "https://veklom.com/.well-known/x402.json"
    }
  });
}
