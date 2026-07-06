import { Page } from '@playwright/test';

const AUTH0_DOMAIN = 'auth.reservaloya.cl';

export async function loginWithAuth0(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByRole('button', { name: /Ingresar/i }).click();

  await page.waitForURL((url) => url.hostname === AUTH0_DOMAIN, { timeout: 15000 });

  const emailInput = page.getByRole('textbox', { name: /email/i });
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(email);

  const passwordInput = page.getByRole('textbox', { name: /password/i });
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill(password);

  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.waitForURL((url) => url.hostname !== AUTH0_DOMAIN, { timeout: 20000 });

  await page.waitForSelector('text=Mi Perfil', { timeout: 10000 });
}

export async function loginAsAdmin(page: Page) {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;
  await loginWithAuth0(page, email, password);
}

export async function loginAsClient(page: Page) {
  const email = process.env.CLIENT_EMAIL!;
  const password = process.env.CLIENT_PASSWORD!;
  await loginWithAuth0(page, email, password);
}

export async function ensureLoggedOut(page: Page) {
  await page.context().clearCookies();
  await page.goto('/');
}
