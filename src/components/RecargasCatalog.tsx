import { supabaseAdmin } from "@/lib/supabase/admin";
import { unstable_cache } from "next/cache";
import { RecargasUI, type RecargaItem } from "./RecargasUI";

const getRechargesWithRates = unstable_cache(
  async () => {
    const [rechargesRes, ratesRes] = await Promise.all([
      supabaseAdmin
        .from("mobile_recharges")
        .select("id, title, description, price_usd, image_url")
        .eq("active", true)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("exchange_rates")
        .select(`
          rate,
          payment_methods!inner(name),
          delivery_methods!inner(name)
        `)
        .limit(6),
    ]);

    const recharges = (rechargesRes.data ?? []) as RecargaItem[];

    type RateRow = {
      rate: number;
      payment_methods: { name: string } | null;
      delivery_methods: { name: string } | null;
    };
    const cupRates = ((ratesRes.data ?? []) as unknown as RateRow[]).map(r => ({
      paymentMethod: r.payment_methods?.name ?? "?",
      deliveryMethod: r.delivery_methods?.name ?? "?",
      rate: r.rate,
    }));

    return { recharges, cupRates };
  },
  ["recharges-catalog"],
  { revalidate: 60, tags: ["mobile-recharges", "exchange-rates"] }
);

export async function RecargasCatalog() {
  const { recharges, cupRates } = await getRechargesWithRates();

  if (recharges.length === 0) return null;

  return (
    <section id="recargas" aria-label="Recargas Móviles" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10 shadow-sm">
          <svg className="h-7 w-7 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          Recargas Móviles
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Planes de datos y minutos para Cuba al mejor precio
        </p>
      </div>

      <RecargasUI recharges={recharges} cupRates={cupRates} />
    </section>
  );
}
