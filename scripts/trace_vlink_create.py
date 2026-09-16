"""Capture the public VLink create request without retaining credentials."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = "https://veklom.com"
ARTIFACT_DIR = Path("artifacts/m1-p2/vlink-first-seam")
SECRET_FIELDS = {
    "token",
    "devicecode",
    "approvalcode",
    "authorization",
    "secret",
}


def redact(value: object) -> object:
    if isinstance(value, dict):
        return {
            key: "<redacted>" if key.lower() in SECRET_FIELDS else redact(item)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [redact(item) for item in value]
    return value


def main() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    events: list[dict[str, object]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        def record_response(response) -> None:
            if "/api/v1/vlinks" not in response.url:
                return
            request = response.request
            try:
                raw_body = response.text()
            except Exception as exc:  # pragma: no cover - evidence fallback
                raw_body = f"<unavailable: {exc}>"
            try:
                body: object = json.loads(raw_body)
            except json.JSONDecodeError:
                body = raw_body
            events.append(
                {
                    "timestamp": datetime.now(UTC).isoformat(),
                    "method": request.method,
                    "url": request.url,
                    "request_post_data": request.post_data,
                    "status": response.status,
                    "response_body": redact(body),
                    "response_headers": {
                        key: value
                        for key, value in response.headers.items()
                        if key.lower()
                        in {
                            "content-type",
                            "server",
                            "cf-ray",
                            "cf-cache-status",
                            "x-powered-by",
                        }
                    },
                }
            )

        page.on("response", record_response)
        page.goto(f"{BASE_URL}/vlink/connect/", wait_until="networkidle")
        page.get_by_role("button", name="Create VLink").click()
        page.wait_for_timeout(2_000)
        page.screenshot(path=ARTIFACT_DIR / "after-create.png", full_page=True)
        browser.close()

    evidence = {
        "captured_at": datetime.now(UTC).isoformat(),
        "base_url": BASE_URL,
        "events": events,
    }
    (ARTIFACT_DIR / "network.json").write_text(
        json.dumps(evidence, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
