-- ============================================================================
-- Migration 004 — Recargas Móviles
-- ============================================================================

CREATE TABLE IF NOT EXISTS mobile_recharges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  price_usd   numeric(10, 2) NOT NULL CHECK (price_usd > 0),
  image_url   text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mobile_recharges_updated_at
  BEFORE UPDATE ON mobile_recharges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE mobile_recharges ENABLE ROW LEVEL SECURITY;

-- Lectura pública (solo activos)
CREATE POLICY "recharges_select_public" ON mobile_recharges
  FOR SELECT USING (active = true);

-- Admin puede hacer todo (verifica rol via profiles)
CREATE POLICY "recharges_all_admin" ON mobile_recharges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('superadmin', 'empleado')
        AND profiles.is_active = true
    )
  );

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_mobile_recharges_created_at
  ON mobile_recharges (created_at DESC);
