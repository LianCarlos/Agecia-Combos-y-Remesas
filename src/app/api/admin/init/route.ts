import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/init
 *
 * Endpoint único de inicialización para el panel admin.
 * Devuelve métodos de pago, métodos de entrega y perfiles en UNA sola
 * llamada, con UN solo check de autenticación.
 *
 * Reduce drásticamente la cantidad de requests y auth checks
 * que hacen las páginas admin del lado cliente.
 */
export async function GET(request: NextRequest) {
  console.log('[TRACE] 🟦 admin/init/route.ts → GET /api/admin/init');
  // ─── Único auth check ───
  if (!(await isAdmin(request))) {
    console.log('[TRACE] 🟦 admin/init/route.ts → isAdmin = FALSE, 401');
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  console.log('[TRACE] 🟦 admin/init/route.ts → isAdmin = TRUE, consultando datos...');

  try {
    const [paymentMethods, deliveryMethods] = await Promise.all([
      supabaseAdmin
        .from("payment_methods")
        .select("id, name, active, currency_id")
        .order("name"),
      supabaseAdmin
        .from("delivery_methods")
        .select("id, name, active")
        .order("name"),
    ]);

    return NextResponse.json({
      paymentMethods: paymentMethods.data ?? [],
      deliveryMethods: deliveryMethods.data ?? [],
    });
  } catch (err) {
    console.error("Error in /api/admin/init:", err);
    return NextResponse.json(
      { error: "Error al cargar datos de inicialización" },
      { status: 500 }
    );
  }
}
