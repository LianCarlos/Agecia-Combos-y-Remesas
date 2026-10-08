import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { CommissionConfig, CommissionRoleType } from "@/types";

// ============================================================================
// Comisiones (%) por país — CRUD de `commission_configs`
// ============================================================================

export const getCommissionConfigs = cache(async (): Promise<CommissionConfig[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("commission_configs")
    .select("*, countries(name, flag_icon, currency_code)")
    .order("country_id");

  if (error) {
    console.error("Error fetching commission configs:", error);
    return [];
  }

  return data as CommissionConfig[];
});

/**
 * Configuraciones de un país (entregador / agencia / referidor).
 */
export const getCommissionConfigsByCountry = cache(
  async (countryId: string): Promise<CommissionConfig[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("commission_configs")
      .select("*")
      .eq("country_id", countryId);

    if (error) {
      console.error("Error fetching commission configs by country:", error);
      return [];
    }

    return data as CommissionConfig[];
  }
);

/**
 * Inserta o actualiza el % de un rol para un país (UNIQUE country_id, role_type).
 */
export async function upsertCommissionConfig(
  countryId: string,
  roleType: CommissionRoleType,
  percent: number
): Promise<CommissionConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("commission_configs")
    .upsert(
      { country_id: countryId, role_type: roleType, percent },
      { onConflict: "country_id,role_type" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting commission config:", error);
    return null;
  }

  return data as CommissionConfig;
}

export async function deleteCommissionConfig(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from("commission_configs").delete().eq("id", id);

  if (error) {
    console.error("Error deleting commission config:", error);
    return false;
  }

  return true;
}
