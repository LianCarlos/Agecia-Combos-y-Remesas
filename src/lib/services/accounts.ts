import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { Account, AccountType } from "@/types";

// ============================================================================
// Cuentas de recepción — CRUD
// (Lectura: admin. Escritura: superadmin — lo refuerza RLS y requireSuperAdmin.)
// ============================================================================

export const getAllAccounts = cache(async (): Promise<Account[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }

  return data as Account[];
});

export const getActiveAccounts = cache(async (): Promise<Account[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching active accounts:", error);
    return [];
  }

  return data as Account[];
});

export interface CreateAccountData {
  name: string;
  type: AccountType;
  currency_id?: string | null;
  country_id?: string | null;
  is_own?: boolean;
  owner_name?: string | null;
  owner_fee_percent?: number;
  account_details?: string | null;
}

export async function createAccount(data: CreateAccountData): Promise<Account | null> {
  const supabase = await createClient();

  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      name: data.name,
      type: data.type,
      currency_id: data.currency_id ?? null,
      country_id: data.country_id ?? null,
      is_own: data.is_own ?? false,
      owner_name: data.owner_name ?? null,
      owner_fee_percent: data.owner_fee_percent ?? 0,
      account_details: data.account_details ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating account:", error);
    return null;
  }

  return account as Account;
}

export interface UpdateAccountData {
  name?: string;
  type?: AccountType;
  currency_id?: string | null;
  country_id?: string | null;
  is_own?: boolean;
  owner_name?: string | null;
  owner_fee_percent?: number;
  account_details?: string | null;
  is_active?: boolean;
}

export async function updateAccount(
  id: string,
  data: UpdateAccountData
): Promise<Account | null> {
  const supabase = await createClient();

  const { data: account, error } = await supabase
    .from("accounts")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating account:", error);
    return null;
  }

  return account as Account;
}

export async function toggleAccount(id: string): Promise<Account | null> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("accounts")
    .select("is_active")
    .eq("id", id)
    .single();

  if (!current) return null;

  const { data: account, error } = await supabase
    .from("accounts")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling account:", error);
    return null;
  }

  return account as Account;
}

export async function deleteAccount(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) {
    console.error("Error deleting account:", error);
    return false;
  }

  return true;
}
