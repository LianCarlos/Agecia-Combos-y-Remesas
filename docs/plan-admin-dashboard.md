# Plan — Mejora del Panel de Administración

> Dashboard operativo, pedidos entrantes, remesas, cuentas de recepción, entregas, comisiones (%) por país, tasas de conversión (USDT) y referidos.

**Fecha:** 2026-10-08 · **Estado:** propuesta para implementación · **Alcance:** panel `/admin` + base de datos + lógica de negocio + persistencia del checkout público.

---

## 1. Objetivo

Convertir el panel de administración actual (que solo muestra conteos de catálogo) en un
**panel operativo** que responda en un vistazo:

1. ¿Qué **pedidos** entraron del sitio (remesa, combo, producto, recarga) y **de quién vino cada cliente** (referido)?
2. ¿Cuánto dinero entró y **en qué cuenta** se recibió?
3. ¿Cuánto se entregó en Cuba, **quién** hace la entrega y en qué **estado** está?
4. ¿Cuánto se paga a **cada quien** (dueño de cuenta, entregador, agencia, referidor) según sus **%**?
5. ¿Cuánto **gana** la agencia por remesa (por país/corredor)?

Regla rectora: **todo lo que entra del cliente se registra solo (automático)**; el admin
**procesa** (asigna cuenta/entregador, mueve estado, marca pagos) en lugar de crear la
operación desde cero. Los cálculos (conversión a USDT, comisiones, ganancia, referido) son
**automáticos**.

---

## 2. Alcance

**Dentro del alcance:**
- **Persistir todo pedido del checkout** (remesa, combo, producto, recarga, carrito) en una tabla de pedidos, además de seguir abriendo WhatsApp.
- **Referidos automáticos para todos los tipos de pedido** (no solo remesas): enlace público `/r/:codigo`, cookie, atribución y comisión.
- Modelo de remesas con **USDT como moneda pivote** de cálculo.
- **Países de origen gestionables** (agregar / eliminar / desactivar).
- Cuentas de recepción (con dueño y comisión, o propias).
- Repartidores / entregadores.
- Configuración de **% por país** (entregador, agencia, referidor).
- Tasas de conversión (origen→USDT, USDT→CUP, USDT→USD).
- Dashboard operativo y secciones de gestión.

**Fuera del alcance (por ahora):**
- **Gestión del catálogo** de combos/productos/recargas (ya existe en el admin); aquí solo se registran sus **pedidos** y su **referido**.
- Pagos/pasarela online: el cobro sigue por fuera (WhatsApp / cajeros), el admin solo registra el resultado.
- Stock/inventario de combos y productos.

**Supuestos confirmados por negocio:**
- **La entrega siempre es en Cuba.**
- El dinero se recibe de un país y se convierte a **USDT** a una tasa.
- Al **dueño de la cuenta** se le deja siempre un %, **salvo cuentas propias** (`is_own`).
- Lo que va a Cuba se manda **en USDT** al entregador.
- En Cuba la tasa **USDT→CUP varía**; **USDT→USD es 1:1**.
- El **pedido se registra automáticamente** al enviarse desde el sitio; el admin no lo carga a mano.
- El **referido se atribuye automáticamente** (por cookie del enlace), para todo tipo de pedido.
- En **catálogo** (combo/producto/recarga) el referido **solo se atribuye** (saber de quién vino); **no genera comisión**.

---

## 3. Flujo del dinero (modelo de negocio)

```
Cliente envía amount_origin (moneda del país, ej. MXN/BRL/USD)
        │
        ▼
   CUENTA de recepción  (Zelle / banco / caja)
        │
        ├─ owner_fee    = 0 si cuenta propia; si no, amount_origin × owner_fee_percent%   (se queda el dueño, en moneda origen)
        ├─ agencia_fee  = amount_origin × agencia%(país)                                  (ganancia de la agencia, en moneda origen)
        ├─ delivery_fee = amount_origin × delivery%(país)                                 (comisión del entregador, en moneda origen)
        ├─ referrer_fee = 0 si no hay referidor; si hay, amount_origin × referrer%(país)  (comisión del referidor, en moneda origen)
        │
        │  beneficiary  = amount_origin − owner_fee − agencia_fee − delivery_fee − referrer_fee   (en moneda origen)
        │
        ▼
   Conversión a USDT (× rate_to_usdt):
        usdt_received    = amount_origin × rate_to_usdt
        beneficiary_usdt = beneficiary   × rate_to_usdt
        (los fees se expresan también en USDT para la contabilidad consolidada)
        │
        ▼
   Se manda a Cuba en USDT:
        usdt_to_cuba = beneficiary_usdt + delivery_fee_usdt
        │
        ▼
   Entrega al beneficiario (en Cuba):
        si CUP:  amount_receive = beneficiary_usdt × rate_usdt_to_cup   (tasa variable)
        si USD:  amount_receive = beneficiary_usdt × 1.0                (1:1)
```

