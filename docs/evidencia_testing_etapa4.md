# Evidencia de Testing Funcional (Etapa 4)

**Flujos Automatizados:** 
1. Autenticación de Usuarios (Login Válido, Inválido y Validaciones)
2. Integración de Pagos (Consumo de API Externa Mercado Pago y Manejo de Errores)

## 1. Documentación de Casos Automatizados

### 🎯 Objetivo General
Asegurar el correcto funcionamiento de los pilares técnicos exigidos: el control de acceso estricto mediante el sistema de autenticación, y la resiliencia del sistema ante el consumo de la API de pasarela de pagos (Mercado Pago).

### 📋 Precondiciones Globales
- El servidor de frontend debe estar operativo en `http://localhost:5173`.
- Las llamadas a las APIs externas (Supabase REST y Supabase Edge Functions) serán interceptadas (Mocked) durante la ejecución para garantizar el aislamiento de la prueba y evitar afectar la base de datos productiva o generar cobros reales.

### 🛠️ Casos de Prueba Funcionales (Ejecución E2E Playwright)

| ID | Caso de Prueba | Pasos de Ejecución | Datos de Prueba | Resultado Esperado |
|:---:|---|---|---|---|
| **CP-01** | Validación de campos obligatorios | 1. Navegar a `/admin/login`<br>2. Dejar los campos vacíos<br>3. Hacer clic en "Iniciar Sesión" | *Ninguno* | El navegador bloquea el envío del formulario usando validación HTML5 nativa (`validity.valueMissing`). |
| **CP-02** | Login Inválido (Rechazo API real) | 1. Navegar a `/admin/login`<br>2. Completar con credenciales falsas<br>3. Hacer clic en "Iniciar Sesión" | Usuario: `admin_falso`<br>Password: `123456` | Supabase rechaza la consulta y la interfaz renderiza el contenedor de error "Credenciales incorrectas". |
| **CP-03** | Login Válido (Redirección exitosa) | 1. Navegar a `/admin/login`<br>2. Interceptar red (Mock API)<br>3. Completar credenciales<br>4. Hacer clic en "Iniciar Sesión" | Usuario: `admin`<br>Password: `password_real` | El sistema procesa el acceso, almacena la sesión en `localStorage` y redirige correctamente a `/admin/dashboard`. |
| **CP-04** | Consumo exitoso de API Externa (Mercado Pago) | 1. Navegar a `/pago`<br>2. Interceptar la Edge Function<br>3. Ingresar código de ticket válido<br>4. Presionar "Enter" | Ticket: `PS-1234-5678` | El frontend invoca la API correctamente y renderiza el link "Abrir en Mercado Pago (Web)" apuntando a la URL retornada (`init_point`). |
| **CP-05** | Comportamiento ante caída de la API Externa | 1. Navegar a `/pago`<br>2. Interceptar la Edge Function forzando código 500<br>3. Ingresar código de ticket<br>4. Presionar "Enter" | Ticket: `PS-1234-5678` | La aplicación no crashea. Atrapa el error y notifica al usuario mediante un Alert con el mensaje "Mercado Pago no responde temporalmente". |

---

## 2. Evidencia de Ejecución

### Captura de Resultado en Terminal

```bash
> parkscan@0.0.0 test:e2e
> playwright test

Running 5 tests using 5 workers

[1/5] [chromium] › tests\e2e\01-login.spec.js:22:3 › Flujo de Autenticación - ParkScan › Login Inválido - Credenciales incorrectas
[2/5] [chromium] › tests\e2e\01-login.spec.js:10:3 › Flujo de Autenticación - ParkScan › Validación de campos obligatorios
[3/5] [chromium] › tests\e2e\01-login.spec.js:34:3 › Flujo de Autenticación - ParkScan › Login Válido - Redirección al Dashboard
[4/5] [chromium] › tests\e2e\02-pago-api.spec.js:25:3 › Flujo de Pago e Integración API - ParkScan › Consumo Exitoso de API - Generación de link de Mercado Pago
[5/5] [chromium] › tests\e2e\02-pago-api.spec.js:54:3 › Flujo de Pago e Integración API - ParkScan › Comportamiento ante Error de API - Caída de Mercado Pago

  5 passed (4.8s)
```

### Captura del Reporte HTML
*(Adjuntar la captura de pantalla del comando `npx playwright show-report` aquí)*

### Comentario sobre Incidentes Encontrados y Soluciones
- **Manejo de Errores Nativos (Supabase):** Durante el desarrollo del `CP-02`, se detectó que al mockear la respuesta de Supabase con un Array vacío (`[]`), el cliente arrojaba el error `PGRST116`, afectando la respuesta esperada de la UI. Se optó por impactar directamente la base real con credenciales falsas para asegurar una prueba fideligna de la interacción frontend-backend.
- **Riesgo Mitigado (Seguridad Webhook):** Se realizó una revisión técnica de la Edge Function (`mp-webhook`) frente a la vulnerabilidad común de Bypass de pagos. Se comprobó que la implementación no confía en los estados enviados por el webhook; en su lugar, utiliza el `paymentId` para consultar activamente a MercadoPago por una conexión cifrada, lo que neutraliza el riesgo de falsificaciones.
