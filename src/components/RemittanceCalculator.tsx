"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRemittanceCalculator } from "@/hooks/useRemittanceCalculator";
import type { Currency } from "@/types";

/* ═══════════════════════════════════════════════════════════
   COUNTRY → CURRENCY MAP (flag + common name)
   Fallback: currencies que no estén en este mapa aún se muestran
   ═══════════════════════════════════════════════════════════ */

const CURRENCY_META: Record<string, { flag: string; country: string }> = {
  USD: { flag: "🇺🇸", country: "Estados Unidos" },
  EUR: { flag: "🇪🇺", country: "Europa" },
  MXN: { flag: "🇲🇽", country: "México" },
  CLP: { flag: "🇨🇱", country: "Chile" },
  BRL: { flag: "🇧🇷", country: "Brasil" },
  COP: { flag: "🇨🇴", country: "Colombia" },
  ARS: { flag: "🇦🇷", country: "Argentina" },
  CAD: { flag: "🇨🇦", country: "Canadá" },
  GBP: { flag: "🇬🇧", country: "Reino Unido" },
  PEN: { flag: "🇵🇪", country: "Perú" },
  BOB: { flag: "🇧🇴", country: "Bolivia" },
  PYG: { flag: "🇵🇾", country: "Paraguay" },
  UYU: { flag: "🇺🇾", country: "Uruguay" },
  VES: { flag: "🇻🇪", country: "Venezuela" },
  VEF: { flag: "🇻🇪", country: "Venezuela" },
  DOP: { flag: "🇩🇴", country: "Rep. Dominicana" },
  CRC: { flag: "🇨🇷", country: "Costa Rica" },
  GTQ: { flag: "🇬🇹", country: "Guatemala" },
  PAB: { flag: "🇵🇦", country: "Panamá" },
  NIO: { flag: "🇳🇮", country: "Nicaragua" },
  HNL: { flag: "🇭🇳", country: "Honduras" },
  SVC: { flag: "🇸🇻", country: "El Salvador" },
  CZK: { flag: "🇨🇿", country: "Rep. Checa" },
  CHF: { flag: "🇨🇭", country: "Suiza" },
  AUD: { flag: "🇦🇺", country: "Australia" },
  JPY: { flag: "🇯🇵", country: "Japón" },
  CNY: { flag: "🇨🇳", country: "China" },
  RUB: { flag: "🇷🇺", country: "Rusia" },
};

function currencyFlag(code: string, name = "") {
  return CURRENCY_META[code]?.flag ?? detectCountryFlag(name) ?? "🌍";
}

const COUNTRY_NAME_FLAGS: Array<[string, string]> = [
  ["estados unidos", "🇺🇸"], ["usa", "🇺🇸"], ["eeuu", "🇺🇸"],
  ["mexico", "🇲🇽"], ["méxico", "🇲🇽"],
  ["canada", "🇨🇦"], ["canadá", "🇨🇦"],
  ["españa", "🇪🇸"], ["espana", "🇪🇸"],
  ["argentina", "🇦🇷"],
  ["brasil", "🇧🇷"], ["brazil", "🇧🇷"],
  ["colombia", "🇨🇴"],
  ["chile", "🇨🇱"],
  ["peru", "🇵🇪"], ["perú", "🇵🇪"],
  ["venezuela", "🇻🇪"],
  ["ecuador", "🇪🇨"],
  ["bolivia", "🇧🇴"],
  ["uruguay", "🇺🇾"],
  ["paraguay", "🇵🇾"],
  ["cuba", "🇨🇺"],
  ["panama", "🇵🇦"], ["panamá", "🇵🇦"],
  ["costa rica", "🇨🇷"],
  ["nicaragua", "🇳🇮"],
  ["honduras", "🇭🇳"],
  ["guatemala", "🇬🇹"],
  ["el salvador", "🇸🇻"],
  ["republica dominicana", "🇩🇴"], ["república dominicana", "🇩🇴"], ["dominicana", "🇩🇴"],
  ["puerto rico", "🇵🇷"],
  ["reino unido", "🇬🇧"], ["uk", "🇬🇧"],
  ["alemania", "🇩🇪"], ["germany", "🇩🇪"],
  ["italia", "🇮🇹"],
  ["francia", "🇫🇷"],
  ["holanda", "🇳🇱"], ["paises bajos", "🇳🇱"],
  ["portugal", "🇵🇹"],
  ["rusia", "🇷🇺"],
  ["china", "🇨🇳"],
  ["japon", "🇯🇵"], ["japón", "🇯🇵"],
  ["australia", "🇦🇺"],
];

