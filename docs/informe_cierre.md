# Informe de Cierre y Lecciones Aprendidas

**Proyecto:** ParkScan - Sistema Automatizado de Gestión de Estacionamiento
**Etapa:** 5 - Versión Final (Release Candidate)
**Integrantes:** Juan Manuel Atencio, Máximo Muñoz, Francisco Navas, Kevin Nieto, Pablo Penoff
**Repositorio Oficial:** [https://github.com/PenoffPablo/ParkScan](https://github.com/PenoffPablo/ParkScan)
**Deploy:** [https://parkscan.vercel.app/](https://parkscan.vercel.app/)

---

## 1. Síntesis del Proceso Desarrollado

El proyecto ParkScan nació como respuesta a la necesidad de modernizar playas de estacionamiento de tamaño medio, pasando de un registro manual propenso a errores a un sistema automatizado, escalable y basado en códigos QR. A lo largo del año, la evolución del producto se dividió en las siguientes fases clave:

- **Etapas 1 y 2 (Ideación y Factibilidad):** Definimos el alcance inicial, diseñamos la interfaz de usuario con un enfoque minimalista y evaluamos la factibilidad técnica optando originalmente por Python/Flask.
- **Etapa 3 (Planificación y Pivot Tecnológico):** Tras un análisis más profundo de los requisitos de interactividad y escalabilidad, decidimos pivotar de Flask hacia una arquitectura moderna basada en React (Vite) en el frontend y Supabase (BaaS) en el backend. En esta etapa desarrollamos la cimentación de la Base de Datos y las Pruebas Unitarias.
- **Etapa 4 (Transaccionalidad y Robustez):** Implementamos las funcionalidades críticas: Control de accesos con Roles, Gestión en Tiempo Real y la integración con la API externa de Mercado Pago mediante Edge Functions seguras. Se afianzó la estabilidad del código mediante Pruebas de Extremo a Extremo (E2E) con Playwright.
- **Etapa 5 (Release Candidate):** Consolidación final del producto. Se pulieron las validaciones, se generaron las guías de usuario y se corrieron las Pruebas de Regresión definitivas para asegurar que todos los módulos trabajen en sintonía. El sistema alcanzó su madurez, estando listo para producción.

---

## 2. Lecciones Aprendidas y Desafíos Resueltos

Durante el ciclo de vida del desarrollo nos enfrentamos a diversos retos técnicos y de gestión que forjaron nuestra experiencia:

1. **Flexibilidad Arquitectónica (El Pivot a Supabase):** 
   *Dificultad:* Mantener nuestro propio backend y base de datos relacional requería mucho tiempo de configuración e infraestructura.
   *Aprendizaje:* Adoptar un Backend as a Service (Supabase) aceleró drásticamente el desarrollo y nos brindó herramientas como autenticación y funciones *serverless* nativas. Aprendimos a adaptar nuestras decisiones técnicas en favor de la agilidad del proyecto sin comprometer la seguridad.

2. **Integración con Servicios Externos (Mercado Pago):**
   *Dificultad:* Lidiar con asincronía, webhooks y evitar vulnerabilidades (ej. manipulación de pagos desde el cliente).
   *Aprendizaje:* Comprendimos la importancia crucial de que el backend sea la única fuente de verdad. El uso de `Edge Functions` de Supabase para generar las preferencias de pago y validar los webhooks nos enseñó a proteger las transacciones financieras aislando la lógica crítica del frontend.

3. **La Importancia del Testing Automatizado:**
   *Dificultad:* A medida que el sistema crecía, un cambio en la base de datos rompía inesperadamente la interfaz gráfica (efecto cascada).
   *Aprendizaje:* Implementar *Vitest* para la lógica de negocio y *Playwright* para flujos de usuario fue revelador. Las pruebas dejaron de ser una "obligación" académica para convertirse en nuestra principal red de seguridad antes de cada integración.

4. **Trabajo en Equipo y Scrum:**
   *Dificultad:* Sincronizar a 5 desarrolladores y evitar conflictos de código en Git.
   *Aprendizaje:* La división modular del trabajo (Frontend vs. Servicios vs. Testing) demostró ser fundamental para evitar cuellos de botella y maximizar el rendimiento de las *sprints*.

---

## 3. Trabajo Futuro y Mejoras Posibles

Si bien el MVP (Release Candidate) cumple con el 100% de los objetivos estipulados, hemos identificado vías de expansión a futuro:
- **Soporte Offline:** Implementar Service Workers (PWA) para que el operario pueda seguir escaneando vehículos si ocurre una caída temporal de internet.
- **Métricas Avanzadas:** Integrar gráficos dinámicos complejos para predecir picos de demanda utilizando inteligencia artificial sobre el histórico de datos.
