import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { DeliveryPerson } from "@/types";

// ============================================================================
// Repartidores / entregadores — CRUD
// ============================================================================

export const getAllDeliveryPersons = cache(async (): Promise<DeliveryPerson[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("delivery_persons")
    .select("*")
    .order("full_name");

  if (error) {
    console.error("Error fetching delivery persons:", error);
    return [];
  }

  return data as DeliveryPerson[];
});

export const getActiveDeliveryPersons = cache(async (): Promise<DeliveryPerson[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("delivery_persons")
    .select("*")
    .eq("is_active", true)
    .order("full_name");

  if (error) {
    console.error("Error fetching active delivery persons:", error);
    return [];
  }

  return data as DeliveryPerson[];
});

export interface CreateDeliveryPersonData {
  full_name: string;
  phone?: string | null;
}

export async function createDeliveryPerson(
  data: CreateDeliveryPersonData
): Promise<DeliveryPerson | null> {
  const supabase = await createClient();

  const { data: person, error } = await supabase
    .from("delivery_persons")
    .insert({ full_name: data.full_name, phone: data.phone ?? null })
    .select()
    .single();

  if (error) {
    console.error("Error creating delivery person:", error);
    return null;
  }

  return person as DeliveryPerson;
}

export interface UpdateDeliveryPersonData {
  full_name?: string;
  phone?: string | null;
  is_active?: boolean;
}

export async function updateDeliveryPerson(
  id: string,
  data: UpdateDeliveryPersonData
): Promise<DeliveryPerson | null> {
  const supabase = await createClient();

  const { data: person, error } = await supabase
    .from("delivery_persons")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating delivery person:", error);
    return null;
  }

  return person as DeliveryPerson;
}

export async function toggleDeliveryPerson(id: string): Promise<DeliveryPerson | null> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("delivery_persons")
    .select("is_active")
    .eq("id", id)
    .single();

  if (!current) return null;

  const { data: person, error } = await supabase
    .from("delivery_persons")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling delivery person:", error);
    return null;
  }

  return person as DeliveryPerson;
}

export async function deleteDeliveryPerson(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from("delivery_persons").delete().eq("id", id);

  if (error) {
    console.error("Error deleting delivery person:", error);
    return false;
  }

  return true;
}
