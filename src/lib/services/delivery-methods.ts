import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { DeliveryMethod } from "@/types";

export const getActiveDeliveryMethods = cache(async (): Promise<DeliveryMethod[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("delivery_methods")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Error fetching delivery methods:", error);
    return [];
  }

  return data as DeliveryMethod[];
});

export const getAllDeliveryMethods = cache(async (): Promise<DeliveryMethod[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("delivery_methods")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching all delivery methods:", error);
    return [];
  }

  return data as DeliveryMethod[];
});

export async function createDeliveryMethod(
  name: string
): Promise<DeliveryMethod | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("delivery_methods")
    .insert({ name, active: true })
    .select()
    .single();

  if (error) {
    console.error("Error creating delivery method:", error);
    return null;
  }

  return data as DeliveryMethod;
}

export async function updateDeliveryMethod(
  id: string,
  name: string,
  active: boolean
): Promise<DeliveryMethod | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("delivery_methods")
    .update({ name, active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating delivery method:", error);
    return null;
  }

  return data as DeliveryMethod;
}

export async function deleteDeliveryMethod(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_methods")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting delivery method:", error);
    return false;
  }

  return true;
}

