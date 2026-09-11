const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const allRequests = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/v1/auth') || url.includes('/os')) {
      allRequests.push(`[${response.status()}] ${url}`);
    }
  });

  // PHASE 1: Login
  console.log("=== PHASE 1: Login ===");
  await page.goto('https://veklom.com/login');
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => {
    const emailInput = document.querySelector('input[type="email"]');
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(emailInput, 'reprewindai@gmail.com');
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    const passwordInput = document.querySelector('input[type="password"]');
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(passwordInput, 'Sk8ter32$');
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.click('button[type="submit"]');
  
  try {
    await page.waitForURL('**/os**', { timeout: 12000 });
    console.log("✅ Redirected to /os");
  } catch (e) {
    console.log("❌ Did not redirect to /os. Final URL:", page.url());
    await browser.close();
    return;
  }
  
  await page.waitForLoadState('networkidle');
  
  // Verify cookie is present
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name === 'veklom_session');
  console.log("veklom_session cookie:", sessionCookie ? `✅ PRESENT (httpOnly=${sessionCookie.httpOnly})` : '❌ MISSING');

  // PHASE 2: Navigate to /os/command (triggers RSC with real session)
  console.log("\n=== PHASE 2: Navigate to /os/command ===");
  await page.goto('https://veklom.com/os/command');
  await page.waitForLoadState('networkidle');
  console.log("Final URL:", page.url());
  const commandOk = page.url().includes('/os/command');
  console.log(commandOk ? "✅ /os/command loaded successfully" : "❌ Was bounced from /os/command");

  // PHASE 3: Hard refresh — confirms session survives
  console.log("\n=== PHASE 3: Hard refresh ===");
  await page.reload();
  await page.waitForLoadState('networkidle');
  const refreshUrl = page.url();
  console.log("URL after refresh:", refreshUrl);
  console.log(refreshUrl.includes('/os') ? "✅ Session survives refresh" : "❌ Bounced on refresh");

  console.log("\n=== Full request trace ===");
  console.log(allRequests.join('\n'));

  await browser.close();
})();
