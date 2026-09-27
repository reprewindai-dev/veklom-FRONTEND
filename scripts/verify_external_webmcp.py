#!/usr/bin/env python3
"""Fresh-runner reproduction of Veklom's public WebMCP consequence lifecycle.

No credentials are used. The only mutations are a uniquely named governed-counter
increment and a denied reset, both observed by read_target_state. Secrets,
single-use tokens, and nonces are never printed or written to the artifact.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import socket
import ssl
import sys
import uuid
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests

ORIGIN = "https://veklom.com"
TIMEOUT = 30
ARTIFACT = Path("external-webmcp-evidence.json")
CHECKS: list[dict] = []
HTTP_TRACE: list[dict] = []
CF_RAYS: set[str] = set()
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Veklom-External-WebMCP-Reproduction/1.0"})
PRIVATE = {"mount_id": None, "mount2_id": None, "token_id": None, "nonce": None,
           "token2_id": None, "nonce2": None, "mount1_terminated": False,
           "mount2_terminated": False}


class StopRun(Exception):
    pass


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            for key, value in attrs:
                if key.lower() == "href" and value:
                    self.hrefs.append(value)


def now():
    return datetime.now(timezone.utc).isoformat()


def safe_url(url: str) -> bool:
    p = urlparse(url)
    return p.scheme == "https" and p.hostname == "veklom.com" and not p.username and not p.password


def request(method: str, url: str, **kwargs):
    if not safe_url(url):
        raise StopRun("discovery returned a URL outside https://veklom.com")
    try:
        response = SESSION.request(method, url, timeout=TIMEOUT, allow_redirects=False, **kwargs)
        ray = response.headers.get("cf-ray")
        if ray:
            CF_RAYS.add(ray)
        HTTP_TRACE.append({"method": method, "path": urlparse(url).path,
                           "status": response.status_code, "cf_ray": ray})
        return response
    except StopRun:
        raise
    except Exception as exc:
        HTTP_TRACE.append({"method": method, "path": urlparse(url).path,
                           "status": None, "error_type": type(exc).__name__})
        raise StopRun(f"HTTP transport failed ({type(exc).__name__})") from None


def require(condition: bool, label: str, detail: str = ""):
    CHECKS.append({"name": label, "status": "PASS" if condition else "FAIL",
                   "detail": detail})
    print(f"[{'PASS' if condition else 'FAIL'}] {label}" +
          (f" — {detail}" if detail else ""))
    if not condition:
        raise StopRun(label)


def discover():
    home = request("GET", ORIGIN + "/")
    require(home.status_code == 200, "Homepage reachable from clean runner",
            f"HTTP {home.status_code}")
    parser = Links()
    parser.feed(home.text)
    machine_link = next((urljoin(ORIGIN + "/", h) for h in parser.hrefs
                         if urlparse(urljoin(ORIGIN + "/", h)).path.rstrip("/") == "/machine"), None)
    require(machine_link is not None and safe_url(machine_link),
            "Machine entrypoint discovered from homepage")
    machine = request("GET", machine_link)
    require(machine.status_code == 200, "Machine entrypoint reachable",
            f"HTTP {machine.status_code}")
    parser = Links()
    parser.feed(machine.text)
    manifest_url = next((urljoin(machine_link, h) for h in parser.hrefs
                         if urlparse(urljoin(machine_link, h)).path == "/mcp/manifest.json"), None)
    static_tools_url = next((urljoin(machine_link, h) for h in parser.hrefs
                            if urlparse(urljoin(machine_link, h)).path == "/mcp/tools.json"), None)
    require(bool(manifest_url and static_tools_url and safe_url(manifest_url)
                 and safe_url(static_tools_url)),
            "MCP manifest and tool catalog discovered from machine page")
    mr = request("GET", manifest_url)
    require(mr.status_code == 200, "MCP manifest fetched", f"HTTP {mr.status_code}")
    manifest = mr.json()
    endpoint_value = manifest.get("rpc_endpoint") or manifest.get("endpoint")
    rpc_url = urljoin(manifest_url, endpoint_value or "")
    require(safe_url(rpc_url), "RPC endpoint derived from manifest")
    tr = request("GET", static_tools_url)
    require(tr.status_code == 200, "Static tools catalog fetched", f"HTTP {tr.status_code}")
    return rpc_url, tr.json()


RPC_ID = 0


def rpc(endpoint: str, method: str, params=None):
    global RPC_ID
    RPC_ID += 1
    payload = {"jsonrpc": "2.0", "id": RPC_ID, "method": method}
    if params is not None:
        payload["params"] = params
    response = request("POST", endpoint, json=payload,
                       headers={"Content-Type": "application/json"})
    if response.status_code != 200:
        raise StopRun(f"JSON-RPC HTTP {response.status_code} for {method}")
    try:
        body = response.json()
    except Exception:
        raise StopRun(f"JSON-RPC returned non-JSON for {method}") from None
    if body.get("error"):
        err = body["error"]
        code = err.get("code") if isinstance(err, dict) else None
        raise StopRun(f"JSON-RPC error for {method} (code={code})")
    return body.get("result")


def decode_tool_result(result):
    if not isinstance(result, dict):
        return result
    if result.get("isError"):
        raise StopRun("tool returned isError=true")
    for item in result.get("content", []):
        if isinstance(item, dict) and isinstance(item.get("text"), str):
            try:
                return json.loads(item["text"])
            except Exception:
                raise StopRun("tool returned non-JSON text") from None
    return result


def call(endpoint, name, arguments):
    result = rpc(endpoint, "tools/call", {"name": name, "arguments": arguments})
    return decode_tool_result(result)


def dig(obj, keys):
    if isinstance(obj, dict):
        for key in keys:
            if obj.get(key) is not None:
                return obj[key]
        for value in obj.values():
            found = dig(value, keys)
            if found is not None:
                return found
    elif isinstance(obj, list):
        for value in obj:
            found = dig(value, keys)
            if found is not None:
                return found
    return None


def find_receipt(obj):
    keys = ("receipt_id", "event_hash", "evidence_hash", "decision_hash")
    if isinstance(obj, dict):
        for key in keys:
            value = obj.get(key)
            if isinstance(value, str) and value:
                return key, value
        for value in obj.values():
            found = find_receipt(value)
            if found:
                return found
    elif isinstance(obj, list):
        for value in obj:
            found = find_receipt(value)
            if found:
                return found
    return None


def discover_public_runtime():
    url = ORIGIN + "/api/proof/live"
    try:
        response = request("GET", url)
        if response.status_code != 200:
            return {"http_status": response.status_code, "deployment_sha": None,
                    "source_sha": None, "observed_at": None}
        data = response.json()
        sha_keys = ("deployment_sha", "deploy_sha", "runtime_sha", "commit_sha",
                    "source_sha", "git_sha", "revision")
        sha_pattern = re.compile(r"^(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{64})$")
        candidates = []
        def walk(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if key.lower() in sha_keys and isinstance(value, str) and sha_pattern.fullmatch(value):
                        candidates.append((key.lower(), value.lower()))
                    walk(value)
            elif isinstance(obj, list):
                for value in obj:
                    walk(value)
        walk(data)
        deployment = next((v for k, v in candidates if k in
                           ("deployment_sha", "deploy_sha", "runtime_sha", "commit_sha", "git_sha", "revision")), None)
        source = next((v for k, v in candidates if k == "source_sha"), None)
        return {"http_status": response.status_code, "deployment_sha": deployment,
                "source_sha": source, "observed_at": data.get("observedAt")}
    except Exception:
        return {"http_status": None, "deployment_sha": None, "source_sha": None,
                "observed_at": None}


def provenance():
    hosts = {"veklom.com"}
    rpc_host = urlparse(ORIGIN).hostname
    if rpc_host:
        hosts.add(rpc_host)
    dns = {}
    for host in sorted(hosts):
        try:
            dns[host] = sorted({item[4][0] for item in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)})
        except Exception as exc:
            dns[host] = {"error_type": type(exc).__name__}
    tls = {}
    for host in sorted(hosts):
        try:
            context = ssl.create_default_context()
            with socket.create_connection((host, 443), timeout=TIMEOUT) as raw:
                with context.wrap_socket(raw, server_hostname=host) as sock:
                    cert = sock.getpeercert(binary_form=True)
                    tls[host] = {"verified": True, "version": sock.version(),
                                 "cipher": sock.cipher()[0] if sock.cipher() else None,
                                 "peer_certificate_sha256": hashlib.sha256(cert).hexdigest()}
        except Exception as exc:
            tls[host] = {"verified": False, "error_type": type(exc).__name__}
    public_ip = None
    try:
        ipr = requests.get("https://api.ipify.org", timeout=10)
        if ipr.status_code == 200 and re.fullmatch(r"[0-9a-fA-F:.]+", ipr.text.strip()):
            public_ip = ipr.text.strip()
    except Exception:
        pass
    runtime = discover_public_runtime()
    return {
        "captured_at_utc": now(),
        "runner": {"provider": "GitHub Actions hosted runner",
                   "github_runner_environment": os.getenv("RUNNER_ENVIRONMENT"),
                   "runner_os": os.getenv("RUNNER_OS"), "runner_arch": os.getenv("RUNNER_ARCH"),
                   "runner_name": os.getenv("RUNNER_NAME"), "hostname": socket.gethostname(),
                   "repository": os.getenv("GITHUB_REPOSITORY"),
                   "run_id": os.getenv("GITHUB_RUN_ID"),
                   "run_attempt": os.getenv("GITHUB_RUN_ATTEMPT"),
                   "run_url": (f"https://github.com/{os.getenv('GITHUB_REPOSITORY')}/actions/runs/"
                               f"{os.getenv('GITHUB_RUN_ID')}") if os.getenv("GITHUB_REPOSITORY") and os.getenv("GITHUB_RUN_ID") else None,
                   "public_source_ip": public_ip},
        "target": {"origin": ORIGIN, "hostname": "veklom.com", "dns_ipv4_ipv6": dns,
                   "tls": tls, "tls_verification": "Python requests default certificate validation",
                   "cf_rays": sorted(CF_RAYS), "http_trace": HTTP_TRACE},
        "verifier_commit_sha": os.getenv("GITHUB_SHA"),
        "target_source_sha": runtime.get("source_sha"),
        "runtime_deployment_sha": runtime.get("deployment_sha"),
        "verifier_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "runtime": runtime,
    }


def main():
    started = now()
    evidence = {"schema": "veklom.external-webmcp-reproduction.v1",
                "classification": "INDEPENDENT_EXTERNAL_REPRODUCTION_CANDIDATE",
                "started_at_utc": started, "checks": CHECKS, "status": "INCOMPLETE"}
    try:
        rpc_url, static_catalog = discover()
        static_tools = static_catalog.get("tools", [])
        live_result = rpc(rpc_url, "tools/list")
        live_tools = (live_result or {}).get("tools", [])
        live_names = sorted(t.get("name", "") for t in live_tools)
        require(bool(live_names), "Live tools/list reached from hosted runner")
        static_names = sorted(t.get("name", "") for t in static_tools)
        require(live_names == static_names, "Live/static tool catalog parity",
                f"live={len(live_names)} static={len(static_names)}")
        required_tools = {"veklom_mount_capability", "veklom_execute_action",
                          "veklom_read_target_state", "veklom_verify_evidence",
                          "veklom_terminate_mount"}
        require(required_tools.issubset(set(live_names)),
                "Consequence lifecycle tools present",
                f"required={len(required_tools)} live={len(live_names)}")

        workspace = "external-" + uuid.uuid4().hex[:16]
        mount = call(rpc_url, "veklom_mount_capability", {
            "package_ref": "veklom.governed-counter@v1", "workspace": workspace,
            "project": "external-webmcp-reproduction"})
        mount_data = mount.get("mount", {}) if isinstance(mount, dict) else {}
        token_data = mount.get("token", {}) if isinstance(mount, dict) else {}
        PRIVATE.update({"mount_id": mount_data.get("id"),
                        "token_id": token_data.get("token_id"),
                        "nonce": token_data.get("nonce")})
        require(mount.get("decision") == "allow" and all(PRIVATE[k] for k in
                ("mount_id", "token_id", "nonce")), "Mount capability",
                f"decision={mount.get('decision')}")

        baseline = call(rpc_url, "veklom_read_target_state",
                        {"mount_id": PRIVATE["mount_id"], "workspace": workspace})
        v0 = dig(baseline, ("value",))
        require(isinstance(v0, int), "Baseline readback", "integer state observed")

        allowed_payload = {"mount_id": PRIVATE["mount_id"], "token_id": PRIVATE["token_id"],
                           "nonce": PRIVATE["nonce"], "action": "counter.increment",
                           "workspace": workspace}
        allowed = call(rpc_url, "veklom_execute_action", allowed_payload)
        require(allowed.get("decision") == "allow", "Allowed action decision",
                f"decision={allowed.get('decision')}")

        after_allowed = call(rpc_url, "veklom_read_target_state",
                             {"mount_id": PRIVATE["mount_id"], "workspace": workspace})
        v1 = dig(after_allowed, ("value",))
        require(isinstance(v1, int) and v1 == v0 + 1,
                "Independent readback proves allowed delta +1",
                f"v0={v0} v1={v1}")

        receipt = find_receipt(allowed)
        receipt_id = receipt[1] if receipt and "hash" not in receipt[0] else None
        event_hash = receipt[1] if receipt and "hash" in receipt[0] else None
        require(bool(receipt), "Execution response contains evidence reference",
                f"field={receipt[0] if receipt else 'missing'}")
        verify_args = {"event_hash": event_hash} if event_hash else {"receipt_id": receipt_id}
        verified = call(rpc_url, "veklom_verify_evidence", verify_args)
        verified_ok = bool(verified.get("verified") or verified.get("valid")
                           or verified.get("decision") == "verified"
                           or (verified.get("status") == "confirmed" and verified.get("verified") is True))
        require(verified_ok, "PGL evidence verifies independently",
                f"verified={bool(verified.get('verified'))} status={verified.get('status')}")

        mount2 = call(rpc_url, "veklom_mount_capability", {
            "package_ref": "veklom.governed-counter@v1", "workspace": workspace,
            "project": "external-webmcp-negative-control"})
        m2, t2 = mount2.get("mount", {}), mount2.get("token", {})
        PRIVATE.update({"mount2_id": m2.get("id"), "token2_id": t2.get("token_id"),
                        "nonce2": t2.get("nonce")})
        require(mount2.get("decision") == "allow" and all(PRIVATE[k] for k in
                ("mount2_id", "token2_id", "nonce2")), "Negative-control mount")
        forbidden = call(rpc_url, "veklom_execute_action", {
            "mount_id": PRIVATE["mount2_id"], "token_id": PRIVATE["token2_id"],
            "nonce": PRIVATE["nonce2"], "action": "counter.reset", "workspace": workspace})
        require(forbidden.get("decision") == "deny", "Forbidden action denied",
                f"decision={forbidden.get('decision')}")

        after_forbidden = call(rpc_url, "veklom_read_target_state",
                               {"mount_id": PRIVATE["mount2_id"], "workspace": workspace})
        v2 = dig(after_forbidden, ("value",))
        require(isinstance(v2, int) and v2 == v1,
                "Independent readback proves forbidden delta 0", f"v1={v1} v2={v2}")

        term1 = call(rpc_url, "veklom_terminate_mount",
                     {"mount_id": PRIVATE["mount_id"], "workspace": workspace,
                      "reason": "external_reproduction_complete"})
        PRIVATE["mount1_terminated"] = term1.get("decision") == "allow"
        term2 = call(rpc_url, "veklom_terminate_mount",
                     {"mount_id": PRIVATE["mount2_id"], "workspace": workspace,
                      "reason": "external_reproduction_complete"})
        PRIVATE["mount2_terminated"] = term2.get("decision") == "allow"
        require(PRIVATE["mount1_terminated"] and PRIVATE["mount2_terminated"],
                "Both test mounts terminated")

        replay = call(rpc_url, "veklom_execute_action", allowed_payload)
        require(replay.get("decision") == "deny", "Exact original action replay denied",
                f"decision={replay.get('decision')}")

        final_state = call(rpc_url, "veklom_read_target_state",
                           {"mount_id": PRIVATE["mount_id"], "workspace": workspace})
        v3 = dig(final_state, ("value",))
        require(isinstance(v3, int) and v3 == v2,
                "Final independent readback proves replay delta 0",
                f"v2={v2} v3={v3}")

        provenance_data = provenance()
        evidence.update({"status": "LIFECYCLE_PASS_PROVENANCE_REVIEW",
                         "finished_at_utc": now(), "workspace_label": workspace,
                         "receipt_id": receipt_id, "event_hash": event_hash,
                         "state_values": {"before": v0, "after_allowed": v1,
                                          "after_forbidden": v2, "after_replay": v3},
                         "provenance": provenance_data})
        missing_runtime_sha = not provenance_data["runtime"].get("deployment_sha")
        if missing_runtime_sha:
            evidence["status"] = "LIFECYCLE_PASS_RUNTIME_SHA_NOT_PUBLISHED"
            print("[INCOMPLETE] Public runtime endpoint did not expose a verifiable deployment SHA.")
        else:
            evidence["status"] = "PASS"
        return 2 if missing_runtime_sha else 0
    except StopRun as exc:
        evidence.update({"status": "FAIL", "failure": str(exc),
                         "finished_at_utc": now()})
        return 1
    except Exception as exc:
        evidence.update({"status": "FAIL", "failure_type": type(exc).__name__,
                         "finished_at_utc": now()})
        return 1
    finally:
        # Best-effort cleanup on partial failure; credentials are never logged.
        if PRIVATE["mount_id"] and not PRIVATE["mount1_terminated"]:
            try:
                # Resolve endpoint again from the public manifest if discovery got far enough.
                manifest_response = request("GET", ORIGIN + "/mcp/manifest.json")
                manifest = manifest_response.json()
                endpoint = urljoin(ORIGIN + "/", manifest.get("rpc_endpoint") or manifest.get("endpoint", ""))
                if safe_url(endpoint):
                    call(endpoint, "veklom_terminate_mount",
                         {"mount_id": PRIVATE["mount_id"], "reason": "verifier_cleanup"})
            except Exception:
                pass
        if PRIVATE["mount2_id"] and not PRIVATE["mount2_terminated"]:
            try:
                manifest_response = request("GET", ORIGIN + "/mcp/manifest.json")
                manifest = manifest_response.json()
                endpoint = urljoin(ORIGIN + "/", manifest.get("rpc_endpoint") or manifest.get("endpoint", ""))
                if safe_url(endpoint):
                    call(endpoint, "veklom_terminate_mount",
                         {"mount_id": PRIVATE["mount2_id"], "reason": "verifier_cleanup"})
            except Exception:
                pass
        evidence["checks"] = CHECKS
        evidence["finished_at_utc"] = evidence.get("finished_at_utc") or now()
        evidence["provenance"] = evidence.get("provenance") or provenance()
        evidence["verifier_commit_sha"] = os.getenv("GITHUB_SHA")
        evidence.setdefault("receipt_id", None)
        evidence.setdefault("event_hash", None)
        ARTIFACT.write_text(json.dumps(evidence, indent=2, sort_keys=True) + "\n",
                            encoding="utf-8")
        passed = sum(1 for check in CHECKS if check["status"] == "PASS")
        print(f"\nLifecycle checks: {passed}/{len(CHECKS)}; evidence: {ARTIFACT}")


if __name__ == "__main__":
    sys.exit(main())
