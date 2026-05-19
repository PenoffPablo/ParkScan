import { test, expect } from '@playwright/test';

test.describe('Flujo de Salida de Vehículos - ParkScan', () => {

  test('Validación Exitosa - Ticket Pagado y Barrera Abierta', async ({ page }) => {
    // Interceptar la búsqueda del ticket
    await page.route('**/rest/v1/tickets?*', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          json: {
            id_ticket: 'ticket-pagado-123',
            estado: 'pagado',
            hora_salida: new Date(Date.now() - 5 * 60000).toISOString() // Pagado hace 5 min
          }
        });
      } else if (request.method() === 'PATCH') {
        // Interceptar la actualización del ticket a estado 'finalizado'
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });

    await page.goto('/salida');

    // Llenar el input (que es el escáner)
    await page.getByPlaceholder('PS-XXXX').fill('PS-PAGADO-123');
    await page.getByPlaceholder('PS-XXXX').press('Enter');

    // Aserción: Esperar que aparezca el estado autorizado
    await expect(page.getByText('¡PAGO VERIFICADO! BARRERA ABIERTA, BUEN VIAJE.')).toBeVisible();
    // Validar visualmente el color o estilo si es posible (ej: aserción sobre un color verde)
    await expect(page.locator('.text-green-500').first()).toBeVisible();
  });

  test('Rechazo por Falta de Pago - Ticket Pendiente', async ({ page }) => {
    await page.route('**/rest/v1/tickets?*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id_ticket: 'ticket-pendiente-456',
          estado: 'pendiente',
          hora_salida: null
        }
      });
    });

    await page.goto('/salida');

    await page.getByPlaceholder('PS-XXXX').fill('PS-PENDIENTE-456');
    await page.getByPlaceholder('PS-XXXX').press('Enter');

    // Aserción: Mostrar error de falta de pago
    await expect(page.getByText('TICKET NO ABONADO. DIRÍJASE A LA TERMINAL DE PAGO.')).toBeVisible();
  });

  test('Rechazo por Ticket Inexistente', async ({ page }) => {
    await page.route('**/rest/v1/tickets?*', async (route) => {
      await route.fulfill({
        status: 406, // Supabase devuelve esto o 404 cuando no hay filas en single()
        json: { message: 'JSON object requested, multiple (or no) rows returned' }
      });
    });

    await page.goto('/salida');

    await page.getByPlaceholder('PS-XXXX').fill('PS-INEXISTENTE');
    await page.getByPlaceholder('PS-XXXX').press('Enter');

    // Aserción: Error de código inválido
    await expect(page.getByText('CÓDIGO DE TICKET INVÁLIDO O NO ENCONTRADO')).toBeVisible();
  });

  test('Rechazo por Tiempo de Gracia Excedido', async ({ page }) => {
    await page.route('**/rest/v1/tickets?*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id_ticket: 'ticket-vencido-789',
          estado: 'pagado',
          hora_salida: new Date(Date.now() - 30 * 60000).toISOString() // Pagado hace 30 min (mayor a 15)
        }
      });
    });

    await page.goto('/salida');

    await page.getByPlaceholder('PS-XXXX').fill('PS-VENCIDO-789');
    await page.getByPlaceholder('PS-XXXX').press('Enter');

    // Aserción: Error de tiempo excedido
    await expect(page.getByText(/TIEMPO EXCEDIDO/)).toBeVisible();
  });

});
