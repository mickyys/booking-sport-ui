import { test, expect, Page } from '@playwright/test';

const getTomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

test.describe('Home - Hero Section', () => {
  test('debe mostrar el titulo principal y subtitulo correctos', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: /Encuentra tu Cancha Perfecta/i })).toBeVisible();
    await expect(page.getByText(/Busca y reserva canchas en los mejores centros deportivos de tu ciudad. ¡Tu próximo partido te espera!/i)).toBeVisible();
  });

  test('debe mostrar el input de busqueda con placeholder correcto', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.getByPlaceholder(/Buscar por nombre/i);
    await expect(searchInput).toBeVisible();
  });
});

test.describe('Home - Filters Default Values', () => {
  test('debe tener valores por defecto correctos en los filtros', async ({ page }) => {
    await page.goto('/');
    
    const tomorrowISO = getTomorrowISO();
    
    const citySelect = page.locator('select').first();
    await expect(citySelect).toHaveValue('Todas');
    
    const hourSelect = page.locator('select').nth(1);
    await expect(hourSelect).toHaveValue('');
    
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toHaveValue(tomorrowISO);
  });
});

test.describe('Home - Sport Center Card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('debe mostrar los componentes de la card correctamente', async ({ page }) => {
    const card = page.locator('div.group.bg-white.rounded-2xl').first();
    await expect(card).toBeVisible();
    
    await expect(card.locator('img[alt]')).toBeVisible();
    await expect(card.getByRole('button', { name: /Ver mapa/i })).toBeVisible();
    await expect(card.getByRole('button', { name: /Política de cancelación/i })).toBeVisible();
    await expect(card.getByRole('button', { name: /Ver más/i })).toBeVisible();
    
    const courtsText = card.locator('text=/\\d+ canchas?/i');
    await expect(courtsText).toBeVisible();
    
    const addressText = card.locator('p.text-sm.font-medium.text-slate-900');
    await expect(addressText.first()).toBeVisible();
  });

  test('debe filtrar por nombre y mostrar el centro esperado', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar por nombre/i);
    await searchInput.fill('Union');
    await searchInput.press('Enter');
    
    await page.waitForTimeout(1500);
    
    const cards = page.locator('div.group.bg-white.rounded-2xl');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    
    const firstCardTitle = cards.first().locator('h3');
    await expect(firstCardTitle).toContainText(/union/i);
  });
});
