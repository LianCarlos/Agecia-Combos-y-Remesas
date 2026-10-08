import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfills de Web APIs que usan los módulos de servidor de Next.js
// (next/cache → revalidatePath) y que el entorno jsdom de Jest no expone.
globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;

// Variables de entorno de prueba: permiten que los módulos que instancian el
// cliente de Supabase al importarse (supabaseAdmin) se carguen en los tests sin
// tocar la red. No se usan credenciales reales.
process.env.SUPABASE_URL ??= "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
