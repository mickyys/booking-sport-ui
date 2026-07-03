import { test } from '@playwright/test';
import { loginAsClient } from '../fixtures/auth';

const SLUG = 'dev-orellana';

test('explore MP checkout', async ({ page }) => {
  await loginAsClient(page);
  await page.goto(`/${SLUG}/reservar`);

  const slot = page.getByRole('heading').filter({ hasText: /:/ }).first();
  await slot.waitFor({ state: 'visible', timeout: 15000 });
  await slot.click();
  await page.getByText('Reservar →').first().click();

  await page.getByRole('heading', { name: /Confirmar Reserva/i }).waitFor({ timeout: 5000 });
  await page.getByPlaceholder(/912345678/i).first().fill('987654321');

  const payButton = page.getByRole('button', { name: /Pagar con MercadoPago/i }).first();
  await payButton.waitFor({ timeout: 5000 });

  // Listen for new pages/tabs and navigation
  const [mpPage] = await Promise.all([
    page.context().waitForEvent('page', { timeout: 30000 }).catch(() => null),
    payButton.click(),
  ]);

  if (mpPage) {
    await mpPage.waitForLoadState('domcontentloaded');
    console.log('MP page URL:', mpPage.url());
    await mpPage.screenshot({ path: 'test-results/mp-checkout.png', fullPage: true });

    // List all iframes
    const frames = mpPage.frames();
    console.log('Frames found:', frames.length);
    for (const f of frames) {
      console.log(' - Frame:', f.name(), f.url().substring(0, 100));
    }

    // Get page content
    const text = await mpPage.evaluate(() => document.body?.innerText?.substring(0, 2000));
    console.log('Page text:', text);
  } else {
    // Same page navigation
    console.log('No new page, current URL:', page.url());
    await page.waitForTimeout(3000);
    console.log('URL after 3s:', page.url());
    const frames = page.frames();
    console.log('Frames:', frames.length);
    for (const f of frames) {
      console.log(' - Frame:', f.name(), f.url().substring(0, 100));
    }
    await page.screenshot({ path: 'test-results/mp-checkout.png', fullPage: true });
    const text = await page.evaluate(() => document.body?.innerText?.substring(0, 2000));
    console.log('Page text:', text);
  }
});
