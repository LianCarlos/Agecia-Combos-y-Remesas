import { isAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { type NextRequest } from "next/server";

/**
 * GET /api/admin/countries
 * Devuelve las monedas activas (currencies) como "países" para el admin.
 * Reemplaza la vieja tabla countries — ahora países = monedas en currencies.
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("currencies")
      .select("*")
      .order("code");

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    console.error("Error in GET /api/admin/countries:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
