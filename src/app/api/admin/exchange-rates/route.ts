import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("exchange_rates")
      .select(`payment_method_id, delivery_method_id, rate, updated_at, payment_methods!inner(id, name, active), delivery_methods!inner(id, name, active)`)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { payment_method_id, delivery_method_id, rate } = body;
    if (!payment_method_id || !delivery_method_id || rate == null) {
      return Response.json({ error: "payment_method_id, delivery_method_id y rate requeridos" }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("exchange_rates")
      .upsert({ payment_method_id, delivery_method_id, rate, updated_at: new Date().toISOString() }, { onConflict: 'payment_method_id,delivery_method_id' })
      .select().single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