Los **% se aplican sobre la moneda de origen** (`amount_origin`); después se convierte todo
a **USDT** para la entrega a Cuba y la contabilidad consolidada. La única conversión "de
mercado" final es USDT→CUP (o USDT→USD = 1).

**Para pedidos de catálogo** (combos/productos/recargas) no hay entrega de remesa ni comisiones:
el pedido guarda su monto en USD y, si trae referidor, **solo se atribuye** (`referrer_id`) para
saber de quién vino el cliente (ver §7.2).

---

## 4. Hallazgos del estado actual

| Tema | Situación hoy | Consecuencia |
|------|---------------|--------------|
| **Transacciones** | No existe tabla de pedidos/remesas. El checkout serializa a WhatsApp y **no persiste nada**. | No hay datos para el dashboard operativo. |
| **Tres flujos de pedido, ninguno persiste** | `CheckoutForm` (remesa), `CartWidget` (carrito combos+productos) y `RecargasUI` (recarga, con su propio texto de WhatsApp) solo abren WhatsApp. | Imposible registrar pedidos ni atribuir referidos. |
| **Cuentas de recepción** | No existe. `payment_methods` describe *cómo* paga el cliente, no *dónde* cae el dinero ni quién es el dueño. | Imposible saber cuánto se recibió por cuenta ni la comisión del dueño. |
| **Entregas / repartidores** | `delivery_methods` describe el *canal*, no la persona ni el estado. | No hay trazabilidad de la entrega. |
| **Comisiones / %** | No existe. **Los % deben variar por país de origen**. | No se calcula pago por participante ni ganancia real. |
| **Tasas internas** | Solo `exchange_rates` (matriz pago×entrega→rate, del cotizador). **No hay origen→USDT ni USDT→CUP**. | No se puede modelar el flujo USDT real. |
| **País de origen** | El checkout usa `currencies` como "país de origen"; `countries` mezcla destino (Cuba) con orígenes. | Hay que normalizar orígenes y hacerlos gestionables. |
| **Referidos** | No existe. No hay enlace ni atribución. | Imposible saber de quién vino cada cliente. |
| **Dashboard** | `src/app/admin/page.tsx` solo cuenta catálogo. | Sin métricas de dinero ni pedidos. |
| **Autenticación/RLS** | Sólida (`is_admin()`, `is_superadmin()`, perfiles `is_active`). `supabaseAdmin` salta RLS. | Base reutilizable para las nuevas tablas. |

**Convenciones a respetar:**
- Acceso a datos vía **Server Actions** (`'use server'`) o **services** en `src/lib/services/*`.
- Lecturas server-side con `supabaseAdmin` (service role) o `createClient()` (cookies); escrituras de admin protegidas por `requireAdmin()` / `requireSuperAdmin()`.
- **Inserción pública de pedidos** vía Server Action que usa `supabaseAdmin` (no se expone INSERT anónimo).
- `revalidatePath('/admin/...')` tras cada mutación.
- Nombres de tablas/columnas en **inglés**, UI en **español**.
- IDs `uuid` con `gen_random_uuid()`; `numeric` para dinero; `timestamptz` para fechas.

---

## 5. Modelo de datos (nueva migración)

**Archivo:** `supabase/migrations/008_operations.sql`

### 5.1 Países de origen — `countries` (gestionables)

