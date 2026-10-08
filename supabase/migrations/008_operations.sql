-- ============================================================================
-- Mr Factus | Migración 008: Operaciones (pedidos, remesas, cuentas, comisiones,
-- tasas USDT, países de origen y referidos)
-- ----------------------------------------------------------------------------
-- Convierte el admin en un panel operativo:
--   1) Todo pedido del sitio (remesa/combo/producto/recarga/carrito) se persiste.
--   2) Remesas con modelo USDT pivote y comisiones (%) por país.
--   3) Cuentas de recepción, entregadores, tasas de conversión y referidos.
--
-- Seguridad (siguiendo 006/007):
--   - Tablas operativas (orders/order_items/remittances/remittance_payouts):
--     cualquier admin (empleado o superadmin) lee y escribe.
--   - Tablas de configuración (accounts, delivery_persons, conversion_rates,
--     commission_configs, referrers, referral_clicks, countries): los admin leen,
--     pero SOLO superadmin escribe.
--   - La inserción de pedidos desde el sitio NO usa RLS: una Server Action
--     pública inserta con la service-role key (salta RLS). No hay INSERT anónimo.
-- ============================================================================

-- ============================================================================
-- 1. PAÍSES DE ORIGEN (extender countries)
-- ============================================================================

ALTER TABLE countries ADD COLUMN IF NOT EXISTS currency_code text;

COMMENT ON COLUMN countries.currency_code IS 'Moneda del país de origen (MXN, BRL, USD, EUR…). NULL = no es origen.';

-- ============================================================================
-- 2. CUENTAS DE RECEPCIÓN — accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  type              text NOT NULL,
  currency_id       uuid REFERENCES currencies(id) ON DELETE SET NULL,
  country_id        uuid REFERENCES countries(id) ON DELETE SET NULL,
  is_own            boolean NOT NULL DEFAULT false,
  owner_name        text,
  owner_fee_percent numeric(6,3) NOT NULL DEFAULT 0,
  account_details   text,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. REPARTIDORES / ENTREGADORES — delivery_persons
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_persons (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text NOT NULL,
  phone      text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. TASAS DE CONVERSIÓN (USDT pivote) — conversion_rates
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversion_rates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_code  text NOT NULL,
  to_code    text NOT NULL,
  rate       numeric(14,6) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_code, to_code)
);

-- ============================================================================
-- 5. COMISIONES (%) POR PAÍS — commission_configs
-- ============================================================================

CREATE TABLE IF NOT EXISTS commission_configs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  role_type  text NOT NULL CHECK (role_type IN ('delivery', 'agencia', 'referrer')),
  percent    numeric(6,3) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_id, role_type)
);

-- ============================================================================
-- 6. REFERIDORES — referrers
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text NOT NULL,
  phone         text,
  referral_code text NOT NULL UNIQUE,
  label         text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. CLICKS DE REFERIDO (métricas) — referral_clicks
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_clicks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   uuid NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. PEDIDOS ENTRANTES — orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type                    text NOT NULL CHECK (order_type IN ('remittance', 'combo', 'product', 'recharge', 'cart')),
  sender_name                   text,
  sender_phone                  text,
  sender_country                text,
  beneficiary_name              text,
  beneficiary_ci                text,
  beneficiary_phone             text,
  beneficiary_address           text,
  beneficiary_card_number       text,
  beneficiary_confirmation_phone text,
  country_id                    uuid REFERENCES countries(id) ON DELETE SET NULL,
  currency_code                 text,
  payment_method_id             uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  delivery_method_id            uuid REFERENCES delivery_methods(id) ON DELETE SET NULL,
  amount_origin                 numeric(14,2),
  amount_usd                    numeric(14,2),
  receiving_amount              numeric(14,2),
  rate_multiplier               numeric(10,4),
  referrer_id                   uuid REFERENCES referrers(id) ON DELETE SET NULL,
  referral_code                 text,
  status                        text NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'procesando', 'completado', 'cancelado')),
  payload                       jsonb NOT NULL DEFAULT '{}'::jsonb,
  whatsapp_sent_at              timestamptz,
  created_at                    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 9. ÍTEMS DEL CARRITO — order_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('combo', 'product')),
  item_id    uuid,
  title      text NOT NULL,
  price_usd  numeric(14,2) NOT NULL,
  quantity   integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 10. REMESAS — remittances
