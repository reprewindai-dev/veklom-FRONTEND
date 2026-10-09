"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError, getToken } from "@/lib/api";
import { readSessionCapabilityLease } from "@/lib/cos/lease-session";

/**
 * The operator runtime console (design brief ref-8 "UACP terminal": NL directives, raw tool traces,
 * JSON). It is an alternate interface over the same governed paths, never an authority bypass:
 * every directive is a JSON-RPC call to this site's MCP server (/api/mcp), which forwards
 * consequential tools to the authority layer with the operator's own credential.
 * A refusal is terminal: it is shown with its reason and is never retried or worked around.
 * Log/trace layout harvested from the original QuantumTerminal; its seeded agents, fake boot
 * lines and "bypassing" fallback are not carried over.
 */
type LineKind = "directive" | "info" | "request" | "result" | "deny" | "error";
type Line = { id: number; kind: LineKind; text: string };

type ToolResult = { content?: Array<{ type?: string; text?: string }>; isError?: boolean };
type RpcResponse = { result?: ToolResult & { tools?: Array<{ name: string; description?: string }> }; error?: { code: number; message: string } };

const HELP = [
  "Directives (each is one call to the governed tool server):",
  "  tools                      list the tools the server exposes",
  "  discover                   capability packages you can mount",
  "  held                       the grant this browser session holds (no network)",
  "  readback [resource]        independent readback of your bound target",
  "  verify <hash|receipt>      check a receipt or ledger event against the ledger",
  "  doc <name>                 read a public discovery document (manifest, claims, openapi, llms, x402…)",
  "  whoami                     your signed-in identity",
  "  call <tool> {json}         call any tool with JSON arguments",
  "  clear                      clear the screen",
  "Plain-language requests such as \"what can I do\" or \"show my grant\" are mapped to these.",
];

let nextId = 1;

function textOf(result?: ToolResult): string {
  const parts = (result?.content ?? []).map((item) => item.text ?? "").filter(Boolean);
  const joined = parts.join("\n");
  try {
    return JSON.stringify(JSON.parse(joined), null, 2);
  } catch {
    return joined || "(empty result)";
  }
}

