import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ExchangeRate } from "@/types";

// ============================================================================
// Rate Matrix (público) — todas las combinaciones activas con joins
// Usa supabaseAdmin + unstable_cache para evitar query en cada render
// ============================================================================

async function _fetchExchangeRates() {
  const { data, error } = await supabaseAdmin
    .from("exchange_rates")
    .select(`
      payment_method_id,
      delivery_method_id,
      rate,
      updated_at,
      payment_methods!inner(id, name, active, currency_id, currencies(id, code, symbol)),
      delivery_methods!inner(id, name, active)
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching exchange rates:", error);
    return [];
  }

  return (data as unknown as Array<{
    payment_method_id: string;
    delivery_method_id: string;
    rate: number;
    updated_at: string;
    payment_methods: {
      id: string;
      name: string;
      active: boolean;
      currency_id: string | null;
      currencies: { id: string; code: string; symbol: string } | null;
    } | null;
    delivery_methods: { id: string; name: string; active: boolean } | null;
  }>).map((row) => ({
    paymentMethodId: row.payment_method_id,
    deliveryMethodId: row.delivery_method_id,
    paymentMethod: row.payment_methods?.name ?? "Desconocido",
    deliveryMethod: row.delivery_methods?.name ?? "Desconocido",
    currencyCode: row.payment_methods?.currencies?.code ?? "USD",
    currencySymbol: row.payment_methods?.currencies?.symbol ?? "$",
    rate: row.rate,
    updatedAt: row.updated_at,
  }));
}

export const getExchangeRates = unstable_cache(
  _fetchExchangeRates,
  ["exchange-rates-public"],
  { revalidate: 60, tags: ["exchange-rates"] }
);

// ============================================================================
// Rate Matrix (Admin) — con joins completos
// ============================================================================

export const getRateMatrix = cache(async () => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exchange_rates")
    .select(`
      payment_method_id,
      delivery_method_id,
      rate,
      updated_at,
      payment_methods!inner(id, name, active, currency_id, currencies(id, code, symbol)),
      delivery_methods!inner(id, name, active)
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching rate matrix:", error);
    return [];
  }

  return data;
});

// ============================================================================
// Calculate Receiving Amount
// ============================================================================

export interface CalculateReceivingAmountParams {
  paymentMethodId: string;
  deliveryMethodId: string;
  amount: number;
}

export interface CalculateReceivingAmountResult {
  receivingAmount: number;
  rate: number;
  paymentMethodName: string;
  deliveryMethodName: string;
}

export const calculateReceivingAmount = cache(async (
  params: CalculateReceivingAmountParams
): Promise<CalculateReceivingAmountResult | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exchange_rates")
    .select(`
      rate,
      payment_methods!inner(name),
      delivery_methods!inner(name)
    `)
    .eq("payment_method_id", params.paymentMethodId)
    .eq("delivery_method_id", params.deliveryMethodId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as {
    rate: number;
    payment_methods: { name: string } | null;
    delivery_methods: { name: string } | null;
  };

  return {
    receivingAmount: params.amount * row.rate,
    rate: row.rate,
    paymentMethodName: row.payment_methods?.name ?? "Desconocido",
    deliveryMethodName: row.delivery_methods?.name ?? "Desconocido",
  };
});

// ============================================================================
// UPSERT Exchange Rate (para Server Actions)
// ============================================================================

export async function upsertExchangeRate(
  paymentMethodId: string,
  deliveryMethodId: string,
  rate: number
): Promise<ExchangeRate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exchange_rates")
    .upsert({
      payment_method_id: paymentMethodId,
      delivery_method_id: deliveryMethodId,
      rate,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error upserting exchange rate:", error);
    return null;
  }

  return data as ExchangeRate;
}

// ============================================================================
// Delete Exchange Rate
// ============================================================================

export async function deleteExchangeRate(
  paymentMethodId: string,
  deliveryMethodId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("exchange_rates")
    .delete()
    .eq("payment_method_id", paymentMethodId)
    .eq("delivery_method_id", deliveryMethodId);

  if (error) {
    console.error("Error deleting exchange rate:", error);
    return false;
  }

  return true;
}

// ============================================================================
// Available Rates by Currency (para el fallback global)
// ============================================================================

export const getAvailableRatesByCurrency = cache(async (currencyCode?: string) => {
  const supabase = await createClient();

  let query = supabase
    .from("exchange_rates")
    .select(`
      payment_method_id,
      delivery_method_id,
      rate,
      updated_at,
      payment_methods!inner(id, name, active, currency_id, currencies!inner(id, code, symbol)),
      delivery_methods!inner(id, name, active)
    `);

  if (currencyCode) {
    query = query.eq("payment_methods.currencies.code", currencyCode);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching available rates:", error);
    return [];
  }

  return data;
});
