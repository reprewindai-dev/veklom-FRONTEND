import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to https://veklom.com...');
  const res = await page.goto('https://veklom.com', { waitUntil: 'networkidle' });
  console.log('veklom.com status:', res.status());
  await page.screenshot({ path: 'veklom_com.png' });
  console.log('Screenshot saved as veklom_com.png');

  console.log('Navigating to https://os.veklom.com...');
  const res2 = await page.goto('https://os.veklom.com', { waitUntil: 'networkidle' });
  console.log('os.veklom.com status:', res2.status());
  await page.screenshot({ path: 'os_veklom_com.png' });
  console.log('Screenshot saved as os_veklom_com.png');

  await browser.close();
})();
