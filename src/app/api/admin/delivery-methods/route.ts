import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  console.log('[TRACE] 🟦 admin/delivery-methods/route.ts → GET');
  if (!(await isAdmin(request))) {
    console.log('[TRACE] 🟦 admin/delivery-methods/route.ts → isAdmin = FALSE, 401');
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  console.log('[TRACE] 🟦 admin/delivery-methods/route.ts → isAdmin = TRUE, consultando...');

  try {
    const { data, error } = await supabaseAdmin
      .from("delivery_methods")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching delivery methods:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (err) {
    console.error("Error in GET /api/admin/delivery-methods:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, active } = body;

    if (!name) {
      return Response.json(
        { error: "name es requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_methods")
      .insert({
        name,
        active: active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating delivery method:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/admin/delivery-methods:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
