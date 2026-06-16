-- ============================================================================
-- Migration 005 — Productos (catálogo con carrito)
-- Espejo de mobile_recharges: tabla independiente, columnas en inglés,
-- booleano "active" (consistente con recargas).
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  price_usd   numeric(10, 2) NOT NULL CHECK (price_usd > 0),
  image_url   text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Reutiliza la función update_updated_at_column() creada en la migración 004.
-- Si corres este script en una BD donde no existe, descomenta el bloque:
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN NEW.updated_at = now(); RETURN NEW; END;
-- $$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Lectura pública (solo activos)
CREATE POLICY "products_select_public" ON products
  FOR SELECT USING (active = true);

-- Admin/empleado puede hacer todo (verifica rol via profiles)
CREATE POLICY "products_all_admin" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('superadmin', 'empleado')
        AND profiles.is_active = true
    )
  );

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_products_created_at
  ON products (created_at DESC);
