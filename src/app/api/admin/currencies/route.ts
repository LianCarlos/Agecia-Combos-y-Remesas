import { isAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { type NextRequest } from "next/server";

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
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { code, name, symbol, flag } = await request.json();
    if (!code || !name) {
      return Response.json({ error: "code y name son requeridos" }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("currencies")
      .insert({ code: code.toUpperCase().trim(), name: name.trim(), symbol: symbol?.trim() || '$', active: true })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') {
        return Response.json({ error: `El código ${code.toUpperCase()} ya existe` }, { status: 409 });
      }
      throw error;
    }
    return Response.json(data, { status: 201 });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
