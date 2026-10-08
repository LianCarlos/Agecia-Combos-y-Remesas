import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cache } from "react";
import type { Referrer } from "@/types";

// ============================================================================
// Referidores — CRUD + resolución por código público
// ============================================================================

/** Cookie de atribución del referido (leída por createOrder y puesta por /r). */
export const REFERRAL_COOKIE = "mr_ref";

/** Ventana de atribución en segundos (30 días). */
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const getAllReferrers = cache(async (): Promise<Referrer[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("referrers")
    .select("*")
    .order("full_name");

  if (error) {
    console.error("Error fetching referrers:", error);
    return [];
  }

  return data as Referrer[];
});

/**
 * Resuelve un código de referido (activo) a su referidor. Devuelve null si no
 * existe o está inactivo. Usado por la ruta pública /r/[code] y createOrder.
 *
 * Usa la service-role key porque ambos consumidores son públicos (sin sesión de
 * admin): la RLS de `referrers` solo deja leer a admin, así que el cliente con
 * cookies no alcanza.
 */
export async function resolveByCode(code: string): Promise<Referrer | null> {
  const normalized = code.trim().toLowerCase();

  const { data, error } = await supabaseAdmin
    .from("referrers")
    .select("*")
    .eq("referral_code", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Referrer;
}

export interface CreateReferrerData {
  full_name: string;
  phone?: string | null;
  referral_code: string;
  label?: string | null;
}

export async function createReferrer(data: CreateReferrerData): Promise<Referrer | null> {
  const supabase = await createClient();

  const { data: referrer, error } = await supabase
    .from("referrers")
    .insert({
      full_name: data.full_name,
      phone: data.phone ?? null,
      referral_code: data.referral_code.trim().toLowerCase(),
      label: data.label ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating referrer:", error);
    return null;
  }

  return referrer as Referrer;
}

export interface UpdateReferrerData {
  full_name?: string;
  phone?: string | null;
  referral_code?: string;
  label?: string | null;
  is_active?: boolean;
}

export async function updateReferrer(
  id: string,
  data: UpdateReferrerData
): Promise<Referrer | null> {
  const supabase = await createClient();

  const { data: referrer, error } = await supabase
    .from("referrers")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating referrer:", error);
    return null;
  }

  return referrer as Referrer;
}

export async function toggleReferrer(id: string): Promise<Referrer | null> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("referrers")
    .select("is_active")
    .eq("id", id)
    .single();

  if (!current) return null;

  const { data: referrer, error } = await supabase
    .from("referrers")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling referrer:", error);
    return null;
  }

  return referrer as Referrer;
}

export async function deleteReferrer(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from("referrers").delete().eq("id", id);

  if (error) {
    console.error("Error deleting referrer:", error);
    return false;
  }

  return true;
}
