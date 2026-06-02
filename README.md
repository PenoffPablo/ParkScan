# 🅿️ ParkScan - Sistema de Gestión de Playa de Estacionamiento

![Status](https://img.shields.io/badge/Status-Release%20Candidate-success)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-teal?logo=tailwindcss)

**ParkScan** es un sistema integral y moderno para la gestión, control y automatización de playas de estacionamiento. Diseñado para ofrecer una experiencia fluida, permite el control de ingresos y egresos (vía QR), automatización de cobros (efectivo y Mercado Pago), administración de sectores, gestión de operarios y análisis de métricas en tiempo real.

---

## 🚀 Características Clave (Release Candidate - Etapa 5)

El sistema en su versión final incluye las siguientes capacidades operativas y de seguridad:

- **Autenticación con Hasheo Bcrypt:** Toda la base de datos de usuarios (Administradores y Operarios) utiliza hasheo de contraseñas no reversible de una vía mediante Bcrypt para la protección de accesos.
- **Control de Actividad de Operarios:** Expulsión en caliente y denegación de login automática para operarios marcados como `inactivos` por el Administrador.
- **Ingreso Manual de Patente:** Panel especial para que el operario registre vehículos de forma manual, asocie plazas y genere el comprobante de ingreso.
- **Ingreso Público de Clientes:** Portal web autónomo para que el cliente consulte disponibilidad y genere un ticket QR en un cajón asignado de forma inteligente.
- **Cobros Multi-Plataforma:** Soporte para cobro presencial en efectivo y pago digital autónomo mediante la integración con la **API de Mercado Pago** y sincronización en tiempo real vía **Supabase Realtime**.

---

## 📄 Documentación Oficial (Etapa 5)

En la carpeta [`/docs`](./docs/) se encuentran los entregables y guías requeridas para el cierre del proyecto:

1. 📘 **[Guía de Usuario](./docs/guia_usuario.md):** Manual operativo detallando el uso del sistema para Clientes, Operarios y Administradores.
2. 📙 **[Informe de Cierre y Lecciones Aprendidas](./docs/informe_cierre.md):** Síntesis del desarrollo anual, pivot tecnológico, retos resueltos y conclusiones.
3. 🔬 **[Reporte Final de Pruebas de Regresión](./docs/reporte_testing_regresion.md):** Evidencia detallada de que el 100% de la suite de pruebas unitarias y E2E pasan satisfactoriamente.

---

## 🚀 Stack Tecnológico

- **Frontend:** React 19 + Vite + Tailwind CSS v4 + React Router DOM v7.
- **Backend & DB:** Supabase (PostgreSQL, Realtime, Edge Functions).
- **Criptografía:** Bcrypt.js (Hasheo y autenticación).
- **Pruebas:** Vitest (Unitarias/Integración) + Playwright (End-to-End).

---

## ⚙️ Requisitos Previos

Para ejecutar este proyecto en tu entorno local, asegúrate de contar con:
- **Node.js** (v18 o superior).
- **npm** (o el gestor de paquetes de tu preferencia).
- **Git**.

---

## 🛠️ Instalación y Configuración Local

1. **Clonar e instalar dependencias:**
   ```bash
   git clone https://github.com/PenoffPablo/ParkScan.git
   cd ParkScan
   npm install
   ```

2. **Variables de Entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto y completa las siguientes claves:
   ```env
   VITE_SUPABASE_URL="tu_url_de_supabase"
   VITE_SUPABASE_ANON_KEY="tu_anon_key_de_supabase"
   ```

3. **Levantar el entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   El servidor de Vite se levantará en `http://localhost:5173`.

---

## 🧪 Testing

Para ejecutar toda la batería de pruebas (unitarias, integración y E2E de Playwright):
```bash
npm run test:all
```

### Ejecutar pruebas individuales:
- **Vitest (Pruebas unitarias):**
  ```bash
  npm run test:unit
  ```
- **Playwright (E2E - Headless):**
  ```bash
  npm run test:e2e
  ```
- **Playwright (Visualizar ejecución - Secuencial):**
  ```bash
  npx playwright test --headed --workers=1
  ```

---

## 🏗️ Arquitectura de Carpetas

```text
/
├── docs/                 # Documentación y reportes de la Etapa 5 (Guía, Cierre, Testing)
├── src/
│   ├── components/       # Componentes de interfaz (Layouts, UI, etc.)
│   ├── pages/            # Vistas principales separadas por rol (Admin, Operario, Cliente)
│   ├── services/         # Integración y llamadas a la API/Supabase
│   ├── utils/            # Lógica de negocio (pricing, validaciones, servicios)
│   └── App.jsx           # Enrutador principal
├── supabase/
│   └── functions/        # Edge Functions (mp-webhook para MercadoPago)
└── vercel.json           # Configuración de despliegue en Vercel
```
