import { test, expect } from '@playwright/test';
import { loginAsClient } from '../fixtures/auth';

const SLUG = 'dev-orellana';

test.describe('Booking Payment Flows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page);
  });

  async function selectFirstAvailableSlot(page: any) {
    const slot = page.getByRole('heading').filter({ hasText: /:/ }).first();
    await expect(slot).toBeVisible({ timeout: 15000 });
    await slot.click();
    await page.getByText('Reservar →').first().click();
  }

  async function selectFirstPaymentSlot(page: any) {
    // Click the last "Reservar →" which is typically a late-hour slot requiring payment
    const reserveBtn = page.getByText('Reservar →').last();
    await expect(reserveBtn).toBeVisible({ timeout: 15000 });
    await reserveBtn.click();
  }

  async function currentHostname(page: any) {
    return page.evaluate(() => window.location.hostname);
  }

  test('PF-01: Pago total con MercadoPago — redirect a pasarela', async ({ page }) => {
    await page.goto(`/${SLUG}/reservar`);
    await selectFirstAvailableSlot(page);

    await expect(page.getByRole('heading', { name: /Confirmar Reserva/i })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/912345678/i).first().fill('987654321');

    const payButton = page.getByRole('button', { name: /Pagar con MercadoPago/i }).first();
    await expect(payButton).toBeVisible({ timeout: 3000 });
    await payButton.click();

    const redirected = await page.waitForFunction(
      () => window.location.href.includes('mercadopago') || window.location.pathname.includes('/booking/success'),
      { timeout: 20000 }
    ).then(() => true).catch(() => false);

    expect(redirected).toBe(true);
  });

  test('PF-02: Pago parcial (abono)', async ({ page }) => {
    await page.goto(`/${SLUG}/reservar`);
    await selectFirstAvailableSlot(page);

    await expect(page.getByRole('heading', { name: /Confirmar Reserva/i })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/912345678/i).first().fill('987654321');

    const partialToggle = page.locator('div:has-text("¿Pagar solo el abono ahora?")').last();
    if (await partialToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      const toggleButton = partialToggle.locator('button[role="button"]');
      await toggleButton.click();
      await expect(page.getByText(/Monto a pagar/i)).toBeVisible();
      test.skip(true, 'Abono visible, requiere MP sandbox para completar');
    } else {
      test.skip(true, 'Pago parcial no disponible para este centro/bloque');
    }
  });

  test('PF-03: Pago opcional — confirmar sin pagar', async ({ page }) => {
    await page.goto(`/${SLUG}/reservar`);
    await selectFirstAvailableSlot(page);

    await expect(page.getByRole('heading', { name: /Confirmar Reserva/i })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/912345678/i).first().fill('987654321');

    const confirmWithoutPay = page.getByRole('button', { name: /sin pagar/i });
    if (await confirmWithoutPay.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmWithoutPay.click();
      await page.waitForURL((url) => url.pathname.includes('/booking/success') || url.pathname.includes('/booking/status'), { timeout: 10000 });
      await expect(page.getByText(/Reserva Confirmada/i).or(page.getByText(/éxito/i)).or(page.getByText(/Pendiente/i))).toBeVisible({ timeout: 5000 });
    } else {
      const venueButton = page.getByRole('button', { name: /Confirmar Reserva/i }).last();
      if (await venueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await venueButton.click();
        await page.waitForURL((url) => url.pathname.includes('/booking/success') || url.pathname.includes('/booking/status'), { timeout: 10000 });
      } else {
        test.skip(true, 'No hay bloque con pago opcional disponible');
      }
    }
  });

  test('PF-05: Pago mock MercadoPago en development', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`/${SLUG}/reservar`);
    await selectFirstPaymentSlot(page);

    await expect(page.getByRole('heading', { name: /Confirmar Reserva/i })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/912345678/i).first().fill('987654321');

    const payButton = page.getByRole('button', { name: /Pagar con MercadoPago/i }).first();
    await expect(payButton).toBeVisible({ timeout: 3000 });
    await payButton.click();

    const mockModal = page.getByRole('button', { name: /Pago Exitoso/i });
    await expect(mockModal).toBeVisible({ timeout: 15000 });

    await mockModal.click();
    await page.waitForFunction(
      () => window.location.pathname.includes('/booking/success'),
      { timeout: 20000 }
    );
    await expect(page.getByText(/Pago Exitoso/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('PF-04: Sin pago online — confirmar directo', async ({ page }) => {
    await page.goto(`/${SLUG}/reservar`);

    const allSlots = page.getByRole('heading').filter({ hasText: /:/ });
    const count = await allSlots.count();
    let foundFreeSlot = false;

    for (let i = 0; i < count; i++) {
      await allSlots.nth(i).click();
      await page.waitForTimeout(500);

      const hasPayRequired = await page.getByText('Pago requerido para reservar').isVisible({ timeout: 1000 }).catch(() => false);
      if (hasPayRequired) {
        await page.goto(`/${SLUG}/reservar`);
        await page.waitForTimeout(1000);
        continue;
      }

      const reserveBtn = page.getByText('Reservar →').first();
      if (await reserveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await reserveBtn.click();
        foundFreeSlot = true;
        break;
      }

      await page.goto(`/${SLUG}/reservar`);
      await page.waitForTimeout(1000);
    }

    if (!foundFreeSlot) {
      test.skip(true, 'No se encontró bloque sin pago online');
      return;
    }

    await page.getByPlaceholder(/912345678/i).first().fill('987654321');

    const confirmButton = page.getByRole('button', { name: /Confirmar Reserva/i }).last();
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmButton.click();
      await page.waitForURL((url) => url.pathname.includes('/booking/success') || url.pathname.includes('/booking/status'), { timeout: 10000 });
      await expect(page.getByText(/Reserva Confirmada/i).or(page.getByText(/éxito/i))).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'No se encontró botón de confirmación');
    }
  });
});