`countries` pasa a ser el catálogo de **orígenes** (no incluye el destino Cuba). Se les añade
la moneda asociada. CRUD desde admin (§8.8).

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid PK` | (ya existe) |
| `name` | `text NOT NULL` | "México", "Brasil", "Estados Unidos"… |
| `flag_icon` | `text` | (ya existe) |
| `currency_code` | `text` | **nueva** — moneda del país: `MXN`, `BRL`, `USD`, `EUR`… |
| `is_active` | `boolean DEFAULT true` | desactivar = ocultar del checkout sin borrar |
| `created_at` | `timestamptz` | (ya existe) |

> Normalización: hoy `countries` mezcla Cuba con orígenes y el checkout usa `currencies`.
> En esta fase **el origen = `countries`**; el selector público pasa a leer `countries` activas.
> `currencies` queda para símbolo/formato (o se mapea por `currency_code`). Eliminar un origen
> es `is_active = false` (o borrado físico si no hay pedidos que lo referencien).

### 5.2 Cuentas de recepción — `accounts`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid PK` | |
| `name` | `text NOT NULL` | "Zelle Chase", "Efectivo USD Miami" |
| `type` | `text NOT NULL` | `zelle` / `bank_transfer` / `cash` / `wallet` / `card` / `other` |
| `currency_id` | `uuid FK → currencies` | Moneda que recibe |
| `country_id` | `uuid FK → countries` | País de origen asociado |
| `is_own` | `boolean DEFAULT false` | `true` = propia → **no** cobra comisión |
| `owner_name` | `text` | Dueño que se queda la comisión |
| `owner_fee_percent` | `numeric(6,3) DEFAULT 0` | % del dueño sobre `amount_origin`. Ignorado si `is_own` |
| `account_details` | `text` | Nº cuenta / teléfono / notas |
| `is_active` | `boolean DEFAULT true` | |
| `created_at` | `timestamptz DEFAULT now()` | |

### 5.3 Repartidores / entregadores — `delivery_persons`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid PK` | |
| `full_name` | `text NOT NULL` | |
| `phone` | `text` | |
| `is_active` | `boolean DEFAULT true` | |
| `created_at` | `timestamptz DEFAULT now()` | |

### 5.4 Tasas de conversión — `conversion_rates`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid PK` | |
| `from_code` | `text NOT NULL` | `MXN`, `BRL`, `USD`, `EUR`, `USDT` |
| `to_code` | `text NOT NULL` | `USDT`, `CUP`, `USD` |
| `rate` | `numeric(14,6) NOT NULL` | unidades de `to_code` por 1 de `from_code` |
| `updated_at` | `timestamptz DEFAULT now()` | |

`UNIQUE (from_code, to_code)`.

### 5.5 Pedidos entrantes — `orders`

**Todo** lo que se envía desde el sitio público queda aquí (remesa, combo, producto, recarga,
carrito), con su referido ya resuelto. Lo escribe una Server Action pública (`supabaseAdmin`).

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid PK` | |
| `order_type` | `text NOT NULL` | `remittance` / `combo` / `product` / `recharge` / `cart` |
| `sender_name` | `text` | Emisor (opcional en catálogo) |
| `sender_phone` | `text` | |
| `sender_country` | `text` | snapshot texto |
| `beneficiary_name` | `text` | |
| `beneficiary_ci` | `text` | |
| `beneficiary_phone` | `text` | |
| `beneficiary_address` | `text` | |
| `beneficiary_card_number` | `text` | |
| `beneficiary_confirmation_phone` | `text` | |
| `country_id` | `uuid FK → countries` | País de origen (nullable) |
| `currency_code` | `text` | snapshot moneda origen |
| `payment_method_id` | `uuid FK → payment_methods` | (nullable) |
| `delivery_method_id` | `uuid FK → delivery_methods` | (nullable) |
| `amount_origin` | `numeric(14,2)` | monto en moneda origen (remesa) |
| `amount_usd` | `numeric(14,2)` | monto en USD (catálogo/carrito) |
| `receiving_amount` | `numeric(14,2)` | snapshot "recibe en Cuba" (remesa) |
| `rate_multiplier` | `numeric(10,4)` | snapshot tasa del cotizador |
| `referrer_id` | `uuid FK → referrers` | **resuelto automáticamente** de la cookie `mr_ref` (nullable) |
| `referral_code` | `text` | snapshot del código (para diagnóstico) |
| `status` | `text NOT NULL DEFAULT 'nuevo'` | `nuevo` / `procesando` / `completado` / `cancelado` |
| `payload` | `jsonb` | detalle específico (recarga título/número, etc.) |
| `whatsapp_sent_at` | `timestamptz` | se abrió WhatsApp |
| `created_at` | `timestamptz DEFAULT now()` | |

### 5.6 Ítems del carrito — `order_items`

Para pedidos `cart` (mezcla de combos y productos). Permite consultar "qué se vendió".

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid PK` | |
| `order_id` | `uuid FK → orders ON DELETE CASCADE` | |
| `kind` | `text NOT NULL` | `combo` / `product` |
| `item_id` | `uuid` | id del combo/producto (nullable) |
| `title` | `text NOT NULL` | snapshot |
| `price_usd` | `numeric(14,2) NOT NULL` | snapshot |
| `quantity` | `integer NOT NULL DEFAULT 1` | |

