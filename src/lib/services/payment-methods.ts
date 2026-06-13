import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { PaymentMethod } from "@/types";

export const getActivePaymentMethods = cache(async (): Promise<PaymentMethod[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_methods")
    .select("*, currencies(*)")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Error fetching payment methods:", error);
    return [];
  }

  return data as PaymentMethod[];
});

export const getActivePaymentMethodsByCurrency = cache(async (currencyCode: string): Promise<PaymentMethod[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_methods")
    .select("*, currencies!inner(*)")
    .eq("active", true)
    .eq("currencies.code", currencyCode)
    .order("name");

  if (error) {
    console.error("Error fetching payment methods by currency:", error);
    return [];
  }

  return data as PaymentMethod[];
});

export const getAllPaymentMethods = cache(async (): Promise<PaymentMethod[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_methods")
    .select("*, currencies(*)")
    .order("name");

  if (error) {
    console.error("Error fetching all payment methods:", error);
    return [];
  }

  return data as PaymentMethod[];
});

export async function createPaymentMethod(
  name: string,
  currencyId: string
): Promise<PaymentMethod | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_methods")
    .insert({ name, currency_id: currencyId, active: true })
    .select("*, currencies(*)")
    .single();

  if (error) {
    console.error("Error creating payment method:", error);
    return null;
  }

  return data as PaymentMethod;
}

export async function updatePaymentMethod(
  id: string,
  name: string,
  active: boolean,
  currencyId?: string | null
): Promise<PaymentMethod | null> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { name, active };
  if (currencyId !== undefined) {
    updateData.currency_id = currencyId;
  }

  const { data, error } = await supabase
    .from("payment_methods")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updateData as any)
    .eq("id", id)
    .select("*, currencies(*)")
    .single();

  if (error) {
    console.error("Error updating payment method:", error);
    return null;
  }

  return data as PaymentMethod;
}

export async function deletePaymentMethod(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting payment method:", error);
    return false;
  }

  return true;
}
