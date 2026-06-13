import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { rate } = body;
    // id format: "payment_method_id:delivery_method_id"
    const [pmId, dmId] = id.split(':');
    const { error } = await supabaseAdmin
      .from("exchange_rates")
      .update({ rate, updated_at: new Date().toISOString() })
      .eq("payment_method_id", pmId)
      .eq("delivery_method_id", dmId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const [pmId, dmId] = id.split(':');
    const { error } = await supabaseAdmin
      .from("exchange_rates")
      .delete()
      .eq("payment_method_id", pmId)
      .eq("delivery_method_id", dmId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