function detectCountryFlag(name: string): string {
  const lower = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [key, flag] of COUNTRY_NAME_FLAGS) {
    const normKey = key.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (lower.includes(normKey)) return flag;
  }
  return "🌍";
}

function currencyCountry(code: string, name: string) {
  return CURRENCY_META[code]?.country ?? name;
}

/* ═══════════════════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════════════════ */

function IconBack({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function getPaymentEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("zelle")) return "⚡";
  if (n.includes("efectivo") || n.includes("cash")) return "💵";
  if (n.includes("transfer") || n.includes("bank")) return "🏦";
  if (n.includes("western")) return "🏢";
  if (n.includes("tarjeta") || n.includes("card")) return "💳";
  if (n.includes("paypal")) return "🅿️";
  if (n.includes("crypto") || n.includes("usdt") || n.includes("btc")) return "🪙";
  return "💰";
}

/* ═══════════════════════════════════════════════════════════
   CALCULADORA PASO A PASO
   ═══════════════════════════════════════════════════════════ */

export function RemittanceCalculator() {
  const {
    currencies,
    filteredPaymentMethods,
    deliveryMethods,
    selectedPaymentMethod,
    selectedDeliveryMethod,
    originCountry,
    originCurrency,
    amount,
    result,
    isLoading,
    calculating,
    error,
    selectPaymentMethod,
    selectDeliveryMethod,
    setOriginCountry,
    setOriginCurrency,
    setAmount,
    calculate,
    reset,
  } = useRemittanceCalculator();

  const [step, setStep] = useState(1);
  const [slideDir, setSlideDir] = useState<"in" | "out">("in");
  const [display, setDisplay] = useState(step);
  const [customCountry, setCustomCountry] = useState("");
  const prevResult = useRef(result);

  useEffect(() => {
    if (result && !prevResult.current && display === 4) goStep(5);
    prevResult.current = result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const goStep = useCallback((s: number) => {
    setSlideDir("out");
    setTimeout(() => {
      setDisplay(s);
      setStep(s);
      setSlideDir("in");
    }, 150);
  }, []);

  const back = () => { if (display > 1 && display < 5) goStep(display - 1); };
  const currentStep = display;

  const payMethods = filteredPaymentMethods();

  const pickCurrency = (c: Currency) => {
    setOriginCountry(currencyCountry(c.code, c.name));
    setOriginCurrency(c.code);
    setTimeout(() => goStep(2), 200);
  };

  const pickPayment = (id: string) => { selectPaymentMethod(id); setTimeout(() => goStep(3), 200); };
  const pickDelivery = (id: string) => { selectDeliveryMethod(id); setTimeout(() => goStep(4), 200); };
  const handleCalc = () => { if (!calculating) calculate(); };
  const handleReset = () => { reset(); setCustomCountry(""); goStep(1); };

  /* ════════ LOADING ════════ */
  if (isLoading) {
    return (
      <section id="remesas" aria-label="Calculadora de remesas" className="mx-auto max-w-md px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-5 w-48 rounded bg-slate-200" />
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="h-4 w-24 rounded bg-slate-200 mb-4" />
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100" />)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ════════ ERROR ════════ */
  if (error && payMethods.length === 0 && currencies.length === 0) {
    return (
      <section id="remesas" aria-label="Calculadora de remesas" className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4">Reintentar</button>
      </section>
    );
  }

  const animClass = slideDir === "in" ? "animate-fade-in-up" : "opacity-0 translate-y-4";

  return (
    <section id="remesas" aria-label="Calculadora de remesas" className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <h2 className="mb-1 text-center text-xl font-bold text-slate-800 sm:text-2xl">Calculadora de Remesas</h2>
      <p className="mb-6 text-center text-sm text-slate-500">Cotiza tu envío en segundos</p>

      {/* Step indicator */}
      <div className="mb-4 flex items-center justify-center gap-1.5">
        {[1,2,3,4,5].map(s => (
          <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= currentStep ? 'bg-brand-green' : 'bg-slate-200'} ${s === currentStep ? 'w-6' : 'w-3'}`} aria-hidden="true" />
        ))}
      </div>

      <div className="card-premium overflow-hidden p-5 sm:p-6" key={currentStep}>
        <div className={animClass}>

          {currentStep > 1 && currentStep < 5 && (
            <button onClick={back} className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-brand-green min-h-[44px]">
              <IconBack /> Atrás
            </button>
          )}

          {/* ════════ PASO 1: PAÍS / MONEDA ════════ */}
          {currentStep === 1 && (
            <>
              <h3 className="mb-1 text-lg font-bold text-slate-800">¿Desde dónde envías?</h3>
              <p className="mb-4 text-xs text-slate-400">Selecciona tu país de origen</p>

              {currencies.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5">
                  {currencies.filter(c => c.active).map(c => {
                    const sel = originCurrency === c.code;
                    return (
                      <button key={c.id} onClick={() => pickCurrency(c)}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 transition-all active:scale-95 min-h-[68px] ${
                          sel ? 'border-brand-green bg-brand-green/5' : 'border-slate-100 bg-white hover:border-brand-green/20'
                        }`}>
                        <span className="text-2xl">{currencyFlag(c.code, c.name)}</span>
                        <span className="text-[11px] font-semibold text-slate-600 leading-tight text-center">
                          {currencyCountry(c.code, c.name).length > 13
                            ? currencyCountry(c.code, c.name).slice(0, 12) + '…'
                            : currencyCountry(c.code, c.name)}
                        </span>
                        <span className="text-[10px] text-slate-400">{c.code}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No hay países configurados aún.</p>
              )}

              {/* Custom country input con bandera dinámica */}
              <div className="mt-3">
                <div className="relative">
                  {customCountry.trim() && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg leading-none">
                      {detectCountryFlag(customCountry)}
                    </span>
                  )}
                  <input
                    value={customCountry}
                    onChange={e => {
                      setCustomCountry(e.target.value);
                      setOriginCountry(e.target.value);
                      setOriginCurrency("__OTHER__");
                    }}
                    placeholder="Otro país..."
                    className={`w-full rounded-xl border border-slate-200 py-2.5 text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 outline-none transition ${
                      customCountry.trim() ? "pl-9 pr-3" : "px-3"
                    }`}
                  />
                </div>
                {customCountry.trim() && (
                  <button
                    onClick={() => { setTimeout(() => goStep(2), 200); }}
                    className="btn-primary mt-2 w-full text-sm"
                  >
                    Continuar con {detectCountryFlag(customCountry)} {customCountry}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ════════ PASO 2: MÉTODO DE PAGO ════════ */}
          {currentStep === 2 && (
            <>
              <h3 className="mb-1 text-lg font-bold text-slate-800">Método de pago</h3>
              <p className="mb-4 text-xs text-slate-400">¿Cómo pagarás el envío desde {originCountry || originCurrency}?</p>
              {payMethods.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No hay métodos de pago disponibles.</p>
              ) : (
                <div className="space-y-2">
                  {payMethods.map(pm => {
                    const sel = selectedPaymentMethod?.id === pm.id;
                    return (
                      <button key={pm.id} onClick={() => pickPayment(pm.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all active:scale-[0.98] min-h-[56px] ${
                          sel ? 'border-brand-green bg-brand-green/5 shadow-sm' : 'border-slate-100 bg-white hover:border-brand-green/20'
                        }`}>
                        <span className="text-xl">{getPaymentEmoji(pm.name)}</span>
                        <span className="flex-1 text-sm font-semibold text-slate-700">{pm.name}</span>
                        {sel && <span className="text-brand-green text-lg">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ════════ PASO 3: MÉTODO DE ENTREGA ════════ */}
          {currentStep === 3 && (
            <>
              <h3 className="mb-1 text-lg font-bold text-slate-800">Método de entrega</h3>
              <p className="mb-4 text-xs text-slate-400">¿Cómo recibirán el dinero en Cuba?</p>
              <div className="space-y-2">
                {deliveryMethods.filter(d => d.active).map(dm => {
                  const sel = selectedDeliveryMethod?.id === dm.id;
                  return (
                    <button key={dm.id} onClick={() => pickDelivery(dm.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all active:scale-[0.98] min-h-[56px] ${
                        sel ? 'border-brand-green bg-brand-green/5 shadow-sm' : 'border-slate-100 bg-white hover:border-brand-green/20'
                      }`}>
                      <span className="text-xl">💵</span>
                      <span className="flex-1 text-sm font-semibold text-slate-700">{dm.name}</span>
                      {sel && <span className="text-brand-green text-lg">✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ════════ PASO 4: MONTO + CALCULAR ════════ */}
          {currentStep === 4 && (
            <>
              <h3 className="mb-1 text-lg font-bold text-slate-800">Monto a enviar</h3>
              <p className="mb-4 text-xs text-slate-400">Ingresa la cantidad en {originCurrency || "USD"}</p>

              <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-5 text-center">
                <span className="text-[10px] uppercase tracking-widest text-slate-400">{originCurrency || "USD"}</span>
                <div className="mt-1 text-3xl font-extrabold text-slate-800 tabular-nums">
                  {amount > 0 ? amount.toLocaleString() : "0"}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {["7","8","9","4","5","6","1","2","3","C","0","⌫"].map(k => {
                  const isAction = k === "C" || k === "⌫";
                  return (
                    <button key={k} type="button"
                      onClick={() => {
                        if (k === "C") setAmount(0);
                        else if (k === "⌫") { const s = amount > 0 ? amount.toString() : "0"; setAmount(s.length <= 1 ? 0 : Number(s.slice(0, -1))); }
                        else { const cur = amount > 0 ? amount.toString() : ""; if ((cur + k).length <= 7) setAmount(Number(cur + k)); }
                      }}
                      className={`select-none rounded-xl py-3 text-base font-semibold active:scale-95 transition-all min-h-[48px] ${
                        isAction ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-white text-slate-800 border border-slate-100 hover:border-brand-green/30 shadow-sm'
                      }`}>
                      {k === "⌫" ? "←" : k}
                    </button>
                  );
                })}
              </div>

              {error && <p className="mb-3 text-xs text-red-500 text-center">{error}</p>}

              <button onClick={handleCalc} disabled={amount <= 0 || calculating}
                className="btn-primary w-full py-3.5 text-base disabled:opacity-50">
                {calculating ? "Calculando..." : "Calcular"}
              </button>
            </>
          )}

          {/* ════════ PASO 5: RESULTADO ════════ */}
          {currentStep === 5 && result && (
            <div className="text-center">
              <div className="mb-3 rounded-2xl bg-gradient-to-br from-brand-green-dark to-brand-green px-5 py-6 text-white shadow-lg">
                <p className="text-xs uppercase tracking-widest text-white/70">Recibirás en Cuba</p>
                <p className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
                  ${result.receivingAmount.toLocaleString("es-CU", { maximumFractionDigits: 0 })}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/60">
                  <span className="flex items-center gap-1">
                    <span className="text-white/40">tasa</span>
                    {result.rateMultiplier >= 10
                      ? result.rateMultiplier.toFixed(0)
                      : result.rateMultiplier >= 1
                        ? result.rateMultiplier.toFixed(2)
                        : `×${result.rateMultiplier.toFixed(3)}`}
                  </span>
                  <span className="text-white/20">·</span>
                  <span>{result.paymentMethodName}</span>
                  <span className="text-white/30">→</span>
                  <span>{result.deliveryMethodName}</span>
                </div>
              </div>
              <p className="mb-4 text-xs text-slate-400">
                Enviaste {result.originAmount} {result.originCurrency} desde {result.originCountry}
              </p>

              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-brand-green">
                <span className="text-lg">✓</span> Cotización completada
              </div>

              <p className="mb-4 text-center text-xs text-slate-400">
                Continúa abajo para completar tu solicitud de remesa
              </p>

              <a href="#checkout" onClick={handleReset}
                className="btn-primary mb-3 flex w-full items-center justify-center gap-2 py-3 text-base no-underline">
                Solicitar Remesa
              </a>

              <button onClick={handleReset}
                className="w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700">
                Nueva cotización
              </button>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
