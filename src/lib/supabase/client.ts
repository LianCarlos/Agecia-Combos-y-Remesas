// DEPRECATED: Usar getBrowserClient() para evitar rate limits.
// Este export existe solo por compatibilidad con código que importa { supabase }.
// NO se recomienda su uso — inicializa el cliente al importar el módulo.
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserClient() {
  if (_browserClient) return _browserClient;

  console.log('[TRACE] 🟦 supabase/client.ts → Inicializando createBrowserClient (lazy)', {
    autoRefreshToken: false,
    timestamp: new Date().toISOString(),
  });

  _browserClient = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return _browserClient;
}


