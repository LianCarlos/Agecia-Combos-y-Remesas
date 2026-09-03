-- ============================================================================
-- Mr Factus | Migración 007: Endurecimiento de Seguridad
-- ----------------------------------------------------------------------------
-- Cierra la cadena de escalada de privilegios detectada en auditoría:
--   1) Usuarios nuevos ya NO nacen con acceso (is_active = false).
--   2) Solo el superadmin puede cambiar roles (evita auto-ascenso empleado→superadmin).
--   3) site_settings deja de ser legible públicamente (protege admin_password).
--
-- IMPORTANTE: además de aplicar esta migración, desactiva el registro público
-- en el panel de Supabase (Authentication → Sign In / Providers → "Allow new
-- users to sign up" = OFF). Esta migración es la segunda línea de defensa.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Helper: ¿el usuario actual es superadmin?
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role = 'superadmin'
  );
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Trigger de alta: los usuarios nuevos nacen INACTIVOS
--    Un alta por registro público queda sin acceso hasta que un superadmin la
--    active. La creación de empleados (server action de superadmin) activa
--    explícitamente is_active = true tras crear la cuenta.
-- ────────────────────────────────────────────────────────────────────────────
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
    false            -- ← antes true: ahora sin acceso por defecto
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. profiles: solo el superadmin puede modificar perfiles / roles
--    Evita que un 'empleado' se auto-ascienda a 'superadmin' vía la REST API.
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

CREATE POLICY "profiles_update_superadmin" ON profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

CREATE POLICY "profiles_delete_superadmin" ON profiles
  FOR DELETE
  TO authenticated
  USING (public.is_superadmin());

-- ────────────────────────────────────────────────────────────────────────────
-- 4. site_settings: quitar la lectura pública (protege admin_password)
--    La app siempre lee estos ajustes con la service-role key (salta RLS), así
--    que no se necesita SELECT público. Solo admin puede leerlos por la REST API.
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read settings" ON site_settings;      -- migración 002
DROP POLICY IF EXISTS "site_settings_select_public" ON site_settings;   -- migración 003

CREATE POLICY "site_settings_select_admin" ON site_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
