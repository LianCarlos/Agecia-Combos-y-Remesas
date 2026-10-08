import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { Country } from "@/types";

// ============================================================================
// Países de origen — CRUD de `countries`
// (El selector público lee activos; el admin gestiona el catálogo completo.)
// ============================================================================

export const getActiveCountries = cache(async (): Promise<Country[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("countries")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching active countries:", error);
    return [];
  }

  return data as Country[];
});

export const getAllCountries = cache(async (): Promise<Country[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("countries")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching all countries:", error);
    return [];
  }

  return data as Country[];
});

export interface CreateCountryData {
  name: string;
  flag_icon?: string | null;
  currency_code?: string | null;
}

export async function createCountry(data: CreateCountryData): Promise<Country | null> {
  const supabase = await createClient();

  const { data: country, error } = await supabase
    .from("countries")
    .insert({
      name: data.name,
      flag_icon: data.flag_icon ?? null,
      currency_code: data.currency_code?.toUpperCase() ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating country:", error);
    return null;
  }

  return country as Country;
}

export interface UpdateCountryData {
  name?: string;
  flag_icon?: string | null;
  currency_code?: string | null;
  is_active?: boolean;
}

export async function updateCountry(
  id: string,
  data: UpdateCountryData
): Promise<Country | null> {
  const supabase = await createClient();

  const payload: UpdateCountryData = { ...data };
  if (typeof payload.currency_code === "string") {
    payload.currency_code = payload.currency_code.toUpperCase();
  }

  const { data: country, error } = await supabase
    .from("countries")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating country:", error);
    return null;
  }

  return country as Country;
}

export async function toggleCountry(id: string): Promise<Country | null> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("countries")
    .select("is_active")
    .eq("id", id)
    .single();

  if (!current) return null;

  const { data: country, error } = await supabase
    .from("countries")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling country:", error);
    return null;
  }

  return country as Country;
}

export async function deleteCountry(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from("countries").delete().eq("id", id);

  if (error) {
    console.error("Error deleting country:", error);
    return false;
  }

  return true;
}
