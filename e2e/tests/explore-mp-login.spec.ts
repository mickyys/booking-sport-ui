import { test } from '@playwright/test';
import { loginAsClient } from '../fixtures/auth';

test('explore MP login fields', async ({ page }) => {
  await loginAsClient(page);
  await page.goto('/dev-orellana/reservar');

  const slot = page.getByRole('heading').filter({ hasText: /:/ }).first();
  await slot.waitFor({ state: 'visible', timeout: 15000 });
  await slot.click();
  await page.getByText('Reservar →').first().click();
  await page.getByRole('heading', { name: /Confirmar Reserva/i }).waitFor({ timeout: 5000 });
  await page.getByPlaceholder(/912345678/i).first().fill('987654321');

  const payButton = page.getByRole('button', { name: /Pagar con MercadoPago/i }).first();
  await payButton.waitFor({ timeout: 5000 });
  await payButton.click();
  await page.waitForFunction(() => window.location.hostname.includes('mercadopago'), { timeout: 20000 });

  const loginBtn = page.getByRole('button', { name: /Ingresar con mi cuenta/i });
  await loginBtn.waitFor({ state: 'visible', timeout: 10000 });
  await loginBtn.click();

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  console.log('Login page URL:', page.url());

  // Check all input-like elements
  const inputInfo = await page.evaluate(() => {
    const all = document.querySelectorAll('input, [role="textbox"], [contenteditable]');
    return Array.from(all).map(el => ({
      id: el.id,
      tag: el.tagName,
      type: (el as HTMLInputElement).type,
      name: (el as HTMLInputElement).name,
      'aria-label': el.getAttribute('aria-label'),
      placeholder: (el as HTMLInputElement).placeholder,
      className: el.className?.substring(0, 80),
      visible: (el as HTMLElement).offsetParent !== null,
      value: (el as HTMLInputElement).value?.substring(0, 50),
    }));
  });
  console.log('Input info:', JSON.stringify(inputInfo, null, 2));

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(el => ({
      id: el.id,
      text: el.innerText?.substring(0, 80),
      visible: el.offsetParent !== null,
    }));
  });
  console.log('Buttons:', JSON.stringify(buttons, null, 2));

  await page.screenshot({ path: 'test-results/mp-login-page.png', fullPage: true });
});
