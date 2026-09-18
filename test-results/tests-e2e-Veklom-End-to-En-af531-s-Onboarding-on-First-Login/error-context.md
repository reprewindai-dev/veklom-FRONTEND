# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e.spec.ts >> Veklom End-to-End Core User & Machine Journey >> 2. PGL Frictionless Onboarding on First Login
- Location: tests\e2e.spec.ts:21:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - link "Veklom M2M Trust Infrastructure — home" [ref=e6] [cursor=pointer]:
          - /url: /
          - generic [ref=e9]:
            - generic [ref=e10]: Veklom
            - generic [ref=e11]: M2M Trust Infrastructure
        - navigation "Primary navigation" [ref=e12]:
          - link "Proof" [ref=e13] [cursor=pointer]:
            - /url: /proof
          - link "Architecture" [ref=e14] [cursor=pointer]:
            - /url: /architecture
          - link "Conformance" [ref=e15] [cursor=pointer]:
            - /url: /conformance
          - link "Docs" [ref=e16] [cursor=pointer]:
            - /url: /docs
          - link "Machine" [ref=e17] [cursor=pointer]:
            - /url: /machine
        - generic [ref=e18]:
          - generic [ref=e20]:
            - button "Light" [ref=e21] [cursor=pointer]
            - button "Dark" [ref=e22] [cursor=pointer]
          - link "Sign in" [ref=e23] [cursor=pointer]:
            - /url: /login
          - link "Get Veklom" [ref=e24] [cursor=pointer]:
            - /url: /get
          - link "Open Capability OS ↗" [ref=e25] [cursor=pointer]:
            - /url: /login?returnTo=/os
            - text: Open Capability OS
            - generic [ref=e26]: ↗
    - main [ref=e27]:
      - main [ref=e28]:
        - generic [ref=e29]:
          - generic [ref=e30]:
            - generic [ref=e31]: Governed entry
            - heading "Your session opens the workspace. It does not widen authority." [level=2] [ref=e33]
            - paragraph [ref=e34]: Veklom keeps identity, access and consequence authority as separate layers. Signing in establishes who you are and which workspace you belong to. CAPPO still decides what any machine execution is allowed to cause.
            - generic [ref=e35]:
              - generic [ref=e36]:
                - generic [ref=e37]: "01"
                - generic [ref=e38]:
                  - generic [ref=e39]: Identity
                  - generic [ref=e40]: Workspace-bound operator identity
              - generic [ref=e41]:
                - generic [ref=e42]: "02"
                - generic [ref=e43]:
                  - generic [ref=e44]: Authority
                  - generic [ref=e45]: Policy and capability remain separate from login
              - generic [ref=e46]:
                - generic [ref=e47]: "03"
                - generic [ref=e48]:
                  - generic [ref=e49]: Evidence
                  - generic [ref=e50]: Session entry never manufactures execution proof
          - generic [ref=e53]:
            - generic [ref=e54]:
              - generic [ref=e55]: Backend-issued session
              - heading "Enter Capability OS." [level=1] [ref=e59]
              - paragraph [ref=e60]: Authentication resolves against the LockerPhycer identity and session authority. GitHub and password sign-in converge on the same workspace-bound session.
            - button "Continue with GitHub" [disabled] [ref=e61]
            - generic [ref=e68]: GitHub OAuth setup is incomplete.
            - generic [ref=e69]: or use your account
            - generic [ref=e73]:
              - generic [ref=e74]:
                - generic [ref=e75]: Email address
                - textbox "Email address" [ref=e76]:
                  - /placeholder: you@company.com
              - generic [ref=e77]:
                - generic [ref=e78]:
                  - generic [ref=e79]: Password
                  - link "Forgot password?" [ref=e80] [cursor=pointer]:
                    - /url: /forgot-password
                - textbox "Password" [ref=e81]:
                  - /placeholder: Your password
              - button "Sign in to Capability OS" [ref=e82] [cursor=pointer]
            - generic [ref=e85]:
              - generic [ref=e86]: Need a workspace?
              - link "Create account →" [ref=e87] [cursor=pointer]:
                - /url: /signup
    - contentinfo [ref=e88]:
      - generic [ref=e90]:
        - generic [ref=e91]:
          - link "Veklom M2M Trust Infrastructure — home" [ref=e92] [cursor=pointer]:
            - /url: /
            - generic [ref=e95]:
              - generic [ref=e96]: Veklom
              - generic [ref=e97]: M2M Trust Infrastructure
          - paragraph [ref=e98]: Governed machine action infrastructure. Authority before consequence. Evidence after execution. No residual agency after termination.
          - generic [ref=e99]:
            - generic [ref=e100]: Canada-first
            - generic [ref=e101]: Sovereign runtime
            - generic [ref=e102]: Evidence-led
        - generic [ref=e103]:
          - generic [ref=e104]:
            - generic [ref=e105]: Capability OS
            - generic [ref=e106]:
              - link "Get Veklom" [ref=e107] [cursor=pointer]:
                - /url: /get
              - link "LockerPhycer" [ref=e108] [cursor=pointer]:
                - /url: /lockerphycer
              - link "CAPPO" [ref=e109] [cursor=pointer]:
                - /url: /cappo
              - link "cAPI" [ref=e110] [cursor=pointer]:
                - /url: /capi
              - link "VLink" [ref=e111] [cursor=pointer]:
                - /url: /vlink
              - link "Guardian" [ref=e112] [cursor=pointer]:
                - /url: /guardian
          - generic [ref=e113]:
            - generic [ref=e114]: Evidence & Network
            - generic [ref=e115]:
              - link "PGL / Gnomledger" [ref=e116] [cursor=pointer]:
                - /url: /pgl
              - link "EEE" [ref=e117] [cursor=pointer]:
                - /url: /eee
              - link "VNP" [ref=e118] [cursor=pointer]:
                - /url: /vnp
              - link "VCGB" [ref=e119] [cursor=pointer]:
                - /url: /vcgb
              - link "Live Proof" [ref=e120] [cursor=pointer]:
                - /url: /proof
              - link "Conformance" [ref=e121] [cursor=pointer]:
                - /url: /conformance
          - generic [ref=e122]:
            - generic [ref=e123]: Developers
            - generic [ref=e124]:
              - link "Documentation" [ref=e125] [cursor=pointer]:
                - /url: /docs
              - link "API Directory" [ref=e126] [cursor=pointer]:
                - /url: /api
              - link "Architecture" [ref=e127] [cursor=pointer]:
                - /url: /architecture
              - link "Security" [ref=e128] [cursor=pointer]:
                - /url: /security
              - link "System Status" [ref=e129] [cursor=pointer]:
                - /url: /status
              - link "Support" [ref=e130] [cursor=pointer]:
                - /url: /support
          - generic [ref=e131]:
            - generic [ref=e132]: Legal & Trust
            - generic [ref=e133]:
              - link "Trust Center" [ref=e134] [cursor=pointer]:
                - /url: /trust
              - link "Privacy" [ref=e135] [cursor=pointer]:
                - /url: /privacy
              - link "Privacy Choices" [ref=e136] [cursor=pointer]:
                - /url: /privacy-choices
              - link "Data Rights" [ref=e137] [cursor=pointer]:
                - /url: /data-rights
              - link "Terms" [ref=e138] [cursor=pointer]:
                - /url: /terms
              - link "Acceptable Use" [ref=e139] [cursor=pointer]:
                - /url: /acceptable-use
              - link "Cookies" [ref=e140] [cursor=pointer]:
                - /url: /cookies
              - link "Data Processing Addendum" [ref=e141] [cursor=pointer]:
                - /url: /dpa
              - link "Subprocessors" [ref=e142] [cursor=pointer]:
                - /url: /subprocessors
      - generic [ref=e144]:
        - paragraph [ref=e145]: "\"Anything is possible, if you're willing to build the wire first.\""
        - generic [ref=e146]: © 2026 Veklom · Governed machine infrastructure
        - generic [ref=e147]:
          - link "security.txt" [ref=e148] [cursor=pointer]:
            - /url: /.well-known/security.txt
          - link "Trust Center" [ref=e149] [cursor=pointer]:
            - /url: /trust
          - link "Privacy Choices" [ref=e150] [cursor=pointer]:
            - /url: /privacy-choices
          - link "Privacy" [ref=e151] [cursor=pointer]:
            - /url: /privacy
          - link "Terms" [ref=e152] [cursor=pointer]:
            - /url: /terms
          - link "Support" [ref=e153] [cursor=pointer]:
            - /url: /support
  - alert [ref=e154]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Veklom End-to-End Core User & Machine Journey', () => {
  4  | 
  5  |   test('1. Public Visitor to VLink Creation', async ({ page }) => {
  6  |     // Navigates to the Try VLink page
  7  |     await page.goto('http://127.0.0.1:3002/vlink/connect');
  8  |     
  9  |     // Assumes an input for connection and creation
  10 |     const vlinkCreateInput = page.locator('input[placeholder*="App Name"]');
  11 |     if (await vlinkCreateInput.isVisible()) {
  12 |       await vlinkCreateInput.fill('E2E Test VLink');
  13 |       await page.locator('button:has-text("Generate")').click();
  14 |       
  15 |       // Expect QR Code to be rendered as an image wrapped in a download link
  16 |       const qrCodeLink = page.locator('a[download="vlink-pairing-qr.png"]');
  17 |       await expect(qrCodeLink).toBeVisible();
  18 |     }
  19 |   });
  20 | 
  21 |   test('2. PGL Frictionless Onboarding on First Login', async ({ page }) => {
  22 |     // Start at login
  23 |     await page.goto('http://127.0.0.1:3002/login');
  24 |     
  25 |     // Simulate user login (UI logic, assuming fields)
> 26 |     await page.locator('input[name="email"]').fill('e2e-test@veklom.com');
     |                                               ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  27 |     await page.locator('input[name="password"]').fill('Password123!');
  28 |     await page.locator('button[type="submit"]').click();
  29 |     
  30 |     // Wait for redirect to OS
  31 |     await page.waitForURL('**/os**');
  32 |     
  33 |     // Because this user is fresh and doesn't have the pgl_onboarded localStorage,
  34 |     // they should be forcibly redirected to onboarding by the AppShell
  35 |     await page.waitForURL('**/os/onboarding');
  36 |     
  37 |     // Onboarding UI presence check
  38 |     await expect(page.locator('text=Operator Identity')).toBeVisible();
  39 |     
  40 |     // Complete onboarding (last step button text)
  41 |     const enterOsBtn = page.locator('button:has-text("Enter Sovereign Workspace")');
  42 |     if (await enterOsBtn.isVisible()) {
  43 |       await enterOsBtn.click();
  44 |       await page.waitForURL('**/os');
  45 |     }
  46 |   });
  47 | 
  48 |   test('3. Capability OS: Sandbox vs Production Toggle', async ({ page }) => {
  49 |     // Navigate straight to OS (assume logged in from context if configured, or just checking UI)
  50 |     await page.goto('http://127.0.0.1:3002/os');
  51 |     
  52 |     // Check if the toggle exists
  53 |     const toggle = page.locator('button:has-text("Sandbox")');
  54 |     if (await toggle.isVisible()) {
  55 |       await expect(toggle).toBeVisible();
  56 |       // Click toggle
  57 |       await toggle.click();
  58 |       await expect(page.locator('button:has-text("Production")')).toBeVisible();
  59 |     }
  60 |   });
  61 | 
  62 |   test('4. Machine-to-Machine API Boundaries (CAPI and CAPI-Link)', async ({ request }) => {
  63 |     // Directly test the CAPI Health endpoint to ensure the proxy is routing correctly
  64 |     const capiResponse = await request.get('http://127.0.0.1:3002/api/v1/capi/health');
  65 |     // We expect either 200 OK or 401 Unauthorized (because of API keys), but NOT 404 (which implies broken routing).
  66 |     expect([200, 401, 403]).toContain(capiResponse.status());
  67 |     
  68 |     // Check the well-known discovery document is accessible
  69 |     const discoveryResponse = await request.get('http://127.0.0.1:3002/.well-known/veklom.json');
  70 |     if (discoveryResponse.ok()) {
  71 |       const data = await discoveryResponse.json();
  72 |       expect(data).toHaveProperty('cappo');
  73 |       expect(data.cappo).toContain('capi.veklom.com');
  74 |     }
  75 |   });
  76 | 
  77 | });
  78 | 
```