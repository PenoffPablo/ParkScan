# Evidencia de Automatización E2E con Playwright

**Flujo Automatizado:** Login de Administrador (Válido, Inválido y Validación de Campos)

## 1. Documentación del Caso Automatizado

### 🎯 Objetivo del Caso
Asegurar que el mecanismo central de control de acceso al sistema funcione correctamente, garantizando que los usuarios no autenticados no puedan ingresar y que los campos requeridos estén debidamente validados por el frontend, bloqueando intentos incompletos.

### 📋 Precondiciones
- El servidor de desarrollo (Vite) debe estar levantado en el puerto `5173`.
- La base de datos (Supabase) debe estar accesible (para probar el rechazo real) o se debe poder interceptar el tráfico de red mediante Playwright (para simular el inicio exitoso sin depender de datos reales).

### 🛠️ Pasos Cubiertos
1. **Validación de Campos:** Navegar al login y presionar "Iniciar Sesión" sin datos. Validar que el navegador exige el ingreso del usuario (`validity.valueMissing`).
2. **Login Inválido:** Ingresar usuario/password inexistentes. Enviar formulario y validar que la UI renderiza el mensaje de error "Credenciales incorrectas" al fallar la consulta.
3. **Login Válido:** Interceptar la llamada a Supabase para evitar el uso de datos productivos. Inyectar un JSON simulando credenciales exitosas. Presionar botón y verificar redirección a `/admin/dashboard` y que exista el token de sesión en el `localStorage`.

### 📊 Datos de Prueba
- **Login Inválido:** 
  - Usuario: `admin_falso`
  - Password: `123456`
- **Login Válido (Mockeado):** 
  - Usuario: `admin`
  - Password: `password_real` (Simulado)

### ✅ Resultado Esperado
Los tres escenarios deben ejecutarse secuencialmente sin intervención humana, asegurando que el DOM reaccione correctamente (mensajes de error, prevenciones de HTML5 o redirecciones). 

---

## 2. Evidencia de Ejecución

### Captura de Resultado en Terminal

```bash
> parkscan@0.0.0 test:e2e
> playwright test

Running 3 tests using 3 workers

[1/3] [chromium] › tests\e2e\01-login.spec.js:22:3 › Flujo de Autenticación - ParkScan › Login Inválido - Credenciales incorrectas
[2/3] [chromium] › tests\e2e\01-login.spec.js:10:3 › Flujo de Autenticación - ParkScan › Validación de campos obligatorios
[3/3] [chromium] › tests\e2e\01-login.spec.js:34:3 › Flujo de Autenticación - ParkScan › Login Válido - Redirección al Dashboard

  3 passed (4.6s)
```

### Captura del Reporte HTML
Para visualizar el reporte interactivo, puedes ejecutar el siguiente comando en la terminal:
```bash
npx playwright show-report
```
> *(Para la entrega, toma una captura de pantalla (screenshot) de tu navegador al ejecutar el comando superior)*

### Comentario sobre Incidentes Encontrados
Durante el desarrollo del test E2E de **Login Inválido**, se evidenció que no era buena práctica interceptar la API y devolver un array vacío (`[]`). El cliente de base de datos *Supabase* detecta el objeto vacío y devuelve un error nativo (`PGRST116`) el cual, al ser inesperado por la simulación, no disparaba correctamente el mensaje exacto *"Credenciales incorrectas"* esperado en el front. 
**Solución adoptada:** Se removió el mock del caso inválido, dejando que Playwright impacte contra el endpoint real de la base de datos usando datos incorrectos (`admin_falso`). Esto forzó a la DB a rechazar legítimamente la petición, logrando el rechazo nativo y validando de manera precisa la visualización del contenedor de error del componente de React.