### 5.7 Remesas — `remittances`

La operación financiera. **Se crea al procesar un `order` de tipo `remittance`** (no a mano).
Guarda **snapshots** de tasas y % para que el histórico no cambie.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid PK` | |
| `order_id` | `uuid FK → orders` | pedido del que nace (nullable, único) |
| `reference` | `text` | Nº de orden / referencia |
| `country_id` | `uuid FK → countries` | País de origen (define los %) |
| `currency_id` | `uuid FK → currencies` | Moneda de origen |
| `payment_method_id` | `uuid FK → payment_methods` | |
| `account_id` | `uuid FK → accounts` | Cuenta donde se recibió (la asigna el admin al procesar) |
| `delivery_method_id` | `uuid FK → delivery_methods` | Canal (CUP / USD) |
| `delivery_person_id` | `uuid FK → delivery_persons` | Entregador (lo asigna el admin) |
| `referrer_id` | `uuid FK → referrers` | copiado del `order` (snapshot) |
| `amount_origin` | `numeric(14,2) NOT NULL` | |
| `rate_to_usdt` | `numeric(14,6) NOT NULL` | snapshot origen→USDT |
| `usdt_received` | `numeric(14,4) NOT NULL` | **Auto** `amount_origin × rate_to_usdt` |
| `owner_fee_percent` | `numeric(6,3) DEFAULT 0` | snapshot (0 si propia) |
| `owner_fee_usdt` | `numeric(14,4) DEFAULT 0` | **Auto** |
| `delivery_currency` | `text NOT NULL DEFAULT 'CUP'` | `CUP` / `USD` |
| `rate_usdt_to_delivery` | `numeric(14,6) NOT NULL` | snapshot USDT→CUP (o 1 si USD) |
| `amount_receive` | `numeric(14,2) NOT NULL` | **Auto** `beneficiary_usdt × rate_usdt_to_delivery` |
| `beneficiary_name` | `text NOT NULL` | |
| `beneficiary_phone` | `text` | |
| `beneficiary_address` | `text` | |
| `status` | `text NOT NULL DEFAULT 'pendiente_recibo'` | `pendiente_recibo` / `recibida` / `en_reparto` / `entregada` / `cancelada` |
| `notes` | `text` | |
| `created_by` | `uuid FK → profiles` | empleado que la procesó |
| `received_at` | `timestamptz` | |
| `delivered_at` | `timestamptz` | |
| `created_at` | `timestamptz DEFAULT now()` | |
| `updated_at` | `timestamptz DEFAULT now()` | |

### 5.8 Comisiones (%) por país — `commission_configs`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid PK` | |
| `country_id` | `uuid FK → countries ON DELETE CASCADE` | País de origen |
| `role_type` | `text NOT NULL` | `delivery` / `agencia` / `referrer` |
| `percent` | `numeric(6,3) NOT NULL DEFAULT 0` | % sobre `amount_origin` |
| `updated_at` | `timestamptz DEFAULT now()` | |

`UNIQUE (country_id, role_type)`.

### 5.9 Pagos por participante — `remittance_payouts`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid PK` | |
| `remittance_id` | `uuid FK → remittances ON DELETE CASCADE` | |
| `role_type` | `text NOT NULL` | `owner` / `delivery` / `agencia` / `referrer` |
| `participant_name` | `text` | |
| `percent` | `numeric(6,3) NOT NULL` | snapshot |
| `amount_usdt` | `numeric(14,4) NOT NULL` | monto en USDT (snapshot) |
| `paid` | `boolean DEFAULT false` | |
| `paid_at` | `timestamptz` | |
| `created_at` | `timestamptz DEFAULT now()` | |

### 5.10 Referidos — `referrers`

