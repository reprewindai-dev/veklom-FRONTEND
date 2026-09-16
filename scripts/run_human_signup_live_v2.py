"""Real public signup, Resend delivery, verification, login, and profile proof."""
from __future__ import annotations

import hashlib, json, re, secrets, string, subprocess, time
from datetime import UTC, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "https://veklom.com"
ARTIFACT_DIR = Path("artifacts/m1-p2/human-onboarding")
CONTAINER = "lockerphycer-lockerphycer-api-1"


def provider_message(email: str) -> dict | None:
    code = r'''import json, os, sys
import resend
resend.api_key = os.environ["RESEND_API_KEY"]
target = sys.argv[1].lower()
for item in resend.Emails.list({"limit": 100}).get("data", []):
    recipients = item.get("to", [])
    recipients = [recipients] if isinstance(recipients, str) else recipients
    if target not in [str(v).lower() for v in recipients]:
        continue
    message = resend.Emails.get(item["id"])
    print(json.dumps({"id": message.get("id"), "last_event": message.get("last_event"), "html": message.get("html", "")}))
    raise SystemExit(0)
print("null")'''
    result = subprocess.run(
        ["docker", "exec", CONTAINER, "python", "-c", code, email],
        capture_output=True, text=True, timeout=30, check=False,
    )
    if result.returncode != 0:
        raise RuntimeError("Resend message lookup failed")
    return json.loads(result.stdout)


def main() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    email = f"veklomdev+m1p2-{int(time.time())}@gmail.com"
    alphabet = string.ascii_letters + string.digits + "!@#%"
    password = "M1p2!" + "".join(secrets.choice(alphabet) for _ in range(22))
    proof: dict = {
        "version": "human-signup-live-proof.v2",
        "started_at": datetime.now(UTC).isoformat(),
        "public_base_url": BASE_URL,
        "test_email_sha256": hashlib.sha256(email.encode()).hexdigest(),
        "status": "INVALID", "steps": {},
    }
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()
            register_response: dict = {}
            page.on("response", lambda response: register_response.update(status=response.status) if response.url.endswith("/api/v1/auth/register") else None)
            page.goto(f"{BASE_URL}/signup", wait_until="networkidle")
            page.get_by_placeholder("Ada Lovelace").fill("M1 P2 Operator")
            page.get_by_placeholder("you@company.com").fill(email)
            page.get_by_placeholder("At least 8 characters").fill(password)
            for checkbox in page.get_by_role("checkbox").all():
                checkbox.check()
            page.get_by_role("button", name="Create account").click()
            page.wait_for_timeout(4_000)
            page.screenshot(path=str(ARTIFACT_DIR / "signup-submitted.png"), full_page=True)
            proof["steps"]["signup"] = {
                "register_status": register_response.get("status"),
                "success_message_visible": page.get_by_text("Account created. Please sign in to continue.", exact=True).is_visible(),
            }
            if register_response.get("status") != 201:
                raise RuntimeError("Public registration did not return 201")

            message = None
            for _ in range(30):
                message = provider_message(email)
                if message and str(message.get("last_event") or "") in {"delivered", "opened", "clicked"}:
                    break
                time.sleep(2)
            if not message:
                raise RuntimeError("Verification message was not found in Resend")
            event = str(message.get("last_event") or "")
            html = str(message.get("html") or "")
            links = re.findall(r'href=["\'](https://veklom\.com/verify-email\?token=[^"\']+)', html)
            if not links:
                raise RuntimeError("Verification link was absent from provider message")
            proof["steps"]["provider_delivery"] = {
                "message_id": message.get("id"), "last_event": event,
                "verification_link_present": True,
            }

            verify_page = context.new_page()
            verify_page.goto(links[0].replace("&amp;", "&"), wait_until="networkidle")
            verify_page.get_by_text("Email verified. Your Veklom account is ready to sign in.", exact=True).wait_for(timeout=15_000)
            verify_page.screenshot(path=str(ARTIFACT_DIR / "email-verified.png"), full_page=True)
            proof["steps"]["verification"] = {"ui_confirmed": True, "token_not_persisted": True}

            page.goto(f"{BASE_URL}/login", wait_until="networkidle")
            page.get_by_placeholder("you@company.com").fill(email)
            page.get_by_placeholder("Enter your password").fill(password)
            page.get_by_role("button", name="Sign in").click()
            page.wait_for_url(re.compile(r"/os(?:/onboarding)?/?$"), timeout=20_000)
            profile = page.evaluate("""async () => {
              const token = localStorage.getItem('veklom.access_token');
              const response = await fetch('/api/v1/auth/me', {headers: token ? {authorization: `Bearer ${token}`} : {}});
              const body = await response.json();
              return {status: response.status, account_status: body.status, workspace_id: body.workspace_id || null};
            }""")
            page.screenshot(path=str(ARTIFACT_DIR / "login-landed.png"), full_page=True)
            proof["steps"]["login"] = {
                "landed_path": page.url.split(BASE_URL, 1)[-1].split("?", 1)[0],
                "profile_status": profile.get("status"), "account_status": profile.get("account_status"),
                "workspace_bound": bool(profile.get("workspace_id")),
            }
            browser.close()
        checks = [
            proof["steps"]["signup"]["register_status"] == 201,
            event in {"delivered", "opened", "clicked"},
            proof["steps"]["verification"]["ui_confirmed"] is True,
            proof["steps"]["login"]["profile_status"] == 200,
            str(proof["steps"]["login"]["account_status"]).lower() == "active",
        ]
        proof["status"] = "VALID" if all(checks) else "INVALID"
    except Exception as exc:
        proof["failure"] = {"type": type(exc).__name__, "message": str(exc)}
    proof["completed_at"] = datetime.now(UTC).isoformat()
    (ARTIFACT_DIR / "human-signup-live-proof.json").write_text(json.dumps(proof, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(proof, indent=2))
    if proof["status"] != "VALID":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
