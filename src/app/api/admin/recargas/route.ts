import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("mobile_recharges")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json(data ?? []);
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { title, description, price_usd, image_url, active } = await request.json();
    if (!title || price_usd == null) {
      return Response.json({ error: "title y price_usd son requeridos" }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("mobile_recharges")
      .insert({ title, description: description ?? null, price_usd, image_url: image_url ?? null, active: active ?? true })
      .select()
      .single();
    if (error) throw error;
    revalidatePath('/');
    return Response.json(data, { status: 201 });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