--     El vínculo pedido → remesa vive aquí (order_id), no en orders.
-- ============================================================================

CREATE TABLE IF NOT EXISTS remittances (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id               uuid UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
  reference              text,
  country_id             uuid REFERENCES countries(id) ON DELETE SET NULL,
  currency_id            uuid REFERENCES currencies(id) ON DELETE SET NULL,
  payment_method_id      uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  account_id             uuid REFERENCES accounts(id) ON DELETE SET NULL,
  delivery_method_id     uuid REFERENCES delivery_methods(id) ON DELETE SET NULL,
  delivery_person_id     uuid REFERENCES delivery_persons(id) ON DELETE SET NULL,
  referrer_id            uuid REFERENCES referrers(id) ON DELETE SET NULL,
  amount_origin          numeric(14,2) NOT NULL,
  rate_to_usdt           numeric(14,6) NOT NULL,
  usdt_received          numeric(14,4) NOT NULL,
  owner_fee_percent      numeric(6,3) NOT NULL DEFAULT 0,
  owner_fee_usdt         numeric(14,4) NOT NULL DEFAULT 0,
  delivery_currency      text NOT NULL DEFAULT 'CUP' CHECK (delivery_currency IN ('CUP', 'USD')),
  rate_usdt_to_delivery  numeric(14,6) NOT NULL,
  amount_receive         numeric(14,2) NOT NULL,
  beneficiary_name       text NOT NULL,
  beneficiary_phone      text,
  beneficiary_address    text,
  status                 text NOT NULL DEFAULT 'pendiente_recibo' CHECK (status IN ('pendiente_recibo', 'recibida', 'en_reparto', 'entregada', 'cancelada')),
  notes                  text,
  created_by             uuid REFERENCES profiles(id) ON DELETE SET NULL,
  received_at            timestamptz,
  delivered_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 11. PAGOS POR PARTICIPANTE — remittance_payouts
-- ============================================================================

CREATE TABLE IF NOT EXISTS remittance_payouts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remittance_id    uuid NOT NULL REFERENCES remittances(id) ON DELETE CASCADE,
  role_type        text NOT NULL CHECK (role_type IN ('owner', 'delivery', 'agencia', 'referrer')),
  participant_name text,
  percent          numeric(6,3) NOT NULL,
  amount_usdt      numeric(14,4) NOT NULL,
  paid             boolean NOT NULL DEFAULT false,
  paid_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 12. ROW LEVEL SECURITY
-- ============================================================================

-- ─── 12.1 Tablas operativas: admin (empleado + superadmin) hace todo ───────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_all_admin" ON orders
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_all_admin" ON order_items
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE remittances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "remittances_all_admin" ON remittances
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE remittance_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "remittance_payouts_all_admin" ON remittance_payouts
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─── 12.2 Configuración: admin lee, solo superadmin escribe ────────────────

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_select_admin" ON accounts
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "accounts_all_superadmin" ON accounts
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

ALTER TABLE delivery_persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery_persons_select_admin" ON delivery_persons
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "delivery_persons_all_superadmin" ON delivery_persons
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

ALTER TABLE conversion_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversion_rates_select_admin" ON conversion_rates
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "conversion_rates_all_superadmin" ON conversion_rates
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

ALTER TABLE commission_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commission_configs_select_admin" ON commission_configs
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "commission_configs_all_superadmin" ON commission_configs
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

ALTER TABLE referrers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrers_select_admin" ON referrers
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "referrers_all_superadmin" ON referrers
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_clicks_select_admin" ON referral_clicks
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "referral_clicks_all_superadmin" ON referral_clicks
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- ─── 12.3 Países de origen: público activo + admin + escritura superadmin ──
--   Recrea las políticas de countries (001 las definió con JWT role; 003 las
--   limpió y no las volvió a crear). Ahora: selector público lee activos.

DROP POLICY IF EXISTS "Enable read access for all users" ON countries;
DROP POLICY IF EXISTS "Admin can insert" ON countries;
DROP POLICY IF EXISTS "Admin can update" ON countries;
DROP POLICY IF EXISTS "Admin can delete" ON countries;

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "countries_select_public" ON countries
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "countries_select_admin" ON countries
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "countries_all_superadmin" ON countries
  FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- ============================================================================
-- 13. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_country_id      ON accounts(country_id);
CREATE INDEX IF NOT EXISTS idx_accounts_currency_id     ON accounts(currency_id);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active       ON accounts(is_active);

CREATE INDEX IF NOT EXISTS idx_delivery_persons_active  ON delivery_persons(is_active);

CREATE INDEX IF NOT EXISTS idx_commission_configs_role  ON commission_configs(role_type);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_referrer ON referral_clicks(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_created  ON referral_clicks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_type             ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_status           ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_country_id       ON orders(country_id);
CREATE INDEX IF NOT EXISTS idx_orders_referrer_id      ON orders(referrer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at       ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_kind        ON order_items(kind);

CREATE INDEX IF NOT EXISTS idx_remittances_status        ON remittances(status);
CREATE INDEX IF NOT EXISTS idx_remittances_country_id    ON remittances(country_id);
CREATE INDEX IF NOT EXISTS idx_remittances_account_id    ON remittances(account_id);
CREATE INDEX IF NOT EXISTS idx_remittances_delivery_person ON remittances(delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_remittances_referrer_id   ON remittances(referrer_id);
CREATE INDEX IF NOT EXISTS idx_remittances_created_at    ON remittances(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payouts_remittance_id   ON remittance_payouts(remittance_id);
CREATE INDEX IF NOT EXISTS idx_payouts_role_type       ON remittance_payouts(role_type);
CREATE INDEX IF NOT EXISTS idx_payouts_paid            ON remittance_payouts(paid);

-- ============================================================================
-- 14. SEED (ilustrativo — confirmar valores con negocio)
-- ============================================================================

-- Países de origen (con moneda)
INSERT INTO countries (name, flag_icon, currency_code)
SELECT 'México', '🇲🇽', 'MXN'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE name = 'México');

INSERT INTO countries (name, flag_icon, currency_code)
SELECT 'Brasil', '🇧🇷', 'BRL'
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE name = 'Brasil');

UPDATE countries SET currency_code = 'USD' WHERE name = 'Estados Unidos';
UPDATE countries SET currency_code = 'EUR' WHERE name = 'España';
-- Cuba es destino, no origen: se oculta del selector de origen.
UPDATE countries SET is_active = false WHERE name = 'Cuba';

-- % por país (entregador / agencia / referidor)
INSERT INTO commission_configs (country_id, role_type, percent)
SELECT c.id, v.role_type, v.percent
FROM (VALUES
  ('México', 'delivery', 4.0), ('México', 'agencia', 8.0), ('México', 'referrer', 3.0),
  ('Brasil', 'delivery', 6.0), ('Brasil', 'agencia', 12.0), ('Brasil', 'referrer', 4.0)
) AS v(name, role_type, percent)
JOIN countries c ON c.name = v.name
ON CONFLICT (country_id, role_type) DO NOTHING;

-- Tasas de conversión (USDT pivote)
INSERT INTO conversion_rates (from_code, to_code, rate) VALUES
  ('MXN','USDT', 0.0480), ('BRL','USDT', 0.1800),
  ('USD','USDT', 1.0000), ('USDT','USD', 1.0000), ('USDT','CUP', 345.0000)
ON CONFLICT (from_code, to_code) DO NOTHING;

-- Referidor de ejemplo
INSERT INTO referrers (full_name, referral_code, label) VALUES
  ('María Pérez', 'maria123', 'publicador')
ON CONFLICT (referral_code) DO NOTHING;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
