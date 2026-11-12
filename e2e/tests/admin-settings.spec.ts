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

  test('debe navegar entre las pestañas de configuración', async ({ page }) => {
    const generalTab = page.getByRole('tab', { name: /^General$/i });
    await expect(generalTab).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('tab', { name: /^Marca$/i }).click();
    await expect(page.getByRole('heading', { name: /Identidad de Marca/i })).toBeVisible();

    await page.getByRole('tab', { name: /^Ubicación$/i }).click();
    await expect(page.getByRole('heading', { name: /^Ubicación$/i })).toBeVisible();

    // El guardado es único para todas las pestañas.
    await expect(page.getByRole('button', { name: /Guardar Cambios/i })).toBeVisible();
  });

  test('debe mostrar la sección de pagos parciales', async ({ page }) => {
    await page.getByRole('tab', { name: /^Pagos$/i }).click();
    await expect(page.getByRole('heading', { name: /Pagos Parciales/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Activar pagos parciales/i)).toBeVisible();

    const saveButton = page.getByRole('button', { name: /Guardar Cambios/i });
    await expect(saveButton).toBeVisible();
  });

  test('debe mostrar el interruptor de Mercado Pago', async ({ page }) => {
    await page.getByRole('tab', { name: /^Pagos$/i }).click();
    await expect(page.getByRole('heading', { name: /^Mercado Pago$/i })).toBeVisible({ timeout: 10000 });

    const toggle = page.getByRole('switch', { name: /Cobrar online con Mercado Pago/i });
    await expect(toggle).toBeVisible();

    // Si el cobro online está activo, apagar debe pedir confirmación porque
    // elimina la conexión con Mercado Pago. Cancelamos para no alterar datos.
    if ((await toggle.getAttribute('aria-checked')) === 'true') {
      await toggle.click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expect(page.getByText(/Se eliminará la conexión con Mercado Pago/i)).toBeVisible();
      await page.getByRole('button', { name: /^Cancelar$/i }).click();
      await expect(page.getByRole('alertdialog')).toBeHidden();
    }
  });
});
