-- ============================================================================
-- Mr Factus | Migración 003: Re-arquitectura Completa
-- Nuevas: currencies
-- Actualizadas: payment_methods, delivery_methods, exchange_rates, combos
-- Trigger: auto-crear perfil al registrar usuario en auth.users
-- RLS: políticas rehechas para TODAS las tablas (role via profiles, no JWT)
-- ============================================================================

-- ============================================================================
-- 0. LIMPIEZA DE POLÍTICAS VIEJAS (preparar para nuevas)
-- ============================================================================

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- 1. CURRENCIES (NUEVA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  symbol text NOT NULL DEFAULT '$',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE currencies IS 'Monedas de origen disponibles (USD, EUR, MXN, etc.)';
COMMENT ON COLUMN currencies.code IS 'Código ISO de la moneda (USD, EUR, MXN)';
COMMENT ON COLUMN currencies.name IS 'Nombre completo (Dólar estadounidense)';
COMMENT ON COLUMN currencies.symbol IS 'Símbolo ($, €)';
COMMENT ON COLUMN currencies.active IS 'Si la moneda está activa';

-- ============================================================================
-- 2. PAYMENT_METHODS (ACTUALIZAR)
-- ============================================================================

-- 2a. Agregar currency_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_methods' AND column_name = 'currency_id'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN currency_id uuid REFERENCES currencies(id) ON DELETE SET NULL;
    COMMENT ON COLUMN payment_methods.currency_id IS 'Moneda asociada al método de pago (FK a currencies)';
  END IF;
END $$;

-- 2b. Renombrar is_active → active
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_methods' AND column_name = 'is_active'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_methods' AND column_name = 'active'
  ) THEN
    ALTER TABLE payment_methods RENAME COLUMN is_active TO active;
  END IF;
END $$;

-- 2c. Si no hay columna active, crearla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_methods' AND column_name = 'active'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN active boolean DEFAULT true;
    COMMENT ON COLUMN payment_methods.active IS 'Si el método de pago está activo';
  END IF;
END $$;

-- ============================================================================
-- 3. DELIVERY_METHODS (ACTUALIZAR)
-- ============================================================================

-- 3a. Eliminar columna type si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'delivery_methods' AND column_name = 'type'
  ) THEN
    ALTER TABLE delivery_methods DROP COLUMN type;
  END IF;
END $$;

-- 3b. Renombrar is_active → active
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'delivery_methods' AND column_name = 'is_active'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'delivery_methods' AND column_name = 'active'
  ) THEN
    ALTER TABLE delivery_methods RENAME COLUMN is_active TO active;
  END IF;
END $$;

-- 3c. Si no hay columna active, crearla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'delivery_methods' AND column_name = 'active'
  ) THEN
    ALTER TABLE delivery_methods ADD COLUMN active boolean DEFAULT true;
    COMMENT ON COLUMN delivery_methods.active IS 'Si el método de entrega está activo';
  END IF;
END $$;

-- ============================================================================
-- 4. EXCHANGE_RATES (RECREAR con PK compuesta)
-- ============================================================================

-- 4a. Crear tabla nueva con PK compuesta (payment_method_id, delivery_method_id)
CREATE TABLE IF NOT EXISTS exchange_rates_v2 (
  payment_method_id uuid NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  delivery_method_id uuid NOT NULL REFERENCES delivery_methods(id) ON DELETE CASCADE,
  rate numeric(10,4) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (payment_method_id, delivery_method_id)
);

COMMENT ON TABLE exchange_rates_v2 IS 'Matriz de tasas: combinación (método de pago, método de entrega) → tasa';
COMMENT ON COLUMN exchange_rates_v2.payment_method_id IS 'Método de pago (FK a payment_methods)';
COMMENT ON COLUMN exchange_rates_v2.delivery_method_id IS 'Método de entrega en Cuba (FK a delivery_methods)';
COMMENT ON COLUMN exchange_rates_v2.rate IS 'Tasa: monto_enviado * rate = monto_recibe';
COMMENT ON COLUMN exchange_rates_v2.updated_at IS 'Última actualización de la tasa';

-- 4b. Migrar datos de la tabla vieja (deduplicados por combinación, tomando la más reciente)
INSERT INTO exchange_rates_v2 (payment_method_id, delivery_method_id, rate, updated_at)
SELECT
  payment_method_id,
  delivery_method_id,
  rate_multiplier,
  updated_at
FROM (
  SELECT DISTINCT ON (payment_method_id, delivery_method_id)
    payment_method_id,
    delivery_method_id,
    rate_multiplier,
    updated_at
  FROM exchange_rates
  WHERE is_active = true
  ORDER BY payment_method_id, delivery_method_id, updated_at DESC
) dedup
ON CONFLICT (payment_method_id, delivery_method_id) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = EXCLUDED.updated_at;

