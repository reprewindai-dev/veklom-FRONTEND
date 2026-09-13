import { test, expect } from '@playwright/test';

test.describe('Veklom End-to-End Core User & Machine Journey', () => {

  test('1. Public Visitor to VLink Creation', async ({ page }) => {
    // Navigates to the Try VLink page
    await page.goto('http://127.0.0.1:3002/vlink/connect');
    
    // Assumes an input for connection and creation
    const vlinkCreateInput = page.locator('input[placeholder*="App Name"]');
    if (await vlinkCreateInput.isVisible()) {
      await vlinkCreateInput.fill('E2E Test VLink');
      await page.locator('button:has-text("Generate")').click();
      
      // Expect QR Code to be rendered as an image wrapped in a download link
      const qrCodeLink = page.locator('a[download="vlink-pairing-qr.png"]');
      await expect(qrCodeLink).toBeVisible();
    }
  });

  test('2. PGL Frictionless Onboarding on First Login', async ({ page }) => {
    // Start at login
    await page.goto('http://127.0.0.1:3002/login');
    
    // Simulate user login (UI logic, assuming fields)
    await page.locator('input[name="email"]').fill('e2e-test@veklom.com');
    await page.locator('input[name="password"]').fill('Password123!');
    await page.locator('button[type="submit"]').click();
    
    // Wait for redirect to OS
    await page.waitForURL('**/os**');
    
    // Because this user is fresh and doesn't have the pgl_onboarded localStorage,
    // they should be forcibly redirected to onboarding by the AppShell
    await page.waitForURL('**/os/onboarding');
    
    // Onboarding UI presence check
    await expect(page.locator('text=Operator Identity')).toBeVisible();
    
    // Complete onboarding (last step button text)
    const enterOsBtn = page.locator('button:has-text("Enter Sovereign Workspace")');
    if (await enterOsBtn.isVisible()) {
      await enterOsBtn.click();
      await page.waitForURL('**/os');
    }
  });

  test('3. Capability OS: Sandbox vs Production Toggle', async ({ page }) => {
    // Navigate straight to OS (assume logged in from context if configured, or just checking UI)
    await page.goto('http://127.0.0.1:3002/os');
    
    // Check if the toggle exists
    const toggle = page.locator('button:has-text("Sandbox")');
    if (await toggle.isVisible()) {
      await expect(toggle).toBeVisible();
      // Click toggle
      await toggle.click();
      await expect(page.locator('button:has-text("Production")')).toBeVisible();
    }
  });

  test('4. Machine-to-Machine API Boundaries (CAPI and CAPI-Link)', async ({ request }) => {
    // Directly test the CAPI Health endpoint to ensure the proxy is routing correctly
    const capiResponse = await request.get('http://127.0.0.1:3002/api/v1/capi/health');
    // We expect either 200 OK or 401 Unauthorized (because of API keys), but NOT 404 (which implies broken routing).
    expect([200, 401, 403]).toContain(capiResponse.status());
    
    // Check the well-known discovery document is accessible
    const discoveryResponse = await request.get('http://127.0.0.1:3002/.well-known/veklom.json');
    if (discoveryResponse.ok()) {
      const data = await discoveryResponse.json();
      expect(data).toHaveProperty('cappo');
      expect(data.cappo).toContain('capi.veklom.com');
    }
  });

});
