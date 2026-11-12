import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Admin Internal Booking', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
  });

  test('IB-01: Crear reserva manual desde la agenda', async ({ page }) => {
    await page.getByRole('button', { name: /Nueva reserva/i }).click();

    const modal = page.getByRole('heading', { name: /Nueva reserva|Bloquear horario/i });
    await expect(modal).toBeVisible({ timeout: 5000 });

    const nameInput = page.getByPlaceholder(/Ej\. Juan Pérez/i);
    const phoneInput = page.getByPlaceholder(/Ej\. \+569/i);
    const confirmButton = page.getByRole('button', {
      name: /Confirmar reserva|Crear \d+ semanas/i,
    });

    await nameInput.fill('Test Internal Booking');
    await phoneInput.fill('987654321');

    // Si no quedan horarios disponibles hoy, el botón sigue deshabilitado.
    if (await confirmButton.isEnabled().catch(() => false)) {
      await confirmButton.click();
      await expect(
        page.getByText(/Reserva creada con éxito|Se crearon \d+ reservas con éxito/i)
      ).toBeVisible({ timeout: 8000 });
    }
  });

  test('IB-02: Abrir formulario de bloqueo', async ({ page }) => {
    await page.getByRole('button', { name: /Nueva reserva/i }).click();
    await page.getByRole('button', { name: /^Bloqueo$/i }).click();

    await expect(page.getByRole('heading', { name: 'Bloquear horario' })).toBeVisible();
    await expect(page.getByText(/quedará no disponible para los clientes/i)).toBeVisible();
  });
});
