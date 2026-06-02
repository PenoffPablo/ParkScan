# Guía de Usuario: ParkScan

**Proyecto:** ParkScan - Sistema Automatizado de Gestión de Estacionamiento
**Versión:** 1.0 (Release Candidate)
**URL del Sistema:** [https://parkscan.vercel.app/](https://parkscan.vercel.app/)

---

## 1. Introducción
ParkScan es un sistema diseñado para modernizar y agilizar el control de playas de estacionamiento. Esta guía está orientada a los tres perfiles principales que interactúan con la plataforma: **Administradores**, **Operarios** y **Clientes**.

---

## 2. Perfil: Administrador (Dueño/Gerente)

El Administrador tiene control total sobre la configuración física y financiera del estacionamiento.

### 2.1. Acceso al Sistema
1. Ingresar a la URL del sistema y dirigirse a la sección de **Administración** (ej. `/admin/login`).
2. Introducir las credenciales proporcionadas (Usuario y Contraseña).
3. Hacer clic en "Iniciar Sesión". 

### 2.2. Panel Principal (Dashboard)
Al ingresar, visualizarás el estado general de la playa:
- Ocupación en tiempo real.
- Recaudación diaria e ingresos por turno.
- Volumen de tráfico de vehículos.

### 2.3. Gestión de Sectores y Plazas
- **Crear Sector:** Permite definir nuevas áreas físicas (ej. "Planta Baja"). Al definir la capacidad, el sistema generará automáticamente las plazas correspondientes.
- **Editar/Eliminar Sector:** Permite modificar nombres o dar de baja sectores que estén en mantenimiento.
- *Nota:* Las plazas no se pueden borrar si tienen vehículos activos registrados.

---

## 3. Perfil: Operario (Personal de Playa)

El Operario es el encargado de la gestión diaria, recepción de vehículos y cobros manuales (si los hubiera).

### 3.1. Acceso y Apertura de Turno
1. Ingresar mediante el panel de acceso para Operarios.
2. Tras iniciar sesión, el sistema registrará el inicio de su turno operativo para la trazabilidad de caja.

### 3.2. Ingreso de Vehículos
1. En el dashboard del operario, seleccionar una **Plaza Libre**.
2. Registrar la patente del vehículo.
3. El sistema generará un **Ticket Digital con Código QR** y registrará la hora exacta de entrada. 

### 3.3. Gestión de Salidas y Cobro Manual
- Si el cliente desea pagar en efectivo, el operario escanea el ticket QR (o ingresa el código).
- El sistema calcula automáticamente la tarifa en base al tiempo transcurrido.
- Se confirma el cobro y la plaza queda inmediatamente "Libre" para un nuevo vehículo.

---

## 4. Perfil: Cliente (Conductor)

El cliente interactúa de forma autónoma con el sistema para agilizar su salida.

### 4.1. Visualización del Ticket
- Al ingresar, el operario le brindará un código QR.
- Escaneando este código con su teléfono móvil, el cliente accede al portal de Autogestión.

### 4.2. Portal de Autogestión y Pago Online
1. El portal mostrará los datos de su estadía: Patente, Sector, Plaza, Hora de Ingreso y Tiempo Transcurrido.
2. Al decidir retirarse, el cliente visualiza el monto total adeudado.
3. **Pago con Mercado Pago:** Al pulsar "Pagar", el sistema lo redirige de forma segura a la pasarela de Mercado Pago.
4. Tras completar el pago, el sistema valida la transacción y habilita la salida del vehículo automáticamente, liberando la plaza.

---
*Fin de la guía.*
