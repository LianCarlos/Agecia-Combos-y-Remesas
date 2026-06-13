import { isAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .eq("key", "admin_password")
      .maybeSingle();

    if (error) {
      console.error("Error al leer admin_password:", error);
      return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    const hasPassword = data !== null && data.value !== "";

    return Response.json({
      adminPassword: hasPassword ? "***" : null,
    });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string" || currentPassword.trim() === "") {
      return Response.json({ error: "La contraseña actual es obligatoria" }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim() === "") {
      return Response.json({ error: "La nueva contraseña no puede estar vacía" }, { status: 400 });
    }

    if (newPassword.trim().length < 4) {
      return Response.json({ error: "La nueva contraseña debe tener al menos 4 caracteres" }, { status: 400 });
    }

    // Verificar que la contraseña actual sea correcta
    const { data: setting } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "admin_password")
      .maybeSingle();

    const dbPassword = setting?.value ?? "";
    const envPassword = process.env.ADMIN_API_TOKEN ?? "";
    const effectivePassword = dbPassword !== "" ? dbPassword : envPassword;

    if (currentPassword.trim() !== effectivePassword) {
      return Response.json({ error: "La contraseña actual es incorrecta" }, { status: 403 });
    }

    // Guardar la nueva contraseña
    const trimmedNew = newPassword.trim();
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert(
        {
          key: "admin_password",
          value: trimmedNew,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (error) {
      console.error("Error al guardar admin_password:", error);
      return Response.json({ error: "Error al guardar la configuración" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/settings error:", error);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
