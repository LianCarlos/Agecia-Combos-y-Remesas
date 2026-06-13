import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const fileName = `public/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("recargas")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (error) {
    // Fallback: intentar en bucket combos con prefijo recargas/
    const fallbackName = `recargas/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: e2 } = await supabaseAdmin.storage
      .from("combos")
      .upload(fallbackName, buffer, { contentType: file.type, upsert: false });
    if (e2) return Response.json({ error: e2.message }, { status: 500 });
    const { data: { publicUrl } } = supabaseAdmin.storage.from("combos").getPublicUrl(fallbackName);
    return Response.json({ url: publicUrl });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from("recargas").getPublicUrl(fileName);
  return Response.json({ url: publicUrl });
}
