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
    const { titulo, descripcion, precio_usd, imagen_url, disponible } = body;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (precio_usd !== undefined) updateData.precio_usd = precio_usd;
    if (imagen_url !== undefined) updateData.imagen_url = imagen_url;
    if (disponible !== undefined) updateData.disponible = disponible;

    const { data, error } = await supabaseAdmin
      .from("combos")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(updateData as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating combo:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (err) {
    console.error("Error in PUT /api/admin/combos/[id]:", err);
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
      .from("combos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting combo:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /api/admin/combos/[id]:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
