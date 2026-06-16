import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MarketTicker } from "@/components/MarketTicker";
import { RemittanceCalculator } from "@/components/RemittanceCalculator";
import { ComboCatalog } from "@/components/ComboCatalog";
import { ProductsCatalog } from "@/components/ProductsCatalog";
import { CheckoutForm } from "@/components/CheckoutForm";
import { RecargasCatalog } from "@/components/RecargasCatalog";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartWidget } from "@/components/cart/CartWidget";
import { Reveal } from "@/components/Reveal";
import { AppDataProvider } from "@/components/AppDataProvider";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCalculatorData } from "@/lib/services/calculator";
import { getActiveCombos } from "@/lib/services/combos";
import { getActiveProducts } from "@/lib/services/products";
import { FALLBACK_CALCULATOR_DATA } from "@/lib/fallback-data";
import type { CalculatorData, PMInfo, RateInfo, Combo, Product } from "@/types";

function MarketTickerSkeleton() {
  return (
    <div className="card-rate w-full animate-pulse" aria-hidden="true">
      <div className="h-12 border-b border-green-900/30" />
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-5 rounded" style={{ background: "rgba(0,255,136,0.04)" }} />
        ))}
      </div>
    </div>
  );
}

const FALLBACK_COUNTRIES = [
  { name: "Estados Unidos", flag_icon: "🇺🇸" },
  { name: "México", flag_icon: "🇲🇽" },
  { name: "España", flag_icon: "🇪🇸" },
  { name: "Colombia", flag_icon: "🇨🇴" },
  { name: "Chile", flag_icon: "🇨🇱" },
];

async function getOriginCountries(): Promise<{ flag_icon: string; name: string }[]> {
  try {
    const { data } = await supabaseAdmin
      .from("countries")
      .select("name, flag_icon")
      .neq("name", "Cuba")
      .order("name");
    const valid = (data ?? []).filter((c): c is { flag_icon: string; name: string } =>
      typeof c.flag_icon === "string" && c.flag_icon.length > 0
    );
    return valid.length > 0 ? valid : FALLBACK_COUNTRIES;
  } catch {
    return FALLBACK_COUNTRIES;
  }
}

async function getWhatsappPhone(): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "whatsapp_phone")
      .single();
    return data?.value || "5355555555";
  } catch {
    return "5355555555";
  }
}

// Precarga de la calculadora en el servidor, con respaldo por-dataset si la BD falla.
async function getCalcData(): Promise<CalculatorData> {
  try {
    const d = await getCalculatorData();
    return {
      currencies: d.currencies.length ? d.currencies : FALLBACK_CALCULATOR_DATA.currencies,
      paymentMethods: d.paymentMethods.length ? d.paymentMethods : FALLBACK_CALCULATOR_DATA.paymentMethods,
      deliveryMethods: d.deliveryMethods.length ? d.deliveryMethods : FALLBACK_CALCULATOR_DATA.deliveryMethods,
      exchangeRates: d.exchangeRates,
    };
  } catch {
    return FALLBACK_CALCULATOR_DATA;
  }
}

async function getCombos(): Promise<Combo[]> {
  try {
    return await getActiveCombos();
  } catch {
    return [];
  }
}

async function getProducts(): Promise<Product[]> {
  try {
    return await getActiveProducts();
  } catch {
    return [];
  }
}

