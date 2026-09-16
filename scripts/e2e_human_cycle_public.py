import os
import json
import time
import subprocess
import re
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

def extract_verification_link():
    result = subprocess.run(
        ["docker", "logs", "--tail", "50", "lockerphycer-api"],
        capture_output=True,
        text=True
    )
    logs = result.stdout + result.stderr
    match = re.search(r"VERIFICATION LINK:\s*(https://[^\s]+)", logs)
    if match:
        return match.group(1)
    return None

def main():
    print("=== VEKLOM HUMAN E2E AUTOMATION ===")
    test_email = f"human_e2e_{int(time.time())}@example.com"
    test_password = "SecurePassword123!"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            ignore_https_errors=True
        )
        page = context.new_page()

        print("[1] Navigating to https://veklom.com/signup")
        page.goto("https://veklom.com/signup", wait_until="networkidle")
        
        print("[2] Filling out signup form")
        page.fill("input[name=\"email\"], input[type=\"email\"]", test_email)
        # Handle password fields (could be multiple if there is a confirm password)
        pw_inputs = page.locator("input[type=\"password\"]")
        for i in range(pw_inputs.count()):
            pw_inputs.nth(i).fill(test_password)
            
        page.click("button[type=\"submit\"]")
        
        print("[3] Waiting for email to be sent and extracting from Docker logs...")
        time.sleep(5)
        
        verify_link = None
        for _ in range(15):
            verify_link = extract_verification_link()
            if verify_link:
                break
            time.sleep(2)
            
        if not verify_link:
            print("❌ FAILED to extract verification link from Docker logs!")
            page.screenshot(path="human_e2e_error.png")
            return
            
        print(f"✅ Found verification link: {verify_link}")
        
        print("[4] Following verification link...")
        page.goto(verify_link, wait_until="networkidle")
        time.sleep(3)
        
        print("[5] Logging in with verified account")
        page.goto("https://veklom.com/login", wait_until="networkidle")
        time.sleep(2)
        page.fill("input[name=\"email\"], input[type=\"email\"]", test_email)
        page.fill("input[type=\"password\"]", test_password)
        page.click("button[type=\"submit\"]")
        
        time.sleep(5)
        
        print("[6] Navigating to V-Link Creation")
        page.goto("https://veklom.com/vlink/connect", wait_until="networkidle")
        time.sleep(3)
        
        # Click Create VLink
        page.click("button:has-text(\"Create VLink\")")
        time.sleep(5)
        
        if "Route not found in proxy table" in page.content():
            print("❌ FAILED: Route not found in proxy table STILL APPEARING!")
            page.screenshot(path="human_e2e_error.png")
            return
            
        print("✅ VLink proxy success!")
        
        print("[7] Navigating to Capability OS (CAPPO)")
        page.goto("https://veklom.com/os/mount?capability=api-discovery", wait_until="networkidle")
        time.sleep(5)
        
        if "No capability packages returned" in page.content():
            print("❌ FAILED: No capability packages returned!")
            page.screenshot(path="human_e2e_cappo_error.png")
            return
            
        print("✅ Capability OS mounted successfully!")
        
        print("=== E2E FLOW COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    main()

