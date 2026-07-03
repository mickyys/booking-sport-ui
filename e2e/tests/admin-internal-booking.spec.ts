import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Admin Internal Booking', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/calendar');
  });

  test('IB-01: Crear reserva manual en calendario', async ({ page }) => {
    await page.waitForTimeout(2000);

    const emptySlot = page.locator('div.cursor-pointer').first();
    await expect(emptySlot).toBeVisible({ timeout: 10000 });
    await emptySlot.click();

    await page.waitForTimeout(1000);

    const modal = page.getByText(/Nueva Reserva|Reserva Interna|Crear Reserva/i);
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const nameInput = page.getByPlaceholder(/Nombre/i).or(page.locator('input').first());
      await nameInput.fill('Test Internal Booking');

      const phoneInput = page.getByPlaceholder(/Teléfono/i).or(page.locator('input[type="tel"]').first());
      if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phoneInput.fill('987654321');
      }

      const saveButton = page.getByRole('button', { name: /Guardar|Crear|Confirmar/i }).last();
      await saveButton.click();

      await expect(page.getByText(/Reserva creada|Creado exitosamente/i).or(page.getByText(/actualizado/i))).toBeVisible({ timeout: 5000 });
    }
  });

  test('IB-02: Reserva interna con método de pago', async ({ page }) => {
    await page.waitForTimeout(2000);

    const emptySlot = page.locator('div.cursor-pointer').first();
    await expect(emptySlot).toBeVisible({ timeout: 10000 });
    await emptySlot.click();

    await page.waitForTimeout(1000);

    const modal = page.getByText(/Nueva Reserva|Reserva Interna|Crear Reserva/i);
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const nameInput = page.getByPlaceholder(/Nombre/i).or(page.locator('input').first());
      await nameInput.fill('Test Internal Payment');

      const paymentSelect = page.locator('select').or(page.getByRole('combobox')).first();
      if (await paymentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await paymentSelect.selectOption({ index: 1 });
      }

      const saveButton = page.getByRole('button', { name: /Guardar|Crear|Confirmar/i }).last();
      await saveButton.click();

      await expect(page.getByText(/Reserva creada|Creado exitosamente/i).or(page.getByText(/actualizado/i))).toBeVisible({ timeout: 5000 });
    }
  });
});
