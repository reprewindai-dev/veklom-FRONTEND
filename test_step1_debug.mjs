import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));

  try {
    await page.goto('https://os.veklom.com/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'reprewindai@gmail.com');
    await page.fill('input[type="password"]', 'Sk8ter32$');
    await page.click('button[type="submit"]');
    await page.waitForURL('https://os.veklom.com/os/onboarding**', { timeout: 15000 });
    
    await page.waitForSelector('input[placeholder="Jane Doe"]');
    await page.fill('input[placeholder="Jane Doe"]', 'Anthony');
    await page.fill('input[placeholder="operator@domain.com"]', 'reprewindai@gmail.com');
    await page.click('button:has-text("Proceed")');
    await page.waitForTimeout(2000);

    await page.fill('input[placeholder="Alpha Core"]', 'Veklom Workspace');
    
    page.on('request', req => {
      if(req.url().includes('/api/v1/')) console.log('REQ:', req.method(), req.url());
    });
    page.on('response', res => {
      if(res.url().includes('/api/v1/')) console.log('RES:', res.status(), res.url());
    });

    console.log('Clicking proceed for Step 1...');
    await page.click('button:has-text("Proceed")');
    await page.waitForTimeout(5000);
    
    console.log('Done.');
  } catch (error) {
    console.error('Failed:', error);
  } finally {
    await browser.close();
  }
})();
