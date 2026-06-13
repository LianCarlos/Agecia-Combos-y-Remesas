# 💸 Mr Factus — Remesas & Combos

Plataforma de remesas y catálogo de combos para el mercado cubano. Calculadora de envíos con tasas de cambio dinámicas, catálogo de productos y checkout vía WhatsApp.

## 🧱 Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | [Tailwind CSS v4](https://tailwindcss.com/) |
| Backend | [Supabase](https://supabase.com/) (PostgreSQL + RLS) |
| Cliente Supabase | `@supabase/ssr` + `@supabase/supabase-js` |
| Testing | Jest 30 + Testing Library |
| Package Manager | pnpm |
| Fuente | Inter (Google Fonts) |

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── combos/route.ts          # GET /api/combos
│   │   ├── countries/route.ts       # GET /api/countries
│   │   ├── delivery-methods/route.ts # GET /api/delivery-methods
│   │   ├── exchange-rates/route.ts  # GET /api/exchange-rates
│   │   └── payment-methods/route.ts # GET /api/payment-methods?countryId=
│   ├── globals.css                  # Tailwind + variables CSS
│   ├── layout.tsx                   # RootLayout (metadata, fuente Inter)
│   └── page.tsx                     # Página principal (Home)
├── components/
│   ├── CheckoutForm.tsx             # Formulario de datos → WhatsApp
│   ├── ComboCatalog.tsx             # Catálogo de combos de alimentos
│   ├── Footer.tsx                   # Footer con info de contacto
│   ├── Header.tsx                   # Navbar sticky con anclas
│   ├── MarketTicker.tsx             # Tasas de cambio (Server Component)
│   └── RemittanceCalculator.tsx     # Calculadora wizard (Client Component)
├── hooks/
│   ├── useCombos.ts                 # Hook: fetch /api/combos
│   └── useRemittanceCalculator.ts   # Hook: wizard de 4 pasos + cálculo
├── lib/
│   ├── services/
│   │   ├── combos.ts                # getActiveCombos()
│   │   ├── countries.ts             # getActiveCountries(), getPaymentMethodsByCountry()
│   │   ├── delivery-methods.ts      # getActiveDeliveryMethods()
│   │   └── exchange-rates.ts        # getActiveRates(), getRateForCombination()
│   ├── supabase/
│   │   ├── admin.ts                 # Cliente con SERVICE_ROLE_KEY
│   │   ├── client.ts                # Cliente browser (NEXT_PUBLIC_*)
│   │   └── server.ts                # Cliente server con cookies
│   └── utils/
│       └── whatsapp.ts              # Generador de URL wa.me pre-formateada
└── types/
    ├── database.types.ts            # Tipos generados de Supabase
    └── index.ts                     # Tipos de dominio (RemittanceResult, WhatsAppOrderData, etc.)

supabase/
└── migrations/
    └── 001_initial_schema.sql       # Esquema base + seed data + RLS
```

## 🏗️ Arquitectura

```
UI (Server/Client Components)
  │
  ├── MarketTicker → directo a getActiveRates() (Server Component)
  │
  └── Client Components
        │
        ▼
      Hook (useRemittanceCalculator / useCombos)
        │
        ▼
      API Route (/api/*)
        │
        ▼
      Service Layer (lib/services/*)
        │
        ▼
      Supabase Client (lib/supabase/server.ts)
        │
        ▼
      PostgreSQL (Supabase)
```

- **MarketTicker** es un Server Component asíncrono que llama directamente al servicio.
- **RemittanceCalculator** y **ComboCatalog** son Client Components que usan hooks → fetch a API Routes → Service Layer → Supabase.
- **CheckoutForm** es un Client Component que genera URLs de WhatsApp sin backend.

## 🔐 Seguridad

- **Sin autenticación de usuarios finales**: todas las tablas tienen lectura pública (`anon`, `authenticated`).
- **Row Level Security (RLS)**: habilitado en las 5 tablas.
- **Escritura restringida**: solo usuarios con `role = 'admin'` en el JWT pueden insertar/actualizar/eliminar.
- **Admin**: cliente separado con `SUPABASE_SERVICE_ROLE_KEY` para operaciones privilegiadas (seed, migraciones).

## 🚀 Cómo Empezar

### Prerequisitos

- Node.js 20+
- pnpm
- Proyecto Supabase con la migración `001_initial_schema.sql` aplicada

### Variables de Entorno

Crear `.env.local` en la raíz:

```bash
# Supabase — Server
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Supabase — Browser
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Admin — Token compartido para el panel de administración (/admin)
# Solo se usa en server-side (isAdmin()). Se envía como header Authorization: Bearer <token>.
# Genera uno seguro con: openssl rand -hex 32
ADMIN_API_TOKEN=<tu-token-seguro>
```

### Instalación y Ejecución

```bash
pnpm install
pnpm build
pnpm dev        # Desarrollo en http://localhost:3000
pnpm start      # Producción
```

## 📜 Scripts Disponibles

| Script | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo (Next.js) |
| `pnpm build` | Build de producción |
| `pnpm start` | Iniciar servidor en producción |
| `pnpm lint` | ESLint |
| `pnpm test` | Ejecutar tests (Jest) |
| `pnpm test:watch` | Tests en modo watch |

## 🗄️ Base de Datos

### Tablas

| Tabla | Descripción |
|---|---|
| `countries` | Países disponibles (🇨🇺, 🇺🇸, 🇪🇸) |
| `payment_methods` | Métodos de pago por país (efectivo, transferencia, Zelle) |
| `delivery_methods` | Métodos de entrega (CUP efectivo, MLC, etc.) |
| `exchange_rates` | Tasas por combinación pago-entrega, con min/max limits |
| `combos` | Catálogo de combos de alimentos con precio y días de entrega |

### Relaciones

```
countries ──┬── payment_methods ──┬── exchange_rates ──┬── delivery_methods
            │                    │                    │
            └────────────────────┘                    │
                                                      └────────────────────
```

- `payment_methods.country_id` → `countries.id`
- `exchange_rates.payment_method_id` → `payment_methods.id`
- `exchange_rates.delivery_method_id` → `delivery_methods.id`
- `exchange_rates` tiene constraint `UNIQUE(payment_method_id, delivery_method_id)`

## 📦 Módulos

### 1. Calculadora de Remesas

Flujo wizard de 4 pasos:
1. Seleccionar país de origen
2. Seleccionar método de pago (cargado dinámicamente según país)
3. Seleccionar método de entrega
4. Ingresar monto → Calcular

Muestra el monto a recibir aplicando la tasa (`amount × rate_multiplier`). Valida límites mínimo y máximo.

### 2. Catálogo de Combos

Grid responsive de tarjetas con:
- Imagen (con fallback a placeholder 📦)
- Título y descripción
- Precio en USD
- Badge de tiempo estimado de entrega
- Botón "Añadir al pedido"

### 3. Checkout WhatsApp

Formulario con datos del remitente y beneficiario. Al enviar, genera un mensaje pre-formateado y abre `wa.me` con:
- Datos del remitente (nombre, teléfono, país)
- Datos del beneficiario (nombre, CI, teléfono, dirección)
- Opcional: datos de la remesa calculada
- Opcional: datos del combo seleccionado

## 🧪 Testing

```bash
pnpm test
```

Tests incluidos:
- `src/app/api/__tests__/routes.test.ts` — Tests de integración de API Routes
- `src/lib/services/__tests__/exchange-rates.test.ts` — Tests del servicio de tasas
- `src/lib/utils/__tests__/whatsapp.test.ts` — Tests del generador de URL WhatsApp
- `src/components/__tests__/components.test.tsx` — Tests de componentes

Documentación de testeo: [`docs/testing/mr-factus-test-instructions.md`](docs/testing/mr-factus-test-instructions.md)

## 📄 Documentación

- [`docs/README.md`](docs/README.md) — Índice de documentación
- [`docs/testing/mr-factus-test-instructions.md`](docs/testing/mr-factus-test-instructions.md) — Instrucciones de testeo manual