Un único tipo de referidor (publicador o captador es solo una etiqueta). Genera el enlace público.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid PK` | |
| `full_name` | `text NOT NULL` | |
| `phone` | `text` | |
| `referral_code` | `text NOT NULL UNIQUE` | slug público, ej. `maria123` |
| `label` | `text` | `publicador` / `captador` (informativo) |
| `is_active` | `boolean DEFAULT true` | |
| `created_at` | `timestamptz DEFAULT now()` | |

### 5.11 Clicks de referido (métricas) — `referral_clicks`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `uuid PK` | |
| `referrer_id` | `uuid FK → referrers ON DELETE CASCADE` | |
| `referral_code` | `text NOT NULL` | snapshot |
| `created_at` | `timestamptz DEFAULT now()` | |

### 5.12 RLS (todas las tablas nuevas)

Mismo patrón que `006`/`007` — **sin lectura pública**, solo admin:

```sql
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_all_admin" ON accounts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ídem para delivery_persons, conversion_rates, remittances,
-- remittance_payouts, commission_configs, referrers, referral_clicks,
-- orders, order_items
```

> **Inserción pública de pedidos:** `orders`/`order_items` **no** tienen política de INSERT
> anónimo. La Server Action pública `createOrder` usa `supabaseAdmin` (service role), valida
> el input y resuelve el referido leyendo la cookie `mr_ref` con `cookies()`. Así las tablas
> quedan privadas y el único "agujero" es una acción acotada y validada.

**Seed** (ilustrativo — confirmar valores con negocio):

```sql
-- Países de origen (con moneda)
INSERT INTO countries (name, flag_icon, currency_code) VALUES
  ('México', '🇲🇽', 'MXN'), ('Brasil', '🇧🇷', 'BRL'),
  ('Estados Unidos', '🇺🇸', 'USD'), ('España', '🇪🇸', 'EUR')
ON CONFLICT (name) DO NOTHING;

-- % por país
INSERT INTO commission_configs (country_id, role_type, percent)
SELECT c.id, r.role_type, r.percent
FROM countries c
JOIN (VALUES
  ('México', 'delivery', 4.0), ('México', 'agencia', 8.0), ('México', 'referrer', 3.0),
  ('Brasil', 'delivery', 6.0), ('Brasil', 'agencia', 12.0), ('Brasil', 'referrer', 4.0)
) AS r(name, role_type, percent) ON r.name = c.name
ON CONFLICT (country_id, role_type) DO NOTHING;

-- Tasas de conversión
INSERT INTO conversion_rates (from_code, to_code, rate) VALUES
  ('MXN','USDT', 0.0480), ('BRL','USDT', 0.1800),
  ('USD','USDT', 1.0000), ('USDT','USD', 1.0000), ('USDT','CUP', 345.0000)
ON CONFLICT (from_code, to_code) DO NOTHING;

-- Referidor de ejemplo
INSERT INTO referrers (full_name, referral_code, label) VALUES
  ('María Pérez', 'maria123', 'publicador')
ON CONFLICT (referral_code) DO NOTHING;
```

---

## 6. Lógica automática vs. manual

| Actividad | Tipo | Dónde |
|-----------|------|-------|
| **Registrar el pedido** (remesa/combo/producto/recarga) | **Auto** | Server Action `createOrder` desde el checkout. |
| **Atribuir el referido** (cookie `mr_ref` → `referrer_id`) | **Auto** | `createOrder` lee la cookie y resuelve contra `referrers`. |
| `usdt_received`, `owner_fee`, `delivery/agencia/referrer_fee`, `beneficiary_usdt`, `amount_receive` | **Auto** | Al procesar la remesa (ver §7). |
| Comisiones y ganancia (`remittance_payouts`) | **Auto** | % por país + % dueño, calculados **sobre la moneda de origen**. |
| Atribución del referido en catálogo (sin comisión) | **Auto** | Se guarda `referrer_id` en el `order`; no genera payout. |
| Totales del dashboard (pedidos, cuentas, países, referidores, estados) | **Auto** | Queries de agregación. |
| **Procesar la remesa**: asignar cuenta + entregador + método entrega | **Manual** | El pedido ya trae el resto; el admin completa lo interno. |
| Confirmar **recibo** / mover estado / marcar entregada | **Manual** | Botones en el detalle. |
| Marcar **comisión pagada** | **Manual** | Checkbox "Pagado" en `remittance_payouts`. |
| CRUD de cuentas, entregadores, % por país, tasas, países de origen, referidores | **Manual** | Secciones admin. |

---

## 7. Fórmulas de cálculo

### 7.1 Remesas (base de los % = moneda de origen)

```
owner_fee    = account.is_own ? 0 : amount_origin × account.owner_fee_percent / 100
delivery_fee = amount_origin × commission_configs(país, delivery) / 100
agencia_fee  = amount_origin × commission_configs(país, agencia) / 100        -- ganancia
referrer_fee = referrer ? amount_origin × commission_configs(país, referrer) / 100 : 0

beneficiary  = amount_origin − owner_fee − delivery_fee − agencia_fee − referrer_fee

