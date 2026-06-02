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
- Al ingresar, el sistema de barrera de acceso le brindará un código QR con el codigo del ticket.

### 4.2. Portal de Autogestión y Pago Online
1. Al dirigirse al kiosco de pago, el cliente debera escanear el código de ticket y se generará un qr de mercado pago
2. Una vez pagado el ticket se actualizará la pantalla con la verificación del pago, El cliente tendrá 15 minutos para salir del estacionamiento.
3. Al llegar a la barrera de salida, el cliente debe acercar el qr del ticket al lector, el sistema detectará el codigo del ticket pagado y levantará la barrera de salida.

---
*Fin de la guía.*