export default async function Home() {
  const [originCountries, whatsappPhone, calcData, combos, products] = await Promise.all([
    getOriginCountries(),
    getWhatsappPhone(),
    getCalcData(),
    getCombos(),
    getProducts(),
  ]);

  // Datos reducidos para el paso de pago del carrito (sin fetch en cliente)
  const cartPaymentMethods: PMInfo[] = calcData.paymentMethods
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      name: p.name,
      active: p.active,
      currencies: p.currencies ? { code: p.currencies.code, symbol: p.currencies.symbol } : null,
    }));
  const cartRates: RateInfo[] = calcData.exchangeRates.map((r) => ({
    paymentMethodId: r.paymentMethodId,
    deliveryMethodId: r.deliveryMethodId,
    deliveryMethod: r.deliveryMethod,
    currencyCode: r.currencyCode,
    currencySymbol: r.currencySymbol,
    rate: r.rate,
  }));

  return (
    <>
      <Header whatsappPhone={whatsappPhone} />

      <main className="min-h-screen">
       <AppDataProvider data={calcData}>
        {/* ═══════════════════════════════════════════════════════════
            HERO · Impacto fintech premium (dark emerald)
            ═══════════════════════════════════════════════════════════ */}
        <section id="inicio" className="hero-section relative isolate overflow-hidden">
          {/* Capa de cuadrícula sutil con máscara radial */}
          <div className="hero-grid-pattern pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
          {/* Brillo orgánico inferior que funde con la sección clara */}
          <div className="hero-fade pointer-events-none absolute inset-x-0 bottom-0 h-28 -z-10" aria-hidden="true" />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center px-5 pb-16 pt-12 text-center sm:pb-24 sm:pt-20">
            {/* Eyebrow: tasa en vivo */}
            <div className="hero-badge inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-50 sm:text-xs">
              <span className="live-dot" aria-hidden="true" />
              Remesas a Cuba en tiempo real
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Envía dinero a Cuba
              <br className="hidden sm:block" />{" "}
              <span className="hero-accent">en minutos</span>
            </h1>

            <p className="mx-auto mt-4 max-w-md text-pretty text-sm text-emerald-100/80 sm:text-lg">
              Remesas, combos y recargas con la{" "}
              <span className="font-semibold text-white">mejor tasa</span> del mercado.
              Rápido, seguro y sin complicaciones.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a href="#calcular" className="hero-cta-primary no-underline">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Calcular Remesa
              </a>
              <a href="#tasas" className="hero-cta-ghost no-underline">
                Ver Tasas de Cambio
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>

            {/* Trust pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-emerald-100/70">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M11.3 1.046a1 1 0 00-1.8-.092L4.2 10.2a1 1 0 00.9 1.45h3.1l-1.5 7.3a1 1 0 001.8.62l6.4-9.34a1 1 0 00-.82-1.58h-3.2l1.72-7.4z" /></svg>
                Entrega inmediata
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 1.5l6.5 2.4v5.1c0 4-2.7 7.7-6.5 8.99C6.2 16.7 3.5 13 3.5 9V3.9L10 1.5zm2.9 6.4a1 1 0 00-1.4-1.4L9 9.0 8.0 8.0a1 1 0 10-1.4 1.4l1.7 1.7a1 1 0 001.4 0l3.2-3.2z" clipRule="evenodd" /></svg>
                100% seguro
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.7 6.7a1 1 0 010 1.4l-6 6a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4l2.3 2.3 5.3-5.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
                Mejor tasa garantizada
              </span>
            </div>

            {/* Corredor de banderas: desde dónde → Cuba (dinámico desde BD) */}
            {originCountries.length > 0 && (
              <div className="mt-10 flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 backdrop-blur-sm">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100/60">Enviamos desde</span>
                <span className="flex items-center gap-1 text-lg leading-none" aria-hidden="true">
                  {originCountries.map((c, i) => (
                    <span key={c.name} className={i >= 4 ? "hidden xs:inline" : undefined}>
                      {c.flag_icon}
                    </span>
                  ))}
                </span>
                <svg className="h-3.5 w-3.5 text-emerald-300/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span className="text-xl leading-none" aria-hidden="true">🇨🇺</span>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CALCULADORA DE REMESAS
            ═══════════════════════════════════════════════════════════ */}
        <Reveal>
          <section id="calcular" aria-label="Calculadora de remesas" className="bg-slate-50/60">
            <RemittanceCalculator />
          </section>
        </Reveal>

        {/* ═══════════════════════════════════════════════════════════
            SOLICITAR REMESA
            ═══════════════════════════════════════════════════════════ */}
        <Reveal>
          <section id="checkout" aria-label="Solicitar remesa">
            <CheckoutForm whatsappPhone={whatsappPhone} />
          </section>
        </Reveal>

        {/* ═══════════════════════════════════════════════════════════
            COMBOS Y PRODUCTOS (carrito compartido)
            ═══════════════════════════════════════════════════════════ */}
        <CartProvider whatsappPhone={whatsappPhone} paymentMethods={cartPaymentMethods} rates={cartRates}>
          <Reveal>
            <ComboCatalog initialData={combos} />
          </Reveal>

          {/* Separador entre Combos y Productos */}
          <div className="mx-auto max-w-6xl px-4 sm:px-6" aria-hidden="true">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-300">
                Productos
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>
          </div>

          <Reveal>
            <ProductsCatalog initialData={products} />
          </Reveal>
          <CartWidget />
        </CartProvider>

        {/* ═══════════════════════════════════════════════════════════
            RECARGAS MÓVILES
            ═══════════════════════════════════════════════════════════ */}
        <Reveal>
          <Suspense fallback={null}>
            <RecargasCatalog whatsappPhone={whatsappPhone} />
          </Suspense>
        </Reveal>

        {/* ═══════════════════════════════════════════════════════════
            TASAS DE CAMBIO
            ═══════════════════════════════════════════════════════════ */}
        <Reveal>
          <section
            id="tasas"
            aria-label="Tasas de cambio en tiempo real"
            className="mx-auto max-w-2xl px-4 pt-8 pb-16 sm:px-6"
          >
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Tasas de Cambio</h2>
              <p className="mt-1 text-sm text-slate-500">Precios actualizados en tiempo real</p>
            </div>
            <Suspense fallback={<MarketTickerSkeleton />}>
              <MarketTicker />
            </Suspense>
          </section>
        </Reveal>
       </AppDataProvider>
      </main>

      <Footer whatsappPhone={whatsappPhone} />
    </>
  );
}
