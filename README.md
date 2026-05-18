# 🅿️ ParkScan - Sistema de Gestión de Playa de Estacionamiento

![Status](https://img.shields.io/badge/Status-En%20Desarrollo-green)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-teal?logo=tailwindcss)

**ParkScan** es un sistema integral y moderno para la gestión, control y automatización de playas de estacionamiento. Diseñado para ofrecer una experiencia fluida, permite el control de ingresos y egresos (vía QR), automatización de cobros, administración de sectores, gestión de operarios y análisis de métricas en tiempo real.

---

## 🚀 Stack Tecnológico

El proyecto se sustenta en una arquitectura moderna enfocada en el rendimiento y la escalabilidad:

### Frontend
- **Framework:** React 19 + Vite.
- **Estilos:** Tailwind CSS v4 para diseño responsive y componentes consistentes.
- **Enrutamiento:** React Router DOM para navegación tipo SPA.
- **Iconografía:** Lucide React.
- **Componentes Extra:** `react-day-picker`, `qrcode.react`, `pdf-parse`.

### Backend & Servicios Integrados
- **BaaS:** Supabase (PostgreSQL, Autenticación, Storage).
- **Edge Functions:** Procesamiento serverless en Supabase con Deno (Ej: Webhooks de cobro).
- **Pasarela de Pagos:** Integración nativa con MercadoPago.

### Calidad y Testing
- **Linter:** ESLint (Configuración estricta de React Hooks).
- **Unit Testing:** Vitest, React Testing Library y Jest-DOM para garantizar la fiabilidad del código y los servicios (`sectorService`, `pricing`, `operarioService`).

---

## ⚙️ Requisitos Previos

Para ejecutar este proyecto en tu entorno local, asegúrate de contar con:
- **Node.js** (v18 o superior).
- **npm** (o el gestor de paquetes de tu preferencia).
- **Git**.

---

## 🛠️ Instalación y Configuración Local

1. **Clonar e instalar dependencias:**
   Una vez posicionado en el directorio raíz del repositorio, instala las dependencias de NPM:
   ```bash
   npm install
   ```

2. **Variables de Entorno:**
   Crea un archivo `.env` o `.env.local` en la raíz del proyecto. Deberás incluir las credenciales vitales para el funcionamiento (pide acceso al administrador del proyecto si no las tienes):
   ```env
   VITE_SUPABASE_URL="tu_url_de_supabase"
   VITE_SUPABASE_ANON_KEY="tu_anon_key_de_supabase"
   ```

3. **Levantar el entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   El servidor de Vite se levantará típicamente en `http://localhost:5173`.

---

## 🧪 Testing

Una aplicación en producción requiere pruebas sólidas. Hemos implementado **Vitest** como motor de pruebas.

Para ejecutar toda la batería de pruebas (unitarias, integración y E2E de Playwright):
```bash
npm run test:all
```
*(Si solo deseas ejecutar las pruebas unitarias rápidas, puedes utilizar `npm run test:unit`)*

---

## 🏗️ Arquitectura de Carpetas Destacada

```text
/
├── src/
│   ├── components/       # Componentes de interfaz reutilizables (Layouts, UI, etc.)
│   ├── pages/            # Vistas principales separadas por rol (Admin, Operario, etc.)
│   ├── services/         # Integración y llamadas a la API/Supabase (sectorService, etc.)
│   ├── utils/            # Lógica de negocio modularizada (pricing, validaciones, etc.)
│   └── App.jsx           # Punto de entrada y configuración de rutas
├── supabase/
│   └── functions/        # Deno Edge Functions (ej. mp-webhook para MercadoPago)
└── vercel.json           # Configuración de despliegue en Vercel
```

---

## 🚀 Despliegue

La aplicación frontend está lista para ser desplegada en **Vercel** o plataformas similares. 
La configuración de enrutamiento necesaria para Single Page Applications ya se encuentra definida en el archivo `vercel.json` en la raíz del proyecto.
