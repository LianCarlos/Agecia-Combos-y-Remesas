# Instrucciones de Testeo — Mr Factus

> **Versión**: 0.1.0 | **Fecha**: 2026-06-02 | **Alcance**: Implementación inicial completa

---

## Alcance Implementado

- [x] Market Ticker: visualización de tasas de cambio activas con banderas y tiempo relativo
- [x] Calculadora de Remesas: wizard de 4 pasos (país → pago → entrega → monto → resultado)
- [x] Catálogo de Combos: grid responsive con imagen, precio, descripción y badge de entrega
- [x] Checkout WhatsApp: formulario remitente/beneficiario → enlace wa.me pre-formateado
- [x] API Routes: 5 endpoints REST (countries, combos, delivery-methods, exchange-rates, payment-methods)
- [x] Estados vacíos y de error para todos los componentes
- [x] Validación de límites (min/max) en calculadora
- [x] Responsive design: mobile (375px), tablet (768px), desktop (1280px+)
- [x] RLS en todas las tablas (lectura pública, escritura admin)

---

## Prerequisitos

| Requisito | Versión / Detalle |
|---|---|
| Node.js | 20+ |
| pnpm | Última estable |
| Supabase | Proyecto corriendo con migración `001_initial_schema.sql` aplicada |
| Navegador | Chrome, Firefox o Safari actualizados |

### Variables de Entorno (`.env.local`)

```bash
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Configuración Inicial

```bash
# 1. Instalar dependencias
pnpm install

# 2. Build de producción
pnpm build

# 3. Iniciar servidor de desarrollo
pnpm dev
# → Abrir http://localhost:3000
```

---

## Datos de Prueba

La migración `001_initial_schema.sql` incluye datos semilla:

### Países (`countries`)
| name | flag_icon |
|---|---|
| Cuba | 🇨🇺 |
| Estados Unidos | 🇺🇸 |
| España | 🇪🇸 |

### Métodos de Pago — Cuba (`payment_methods`)
| name | type |
|---|---|
| Efectivo USD | cash_pickup |
| Transferencia bancaria | bank_transfer |
| Zelle | wallet |

### Métodos de Entrega (`delivery_methods`) y Tasas (`exchange_rates`)
> **⚠️ Sin seed data incluido.** Deben insertarse manualmente antes de testear CP-01 y CP-02.

#### SQL para insertar datos de prueba:

```sql
-- Métodos de entrega
INSERT INTO delivery_methods (name, type) VALUES
  ('CUP Efectivo', 'cash'),
  ('MLC Transferencia', 'transfer'),
  ('Tarjeta MLC', 'card');

-- Tasas de cambio (necesita los IDs de payment_methods y delivery_methods)
-- Reemplazar <payment-id> y <delivery-id> con UUIDs reales
INSERT INTO exchange_rates (payment_method_id, delivery_method_id, rate_multiplier, min_limit, max_limit) VALUES
  ('<payment-id-efectivo>', '<delivery-id-cup>', 320.00, 1.00, 5000.00),
  ('<payment-id-zelle>', '<delivery-id-mlc>', 1.05, 10.00, 10000.00);

-- Combos
INSERT INTO combos (title, description, price_usd, estimated_delivery_days, image_url) VALUES
  ('Combo Básico', 'Arroz, frijoles, aceite, azúcar — productos esenciales para el hogar cubano.', 25.00, 3, NULL),
  ('Combo Familiar', 'Arroz 10kg, aceite 5L, pollo 5kg, frijoles 5kg, azúcar 5kg, café, leche en polvo.', 65.00, 5, NULL),
  ('Combo Premium', 'Todo lo del combo familiar + jamón, queso, pastas, detergente, y artículos de aseo personal.', 120.00, 7, NULL);
```

---

## Casos de Prueba Manual

### CP-01: Market Ticker Muestra Tasas

| Campo | Valor |
|---|---|
| **Precondición** | Tabla `exchange_rates` tiene al menos 1 registro con `payment_methods.is_active = true`, `delivery_methods.is_active = true`, y `countries.is_active = true` |
| **Prioridad** | Alta |
| **Tipo** | Smoke test |

**Pasos:**
1. Abrir `http://localhost:3000`
2. Observar la sección superior "Tasas de Cambio"

**Resultado esperado:**
- [ ] Se muestra el título "Tasas de Cambio"
- [ ] Cada tarjeta contiene: emoji de bandera, nombre del país, método de pago → método de entrega, multiplicador de tasa (ej: `320x`)
- [ ] Se muestra tiempo relativo ("ahora mismo", "hace X min", "hace X h", "hace X d")
- [ ] Las tarjetas tienen efecto hover (elevación sutil)

**Caso alternativo — Sin datos:**
- Si no hay tasas activas, se muestra: "📊 No hay tasas de cambio disponibles en este momento."

---

### CP-02: Calculadora — Flujo Completo

