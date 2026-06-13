import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, active, currency_id } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (active !== undefined) updateData.active = active;
    if (currency_id !== undefined) updateData.currency_id = currency_id;

    const { data, error } = await supabaseAdmin
      .from("payment_methods")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(updateData as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating payment method:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (err) {
    console.error("Error in PUT /api/admin/payment-methods/[id]:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { error } = await supabaseAdmin
      .from("payment_methods")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting payment method:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /api/admin/payment-methods/[id]:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
