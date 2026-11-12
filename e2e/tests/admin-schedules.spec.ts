import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Admin Espacios', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/spaces');
  });

  test('muestra el listado de espacios con filtros y búsqueda', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^Espacios$/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder(/Buscar espacio/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Todas \(\d+\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Canchas \(\d+\)/i })).toBeVisible();
  });

  test('abre el detalle del espacio con el panel de horarios', async ({ page }) => {
    const card = page.locator('article').first();
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.getByRole('button', { name: /Gestionar/i }).click();

    await expect(page.getByRole('button', { name: 'Horario semanal' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Guardar cambios/i })).toBeVisible();
  });

  test('permite filtrar por categoría', async ({ page }) => {
    const canchas = page.getByRole('button', { name: /Canchas \(\d+\)/i });
    await expect(canchas).toBeVisible({ timeout: 15000 });
    await canchas.click();

    const cards = page.locator('article');
    const count = await cards.count();
    for (let index = 0; index < count; index += 1) {
      await expect(cards.nth(index).getByText(/^Cancha$/i)).toBeVisible();
    }
  });
});

test.describe('Admin Espacios mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('sin overflow horizontal y guardar visible en el detalle', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/spaces');
    await expect(page.getByRole('heading', { name: /^Espacios$/i })).toBeVisible({ timeout: 15000 });

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasOverflow).toBe(false);

    await page.locator('article').first().getByRole('button', { name: /Gestionar/i }).click();
    await expect(page.getByRole('button', { name: /Guardar cambios/i })).toBeVisible({ timeout: 10000 });
  });
});
