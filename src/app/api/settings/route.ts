import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_PUBLIC_KEYS = ["whatsapp_phone"] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key || !ALLOWED_PUBLIC_KEYS.includes(key as (typeof ALLOWED_PUBLIC_KEYS)[number])) {
    return Response.json({ error: "Clave no permitida" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching setting ${key}:`, error);
      return Response.json({ error: "Error interno" }, { status: 500 });
    }

    return Response.json({ key, value: data?.value ?? null });
  } catch (err) {
    console.error("GET /api/settings error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