# conversión a USDT
usdt_received     = amount_origin × rate_to_usdt
owner_fee_usdt    = owner_fee    × rate_to_usdt
delivery_fee_usdt = delivery_fee × rate_to_usdt
agencia_fee_usdt  = agencia_fee  × rate_to_usdt
referrer_fee_usdt = referrer_fee × rate_to_usdt
beneficiary_usdt  = beneficiary  × rate_to_usdt

usdt_to_cuba    = beneficiary_usdt + delivery_fee_usdt
delivery_currency = 'CUP' | 'USD'
amount_receive  = beneficiary_usdt × rate_usdt_to_cup   (CUP)
amount_receive  = beneficiary_usdt × 1.0                 (USD)
```

### 7.2 Catálogo (combo / producto / recarga / carrito)

No hay reparto de remesa ni comisiones. El **referidor solo se atribuye** (queda `referrer_id`
en el `order` para saber de quién vino el cliente), pero **no genera payout**.

- **Ganancia de la agencia** = `agencia_fee_usdt` (remesas). Varía por país.
- **Pago al dueño de cuenta** = `owner_fee_usdt` (0 si propia).
- **Pago al entregador** = `delivery_fee_usdt`.
- **Pago al referidor** = `referrer_fee_usdt` (solo remesas).
- Todo se persiste como snapshot en `remittances`/`orders` y `remittance_payouts`.

---

## 8. Secciones del admin (páginas nuevas)

### 8.1 Dashboard — `src/app/admin/page.tsx` (reescribir)

**Server Component** (con `Suspense` + skeletons). Métricas:

- **Pedidos del período:** totales y por `order_type` (remesa, combo, producto, recarga, carrito).
- **Remesas:** totales y por estado; USDT recibido, CUP entregado, **ganancia** (USDT).
- **Comisiones** devengadas vs. pagadas.
- **Por país:** pedidos, USDT recibido, ganancia por corredor.
- **Por cuenta:** total recibido, marcando propias vs. de terceros.
- **Por entregador:** entregas, monto, comisión devengada/pendiente.
- **Por referidor:** clicks, pedidos atribuidos, comisión devengada/pendiente (solo remesas).
- **Tasas actuales** (origen→USDT, USDT→CUP) y última actualización.
- **Actividad reciente:** últimos 10 pedidos.

> Sin librería de charts nueva: tarjetas KPI + tablas + mini-barras SVG.

### 8.2 Pedidos — `src/app/admin/orders/page.tsx`

Listado de **todos los pedidos entrantes** (con filtros por tipo, estado, referidor, fechas) y
detalle por pedido: datos del emisor/beneficiario, monto, ítems (si carrito), referido, estado.
Aquí se ven los pedidos de combos/productos/recargas y se cambia su estado
(`nuevo → procesando → completado/cancelado`).

### 8.3 Remesas — `src/app/admin/remittances/page.tsx`

Listado de remesas (nacidas de pedidos `remittance`) con filtros. **Procesar** una remesa:

- El pedido ya trae: país, moneda, método de pago/entrega, monto, beneficiario, referido.
- El admin completa: **cuenta** de recepción, **entregador**, y confirma.
- El sistema calcula en vivo todo el desglose (§7.1) y crea `remittances` + `remittance_payouts`.
- Botones de estado: `pendiente_recibo → recibida → en_reparto → entregada` (y `cancelada`).
- Detalle con los payouts (dueño/entregador/agencia/referidor) y toggle "pagado".

### 8.4 Cuentas de recepción — `src/app/admin/accounts/page.tsx`

CRUD de `accounts` + por cuenta: total recibido, nº de remesas, comisión generada al dueño.

### 8.5 Entregadores — `src/app/admin/delivery-persons/page.tsx`

CRUD de `delivery_persons` + por entregador: entregas, monto, comisión devengada/pendiente.

### 8.6 Comisiones (%) por país — `src/app/admin/commissions/page.tsx`

Matriz **país × rol** (`delivery` / `agencia` / `referrer`):

| País | Entregador % | Agencia % | Referidor % |
|------|--------------|-----------|-------------|
| México | 4.0 | 8.0 | 3.0 |
| Brasil | 6.0 | 12.0 | 4.0 |
| … | | | |

+ nota: el % del dueño de cuenta se configura en **Cuentas**.

### 8.7 Tasas de conversión — `src/app/admin/conversion-rates/page.tsx`

CRUD de `conversion_rates` (`origen→USDT`, `USDT→CUP` variable, `USDT→USD` fijo 1:1).

### 8.8 Países de origen — `src/app/admin/countries/page.tsx`

CRUD de `countries` (nombre, bandera, `currency_code`, activo/eliminar). Agregar/eliminar
orígenes aquí alimenta el selector del checkout y la matriz de comisiones.

### 8.9 Referidos — `src/app/admin/referrers/page.tsx`

CRUD de `referrers` (nombre, teléfono, **código** único, etiqueta, activo) + por referidor:
enlace público `https://<dominio>/r/<código>`, clicks, pedidos atribuidos, comisión devengada/pendiente (solo remesas).

