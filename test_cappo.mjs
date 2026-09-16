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

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'after_submit.png' });
    console.log('Screenshot saved as after_submit.png');

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await browser.close();
  }
})();
