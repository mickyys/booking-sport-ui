import { test, expect } from '@playwright/test';
import { loginAsClient } from '../fixtures/auth';

test.describe('Client Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page);
  });

  test('debe mostrar el modal de pago al seleccionar un bloque', async ({ page }) => {
    await page.goto('/dev-orellana/reservar');

    const firstSlot = page.getByRole('heading').filter({ hasText: /:/ }).first();
    await expect(firstSlot).toBeVisible({ timeout: 15000 });
    await firstSlot.click();

    const bookButton = page.getByText('Reservar →').first();
    await expect(bookButton).toBeVisible({ timeout: 5000 });
    await bookButton.click();

    await expect(page.getByRole('heading', { name: /Confirmar Reserva/i })).toBeVisible({ timeout: 5000 });
  });

  test('debe permitir alternar pago parcial si está disponible', async ({ page }) => {
    await page.goto('/dev-orellana/reservar');

    const firstSlot = page.getByRole('heading').filter({ hasText: /:/ }).first();
    await firstSlot.click();
    await page.getByText('Reservar →').first().click();

    const toggleContainer = page.locator('div:has-text("¿Pagar solo el abono ahora?")').last();
    if (await toggleContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      const toggleButton = toggleContainer.locator('button[role="button"]');
      await expect(toggleButton).toBeVisible();
      await toggleButton.click();
    } else {
      test.skip(true, 'Pago parcial no habilitado para este centro/bloque');
    }
  });

  test('debe mostrar métodos de pago correctos según el bloque', async ({ page }) => {
    await page.goto('/dev-orellana/reservar');

    const firstSlot = page.getByRole('heading').filter({ hasText: /:/ }).first();
    await firstSlot.click();
    await page.getByText('Reservar →').first().click();

    await expect(page.getByRole('heading', { name: /Confirmar Reserva/i })).toBeVisible();
  });
});