| Campo | Valor |
|---|---|
| **Precondición** | Tablas `countries`, `payment_methods`, `delivery_methods`, `exchange_rates` con datos |
| **Prioridad** | Alta |
| **Tipo** | Flujo principal |

**Pasos:**
1. Abrir `http://localhost:3000`
2. En la sección "💱 Calculadora de Remesas", seleccionar un país (ej: "🇨🇺 Cuba")
3. Verificar que el paso 2 se activa con métodos de pago
4. Seleccionar un método de pago (ej: "Efectivo USD")
5. Verificar que el paso 3 se activa con métodos de entrega como botones de radio
6. Seleccionar un método de entrega (ej: "CUP Efectivo")
7. Verificar que aparece el campo de monto
8. Ingresar `100`
9. Clic en "Calcular"

**Resultado esperado:**
- [ ] Se muestra tarjeta de resultado con gradiente verde
- [ ] Muestra: monto enviado ($100.00 USD), tasa aplicada, monto a recibir
- [ ] Muestra los métodos seleccionados (pago, entrega, país)
- [ ] Botón "Nuevo Cálculo" para reiniciar el wizard

---

### CP-03: Calculadora — Validación de Límites

| Campo | Valor |
|---|---|
| **Precondición** | Tasa configurada con `min_limit = 1.00` y `max_limit = 5000.00` |
| **Prioridad** | Alta |
| **Tipo** | Validación |

**Sub-caso A: Monto por debajo del mínimo**
1. Completar pasos 1-3 del wizard (país, pago, entrega)
2. Ingresar monto `0.50`
3. Clic en "Calcular"

**Resultado esperado:**
- [ ] Banner de error: "El monto mínimo es $1.00 USD"
- [ ] No se muestra tarjeta de resultado

**Sub-caso B: Monto por encima del máximo**
1. Ingresar monto `6000`
2. Clic en "Calcular"

**Resultado esperado:**
- [ ] Banner de error: "El monto máximo es $5000.00 USD"
- [ ] No se muestra tarjeta de resultado

**Sub-caso C: Monto vacío o cero**
1. Dejar el campo vacío o en 0
2. Verificar que el botón "Calcular" está deshabilitado

---

### CP-04: Catálogo de Combos

| Campo | Valor |
|---|---|
| **Precondición** | Tabla `combos` tiene al menos 1 registro con `is_active = true` |
| **Prioridad** | Alta |
| **Tipo** | Funcional |

**Pasos:**
1. Abrir `http://localhost:3000`
2. Navegar a la sección "Combos de Alimentos" (o hacer clic en "Combos" en la navbar)

**Resultado esperado:**
- [ ] Título "Combos de Alimentos"
- [ ] Grid de tarjetas: 1 columna en mobile, 2 en tablet, 3 en desktop
- [ ] Cada tarjeta contiene:
  - Imagen (o placeholder 📦 si no tiene)
  - Badge de tiempo de entrega ("⏱️ X días")
  - Título del combo
  - Descripción
  - Precio en USD en verde (formato `$XX.00`)
  - Botón "Añadir al pedido" con borde verde
- [ ] Efecto hover en tarjetas

**Caso alternativo — Sin combos:**
- [ ] Mensaje: "📦 No hay combos disponibles en este momento."

---

### CP-05: Checkout WhatsApp

| Campo | Valor |
|---|---|
| **Precondición** | Ninguna (no requiere backend) |
| **Prioridad** | Alta |
| **Tipo** | Funcional |

**Pasos:**
1. Abrir `http://localhost:3000`
2. Navegar a la sección "📋 Datos del Envío"
3. Llenar datos del remitente:
   - Nombre completo: `Juan Pérez`
   - Teléfono: `+1 555 123 4567`
   - País: `Estados Unidos`
4. Llenar datos del beneficiario:
   - Nombre completo: `María García`
   - Carnet de Identidad: `12345678901`
   - Teléfono: `+53 5 123 4567`
   - Dirección: `Calle 23 #456, Vedado, La Habana`
5. Clic en "Enviar Pedido por WhatsApp"

**Resultado esperado:**
- [ ] Se abre una nueva pestaña con URL `https://wa.me/5355555555?text=...`
- [ ] El mensaje pre-formateado contiene:
  - "🏦 *NUEVA ORDEN - MR FACTUS*"
  - Fecha y hora
  - Datos del remitente
  - Datos del beneficiario (incluyendo CI)
  - "✅ *Orden generada desde Mr Factus*"

**Sub-caso: Validación de campos requeridos**
1. Dejar todos los campos vacíos
2. Clic en "Enviar Pedido por WhatsApp"

**Resultado esperado:**
- [ ] Alerta del navegador: "Por favor completa todos los campos obligatorios."
- [ ] No se abre WhatsApp

---

### CP-06: Estados Vacíos

| Campo | Valor |
|---|---|
| **Precondición** | Tablas sin datos activos |
| **Prioridad** | Media |
| **Tipo** | Edge case |

Probar cada componente con su tabla vacía:

