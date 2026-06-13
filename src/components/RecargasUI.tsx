"use client";

import { useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export interface RecargaItem {
  id: string;
  title: string;
  description: string | null;
  price_usd: number;
  image_url: string | null;
}

export interface CupRate {
  paymentMethod: string;
  deliveryMethod: string;
  rate: number;
}

interface RateInfo {
  paymentMethodId: string;
  deliveryMethodId: string;
  deliveryMethod: string;
  currencyCode: string;
  currencySymbol: string;
  rate: number;
}

interface PMInfo {
  id: string;
  name: string;
  active: boolean;
}

function convertToPaymentCurrency(
  priceUSD: number,
  pmId: string,
  rates: RateInfo[]
): { amount: number; code: string; symbol: string } | null {
  const pmRates = rates.filter(r => r.paymentMethodId === pmId);
  if (!pmRates.length) return null;
  const { currencyCode, currencySymbol } = pmRates[0];
  if (currencyCode === "USD") return { amount: priceUSD, code: "USD", symbol: "$" };
  const usdDel = pmRates.find(r => r.deliveryMethod.toLowerCase().includes("usd"));
  if (usdDel?.rate) return { amount: priceUSD / usdDel.rate, code: currencyCode, symbol: currencySymbol };
  const myCup = pmRates.find(r => r.deliveryMethod.toLowerCase().includes("cup"));
  if (!myCup) return null;
  const usdRef = rates.filter(r => r.currencyCode === "USD").find(r => r.deliveryMethodId === myCup.deliveryMethodId);
  if (!usdRef?.rate) return null;
  return { amount: priceUSD * (usdRef.rate / myCup.rate), code: currencyCode, symbol: currencySymbol };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════════════════ */

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECARGA ORDER MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

interface RecargaOrderModalProps {
  recarga: RecargaItem;
  onClose: () => void;
  paymentMethods: PMInfo[];
  rates: RateInfo[];
  loading: boolean;
}

function RecargaOrderModal({ recarga, onClose, paymentMethods, rates, loading }: RecargaOrderModalProps) {
  const [phone, setPhone] = useState("");
  const [pmId, setPMId] = useState("");

  const pm = paymentMethods.find(p => p.id === pmId);
  const converted = pmId ? convertToPaymentCurrency(recarga.price_usd, pmId, rates) : null;
  const canSend = phone.trim().length >= 7 && pmId !== "";

  function sendWA() {
    const amountStr = converted
      ? `${converted.symbol}${converted.amount.toFixed(2)} ${converted.code}`
      : `$${recarga.price_usd.toFixed(2)} USD`;

    const lines = [
      `📱 *RECARGA MÓVIL — Mr Factus*`,
      ``,
      `📡 *Recarga:* ${recarga.title}`,
      `💰 *Precio:* $${recarga.price_usd.toFixed(2)} USD`,
      pm ? `💳 *Método de pago:* ${pm.name}` : null,
      converted ? `📲 *Monto a pagar:* ${amountStr}` : null,
      ``,
      `━━━━━━━━━━━━━━━`,
      `📱 *NÚMERO A RECARGAR*`,
      `   Cuba: +53${phone}`,
      ``,
      `━━━━━━━━━━━━━━━`,
      `📅 ${new Date().toLocaleString("es-CU", { timeZone: "America/Havana" })}`,
      `✅ Pedido desde Mr Factus`,
    ].filter((l): l is string => l !== null);

    window.open(
      `https://wa.me/5355555555?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Recarga Móvil</p>
            <h3 className="truncate font-bold text-slate-800 leading-tight">{recarga.title}</h3>
          </div>
          <div className="ml-3 flex items-center gap-2 flex-shrink-0">
            <span className="rounded-full bg-brand-green/10 px-3 py-1 text-sm font-extrabold text-brand-green">
              ${recarga.price_usd.toFixed(2)} USD
            </span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition"
              aria-label="Cerrar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 pt-5 space-y-5">
          {/* Número en Cuba */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Número a recargar en Cuba</p>
            <div className="flex gap-2 items-center">
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 whitespace-nowrap">
                🇨🇺 +53
              </span>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="5XXXXXXX"
                maxLength={8}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition"
              />
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">¿Cómo vas a pagar?</p>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl skeleton-shimmer" />)}
              </div>
            ) : paymentMethods.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-3">No hay métodos disponibles</p>
            ) : (
              <div className="space-y-2">
                {paymentMethods.map(p => {
                  const sel = pmId === p.id;
                  const conv = sel ? convertToPaymentCurrency(recarga.price_usd, p.id, rates) : null;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPMId(p.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all active:scale-[0.98] ${
                        sel ? "border-brand-green bg-brand-green/5 shadow-sm" : "border-slate-100 hover:border-brand-green/20"
                      }`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-slate-700">{p.name}</span>
                        {sel && conv && (
                          <span className="text-xs font-mono font-bold text-brand-green">
                            Pagarás: {conv.symbol}{conv.amount.toFixed(2)} {conv.code}
                          </span>
                        )}
                        {sel && !conv && (
                          <span className="text-xs text-slate-400">
                            Pagarás: ${recarga.price_usd.toFixed(2)} USD
                          </span>
                        )}
                      </span>
                      {sel && <span className="text-brand-green text-lg flex-shrink-0">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={sendWA}
            disabled={!canSend}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white shadow-md shadow-[#25D366]/25 transition-all hover:bg-[#1fb855] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Pedir por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECHARGE CARD
   ═══════════════════════════════════════════════════════════════════════════ */

interface CupRateDisplay {
  paymentMethod: string;
  deliveryMethod: string;
  cupAmount: number;
}

function RechargeCard({
  recarga,
  cupRates,
  onOrder,
}: {
  recarga: RecargaItem;
  cupRates: CupRateDisplay[];
  onOrder: () => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-green/10">
      {/* Imagen */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-brand-green/10 to-emerald-50">
        {recarga.image_url ? (
          <img
            src={recarga.image_url}
            alt={recarga.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-5xl">📱</span>
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-extrabold text-brand-green shadow-lg backdrop-blur-sm">
          ${recarga.price_usd.toFixed(2)} USD
        </span>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold text-slate-800 leading-tight">{recarga.title}</h3>
        {recarga.description && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{recarga.description}</p>
        )}

        {/* CTA */}
        <button
          onClick={onOrder}
          className="mt-auto pt-4 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white shadow-md shadow-[#25D366]/25 transition-all hover:bg-[#1fb855] hover:shadow-lg active:scale-[0.97]"
          aria-label={`Pedir ${recarga.title}`}
        >
          <WhatsAppIcon className="h-4 w-4" />
          Pedir por WhatsApp
        </button>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECARGAS UI (main client export)
   ═══════════════════════════════════════════════════════════════════════════ */

export function RecargasUI({
  recharges,
  cupRates,
}: {
  recharges: RecargaItem[];
  cupRates: { paymentMethod: string; deliveryMethod: string; rate: number }[];
}) {
  const [orderingRecarga, setOrderingRecarga] = useState<RecargaItem | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PMInfo[]>([]);
  const [rates, setRates] = useState<RateInfo[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  async function openOrder(recarga: RecargaItem) {
    setOrderingRecarga(recarga);
    if (!paymentMethods.length) {
      setLoadingData(true);
      try {
        const [pmRes, ratesRes] = await Promise.all([
          fetch("/api/payment-methods").then(r => r.json()),
          fetch("/api/exchange-rates").then(r => r.json()),
        ]);
        setPaymentMethods((pmRes as PMInfo[]).filter(p => p.active));
        setRates(ratesRes as RateInfo[]);
      } catch {
        // modal will show "no hay métodos"
      }
      setLoadingData(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {recharges.map(r => {
          const cardRates: CupRateDisplay[] = cupRates.slice(0, 3).map(cr => ({
            paymentMethod: cr.paymentMethod,
            deliveryMethod: cr.deliveryMethod,
            cupAmount: r.price_usd * cr.rate,
          }));
          return (
            <RechargeCard
              key={r.id}
              recarga={r}
              cupRates={cardRates}
              onOrder={() => openOrder(r)}
            />
          );
        })}
      </div>

      {orderingRecarga && (
        <RecargaOrderModal
          recarga={orderingRecarga}
          onClose={() => setOrderingRecarga(null)}
          paymentMethods={paymentMethods}
          rates={rates}
          loading={loadingData}
        />
      )}
    </>
  );
}
