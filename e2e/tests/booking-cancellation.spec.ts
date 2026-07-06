import { test, expect } from '@playwright/test';
import { loginAsClient } from '../fixtures/auth';

test.describe('Booking Cancellation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page);
  });

  test('CA-01: Ver Mis Reservas con reservas activas', async ({ page }) => {
    await page.goto('/mis-reservas');

    await page.waitForTimeout(3000);

    const heading = page.getByRole('heading', { name: /Reservas|Mis reservas/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('CA-02: Ver detalle de una reserva', async ({ page }) => {
    await page.goto('/mis-reservas');

    await page.waitForTimeout(3000);

    const bookingCard = page.locator('div').filter({ hasText: /Cancha/i }).first();
    if (await bookingCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bookingCard.click();
      await page.waitForTimeout(1000);
    }
  });
});
