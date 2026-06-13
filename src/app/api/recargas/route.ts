import { supabaseAdmin } from "@/lib/supabase/admin";
import { unstable_cache } from "next/cache";

const getActiveRecharges = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("mobile_recharges")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) return [];
    return data ?? [];
  },
  ["mobile-recharges-public"],
  { revalidate: 60, tags: ["mobile-recharges"] }
);

export async function GET() {
  const data = await getActiveRecharges();
  return Response.json(data);
}
