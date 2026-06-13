import { type NextRequest } from "next/server";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

// ============================================================================
// Validación de administrador (API routes)
// ============================================================================

export async function isAdmin(request: NextRequest): Promise<boolean> {
  // ─── Método 1: Token Bearer ───
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const envToken = process.env.ADMIN_API_TOKEN;
    if (envToken && token === envToken) return true;
    return false;
  }

  // ─── Método 2: Cookie de sesión — cliente fresco del request (sin React.cache) ───
  try {
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // API routes son read-only para cookies
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active) return false;
    return profile.role === "superadmin" || profile.role === "empleado";
  } catch {
    return false;
  }
}

// ============================================================================
// Autenticación para Server Components (AdminLayout)
// ============================================================================

export const getCurrentUserAndProfile = cache(async (): Promise<{
  userId: string;
  email: string | null;
  profile: Profile | null;
} | null> => {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      userId: user.id,
      email: user.email ?? null,
      profile: profile as Profile | null,
    };
  } catch {
    return null;
  }
});
