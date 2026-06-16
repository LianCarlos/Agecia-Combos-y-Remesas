import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getExchangeRates } from "./exchange-rates";
import type {
  CalculatorData,
  Currency,
  PaymentMethod,
  DeliveryMethod,
} from "@/types";

/**
 * Carga base de la calculadora (monedas + métodos), cacheada entre requests
 * para sobrevivir caídas transitorias de la BD. Usa supabaseAdmin (sin cookies)
 * para poder cachearse. Se revalida cada 60s o al mutar los tags.
 */
const getCalculatorBase = unstable_cache(
  async (): Promise<Omit<CalculatorData, "exchangeRates">> => {
    const [curRes, pmRes, dmRes] = await Promise.all([
      supabaseAdmin.from("currencies").select("*").eq("active", true).order("code"),
      supabaseAdmin.from("payment_methods").select("*, currencies(*)").eq("active", true).order("name"),
      supabaseAdmin.from("delivery_methods").select("*").eq("active", true).order("name"),
    ]);

    return {
      currencies: (curRes.data ?? []) as Currency[],
      paymentMethods: (pmRes.data ?? []) as unknown as PaymentMethod[],
      deliveryMethods: (dmRes.data ?? []) as DeliveryMethod[],
    };
  },
  ["calculator-base"],
  { revalidate: 60, tags: ["currencies", "payment-methods", "delivery-methods"] }
);

/**
 * Agrega todos los datasets que la calculadora necesita para renderizar y
 * calcular en el cliente sin más round-trips. Pensado para precargar en el
 * Server Component (page.tsx) y pasar como props iniciales.
 */
export async function getCalculatorData(): Promise<CalculatorData> {
  const [base, exchangeRates] = await Promise.all([
    getCalculatorBase(),
    getExchangeRates(),
  ]);
  return { ...base, exchangeRates };
}
