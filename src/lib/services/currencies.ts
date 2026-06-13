import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { Currency } from "@/types";

// ============================================================================
// Currencies — CRUD completo
// ============================================================================

export const getActiveCurrencies = cache(async (): Promise<Currency[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("currencies")
    .select("*")
    .eq("active", true)
    .order("code");

  if (error) {
    console.error("Error fetching active currencies:", error);
    return [];
  }

  return data as Currency[];
});

export const getAllCurrencies = cache(async (): Promise<Currency[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("currencies")
    .select("*")
    .order("code");

  if (error) {
    console.error("Error fetching all currencies:", error);
    return [];
  }

  return data as Currency[];
});

export async function createCurrency(
  code: string,
  name: string,
  symbol: string
): Promise<Currency | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("currencies")
    .insert({ code: code.toUpperCase(), name, symbol, active: true })
    .select()
    .single();

  if (error) {
    console.error("Error creating currency:", error);
    return null;
  }

  return data as Currency;
}

export async function toggleCurrency(id: string): Promise<Currency | null> {
  const supabase = await createClient();

  // Get current state
  const { data: current } = await supabase
    .from("currencies")
    .select("active")
    .eq("id", id)
    .single();

  if (!current) return null;

  const { data, error } = await supabase
    .from("currencies")
    .update({ active: !current.active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling currency:", error);
    return null;
  }

  return data as Currency;
}

export async function deleteCurrency(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("currencies")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting currency:", error);
    return false;
  }

  return true;
}
