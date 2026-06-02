import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación - ParkScan', () => {

  test.beforeEach(async ({ page }) => {
    // Precondición: Navegar a la página de login de administrador
    await page.goto('/admin/login');
  });

  test('Validación de campos obligatorios', async ({ page }) => {
    // Intentar enviar el formulario vacío
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    // Validar que el navegador bloquea el envío (HTML5 required)
    const usuarioInput = page.getByPlaceholder('Ingresa tu usuario');

    // Verificamos el seudoclase :invalid de CSS nativo
    await expect(usuarioInput).toHaveJSProperty('validity.valueMissing', true);
  });

  test('Login Inválido - Credenciales incorrectas', async ({ page }) => {
    // Completar datos incorrectos
    await page.getByPlaceholder('Ingresa tu usuario').fill('admin_falso');
    await page.getByPlaceholder('••••••••').fill('123456');

    await page.locator('button[type="submit"]').click();

    // Aserción: Verificar que aparece el mensaje de error de UI
    const errorMsg = page.locator('.text-red-400');
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
  });

  test('Login Válido - Redirección al Dashboard', async ({ page }) => {
    // Interceptamos la petición a Supabase para simular un inicio de sesión exitoso
    // Devolvemos un mock de un administrador
    await page.route('**/rest/v1/administradores*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [{ id: 1, usuario: 'admin', password: '$2b$10$j3uty7CrEY38qR7v6f7GJucJg8y9izORfVMcuEMxPCtwdjciJB2YC', rol: 'admin', nombre: 'Admin Mock' }]
      });
    });

    // Completar datos correctos
    await page.getByPlaceholder('Ingresa tu usuario').fill('admin');
    await page.getByPlaceholder('••••••••').fill('password_real');

    await page.locator('button[type="submit"]').click();

    // Aserción: Verificar que la redirección ocurre correctamente
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);

    // Aserción extra: Validar que el localStorage contiene la sesión
    const session = await page.evaluate(() => localStorage.getItem('parkscan_admin'));
    expect(session).toContain('"usuario":"admin"');
  });

});
