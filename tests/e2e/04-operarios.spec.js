import { test, expect } from '@playwright/test';

test.describe('Flujos de Operarios y Administración - ParkScan', () => {

  test('Flujo de Cobro Manual en Efectivo por Operario', async ({ page }) => {
    // Inyectar sesión de operario en localStorage
    await page.addInitScript(() => {
      localStorage.setItem('parkscan_operario', JSON.stringify({ 
        id_operario: 'op-123', 
        nombre: 'Carlos', 
        apellido: 'Operario', 
        usuario: 'carlos_op' 
      }));
    });

    // Mock para validar que el operario está activo (checkStatus en layout)
    await page.route('**/rest/v1/operarios*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [{ id_operario: 'op-123', nombre: 'Carlos', apellido: 'Operario', usuario: 'carlos_op', estado: 'activo' }]
      });
    });

    // Mock de búsqueda de ticket
    await page.route('**/rest/v1/tickets?*', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          json: {
            id_ticket: 'ticket-cobrar-123',
            codigo_qr: 'PS-COBRO',
            estado: 'pendiente',
            hora_entrada: new Date(Date.now() - 5400000).toISOString(), // Hace 1.5 horas para que redondee seguro a 2 horas
            id_plaza: 'plaza-1',
            plazas: {
              id_plaza: 'plaza-1',
              numero: 'B-15',
              sectores: { nombre: 'Subsuelo 1' }
            }
          }
        });
      } else if (request.method() === 'PATCH') {
        // Mock de actualización de estado de ticket a pagado
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });

    // Mock para actualizar plaza a libre
    await page.route('**/rest/v1/plazas?*', async (route) => {
      await route.fulfill({ status: 204 });
    });

    // Mock para insertar el pago
    await page.route('**/rest/v1/pagos?*', async (route) => {
      await route.fulfill({ status: 201 });
    });

    await page.goto('/operario/cobro');

    // Validar el ticket
    await page.getByPlaceholder('PS-XXXX-XXXX').fill('PS-COBRO');
    await page.getByRole('button', { name: /Validar/i }).click();

    // Esperar a que se muestre el detalle del ticket
    await expect(page.getByText('Liquidación de Servicio')).toBeVisible();
    await expect(page.getByText('B-15')).toBeVisible();
    await expect(page.getByText('2 HORAS')).toBeVisible(); // 2 horas calculadas
    
    // Ejecutar Cobro en Efectivo
    await page.getByRole('button', { name: /Efectivo/i }).click();

    // Aserción de éxito
    await expect(page.getByText(/¡Cobro exitoso de/i)).toBeVisible();
    await expect(page.getByText(/La plaza B-15 ha sido liberada/i)).toBeVisible();
  });

  test('Administrador - Ver y Cargar Operarios', async ({ page }) => {
    // Inyectar sesión de administrador en localStorage
    await page.addInitScript(() => {
      localStorage.setItem('parkscan_admin', JSON.stringify({ 
        id_admin: 'adm-1', 
        usuario: 'admin' 
      }));
    });

    // Mock para obtener operarios
    await page.route('**/rest/v1/operarios?*', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id_operario: 'op-1', nombre: 'Juan', apellido: 'Perez', usuario: 'jperez', estado: 'activo' },
          { id_operario: 'op-2', nombre: 'Ana', apellido: 'Gomez', usuario: 'agomez', estado: 'inactivo' }
        ]
      });
    });

    await page.goto('/admin/operarios');

    // Validar que se muestran los operarios en la pantalla
    await expect(page.getByText('Gestión de Personal')).toBeVisible();
    await expect(page.getByText('Juan Perez')).toBeVisible();
    await expect(page.getByText('@jperez')).toBeVisible();
    await expect(page.getByText('Ana Gomez')).toBeVisible();
  });

});