### 8.10 Navegación

- `AdminSidebar.tsx`: añadir `Pedidos`, `Remesas`, `Cuentas`, `Entregadores`, `Comisiones`,
  `Tasas de conversión`, `Países de origen`, `Referidos`.
- `MobileBottomNav.tsx`: priorizar `Pedidos` y `Remesas`; el resto en sidebar desktop.

---

## 9. Cambios en código (archivos)

### Crear
| Archivo | Contenido |
|---------|-----------|
| `supabase/migrations/008_operations.sql` | Tablas + RLS + seed (§5). |
| `src/lib/services/orders.ts` | `createOrder`, `getOrders(filters)`, `getOrder`, `updateOrderStatus`, `getDashboardStats`, `getReferrerStats`. |
| `src/lib/services/accounts.ts` | CRUD + `getAccountTotals`. |
| `src/lib/services/delivery-persons.ts` | CRUD + `getDeliveryPersonTotals`. |
| `src/lib/services/conversion-rates.ts` | CRUD + `getRate(from,to)`. |
| `src/lib/services/remittances.ts` | `processRemittance(orderId, …)`, `updateStatus`, agregaciones. |
| `src/lib/services/commissions.ts` | `computePayouts` (§7, por país). |
| `src/lib/services/referrers.ts` | CRUD + `resolveByCode` + `getReferrerStats`. |
| `src/lib/services/countries.ts` | CRUD de países de origen. |
| `src/lib/actions/orders.ts` | `createOrder` pública (supabaseAdmin, lee cookie `mr_ref`) + acciones admin de pedidos. |
| `src/app/r/[code]/route.ts` | Ruta pública: valida código, guarda cookie `mr_ref`, registra click, redirige a `/`. |
| `src/app/admin/orders/page.tsx` | Listado/detalle de pedidos (§8.2). |
| `src/app/admin/remittances/page.tsx` | Procesar remesas (§8.3). |
| `src/app/admin/accounts/page.tsx` | CRUD (§8.4). |
| `src/app/admin/delivery-persons/page.tsx` | CRUD (§8.5). |
| `src/app/admin/commissions/page.tsx` | Matriz país×rol (§8.6). |
| `src/app/admin/conversion-rates/page.tsx` | CRUD (§8.7). |
| `src/app/admin/countries/page.tsx` | CRUD orígenes (§8.8). |
| `src/app/admin/referrers/page.tsx` | CRUD + stats (§8.9). |
| `src/lib/__tests__/commissions.test.ts` | Tests §7 (por país, cuenta propia/ajena, CUP/USD, referidor). |
| `src/lib/services/__tests__/orders.test.ts` | Tests de `createOrder` (resolución de referido). |

### Modificar
| Archivo | Cambio |
|---------|--------|
| `src/types/index.ts` | Interfaces `Account`, `DeliveryPerson`, `ConversionRate`, `Order`, `OrderItem`, `Remittance`, `RemittancePayout`, `CommissionConfig`, `Referrer`, `ReferralClick`, `DashboardStats`. |
| `src/types/database.types.ts` | Regenerar (`supabase gen types`) o extender. |
| `src/components/CheckoutForm.tsx` | Llamar `createOrder` (con datos del pedido) antes de abrir WhatsApp. |
| `src/components/cart/CartWidget.tsx` | Llamar `createOrder` (tipo `cart` + ítems) antes de abrir WhatsApp. |
| `src/components/RecargasUI.tsx` | Llamar `createOrder` (tipo `recharge`) antes de abrir WhatsApp. |
| `src/lib/utils/whatsapp.ts` | (opcional) añadir `Referido: <código>` al mensaje como respaldo visual. |
| `src/app/admin/page.tsx` | Dashboard operativo (§8.1). |
| `src/app/admin/components/AdminSidebar.tsx` | Ítems nuevos. |
| `src/app/admin/components/MobileBottomNav.tsx` | Ítems nuevos. |
| `README.md` | Documentar nuevas secciones y tablas. |

---

## 10. Fases de implementación (orden sugerido)

