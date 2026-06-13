import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("combos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching combos:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (err) {
    console.error("Error in GET /api/admin/combos:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, price_usd, image_url, available } = body;

    if (!title || price_usd == null) {
      return Response.json(
        { error: "title y price_usd son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("combos")
      .insert({
        title,
        description: description ?? null,
        price_usd,
        image_url: image_url ?? null,
        available: available ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating combo:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/admin/combos:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
