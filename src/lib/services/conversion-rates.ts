import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { ConversionRate } from "@/types";

// ============================================================================
// Tasas de conversión (USDT pivote) — CRUD + consulta puntual
// ============================================================================

export const getAllConversionRates = cache(async (): Promise<ConversionRate[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversion_rates")
    .select("*")
    .order("from_code")
    .order("to_code");

  if (error) {
    console.error("Error fetching conversion rates:", error);
    return [];
  }

  return data as ConversionRate[];
});

/**
 * Devuelve la tasa `fromCode → toCode`, o null si no existe.
 */
export async function getRate(fromCode: string, toCode: string): Promise<number | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversion_rates")
    .select("rate")
    .eq("from_code", fromCode.toUpperCase())
    .eq("to_code", toCode.toUpperCase())
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.rate;
}

/**
 * Inserta o actualiza la tasa para el par `fromCode → toCode` (UNIQUE).
 */
export async function upsertRate(
  fromCode: string,
  toCode: string,
  rate: number
): Promise<ConversionRate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversion_rates")
    .upsert(
      { from_code: fromCode.toUpperCase(), to_code: toCode.toUpperCase(), rate },
      { onConflict: "from_code,to_code" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting conversion rate:", error);
    return null;
  }

  return data as ConversionRate;
}

export async function deleteRate(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from("conversion_rates").delete().eq("id", id);

  if (error) {
    console.error("Error deleting conversion rate:", error);
    return false;
  }

  return true;
}
