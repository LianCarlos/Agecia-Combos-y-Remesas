-- ============================================================================
-- Mr Factus | Migración Inicial: Esquema Base
-- Tablas: countries, payment_methods, delivery_methods, exchange_rates, combos
-- ============================================================================

-- ============================================================================
-- EXTENSIONES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. COUNTRIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  flag_icon text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE countries IS 'Países disponibles en la plataforma';
COMMENT ON COLUMN countries.name IS 'Nombre del país';
COMMENT ON COLUMN countries.flag_icon IS 'Emoji de la bandera del país';
COMMENT ON COLUMN countries.is_active IS 'Indica si el país está activo en la plataforma';

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "Enable read access for all users" ON countries
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura admin
CREATE POLICY "Admin can insert" ON countries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can update" ON countries
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can delete" ON countries
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- 2. PAYMENT_METHODS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE payment_methods IS 'Métodos de pago disponibles por país';
COMMENT ON COLUMN payment_methods.country_id IS 'País al que pertenece el método de pago';
COMMENT ON COLUMN payment_methods.type IS 'Tipo: bank_transfer, cash_pickup, card, wallet';

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "Enable read access for all users" ON payment_methods
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura admin
CREATE POLICY "Admin can insert" ON payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can update" ON payment_methods
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can delete" ON payment_methods
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- 3. DELIVERY_METHODS
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'transfer', 'card')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE delivery_methods IS 'Métodos de entrega de las remesas';
COMMENT ON COLUMN delivery_methods.name IS 'Nombre descriptivo (ej: CUP Efectivo, MLC)';
COMMENT ON COLUMN delivery_methods.type IS 'Tipo: cash, transfer, card';

ALTER TABLE delivery_methods ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "Enable read access for all users" ON delivery_methods
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura admin
CREATE POLICY "Admin can insert" ON delivery_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can update" ON delivery_methods
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can delete" ON delivery_methods
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- 4. EXCHANGE_RATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method_id uuid NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  delivery_method_id uuid NOT NULL REFERENCES delivery_methods(id) ON DELETE CASCADE,
  rate_multiplier numeric(10,4) NOT NULL,
  min_limit numeric(10,2) NOT NULL DEFAULT 0,
  max_limit numeric(10,2) NOT NULL DEFAULT 999999.99,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (payment_method_id, delivery_method_id)
);

COMMENT ON TABLE exchange_rates IS 'Tasas de cambio por combinación de método de pago y entrega';
COMMENT ON COLUMN exchange_rates.payment_method_id IS 'Método de pago origen';
COMMENT ON COLUMN exchange_rates.delivery_method_id IS 'Método de entrega destino';
COMMENT ON COLUMN exchange_rates.rate_multiplier IS 'Multiplicador: monto_origen * rate = monto_recibir';
COMMENT ON COLUMN exchange_rates.min_limit IS 'Límite mínimo de la transacción en USD';
COMMENT ON COLUMN exchange_rates.max_limit IS 'Límite máximo de la transacción en USD';

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "Enable read access for all users" ON exchange_rates
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura admin
CREATE POLICY "Admin can insert" ON exchange_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can update" ON exchange_rates
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can delete" ON exchange_rates
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- 5. COMBOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price_usd numeric(10,2) NOT NULL,
  estimated_delivery_days integer NOT NULL DEFAULT 1,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE combos IS 'Combos de productos (alimentos, artículos)';
COMMENT ON COLUMN combos.title IS 'Título del combo';
COMMENT ON COLUMN combos.description IS 'Descripción del contenido del combo';
COMMENT ON COLUMN combos.price_usd IS 'Precio en USD';
COMMENT ON COLUMN combos.estimated_delivery_days IS 'Días estimados de entrega';

ALTER TABLE combos ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "Enable read access for all users" ON combos
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura admin
CREATE POLICY "Admin can insert" ON combos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can update" ON combos
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can delete" ON combos
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payment_methods_country_id ON payment_methods(country_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_payment_method_id ON exchange_rates(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_delivery_method_id ON exchange_rates(delivery_method_id);

-- ============================================================================
-- DATOS SEMILLA (SEED)
-- ============================================================================

-- Countries
INSERT INTO countries (name, flag_icon) VALUES
  ('Cuba', '🇨🇺'),
  ('Estados Unidos', '🇺🇸'),
  ('España', '🇪🇸');

-- Payment Methods (Cuba)
DO $$
DECLARE
  v_cuba_id uuid;
BEGIN
  SELECT id INTO v_cuba_id FROM countries WHERE name = 'Cuba';

  INSERT INTO payment_methods (country_id, name, type) VALUES
    (v_cuba_id, 'Efectivo USD', 'cash_pickup'),
    (v_cuba_id, 'Transferencia bancaria', 'bank_transfer'),
    (v_cuba_id, 'Zelle', 'wallet');
END $$;

-- Delivery Methods
INSERT INTO delivery_methods (name, type) VALUES
  ('CUP Efectivo', 'cash'),
  ('CUP Transferencia', 'transfer'),
  ('MLC Tarjeta', 'card');

-- Exchange Rates
DO $$
DECLARE
  v_zelle_pm_id uuid;
  v_efectivo_usd_pm_id uuid;
  v_transf_bancaria_pm_id uuid;
  v_cup_efectivo_dm_id uuid;
  v_cup_transf_dm_id uuid;
  v_mlc_tarjeta_dm_id uuid;
BEGIN
  SELECT id INTO v_zelle_pm_id FROM payment_methods WHERE name = 'Zelle';
  SELECT id INTO v_efectivo_usd_pm_id FROM payment_methods WHERE name = 'Efectivo USD';
  SELECT id INTO v_transf_bancaria_pm_id FROM payment_methods WHERE name = 'Transferencia bancaria';

  SELECT id INTO v_cup_efectivo_dm_id FROM delivery_methods WHERE name = 'CUP Efectivo';
  SELECT id INTO v_cup_transf_dm_id FROM delivery_methods WHERE name = 'CUP Transferencia';
  SELECT id INTO v_mlc_tarjeta_dm_id FROM delivery_methods WHERE name = 'MLC Tarjeta';

  INSERT INTO exchange_rates (payment_method_id, delivery_method_id, rate_multiplier) VALUES
    (v_zelle_pm_id,           v_cup_efectivo_dm_id, 1.20),
    (v_zelle_pm_id,           v_cup_transf_dm_id,   1.18),
    (v_efectivo_usd_pm_id,    v_cup_efectivo_dm_id, 1.15),
    (v_efectivo_usd_pm_id,    v_cup_transf_dm_id,   1.13),
    (v_transf_bancaria_pm_id, v_cup_efectivo_dm_id, 1.16),
    (v_transf_bancaria_pm_id, v_mlc_tarjeta_dm_id,  0.95);
END $$;

-- Combos
INSERT INTO combos (title, description, price_usd, estimated_delivery_days) VALUES
  ('Combo Familiar',  'Arroz, frijoles, aceite, pollo, huevos',                               45.00, 2),
  ('Combo Económico', 'Arroz, frijoles, aceite',                                                25.00, 1),
  ('Combo Premium',   'Arroz, frijoles, aceite, pollo, cerdo, huevos, leche, pan',              75.00, 3);

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
