import { test, expect } from '@playwright/test';
import { ensureLoggedOut } from '../fixtures/auth';

const SLUG = 'dev-orellana';
const GUEST_NAME = 'Test Guest';
const GUEST_EMAIL = 'testguest@yopmail.com';
const GUEST_PHONE = '987654321';

test.describe('Guest Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('GB-01: Invitado + confirmar reserva', async ({ page }) => {
    await page.goto(`/${SLUG}/reservar`);

    const firstSlot = page.getByRole('heading').filter({ hasText: /:/ }).first();
    await expect(firstSlot).toBeVisible({ timeout: 15000 });
    await firstSlot.click();
    await page.getByText('Reservar →').first().click();

    await expect(page.getByRole('heading', { name: /Confirmar Reserva/i })).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder(/Juan Pérez/i).first().fill(GUEST_NAME);
    await page.getByPlaceholder(/juan@ejemplo.com/i).first().fill(GUEST_EMAIL);
    await page.getByPlaceholder(/912345678/i).first().fill(GUEST_PHONE);

    const confirmButton = page.getByRole('button', { name: /Confirmar Reserva/i }).last();
    const payButton = page.getByRole('button', { name: /Pagar con MercadoPago/i }).first();

    if (await payButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip(true, 'Este bloque requiere pago, se prueba solo flujo sin pago');
    } else if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
      await page.waitForURL((url) => url.pathname.includes('/booking/success') || url.pathname.includes('/booking/status'), { timeout: 10000 });
      await expect(page.getByText(/Reserva Confirmada/i).or(page.getByText(/éxito/i))).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'No hay bloque sin pago disponible');
    }
  });

  test('GB-02: Validación campos requeridos como invitado', async ({ page }) => {
    await page.goto(`/${SLUG}/reservar`);

    const firstSlot = page.getByRole('heading').filter({ hasText: /:/ }).first();
    await expect(firstSlot).toBeVisible({ timeout: 15000 });
    await firstSlot.click();
    await page.getByText('Reservar →').first().click();

    await expect(page.getByRole('heading', { name: /Confirmar Reserva/i })).toBeVisible({ timeout: 5000 });

    const payButton = page.getByRole('button', { name: /Pagar con MercadoPago/i }).first();
    if (await payButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await payButton.click();
      await page.waitForTimeout(500);
      const errorMessages = page.locator('text=Requerido');
      const errorCount = await errorMessages.count();
      expect(errorCount).toBeGreaterThanOrEqual(1);
    } else {
      const confirmButton = page.getByRole('button', { name: /Confirmar/i }).last();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
        await page.waitForTimeout(500);
        const errorMessages = page.locator('text=Requerido');
        const errorCount = await errorMessages.count();
        expect(errorCount).toBeGreaterThanOrEqual(1);
      } else {
        test.skip(true, 'No hay botón de confirmación disponible');
      }
    }
  });
});
