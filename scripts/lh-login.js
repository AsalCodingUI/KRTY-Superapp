const { chromium } = require('playwright');

(async () => {
  const userDataDir = '/tmp/lh-profile';
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();
  const url = 'http://localhost:3002/login';
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  if (page.url().includes('/dashboard')) {
    await context.close();
    return;
  }

  await page.waitForSelector('form');

  await page.fill('input[name="email"]', 'admin@admin.com');
  await page.fill('input[name="password"]', 'admin');

  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return;
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);
  });

  try {
    await page.waitForURL('**/dashboard', { timeout: 20000 });
  } catch (err) {
    const errorText = await page.locator('text=Login failed').first().textContent().catch(() => null);
    throw new Error(`Login failed or did not reach dashboard. ${errorText ?? ''}`);
  } finally {
    await context.close();
  }
})();
