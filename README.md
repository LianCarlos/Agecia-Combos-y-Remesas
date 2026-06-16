<div align="center">

# 💸 Mr Factus — Remesas & Combos

**Plataforma fullstack de remesas internacionales y catálogo de productos para Cuba.**  
Calculadora de envíos en tiempo real, carrito de combos/recargas y checkout directo vía WhatsApp — todo sin un backend intermedio.

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## ✨ ¿Qué hace esta plataforma?

| Módulo | Descripción |
|--------|-------------|
| **Calculadora de Remesas** | Wizard interactivo de 4 pasos: origen → método de pago → método de entrega → monto. Aplica tasa dinámica desde Supabase con validación de límites min/max. |
| **Catálogo de Combos** | Grid de paquetes prearmados de alimentos con precio en USD, tiempo de entrega y opción de personalización. |
| **Catálogo de Productos** | Selección suelta de artículos para armar tu propio pedido a medida. |
| **Recargas Móviles** | Planes de datos/saldo para Cuba con imagen y precio. |
| **Carrito global** | Contexto React que persiste ítems (combos + productos + recargas) durante toda la sesión. |
| **Checkout WhatsApp** | Genera un mensaje pre-formateado con los datos del remitente, beneficiario, remesa y pedido — abre `wa.me` directo, sin pasarela de pago. |
| **Ticker de tasas** | Server Component que muestra cotizaciones en tiempo real al cargar la página. |
| **Panel de administración** | Dashboard completo con autenticación por roles (superadmin / empleado) para gestionar toda la data de la plataforma. |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                       Next.js 16 App Router                     │
│                                                                 │
│  ┌─────────────────┐      ┌──────────────────────────────────┐  │
│  │ Server Components│      │       Client Components          │  │
│  │                 │      │                                  │  │
│  │  MarketTicker   │      │  RemittanceCalculator            │  │
│  │  page.tsx (SSR) │      │  ComboCatalog / ProductsCatalog  │  │
│  │  AppDataProvider│      │  CartProvider / CartWidget       │  │
│  └────────┬────────┘      └──────────────┬───────────────────┘  │
│           │                              │                      │
│           │                      ┌───────▼───────┐             │
│           │                      │  Custom Hooks  │             │
│           │                      │  useRemittance │             │
│           │                      │  useCombos     │             │
│           │                      │  useProducts   │             │
│           │                      └───────┬────────┘             │
│           │                              │                      │
│           │                    ┌─────────▼──────────┐          │
│           └────────────────────►   Server Actions    │          │
│                                │  'use server'       │          │
│                                │  lib/actions/admin  │          │
│                                └─────────┬──────────┘          │
└──────────────────────────────────────────┼──────────────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │   Service Layer          │
                              │   lib/services/*.ts      │
                              └────────────┬─────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │   Supabase (PostgreSQL)  │
                              │   + Row Level Security   │
                              └─────────────────────────┘
```

**Decisiones de diseño clave:**
- **Sin capa REST propia** — los componentes se comunican con la DB directamente mediante Server Actions y servicios del lado del servidor. Menos latencia, menos código, menos superficie de ataque.
- **AppDataProvider** — precarga tasas de cambio, métodos de pago y entrega al montar la app (SSR), evitando waterfalls en la calculadora.
- **Fallback data** — si Supabase falla al iniciar, se sirven datos estáticos para que la UI nunca quede en blanco.
- **Checkout sin backend** — el pedido completo se serializa en una URL de WhatsApp; no se almacena información de pago ni datos personales en la DB.

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Motivo |
|-----------|-----------|--------|
| Framework | **Next.js 16** (App Router) | RSC + Server Actions sin backend separado |
| Lenguaje | **TypeScript 5** | Tipos generados desde Supabase, seguridad de extremo a extremo |
| Estilos | **Tailwind CSS v4** | Nueva sintaxis `@import "tailwindcss"`, cero config |
| Base de datos | **Supabase / PostgreSQL** | RLS por roles, tipos autogenerados, Storage para imágenes |
| Auth | **Supabase Auth + SSR** | Sesiones en cookies HTTP-only, `@supabase/ssr` |
| Testing | **Jest 30 + Testing Library** | Tests unitarios de hooks, utils y componentes |
| Package manager | **pnpm** | Workspaces, instalación rápida |
| Deploy | **Vercel** | CI/CD automático en cada push a `main` |

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── admin/                        # Panel de administración (auth requerida)
│   │   ├── combos/                   # CRUD combos + productos
│   │   ├── currencies/               # Gestión de monedas
│   │   ├── delivery-methods/         # Métodos de entrega
│   │   ├── employees/                # Gestión de empleados (superadmin)
│   │   ├── exchange-rates/           # Matriz de tasas de cambio
│   │   ├── payment-methods/          # Métodos de pago por país
│   │   ├── recargas/                 # Recargas móviles
│   │   ├── components/               # Header, Sidebar, Shell, MobileNav
│   │   ├── actions.ts                # Server Actions del admin
│   │   └── layout.tsx                # Layout con guard de sesión
│   ├── login/page.tsx                # Inicio de sesión empleados
│   ├── globals.css                   # Tailwind + keyframes + utilidades
│   ├── layout.tsx                    # Root layout (metadata, fuente Inter)
│   └── page.tsx                      # Home (SSR: tasas, combos, productos)
│
├── components/
│   ├── AppDataProvider.tsx           # Contexto con datos precargados en SSR
│   ├── cart/
│   │   ├── CartProvider.tsx          # Contexto global del carrito
│   │   └── CartWidget.tsx            # Widget flotante con conteo de ítems
│   ├── CheckoutForm.tsx              # Formulario → URL WhatsApp
│   ├── ComboCatalog.tsx              # Grid de combos con Reveal animations
│   ├── Header.tsx                    # Navbar sticky + smooth scroll con offset
│   ├── MarketTicker.tsx              # Ticker de tasas (Server Component)
│   ├── ProductsCatalog.tsx           # Catálogo de productos sueltos
│   ├── RecargasCatalog.tsx           # Catálogo de recargas móviles
│   ├── RecargasUI.tsx                # UI de recarga + integración carrito
│   ├── RemittanceCalculator.tsx      # Wizard calculadora de remesas
│   └── Reveal.tsx                    # Animaciones scroll (IntersectionObserver)
│
├── hooks/
│   ├── useCombos.ts                  # Fetch y estado de combos
│   ├── useProducts.ts                # Fetch y estado de productos
│   ├── useRemittanceCalculator.ts    # Lógica completa del wizard (4 pasos)
│   └── useReveal.ts                  # IntersectionObserver para animaciones
│
├── lib/
│   ├── actions/
│   │   ├── admin.ts                  # Server Actions CRUD (combos, tasas, métodos...)
│   │   └── employees.ts              # Server Actions de gestión de empleados
│   ├── services/
│   │   ├── calculator.ts             # getCalculatorData() — datos del cotizador
│   │   ├── combos.ts                 # getActiveCombos()
│   │   ├── countries.ts              # getActiveCountries()
│   │   ├── currencies.ts             # getAllCurrencies()
│   │   ├── delivery-methods.ts       # getActiveDeliveryMethods()
│   │   ├── exchange-rates.ts         # getActiveRates(), getRateForCombination()
│   │   ├── payment-methods.ts        # getPaymentMethodsByCountry()
│   │   ├── products.ts               # getActiveProducts()
│   │   └── profiles.ts               # getProfile(), getUsersByRole()
│   ├── supabase/
│   │   ├── admin.ts                  # Cliente con SERVICE_ROLE_KEY (solo server)
│   │   ├── client.ts                 # Cliente browser (NEXT_PUBLIC_*)
│   │   └── server.ts                 # Cliente server con cookies (SSR/RSC)
│   ├── utils/
│   │   ├── currency-convert.ts       # Conversión entre monedas
│   │   └── whatsapp.ts               # buildWhatsAppURL() — serializa el pedido
│   ├── auth.ts                       # getCurrentUserAndProfile(), requireAdmin()
│   └── fallback-data.ts              # Datos estáticos cuando Supabase no responde
│
└── types/
    ├── database.types.ts             # Tipos autogenerados del schema Supabase
    └── index.ts                      # Tipos de dominio (Combo, Product, RateInfo...)

supabase/
└── migrations/
    ├── 001_initial_schema.sql        # Schema base + RLS
    ├── 002_site_settings.sql         # Configuración dinámica del sitio
    ├── 003_remesas_rearchitecture.sql # Reestructura de tasas y métodos
    ├── 004_mobile_recharges.sql      # Tabla de recargas móviles
    └── 005_products.sql              # Tabla de productos sueltos
```

---

## 🗄️ Base de Datos

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `countries` | Países de origen de envíos (🇺🇸 🇲🇽 🇪🇸 🇨🇴 ...) |
| `currencies` | Monedas soportadas con código y símbolo |
| `payment_methods` | Métodos de pago por país (Zelle, transferencia, efectivo...) |
| `delivery_methods` | Métodos de entrega en Cuba (CUP, MLC, USD efectivo...) |
| `exchange_rates` | Tasa por combinación pago↔entrega, con límites min/max |
| `combos` | Paquetes de alimentos con imagen, precio y días de entrega |
| `products` | Productos sueltos para armar pedidos a medida |
| `mobile_recharges` | Planes de recarga móvil para Cuba |
| `profiles` | Perfiles de empleados vinculados a `auth.users` con rol |
| `site_settings` | Configuración dinámica (teléfono WhatsApp, textos...) |

### Relaciones clave

```
countries
  └── payment_methods (country_id → currencies)
        └── exchange_rates (payment_method_id)
              └── delivery_methods (delivery_method_id)
```

La constraint `UNIQUE(payment_method_id, delivery_method_id)` en `exchange_rates` garantiza que cada combinación pago/entrega tenga exactamente una tasa.

### Seguridad con RLS

- **Lectura pública** — combos, productos, recargas, tasas y métodos son accesibles sin autenticación.
- **Escritura restringida** — solo roles `superadmin` y `empleado` en el JWT pueden mutar datos.
- **Superadmin exclusivo** — gestión de empleados y sus perfiles.
- **Sin datos de pago en DB** — el checkout completo vive en una URL de WhatsApp; nada sensible se almacena.

---

## 🔐 Panel de Administración

Accesible en `/admin` — requiere inicio de sesión con cuenta creada por un superadmin.

| Sección | Qué gestiona |
|---------|-------------|
| **Dashboard** | Vista general con métricas rápidas |
| **Combos & Productos** | CRUD con subida de imagen o URL externa, toggle activo/inactivo, bulk delete |
| **Recargas** | CRUD de planes móviles con imagen |
| **Tasas de cambio** | Edición inline de la matriz completa de tasas |
| **Métodos de pago** | Creación y toggle por país/moneda |
| **Métodos de entrega** | Gestión de modalidades de entrega |
| **Monedas** | Administración de monedas soportadas |
| **Empleados** | Alta y baja de cuentas *(solo superadmin)* |

---

## 🚀 Instalación y Desarrollo

### Requisitos

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- Proyecto Supabase con las migraciones aplicadas

### Variables de entorno

Crea `.env.local` en la raíz:

```bash
# Supabase (servidor)
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Supabase (cliente público)
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Aplicar migraciones

Ejecuta en orden desde el **SQL Editor** de Supabase:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_site_settings.sql
supabase/migrations/003_remesas_rearchitecture.sql
supabase/migrations/004_mobile_recharges.sql
supabase/migrations/005_products.sql
```

### Comandos

```bash
pnpm install          # Instalar dependencias
pnpm dev              # Desarrollo → http://localhost:3000
pnpm build            # Build de producción
pnpm start            # Servidor en producción
pnpm test             # Tests unitarios (Jest)
pnpm test:watch       # Tests en modo watch
pnpm lint             # ESLint
```

---

## 🧪 Testing

```bash
pnpm test
```

| Archivo | Qué testea |
|---------|-----------|
| `hooks/__tests__/useRemittanceCalculator.test.ts` | Lógica del wizard: pasos, cálculo de tasa, límites min/max |
| `lib/utils/__tests__/whatsapp.test.ts` | Generación correcta de URLs `wa.me` pre-formateadas |

---

## 📦 Patrones destacados

### Server Actions en lugar de API routes

```ts
// ❌ Antes: llamada HTTP con fetch + manejo de status codes
await fetch('/api/admin/combos', { method: 'POST', body: JSON.stringify(data) })

// ✅ Ahora: función tipada, ejecutada en el servidor, sin HTTP layer
await createComboAction(data)
```

### AppDataProvider — datos críticos precargados en SSR

```tsx
// page.tsx (Server Component) — una sola query al arrancar
const calculatorData = await getCalculatorData();

// Los datos viajan al cliente sin ningún fetch adicional
<AppDataProvider initialData={calculatorData}>
  <RemittanceCalculator />   {/* instantáneo, sin loading state */}
</AppDataProvider>
```

### Reveal — animaciones de scroll con reset

```tsx
// Se reanima cada vez que la sección entra al viewport
// Transición solo en entrada → reset instantáneo al salir
<Reveal delay={150}>
  <ComboCatalog />
</Reveal>
```

---

## 📄 Licencia

Proyecto privado — © 2025 Mr Factus. Todos los derechos reservados.
