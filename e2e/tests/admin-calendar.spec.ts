import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Admin Agenda', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
  });

  test('debe mostrar la agenda con el calendario', async ({ page }) => {
    await expect(page.locator('.fc')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /Nueva reserva/i })).toBeVisible();
  });

  test('debe abrir el modal de nueva reserva', async ({ page }) => {
    await page.getByRole('button', { name: /Nueva reserva/i }).click();
    await expect(
      page.getByRole('heading', { name: /Nueva reserva|Bloquear horario/i })
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Cancha/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Bloqueo/i })).toBeVisible();
  });

  test('mobile: usa vista día sin overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    const bar = page.getByTestId('agenda-mobile-bar');
    await expect(bar).toBeVisible({ timeout: 15000 });

    // La vista mobile debe ser día (una sola columna), no la semana.
    await expect(page.locator('.fc-timeGridDay-view')).toBeVisible();
    await expect(page.locator('.fc-timegrid-col.fc-day')).toHaveCount(1);

    // Sin scroll horizontal en el documento.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // El CTA abre el bottom sheet de nueva reserva.
    await page.getByRole('button', { name: /Nueva reserva/i }).click();
    await expect(
      page.getByRole('heading', { name: /Nueva reserva|Bloquear horario/i })
    ).toBeVisible({ timeout: 5000 });
  });
});
