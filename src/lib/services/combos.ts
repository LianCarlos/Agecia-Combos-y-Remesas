import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { Combo } from "@/types";

// Público: se consume client-side vía /api/combos, así que basta dedupe por request.
export const getActiveCombos = cache(async (): Promise<Combo[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("combos")
    .select("*")
    .eq("available", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching active combos:", error);
    return [];
  }

  return data as Combo[];
});

export const getAllCombos = cache(async (): Promise<Combo[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("combos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all combos:", error);
    return [];
  }

  return data as Combo[];
});

export interface CreateComboData {
  title: string;
  description?: string | null;
  price_usd: number;
  image_url?: string | null;
}

export async function createCombo(data: CreateComboData): Promise<Combo | null> {
  const supabase = await createClient();

  const { data: combo, error } = await supabase
    .from("combos")
    .insert({
      title: data.title,
      description: data.description ?? null,
      price_usd: data.price_usd,
      image_url: data.image_url ?? null,
      available: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating combo:", error);
    return null;
  }

  return combo as Combo;
}

export interface UpdateComboData {
  title?: string;
  description?: string | null;
  price_usd?: number;
  image_url?: string | null;
  available?: boolean;
}

export async function updateCombo(
  id: string,
  data: UpdateComboData
): Promise<Combo | null> {
  const supabase = await createClient();

  const { data: combo, error } = await supabase
    .from("combos")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating combo:", error);
    return null;
  }

  return combo as Combo;
}

export async function deleteCombo(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("combos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting combo:", error);
    return false;
  }

  return true;
}