| Componente | Tabla requerida | Mensaje esperado |
|---|---|---|
| MarketTicker | `exchange_rates` | "No hay tasas de cambio disponibles en este momento." |
| RemittanceCalculator | `countries` | "No hay países disponibles en este momento." |
| ComboCatalog | `combos` | "No hay combos disponibles en este momento." |

---

### CP-07: Estados de Error

| Campo | Valor |
|---|---|
| **Precondición** | Error de red o Supabase inaccesible |
| **Prioridad** | Media |
| **Tipo** | Edge case |

**Pasos:**
1. Detener Supabase o desconectar red
2. Refrescar la página

**Resultado esperado:**
- [ ] MarketTicker: no muestra error (retorna array vacío silenciosamente)
- [ ] RemittanceCalculator: muestra banner rojo con "Error al cargar datos iniciales"
- [ ] ComboCatalog: muestra banner rojo con "Error al cargar combos"

---

### CP-08: Responsive Design

| Campo | Valor |
|---|---|
| **Precondición** | Datos cargados correctamente |
| **Prioridad** | Alta |
| **Tipo** | Visual |

**Breakpoints a probar:**

| Dispositivo | Ancho | Verificaciones |
|---|---|---|
| Mobile | 375px | Navbar: enlaces inferiores visibles (Inicio, Remesas, Combos). Sin menú hamburguesa. Componentes en 1 columna. |
| Tablet | 768px | Navbar: enlaces en línea horizontal. MarketTicker: 2 columnas. Combos: 2 columnas. |
| Desktop | 1280px+ | MarketTicker: 4 columnas. Combos: 3 columnas. Ancho máximo 6xl (72rem) centrado. |

**Verificaciones adicionales:**
- [ ] No hay desbordamiento horizontal en ningún breakpoint
- [ ] Los textos no se cortan ni solapan
- [ ] Los botones y selects son accesibles con el pulgar en mobile (min 44px altura)
- [ ] La navbar es sticky al hacer scroll
- [ ] El footer se ve correctamente en todos los breakpoints

---

### CP-09: Navegación por Anclas

| Campo | Valor |
|---|---|
| **Precondición** | Página cargada |
| **Prioridad** | Baja |
| **Tipo** | Navegación |

**Pasos:**
1. Clic en "Remesas" en la navbar
2. Clic en "Combos" en la navbar
3. Clic en "Inicio" en la navbar

**Resultado esperado:**
- [ ] Scroll suave a la sección correspondiente (`scroll-smooth`)
- [ ] URL no cambia (anclas con `#` no modifican la ruta)

---

## Regresión

Verificaciones rápidas para asegurar que los cambios no rompen funcionalidad existente:

- [ ] `pnpm build` completa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm test` todos los tests pasan
- [ ] La página carga sin errores en consola del navegador
- [ ] No hay errores 500 en las API routes (Network tab)
- [ ] Las 5 rutas API responden con datos válidos cuando las tablas tienen datos
- [ ] Las 5 rutas API responden con array vacío cuando las tablas están vacías
- [ ] El cliente Supabase browser (`NEXT_PUBLIC_*`) no expone la `SERVICE_ROLE_KEY`

---

## Criterios de Aceptación

### Funcionales
- [ ] CP-01: Market Ticker muestra tasas con banderas, nombres y tiempos relativos
- [ ] CP-02: Flujo completo de calculadora produce resultado correcto
- [ ] CP-03: Validación de límites muestra mensajes de error correctos
- [ ] CP-04: Catálogo de combos renderiza grid con todos los campos
- [ ] CP-05: Checkout abre WhatsApp con mensaje pre-formateado y validación de campos

### No Funcionales
- [ ] CP-06: Estados vacíos muestran mensajes amigables
- [ ] CP-07: Estados de error no rompen la página (degradación elegante)
- [ ] CP-08: Layout responsive en mobile, tablet y desktop
- [ ] CP-09: Navegación por anclas con scroll suave

### Seguridad
- [ ] RLS: usuario anónimo puede leer todas las tablas
- [ ] RLS: usuario anónimo NO puede insertar, actualizar ni eliminar
- [ ] `SUPABASE_SERVICE_ROLE_KEY` no se expone en el bundle del navegador

### Rendimiento
- [ ] MarketTicker se renderiza en servidor (verificar `view-source:` sin loading states)
- [ ] Tiempo de carga inicial < 3s en conexión estándar
- [ ] No hay layout shift acumulado (CLS) visible durante la carga

---

## Notas para el Tester

1. **Orden de ejecución recomendado**: CP-01 → CP-02 → CP-03 → CP-04 → CP-05 → CP-06 → CP-07 → CP-08 → CP-09
2. **Datos de prueba**: ejecutar el SQL de la sección "Datos de Prueba" antes de comenzar.
3. **Limpiar entre ciclos**: si se modifican datos durante el testeo, restaurar con los INSERT de seed.
4. **Reportar bugs** con: caso de prueba, paso exacto, valor ingresado, resultado esperado vs obtenido, screenshot si aplica.
