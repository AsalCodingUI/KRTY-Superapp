const { chromium } = require('playwright');

(async () => {
  const context = await chromium.launchPersistentContext('/tmp/lh-profile', {
    headless: true,
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('PAGE CONSOLE ERROR:', msg.text());
    }
  });
  page.on('pageerror', (err) => {
    console.error('PAGE ERROR:', err);
  });

  await page.goto('http://localhost:3002/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const url = page.url();
  console.log('URL:', url);

  await context.close();
})();
