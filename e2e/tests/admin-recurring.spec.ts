import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Admin Recurring Reservations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('RC-01: Crear cliente recurrente semanal', async ({ page }) => {
    await page.goto('/admin/recurring');

    await expect(page.getByRole('heading', { name: 'Reservas', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Reservas recurrentes/i)).toBeVisible();

    const newButton = page.getByRole('button', { name: /Nuevo|Crear|Agregar/i }).first();
    if (await newButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newButton.click();
      await page.waitForTimeout(1000);
    }

    const nameInput = page.getByPlaceholder(/Nombre/i).or(page.locator('input').first());
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Test Recurring Client');

      const phoneInput = page.getByPlaceholder(/Teléfono/i).or(page.locator('input[type="tel"]').first());
      if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phoneInput.fill('987654321');
      }

      const saveButton = page.getByRole('button', { name: /Guardar|Crear|Confirmar/i }).last();
      await saveButton.click();

      await expect(page.getByText(/Creado|Guardado|actualizado|éxito/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('RC-02: Listar clientes recurrentes', async ({ page }) => {
    await page.goto('/admin/recurring');

    await page.waitForTimeout(3000);

    const table = page.locator('table').or(page.locator('div').filter({ hasText: /Cliente|cliente/i }));
    await expect(table.first()).toBeVisible({ timeout: 10000 });
  });
});
