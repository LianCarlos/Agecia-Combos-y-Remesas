import { isAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { type NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.symbol !== undefined) update.symbol = body.symbol;
    if (body.active !== undefined) update.active = body.active;

    const { data, error } = await supabaseAdmin
      .from("currencies")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(update as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return Response.json(data);
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("currencies")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
