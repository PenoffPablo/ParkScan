# Reporte Final de Pruebas de Regresión (Etapa 5)

**Proyecto:** ParkScan - Sistema Automatizado de Gestión de Estacionamiento
**Versión Evaluada:** 1.0 (Release Candidate)
**Integrantes:** Juan Manuel Atencio, Máximo Muñoz, Francisco Navas, Kevin Nieto, Pablo Penoff
**Última Ejecución:** Exitoso (11/11 tests aprobados)

---

## 1. Objetivo del Documento

Este reporte certifica la **calidad, estabilidad e integración general** del sistema ParkScan en su etapa final de desarrollo (Etapa 5). Estas **Pruebas de Regresión** garantizan que las nuevas implementaciones críticas:
- **Hasheo de Contraseñas (Bcrypt):** Conversión de toda la base de datos de credenciales a hashes no reversibles y verificación en el flujo de Login.
- **Ingreso Manual de Operario:** Nueva pantalla para que el personal de playa registre patentes y asigne cajones físicamente.
- **Control de Operarios Inactivos:** Expulsión automática y bloqueo de transacciones para operarios dados de baja por el Administrador.
No han quebrado las funcionalidades core del sistema desarrolladas en etapas tempranas.

## 2. Metodología y Cobertura

La validación del sistema (Release Candidate) se dividió en dos grandes dimensiones automatizadas, logrando un 100% de cobertura sobre los flujos críticos:

1. **Lógica Interna e Infraestructura (Pruebas Unitarias - Vitest):** Verifican que la base de datos y la capa de servicios gestionen correctamente la arquitectura del predio (CRUD de Sectores y Plazas) y cálculo de tarifas.
2. **Flujos de Usuario y Seguridad (Pruebas E2E - Playwright):** Simulan el comportamiento humano en el navegador, validando el Control de Acceso, los estados de sesión y la Integración con Pasarela de Pagos.

---

## 3. Matriz de Resultados de Regresión Final

### 3.1. Módulo Core: Infraestructura y Gestión Operativa
Herramienta: `Vitest`
Objetivo: Garantizar que la gestión física del estacionamiento permanece intacta.

| ID Prueba | Escenario de Regresión Evaluado | Criterio de Aceptación | Resultado |
| :--- | :--- | :--- | :--- |
| **REG-CRUD-01** | Lectura de Sectores habilitados | El sistema recupera el árbol de sectores y plazas sin latencias ni errores de red. | **[PASSED]** |
| **REG-CRUD-02** | Creación Atómica (Sector + Plazas) | Al crear un sector de capacidad N, se autogeneran N plazas correlativas en la base de datos. | **[PASSED]** |
| **REG-CRUD-03** | Modificación de Estado | Actualizar un sector a "Mantenimiento" inactiva correctamente el área visual para el operario. | **[PASSED]** |
| **REG-CRUD-04** | Eliminación Controlada | Borrar un sector elimina en cascada únicamente sus propias plazas asociadas. | **[PASSED]** |

*Tiempo de ejecución total: 13ms.*

---

### 3.2. Módulo de Seguridad: Autenticación con Hasheo Bcrypt
Herramienta: `Playwright E2E`
Objetivo: Validar que los mecanismos de protección de rutas y formularios sigan respondiendo acorde a la arquitectura, utilizando contraseñas cifradas.

| ID Prueba | Escenario de Regresión Evaluado | Criterio de Aceptación | Resultado |
| :--- | :--- | :--- | :--- |
| **REG-AUTH-01** | Validación HTML5 | El navegador bloquea nativamente intentos de inicio de sesión con campos vacíos. | **[PASSED]** |
| **REG-AUTH-02** | Bloqueo por Credenciales Falsas | La UI despliega alerta roja sin crashear el sistema ante rechazo de Base de Datos. | **[PASSED]** |
| **REG-AUTH-03** | Login Exitoso con Bcrypt | Se verifica la contraseña hasheada, se genera token en `localStorage` y redirige a `/admin/dashboard`. | **[PASSED]** |
| **REG-AUTH-04** | Operario Inactivo Bloqueado | Un operario con `estado === 'inactivo'` en la base de datos tiene denegado el login y es expulsado si intenta operar. | **[PASSED]** |

*Tiempo de ejecución total: 16.8s.*

---

### 3.3. Módulo de Operario: Ingreso Manual y Cobros
Herramienta: `Playwright E2E`
Objetivo: Comprobar que el operario puede registrar ingresos con patente manualmente y cobrar en efectivo o digital.

| ID Prueba | Escenario de Regresión Evaluado | Criterio de Aceptación | Resultado |
| :--- | :--- | :--- | :--- |
| **REG-OP-01** | Ingreso Manual de Patente | El operario registra una patente, asocia una plaza libre y el sistema genera el ticket activo correctamente. | **[PASSED]** |
| **REG-OP-02** | Flujo de Cobro Manual en Efectivo | Se busca el ticket, se calcula la tarifa por horas y al presionar "Efectivo" se liquida la deuda y libera la plaza. | **[PASSED]** |

---

### 3.4. Módulo Financiero: Integración con Mercado Pago
Herramienta: `Playwright E2E` + `Supabase Edge Functions`
Objetivo: Comprobar la resiliencia en la comunicación de pagos y la correcta generación de URLs para los clientes.

| ID Prueba | Escenario de Regresión Evaluado | Criterio de Aceptación | Resultado |
| :--- | :--- | :--- | :--- |
| **REG-API-01** | Emisión de Link de Pago | Tras consultar un ticket, la pasarela de Mercado Pago devuelve la URL y la UI habilita el botón "Pagar". | **[PASSED]** |
| **REG-API-02** | Tolerancia a Fallos (API Caída) | Si Mercado Pago está caído (error 500), el sistema alerta al cliente informando de la desconexión temporal de forma segura. | **[PASSED]** |

*Tiempo de ejecución total: 21.4s.*

---

## 4. Conclusión Técnica Final

Las métricas arrojadas por la suite de pruebas indican que **ParkScan Release Candidate** ha mantenido su integridad de código al 100%. Las nuevas incorporaciones (ingreso manual, cifrado de contraseñas de operarios y administradores, y seguridad ante operarios inactivos) no afectaron negativamente a las funcionalidades preexistentes.

Todos los flujos críticos fueron validados exitosamente (**11/11 tests aprobados**), asegurando que la aplicación es altamente estable y se encuentra en óptimas condiciones para producción.
