import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/types/database.types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

/**
 * Crea (o reusa) el cliente de Supabase del lado servidor.
 * Envuelto en React.cache() para que múltiples llamadas dentro de un
 * mismo render compartan el mismo cliente — reduce drásticamente la
 * cantidad de instancias creadas por página.
 */
export const createClient = cache(async () => {
  console.log('[TRACE] 🟩 server.ts createClient() → Llamando cookies()...');
  const cookieStore = await cookies();

  console.log('[TRACE] 🟩 server.ts createClient() → Creando createServerClient...');
  return createServerClient<Database>(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Puede fallar en Server Components — ignorar
          }
        },
      },
    }
  );
});
