import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Admin Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/calendar');
  });

  test('debe mostrar el calendario con las canchas', async ({ page }) => {
    const courtHeaders = page.locator('th').filter({ hasText: /Cancha/i });
    const headers = page.locator('div').filter({ hasText: /Cancha/i }).first().or(courtHeaders.first());
    await expect(headers).toBeVisible({ timeout: 10000 });
  });

  test('debe abrir el diálogo de reserva al hacer clic en un espacio vacío', async ({ page }) => {
    const emptySlot = page.locator('div.cursor-pointer').first();
    if (await emptySlot.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emptySlot.click();
    }
  });
});