-- 4c. Reemplazar tabla vieja por la nueva
DROP TABLE IF EXISTS exchange_rates CASCADE;
ALTER TABLE exchange_rates_v2 RENAME TO exchange_rates;

-- ============================================================================
-- 5. COMBOS (RENOMBRAR COLUMNAS español → inglés)
-- ============================================================================

-- 5a. titulo → title
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'combos' AND column_name = 'titulo'
  ) THEN
    ALTER TABLE combos RENAME COLUMN titulo TO title;
  END IF;
END $$;

-- 5b. descripcion → description
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'combos' AND column_name = 'descripcion'
  ) THEN
    ALTER TABLE combos RENAME COLUMN descripcion TO description;
  END IF;
END $$;

-- 5c. disponible → available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'combos' AND column_name = 'disponible'
  ) THEN
    ALTER TABLE combos RENAME COLUMN disponible TO available;
  END IF;
END $$;

-- 5d. imagen_url → image_url
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'combos' AND column_name = 'imagen_url'
  ) THEN
    ALTER TABLE combos RENAME COLUMN imagen_url TO image_url;
  END IF;
END $$;

-- 5e. precio_usd → price_usd (ya está en inglés, pero por si acaso)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'combos' AND column_name = 'precio_usd'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'combos' AND column_name = 'price_usd'
  ) THEN
    ALTER TABLE combos RENAME COLUMN precio_usd TO price_usd;
  END IF;
END $$;

-- ============================================================================
-- 6. PROFILES — TRIGGER para auto-crear perfil al registrar usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    'empleado',
    true
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. RLS — POLÍTICAS NUEVAS (TODAS verifican rol contra profiles)
-- ============================================================================

-- ─── Helper: función auxiliar para verificar rol admin ───
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role IN ('superadmin', 'empleado')
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7a. currencies
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- SELECT: público solo activas; admin ve todas
CREATE POLICY "currencies_select_public" ON currencies
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "currencies_select_admin" ON currencies
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- INSERT/UPDATE/DELETE: solo admin
CREATE POLICY "currencies_insert_admin" ON currencies
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "currencies_update_admin" ON currencies
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "currencies_delete_admin" ON currencies
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 7b. payment_methods
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_methods_select_public" ON payment_methods
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "payment_methods_select_admin" ON payment_methods
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "payment_methods_insert_admin" ON payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "payment_methods_update_admin" ON payment_methods
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "payment_methods_delete_admin" ON payment_methods
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 7c. delivery_methods
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE delivery_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_methods_select_public" ON delivery_methods
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "delivery_methods_select_admin" ON delivery_methods
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "delivery_methods_insert_admin" ON delivery_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "delivery_methods_update_admin" ON delivery_methods
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "delivery_methods_delete_admin" ON delivery_methods
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 7d. exchange_rates
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exchange_rates_select_public" ON exchange_rates
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "exchange_rates_insert_admin" ON exchange_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "exchange_rates_update_admin" ON exchange_rates
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "exchange_rates_delete_admin" ON exchange_rates
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 7e. combos
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "combos_select_public" ON combos
  FOR SELECT
  TO anon, authenticated
  USING (available = true);

CREATE POLICY "combos_select_admin" ON combos
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "combos_insert_admin" ON combos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "combos_update_admin" ON combos
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "combos_delete_admin" ON combos
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 7f. profiles
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: ver tu propio perfil; admin ve todos
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- UPDATE: solo admin puede actualizar
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- INSERT: solo vía trigger (no permite inserts directos)
-- (No se crea política de INSERT; el trigger usa SECURITY DEFINER)

-- DELETE: solo admin
CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 7g. site_settings (mantener políticas existentes pero rehechas)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_select_public" ON site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "site_settings_insert_admin" ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "site_settings_update_admin" ON site_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "site_settings_delete_admin" ON site_settings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 8. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payment_methods_currency_id ON payment_methods(currency_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(active);
CREATE INDEX IF NOT EXISTS idx_delivery_methods_active ON delivery_methods(active);
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies(active);
CREATE INDEX IF NOT EXISTS idx_combos_available ON combos(available);

-- ============================================================================
-- 9. SEED — Monedas por defecto + Vincular payment_methods existentes a USD
-- ============================================================================

INSERT INTO currencies (code, name, symbol) VALUES
  ('USD', 'Dólar estadounidense', '$'),
  ('EUR', 'Euro', '€'),
  ('MXN', 'Peso mexicano', '$'),
  ('CLP', 'Peso chileno', '$'),
  ('BRL', 'Real brasileño', 'R$')
ON CONFLICT (code) DO NOTHING;

-- Vincular TODOS los payment_methods existentes sin currency_id a USD por defecto
DO $$
DECLARE
  v_usd_id uuid;
BEGIN
  SELECT id INTO v_usd_id FROM currencies WHERE code = 'USD';
  IF v_usd_id IS NOT NULL THEN
    UPDATE payment_methods SET currency_id = v_usd_id WHERE currency_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
