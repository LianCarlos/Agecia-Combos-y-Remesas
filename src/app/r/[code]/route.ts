import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
  resolveByCode,
} from "@/lib/services/referrers";

// ============================================================================
// Enlace público de referido: /r/<código>
// ----------------------------------------------------------------------------
// 1) Resuelve el código contra `referrers` (solo activos).
// 2) Si es válido, registra un click en `referral_clicks` (métrica).
// 3) Guarda la cookie `mr_ref` para que createOrder atribuya el pedido.
// 4) Redirige a la home en todos los casos (código inválido → sin cookie).
//
// Es una ruta pública: usa la service-role key (la RLS de referrers no deja
// leer a anónimos) y no confía en ninguna sesión.
// ============================================================================

// La ruta depende de datos de runtime (referrer, cookie, click) y de
// `supabaseAdmin`, que exige SUPABASE_URL al importarse. Dinámica para que
// `next build` no intente prerenderizarla y falle sin variables de entorno.
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  const { code } = await context.params;
  const home = new URL("/", request.url);
  const response = NextResponse.redirect(home, { status: 302 });

  if (!code) {
    return response;
  }

  const referrer = await resolveByCode(code);
  if (!referrer) {
    // Código inválido o inactivo: seguimos a la home, sin atribución.
    return response;
  }

  // Métrica (no bloqueante): un fallo aquí no debe impedir la redirección.
  try {
    await supabaseAdmin.from("referral_clicks").insert({
      referrer_id: referrer.id,
      referral_code: referrer.referral_code,
    });
  } catch (error) {
    console.error("Error registrando click de referido:", error);
  }

  // Cookie de atribución: el último enlace abierto pisa al anterior.
  response.cookies.set(REFERRAL_COOKIE, referrer.referral_code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