/** Map a plain-language request onto a directive. Unrecognised input is never guessed at. */
export function normalizeDirective(input: string): string {
  const text = input.trim();
  const lower = text.toLowerCase();
  if (/^(what can i do|list (capabilities|packages)|show (capabilities|packages))\b/.test(lower)) return "discover";
  if (/^(show|what is|what's) my (grant|lease|mount)\b/.test(lower)) return "held";
  if (/^(who am i|show my (identity|account))\b/.test(lower)) return "whoami";
  if (/^(list tools|what tools)\b/.test(lower)) return "tools";
  return text;
}

export function TerminalSession({ autoFocus = false, className = "" }: { autoFocus?: boolean; className?: string }) {
  const [lines, setLines] = useState<Line[]>([
    { id: nextId++, kind: "info", text: "Veklom operator console. Every directive runs through the governed tool server. Type help." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [lines]);

  const push = (kind: LineKind, text: string) => setLines((current) => [...current, { id: nextId++, kind, text }]);

  async function rpc(method: string, params?: Record<string, unknown>): Promise<RpcResponse> {
    const body = { jsonrpc: "2.0", id: nextId++, method, ...(params ? { params } : {}) };
    push("request", `→ ${method}${params ? ` ${JSON.stringify(params)}` : ""}`);
    return api<RpcResponse>("/api/mcp", { method: "POST", body });
  }

  async function callTool(name: string, args: Record<string, unknown>) {
    const response = await rpc("tools/call", { name, arguments: args });
    if (response.error) {
      // A refusal or missing credential is final. Show it exactly; never retry or bypass.
      push("deny", `REFUSED · ${response.error.message}`);
      return;
    }
    push(response.result?.isError ? "deny" : "result", `${response.result?.isError ? "REFUSED · " : ""}${textOf(response.result)}`);
  }

  async function run(raw: string) {
    const directive = normalizeDirective(raw);
    const [command, ...rest] = directive.split(/\s+/);
    const argument = rest.join(" ").trim();
    switch (command.toLowerCase()) {
      case "help":
        HELP.forEach((line) => push("info", line));
        return;
      case "clear":
        setLines([]);
        return;
      case "tools": {
        const response = await rpc("tools/list");
        if (response.error) { push("error", response.error.message); return; }
        push("result", (response.result?.tools ?? []).map((tool) => `${tool.name}  ${tool.description ?? ""}`).join("\n") || "(no tools returned)");
        return;
      }
      case "discover":
        await callTool("veklom_discover_capabilities", {});
        return;
      case "held": {
        const lease = readSessionCapabilityLease();
        push("result", lease && !lease.terminated
          ? JSON.stringify({ mount_id: lease.mountId, package: lease.packageRef, target: lease.targetRef, resource: lease.resource, project: lease.project, expires_at: lease.expiresAt, grants: lease.grants }, null, 2)
          : "No grant is held in this session. Request one in Authority.");
        return;
      }
      case "readback": {
        const lease = readSessionCapabilityLease();
        if (!lease || lease.terminated) { push("info", "No binding held. Readback is scoped to a held binding; request a grant in Authority first."); return; }
        await callTool("veklom_read_target_state", {
          mount_id: lease.mountId,
          ...(lease.targetRef ? { target_ref: lease.targetRef } : {}),
          ...(argument || lease.resource ? { resource: argument || lease.resource } : {}),
          ...(lease.workspace ? { workspace: lease.workspace } : {}),
        });
        return;
      }
      case "verify": {
        if (!argument) { push("info", "Usage: verify <event hash or rcpt_… receipt id>"); return; }
        await callTool("veklom_verify_evidence", argument.startsWith("rcpt_") ? { receipt_id: argument } : { event_hash: argument });
        return;
      }
      case "doc": {
        if (!argument) { push("info", "Usage: doc <manifest|claims|conformance|evidence_index|openapi|llms|x402>"); return; }
        await callTool("veklom_read_discovery_document", { document: argument });
        return;
      }
      case "whoami": {
        if (!getToken()) { push("info", "Not signed in in this browser tab (or signed in with a browser-only session). Sign in to act."); }
        try {
          const me = await api<Record<string, unknown>>("/api/v1/auth/me");
          push("result", JSON.stringify({ email: me.email, role: me.role, workspace_id: me.workspace_id, status: me.status }, null, 2));
        } catch (error) {
          push("error", error instanceof ApiError ? `${error.status}: ${error.message}` : "Identity unavailable.");
        }
        return;
      }
      case "call": {
        const [tool, ...json] = rest;
        if (!tool) { push("info", "Usage: call <tool> {json arguments}"); return; }
        let args: Record<string, unknown> = {};
        const source = json.join(" ").trim();
        if (source) {
          try {
            args = JSON.parse(source) as Record<string, unknown>;
          } catch {
            push("error", "Arguments must be a JSON object, e.g. {\"mount_id\":\"mnt_…\"}");
            return;
          }
        }
        await callTool(tool, args);
        return;
      }
      default:
        push("info", `Unknown directive "${command}". Nothing was run. Type help.`);
    }
  }

  async function submit() {
    const raw = input.trim();
    if (!raw || busy) return;
    setInput("");
    setHistory((current) => [raw, ...current].slice(0, 50));
    setCursor(-1);
    push("directive", raw);
    setBusy(true);
    try {
      await run(raw);
    } catch (error) {
      push("error", error instanceof ApiError ? `${error.status}: ${error.message}` : error instanceof Error ? error.message : "The directive failed.");
    }
    setBusy(false);
  }

  const color: Record<LineKind, string> = {
    directive: "text-cos-accent",
    info: "text-cos-muted",
    request: "text-cos-steel",
    result: "text-cos-text",
    deny: "text-cos-warn",
    error: "text-cos-danger",
  };

  return (
    <div className={`flex min-h-0 flex-col rounded-lg border border-cos-border bg-cos-bg/30 ${className}`}>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 font-mono text-xs leading-5" role="log" aria-live="polite">
        {lines.map((line) => (
          <pre key={line.id} className={`whitespace-pre-wrap break-words ${color[line.kind]}`}>{line.kind === "directive" ? `› ${line.text}` : line.text}</pre>
        ))}
        {busy ? <div className="text-cos-steel">…</div> : null}
        <div ref={endRef} />
      </div>
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="flex items-center gap-2 border-t border-cos-border px-4 py-3">
        <span className="font-mono text-cos-accent">›</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp" && history.length) { event.preventDefault(); const next = Math.min(cursor + 1, history.length - 1); setCursor(next); setInput(history[next]); }
            if (event.key === "ArrowDown") { event.preventDefault(); const next = cursor - 1; setCursor(next); setInput(next >= 0 ? history[next] : ""); }
          }}
          placeholder="Type a directive, or help"
          aria-label="Terminal directive"
          className="flex-1 bg-transparent font-mono text-sm text-cos-text outline-none placeholder:text-cos-steel/70"
          disabled={busy}
        />
      </form>
    </div>
  );
}
