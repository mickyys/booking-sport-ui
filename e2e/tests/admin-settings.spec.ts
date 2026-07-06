import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/settings');
  });

  test('debe cargar la configuración general del centro', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Configuración General/i })).toBeVisible({ timeout: 10000 });

    const slugInput = page.getByRole('textbox', { name: /slug|orellana/i });
    await expect(slugInput).toBeVisible();
  });

  test('debe mostrar la sección de pagos parciales', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Pagos Parciales/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Activar pagos parciales/i)).toBeVisible();

    const saveButton = page.getByRole('button', { name: /Guardar Cambios/i });
    await expect(saveButton).toBeVisible();
  });
});
