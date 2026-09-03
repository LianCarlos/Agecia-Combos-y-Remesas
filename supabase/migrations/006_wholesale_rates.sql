-- Tasas mayoristas: tiers de tasa por método de pago y monto mínimo de envío
CREATE TABLE IF NOT EXISTS wholesale_rates (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  min_amount        NUMERIC(12,2) NOT NULL,   -- monto mínimo en USD para aplicar esta tasa
  rate              NUMERIC(12,4) NOT NULL,   -- CUP por 1 unidad de moneda de pago
  active            BOOLEAN DEFAULT true NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE wholesale_rates ENABLE ROW LEVEL SECURITY;

-- Lectura pública de tasas activas
CREATE POLICY "wholesale_rates_public_read" ON wholesale_rates
  FOR SELECT USING (active = true);

-- Escritura solo para empleados/superadmin autenticados
CREATE POLICY "wholesale_rates_admin_all" ON wholesale_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('superadmin', 'empleado')
        AND profiles.is_active = true
    )
  );
