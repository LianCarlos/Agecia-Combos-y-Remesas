-- ============================================================================
-- Mr Factus | Migración 002: Configuración del Sitio (Site Settings)
-- Tabla: site_settings — almacena configuraciones clave/valor para el sitio
-- ============================================================================

-- ============================================================================
-- 1. SITE_SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE site_settings IS 'Configuraciones clave-valor del sitio (ej: admin_password)';
COMMENT ON COLUMN site_settings.key IS 'Clave única de la configuración';
COMMENT ON COLUMN site_settings.value IS 'Valor de la configuración (texto)';
COMMENT ON COLUMN site_settings.updated_at IS 'Última actualización del registro';

-- ============================================================================
-- 2. RLS — ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquiera puede leer (necesario para isAdmin en server)
CREATE POLICY "Anyone can read settings" ON site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura: solo admin authenticated
CREATE POLICY "Admin can insert settings" ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can update settings" ON site_settings
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can delete settings" ON site_settings
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- 3. SEED — Contraseña admin inicial vacía (usa fallback de env)
-- ============================================================================

INSERT INTO site_settings (key, value) VALUES ('admin_password', '')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
