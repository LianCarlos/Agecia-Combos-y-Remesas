import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Product } from "@/types";

// Público: solo productos activos, cacheado entre requests (tag "products")
export const getActiveProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching active products:", error);
      return [];
    }

    return data as Product[];
  },
  ["products-public"],
  { revalidate: 60, tags: ["products"] }
);
