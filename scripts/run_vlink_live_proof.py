"""Run and preserve a secret-free public VLink machine + human proof."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from playwright.sync_api import sync_playwright


BASE_URL = "https://veklom.com"
ARTIFACT_DIR = Path("artifacts/m1-p2/vlink")


def call(
    method: str,
    path: str,
    *,
    payload: dict[str, Any] | None = None,
    bearer: str | None = None,
) -> tuple[int, dict[str, Any]]:
    body = json.dumps(payload).encode() if payload is not None else None
    headers = {"content-type": "application/json"}
    if bearer:
        headers["authorization"] = f"Bearer {bearer}"
    request = Request(f"{BASE_URL}{path}", data=body, headers=headers, method=method)
    try:
        with urlopen(request, timeout=30) as response:
            return response.status, json.loads(response.read().decode())
    except HTTPError as error:
        return error.code, json.loads(error.read().decode())


def main() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    started_at = datetime.now(UTC).isoformat()
    proof: dict[str, Any] = {
        "version": "vlink-live-proof.v1",
        "started_at": started_at,
        "public_base_url": BASE_URL,
        "status": "INVALID",
        "steps": {},
    }

    try:
        create_status, created = call(
            "POST",
            "/api/v1/vlinks",
            payload={
                "workspaceId": "m1-p2-live-proof",
                "environment": "production",
                "displayName": "M1 P2 live proof",
                "sourceType": "ai-client",
            },
        )
        vlink_id = created["vlink"]["vlinkId"]
        enrollment_token = created["enrollmentGrant"]["token"]
        proof["vlink_id"] = vlink_id
        proof["steps"]["machine_create"] = {
            "status": create_status,
            "created": create_status == 201,
            "connection_status": created["vlink"].get("connectionStatus"),
            "enrollment_status": created["vlink"].get("enrollmentStatus"),
        }

        unscoped_status, unscoped = call(
            "POST",
            f"/api/v1/vlinks/{vlink_id}/pairing",
            payload={"ttlSeconds": 600},
        )
        proof["steps"]["pairing_without_grant_denied"] = {
            "status": unscoped_status,
            "error": unscoped.get("error"),
        }

        pairing_status, pairing_body = call(
            "POST",
            f"/api/v1/vlinks/{vlink_id}/pairing",
            payload={"ttlSeconds": 600},
            bearer=enrollment_token,
        )
        pairing = pairing_body["pairing"]
        pairing_id = pairing["pairingId"]
        device_code = pairing["deviceCode"]
        approval_url = pairing["qrPayload"]
        proof["pairing_id"] = pairing_id
        proof["steps"]["machine_pairing_request"] = {
            "status": pairing_status,
            "created": pairing_status == 201,
            "pairing_state": pairing.get("status"),
        }

        early_status, early = call(
            "POST",
            f"/api/v1/vlinks/{vlink_id}/pairing/{pairing_id}/exchange",
            payload={"deviceCode": device_code},
        )
        proof["steps"]["exchange_before_human_denied"] = {
            "status": early_status,
            "error": early.get("error"),
        }

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()
            response = page.goto(approval_url, wait_until="networkidle")
            proof["steps"]["human_pairing_page"] = {
                "status": response.status if response else None,
                "title": page.title(),
                "approval_ui_visible": page.get_by_role(
                    "button", name="Approve pairing"
                ).is_visible(),
            }
            page.screenshot(path=ARTIFACT_DIR / "human-approval-before.png", full_page=True)
            page.get_by_role("button", name="Approve pairing").click()
            page.get_by_text("Pairing approved", exact=True).wait_for(timeout=15_000)
            page.screenshot(path=ARTIFACT_DIR / "human-approval-after.png", full_page=True)
            proof["steps"]["human_approval"] = {
                "approved": True,
                "confirmation_visible": True,
            }
            browser.close()

        status_status, current = call(
            "GET", f"/api/v1/vlinks/{vlink_id}/pairing/{pairing_id}"
        )
        proof["steps"]["machine_observes_approval"] = {
            "status": status_status,
            "pairing_state": current.get("pairing", {}).get("status"),
        }

        exchange_status, exchanged = call(
            "POST",
            f"/api/v1/vlinks/{vlink_id}/pairing/{pairing_id}/exchange",
            payload={"deviceCode": device_code},
        )
        access_token = exchanged["credential"]["token"]
        credential_id = exchanged["credential"]["credentialId"]
        proof["credential_id"] = credential_id
        proof["steps"]["machine_exchange"] = {
            "status": exchange_status,
            "pairing_state": exchanged.get("pairing", {}).get("status"),
            "scoped_to_vlink": exchanged["credential"].get("vlinkId") == vlink_id,
            "expires_at": exchanged["credential"].get("expiresAt"),
        }

        no_token_status, no_token = call(
            "POST", f"/api/v1/vlinks/{vlink_id}/test", payload={}
        )
        proof["steps"]["vlink_id_alone_denied"] = {
            "status": no_token_status,
            "error": no_token.get("error"),
        }

        test_status, test = call(
            "POST",
            f"/api/v1/vlinks/{vlink_id}/test",
            payload={},
            bearer=access_token,
        )
        proof["steps"]["scoped_operation"] = {
            "status": test_status,
            "ok": test.get("ok") is True,
            "event_id": test.get("event", {}).get("eventId"),
            "event_status": test.get("event", {}).get("status"),
        }

        revoke_status, revoke = call(
            "POST",
            f"/api/v1/vlinks/{vlink_id}/access/revoke",
            payload={},
            bearer=access_token,
        )
        proof["steps"]["revoke"] = {
            "status": revoke_status,
            "credential_status": revoke.get("revoked", {}).get("status"),
        }

        replay_status, replay = call(
            "POST",
            f"/api/v1/vlinks/{vlink_id}/test",
            payload={},
            bearer=access_token,
        )
        proof["steps"]["post_revoke_denied"] = {
            "status": replay_status,
            "error": replay.get("error"),
        }

        checks = [
            create_status == 201,
            unscoped_status == 401,
            pairing_status == 201,
            early_status == 409,
            status_status == 200,
            current.get("pairing", {}).get("status") == "approved",
            exchange_status == 200,
            no_token_status == 401,
            test_status == 200 and test.get("ok") is True,
            revoke_status == 200,
            revoke.get("revoked", {}).get("status") == "revoked",
            replay_status == 401,
        ]
        proof["status"] = "VALID" if all(checks) else "INVALID"
    except Exception as exc:
        proof["failure"] = {"type": type(exc).__name__, "message": str(exc)}

    proof["completed_at"] = datetime.now(UTC).isoformat()
    (ARTIFACT_DIR / "vlink-live-proof.json").write_text(
        json.dumps(proof, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(proof, indent=2))
    if proof["status"] != "VALID":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
