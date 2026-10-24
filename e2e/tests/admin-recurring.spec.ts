import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Admin Recurring Reservations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('RC-01: Ver página de reservas recurrentes', async ({ page }) => {
    await page.goto('/admin/recurring');

    await expect(page.getByRole('heading', { name: /Reservas fijas/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /Crear en agenda/i })).toBeVisible();
    await expect(page.getByTestId('recurring-toolbar')).toBeVisible();
    await expect(page.getByRole('button', { name: /Finalizadas/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Filtros/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Buscar recurrencias/i })).toBeVisible();
  });

  test('RC-02: Listar clientes recurrentes', async ({ page }) => {
    await page.goto('/admin/recurring');

    await page.waitForTimeout(3000);

    const content = page
      .getByTestId('recurring-list')
      .or(page.getByText(/Todavía no hay reservas recurrentes/i))
      .or(page.getByText(/No encontramos recurrencias/i));
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });
});
