import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('https://os.veklom.com/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'reprewindai@gmail.com');
    await page.fill('input[type="password"]', 'Sk8ter32$');
    await page.click('button[type="submit"]');
    await page.waitForURL('https://os.veklom.com/os/onboarding**', { timeout: 15000 });
    
    // Step 0: Identify Operator
    await page.waitForSelector('input[placeholder="Jane Doe"]');
    await page.fill('input[placeholder="Jane Doe"]', 'Anthony');
    await page.fill('input[placeholder="operator@domain.com"]', 'reprewindai@gmail.com');
    await page.click('button:has-text("Proceed")');
    await page.waitForTimeout(2000);

    // Step 1: Establish Authority
    await page.fill('input[placeholder="Alpha Core"]', 'Veklom Workspace');
    
    // Listen for the workspace API response!
    page.on('response', response => {
      if (response.url().includes('/api/v1/workspace')) {
        console.log('Workspace API Status:', response.status());
      }
    });

    await page.click('button:has-text("Proceed")');
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'step1_result.png' });
    console.log('Done.');

  } catch (error) {
    console.error('Failed:', error);
  } finally {
    await browser.close();
  }
})();
