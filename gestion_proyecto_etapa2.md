# Actualización de la Gestión del Proyecto - ParkScan

Este documento presenta la revisión y actualización de los componentes de gestión del proyecto, reflejando el progreso alcanzado durante la **Etapa 2** y las decisiones estratégicas tomadas durante el desarrollo.

---

## 1. Actualización del Análisis de Riesgos

Se han revisado los riesgos identificados en la fase inicial (Etapa 1) y se han incorporado nuevos factores detectados durante la implementación técnica.

### Matriz de Riesgos Actualizada

| Riesgo | Impacto | Probabilidad | Estado / Mitigación |
| :--- | :--- | :--- | :--- |
| **Manejo de Concurrencia** | Alto | Media | **Mitigado**: La migración a Supabase (PostgreSQL) permite un manejo de transacciones más robusto que la propuesta inicial en MySQL. |
| **Integridad de Datos** | Crítico | Baja | **Controlado**: Se implementaron validaciones de datos en frontend y constraints en la base de datos para evitar registros huérfanos. |
| **Dependencia de API Externa (MP)** | Alto | Media | **Nuevo / Activo**: El sistema de pagos depende de la disponibilidad de Mercado Pago. Se mitigó permitiendo pagos manuales por parte del operario como backup. |
| **Curva de Aprendizaje (Pivot Tecnológico)** | Medio | Alta | **Superado**: El cambio de Flask a React/Vite/Supabase supuso un reto inicial, pero resultó en una arquitectura más moderna y escalable. |
| **Dificultades Técnicas de Integración** | Medio | Media | **Nuevo / Resuelto**: La comunicación entre el frontend y las Edge Functions para generar preferencias de pago presentó retos de CORS y autenticación, ya resueltos. |
| **Retrasos en el Desarrollo** | Medio | Baja | **Controlado**: El uso de herramientas ágiles y la simplificación de la arquitectura backend (BaaS) permitieron compensar el tiempo invertido en el pivot tecnológico. |

---

## 2. Revisión del Análisis Costo-Beneficio

El análisis original se ha actualizado considerando los recursos reales utilizados y el valor agregado por las nuevas funcionalidades.

### Recursos Utilizados vs. Planificados
- **Infraestructura**: Se mantuvo el costo de $0 mediante el uso de la capa gratuita de **Supabase** y **Vercel**, superando la expectativa inicial de requerir un servidor local para MySQL/Flask.
- **Esfuerzo de Desarrollo**: Se invirtieron horas adicionales en la configuración de la integración con Mercado Pago y el aprendizaje de Supabase Realtime. Sin embargo, esto redujo drásticamente el tiempo necesario para desarrollar un backend manual en Python.

### Complejidad y Valor Agregado
1. **Autenticación por Roles**: Agrega un valor crítico de seguridad y auditoría que no estaba detallado en el prototipo funcional inicial.
2. **Pagos Autónomos (API MP)**: Representa el mayor salto de valor. Reduce la carga de trabajo del operario y minimiza el error humano en el cobro, impactando directamente en la rentabilidad del negocio.
3. **Sincronización en Tiempo Real**: La implementación de *websockets* (Supabase Realtime) para detectar pagos mejora la experiencia del cliente (UX), eliminando la necesidad de recargas manuales de página.

### Conclusión del Análisis
A pesar del incremento en la complejidad técnica debido al cambio de stack, el **beneficio neto ha aumentado**. El sistema es ahora más "automático" de lo planeado originalmente (autogestión del cliente), lo que incrementa el retorno de inversión (ROI) estimado al reducir la necesidad de personal dedicado exclusivamente a la caja.

---

## 3. Decisiones Estratégicas y Evolución
La decisión de migrar a una arquitectura **SPA (Single Page Application)** con React y un **BaaS (Backend as a Service)** como Supabase ha permitido:
- Mayor velocidad de respuesta en la interfaz de usuario.
- Reducción de la superficie de ataque al no gestionar un servidor propio.
- Facilidad para escalar a futuro (ej. implementación de notificaciones push o apps móviles).