1. **Migración** `008_operations.sql` (tablas + RLS + seed) y aplicar en Supabase.
2. **Tipos** (`index.ts` + `database.types.ts`).
3. **Services** de lectura/escritura + **`commissions.ts`** (§7) con sus tests.
4. **Ruta pública `/r/[code]`** + cookie `mr_ref` + `referral_clicks`.
5. **`createOrder`** (Server Action pública) + enganchar los 3 checkout (remesa/carrito/recarga).
6. **Secciones CRUD simples**: `conversion-rates`, `countries`, `accounts`, `delivery-persons`, `commissions`, `referrers`.
7. **Pedidos** (listado/detalle) y **Remesas** (procesar + cálculo en vivo + estados + pagos).
8. **Dashboard** operativo + navegación.
9. **Tests** + `pnpm lint` + `pnpm build`.

---

## 11. Riesgos y consideraciones

- **Inserción pública de pedidos:** `createOrder` es un endpoint abierto (sin auth). Validar
  tipos/longitudes, limitar tamaño del payload y no confiar en nada del cliente. El referido se
  resuelve por cookie en el servidor, no por un campo que el cliente pueda falsear.
- **Cookie del referido (`mr_ref`):** es de atribución, no de seguridad. El último enlace abierto
  pisa al anterior. No usarla para autenticar.
- **Países de origen normalizados:** migrar orígenes a `countries` con `currency_code`; no mezclar
  Cuba (destino) con orígenes. `commission_configs` y `remittances` dependen de `countries`.
- **Dos capas de tasas:** `conversion_rates` (contabilidad USDT) vs. `exchange_rates`/`wholesale_rates`
  (cotizador público). No se sincronizan automáticamente en esta fase.
- **USDT vs USD:** tokens distintos aunque `USDT→USD` sea 1:1. Mantener códigos separados.
- **Dinero y decimales:** usar `numeric` siempre; formatear solo en UI (`format.ts`).
- **Snapshot vs. en vivo:** persistir tasas y % al procesar la remesa para que el histórico no cambie.
- **Cuenta propia vs. de terceros:** `owner_fee = 0` si `is_own`.
- **Recálculo:** al cambiar país/cuenta/monto en una remesa, recalcular y regrabar payouts.
- **RLS:** tablas nuevas privadas (solo admin). Dashboard con `supabaseAdmin`.
- **Permisos:** un `empleado` **solo opera pedidos y remesas** (`requireAdmin`). La configuración
  (comisiones, cuentas, tasas, países de origen, referidores) requiere `requireSuperAdmin`.
- **Backups:** aplicar la migración con respaldo previo; cambio de esquema aditivo.

---

## 12. Definición de "Hecho" (criterios de aceptación)

- Un pedido de **remesa, combo, producto o recarga** se **registra solo** en el admin y a la vez abre WhatsApp.
- El **referido se atribuye automáticamente** (enlace `/r/:código` → cookie → `referrer_id`) para **todos** los tipos de pedido; en catálogo **solo se atribuye** (sin comisión).
- Los **países de origen se agregan/eliminan** desde el admin y alimentan el checkout y las comisiones.
- Al **procesar** una remesa (asignar cuenta/entregador) se calculan automáticamente, con **% sobre la moneda de origen**: `owner_fee`, `delivery_fee`, `agencia_fee`, `referrer_fee`, `usdt_received` y `amount_receive` (CUP o USD).
- La **misma remesa** desde México y desde Brasil produce **comisiones y ganancia distintas**.
- Una **cuenta propia** no genera comisión; una de terceros sí.
- El monto a entregar usa **USDT→CUP** (variable) o **USDT→USD (1:1)**.
- Cada remesa tiene **cuenta, entregador y estado**; el estado avanza manualmente.
- Los **%** (entregador, agencia, referidor) se editan por país; el **% del dueño** por cuenta.
- Las **tasas** (origen→USDT, USDT→CUP, USDT→USD) se editan en su sección.
- `pnpm test`, `pnpm lint` y `pnpm build` pasan en verde.

---

## 13. Decisiones cerradas y pendientes

**Cerradas (confirmadas por negocio):**
- El referidor **solo se atribuye** en catálogo (sin comisión); cobra comisión **solo en remesas**.
- La **cuenta** de recepción se asigna **manualmente** al procesar la remesa.
- Un **`empleado`** solo opera pedidos/remesas; comisiones, cuentas, tasas, países y referidores son **`superadmin`**.

**Pendiente:**
- **% de ejemplo (seed):** México 4/8/3 y Brasil 6/12/4 son ilustrativos; confirmar los reales.
