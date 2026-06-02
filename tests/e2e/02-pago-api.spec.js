import { test, expect } from '@playwright/test';

test.describe('Flujo de Pago e Integración API - ParkScan', () => {

  test.beforeEach(async ({ page }) => {
    // Interceptar la llamada a Supabase para buscar el ticket
    // Simulamos que el ticket existe y no está pagado
    await page.route('**/rest/v1/tickets*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id_ticket: 'test-uuid-123',
          codigo_qr: 'PS-1234-5678',
          estado: 'activo',
          hora_entrada: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
          plazas: {
            numero: 'A-12',
            sectores: { nombre: 'Planta Baja' }
          }
        }
      });
    });
  });

  test('Consumo Exitoso de API - Generación de link de Mercado Pago', async ({ page }) => {
    // Interceptar la llamada a la Edge Function 'create-preference'
    // Simulamos que la API externa de Mercado Pago responde correctamente
    await page.route('**/functions/v1/create-preference', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'pref-mock-999',
          init_point: 'https://www.mercadopago.com.ar/mock-checkout'
        }
      });
    });

    await page.goto('/pago');

    // Llenar el input y buscar
    await page.getByPlaceholder('PS-XXXX-XXXX').fill('PS-1234-5678');

    // El botón tiene un icono ArrowRight, no tiene texto, así que buscamos por etiqueta button en el div
    // O más simple, disparamos Enter en el input
    await page.getByPlaceholder('PS-XXXX-XXXX').press('Enter');

    // Aserción: Verificar que se muestra el componente de "Abrir en Mercado Pago"
    // con el href correcto devuelto por la API mockeada.
    const mpLink = page.getByRole('link', { name: /Abrir en Mercado Pago/i });
    await expect(mpLink).toBeVisible({ timeout: 10000 });
    await expect(mpLink).toHaveAttribute('href', 'https://www.mercadopago.com.ar/mock-checkout');
  });

  test('Comportamiento ante Error de API - Caída de Mercado Pago', async ({ page }) => {
    // Interceptar la Edge Function para forzar un error 500 (API Caída)
    await page.route('**/functions/v1/create-preference', async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: 'Mercado Pago no responde temporalmente' }
      });
    });

    // Escuchar el evento de alert() nativo del navegador que tira el catch
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.goto('/pago');

    // Llenar el input y buscar
    await page.getByPlaceholder('PS-XXXX-XXXX').fill('PS-1234-5678');
    await page.getByPlaceholder('PS-XXXX-XXXX').press('Enter');

    // Aserción: Esperar un segundo para que el alert se dispare y validar el mensaje
    // Playwright maneja las promesas rápido, usaremos waitForTimeout corto o chequearemos la variable
    await page.waitForTimeout(1000);

    // Validar que el alert contuvo el mensaje de error de la API
    expect(dialogMessage).toContain('Mercado Pago no responde temporalmente');
  });

});
