"""Run the live VLink proof with a browser-identifying HTTP user agent."""

from urllib.request import Request as UrlRequest

import run_vlink_live_proof as proof


def browser_request(url, data=None, headers=None, method=None):
    merged = {"user-agent": "Mozilla/5.0 Veklom-M1-P2-Acceptance/1.0"}
    merged.update(headers or {})
    return UrlRequest(url, data=data, headers=merged, method=method)


proof.Request = browser_request
proof.main()
