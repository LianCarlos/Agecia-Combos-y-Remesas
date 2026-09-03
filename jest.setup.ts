import "@testing-library/jest-dom";

// Variables de entorno de prueba: permiten que los módulos que instancian el
// cliente de Supabase al importarse (supabaseAdmin) se carguen en los tests sin
// tocar la red. No se usan credenciales reales.
process.env.SUPABASE_URL ??= "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
