import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to Capability OS Login...');
    await page.goto('https://os.veklom.com/login', { waitUntil: 'networkidle' });

    console.log('Logging in...');
    await page.fill('input[type="email"]', 'reprewindai@gmail.com');
    await page.fill('input[type="password"]', 'Sk8ter32$');
    await page.click('button[type="submit"]');

    await page.waitForURL('https://os.veklom.com/os/onboarding**', { timeout: 10000 });
    console.log('At onboarding!');
    
    // Step 1: Identify Operator
    await page.fill('input[placeholder="Jane Doe"]', 'Anthony');
    await page.fill('input[placeholder="operator@domain.com"]', 'reprewindai@gmail.com');
    await page.click('button:has-text("Proceed")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'onboarding_step2.png' });
    console.log('Proceeded past operator identity.');

    // We will just wait and take a screenshot of the next step
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'onboarding_step3.png' });

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await browser.close();
  }
})();
