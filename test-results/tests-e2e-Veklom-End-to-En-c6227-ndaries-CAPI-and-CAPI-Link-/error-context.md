# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e.spec.ts >> Veklom End-to-End Core User & Machine Journey >> 4. Machine-to-Machine API Boundaries (CAPI and CAPI-Link)
- Location: tests\e2e.spec.ts:62:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 500
Received array: [200, 401, 403]
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
  26 |     await page.locator('input[name="email"]').fill('e2e-test@veklom.com');
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
> 66 |     expect([200, 401, 403]).toContain(capiResponse.status());
     |                             ^ Error: expect(received).toContain(expected) // indexOf
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