"use client";

import { useState } from "react";
import { useCombos } from "@/hooks/useCombos";
import type { Combo } from "@/types";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

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
  currencies?: { code: string; symbol: string } | null;
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
   SVG ICONS
   ═══════════════════════════════════════════════════════════════════════════ */

function IconPackage({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

function IconWhatsApp({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconAlertTriangle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function IconBoxEmpty({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6.75 4.125l3-1.5m0 0l3 1.5m-3-1.5v6.75M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

function IconRefresh({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMBO ORDER MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

interface ComboOrderModalProps {
  combo: Combo;
  onClose: () => void;
  paymentMethods: PMInfo[];
  rates: RateInfo[];
  loading: boolean;
}

function ComboOrderModal({ combo, onClose, paymentMethods, rates, loading }: ComboOrderModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [ci, setCI] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pmId, setPMId] = useState("");

  const pm = paymentMethods.find(p => p.id === pmId);
  const step1Valid = name.trim().length > 0 && phone.trim().length > 0;
  const step2Valid = pmId !== "";

  function sendWA() {
    const converted = pmId ? convertToPaymentCurrency(combo.price_usd, pmId, rates) : null;
    const amountStr = converted
      ? `${converted.symbol}${converted.amount.toFixed(2)} ${converted.code}`
      : `$${combo.price_usd.toFixed(2)} USD`;

    const lines = [
      `🛒 *PEDIDO COMBO — Mr Factus*`,
      ``,
      `📦 *Combo:* ${combo.title}`,
      `💰 *Precio:* $${combo.price_usd.toFixed(2)} USD`,
      pm ? `💳 *Método de pago:* ${pm.name}` : null,
      converted ? `📲 *Monto a pagar:* ${amountStr}` : null,
      ``,
      `━━━━━━━━━━━━━━━`,
      `📥 *DATOS DEL RECEPTOR*`,
      `   Nombre: ${name}`,
      ci ? `   CI: ${ci}` : null,
      `   Teléfono: +53${phone}`,
      address ? `   Dirección: ${address}` : null,
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
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Combo</p>
            <h3 className="truncate font-bold text-slate-800 leading-tight">{combo.title}</h3>
          </div>
          <div className="ml-3 flex items-center gap-2 flex-shrink-0">
            <span className="rounded-full bg-brand-green/10 px-3 py-1 text-sm font-extrabold text-brand-green">
              ${combo.price_usd.toFixed(2)} USD
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

        {/* Step indicator */}
        <div className="flex gap-1.5 px-5 pt-4">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "bg-brand-green" : "bg-slate-100"}`}
            />
          ))}
        </div>

        <div className="px-5 pb-6 pt-4">
          {/* PASO 1: datos del receptor */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">¿Quién recibe el combo?</p>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Nombre completo *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nombre del receptor en Cuba"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Carnet de identidad</label>
                <input
                  value={ci}
                  onChange={e => setCI(e.target.value)}
                  placeholder="CI del receptor (opcional)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Teléfono en Cuba *</label>
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
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Dirección</label>
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Dirección del receptor (opcional)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="btn-primary mt-2 w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          )}

          {/* PASO 2: método de pago */}
          {step === 2 && (
            <div className="space-y-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-green transition min-h-[32px]">
                ← Atrás
              </button>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">¿Cómo vas a pagar?</p>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl skeleton-shimmer" />)}
                </div>
              ) : paymentMethods.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-4">No hay métodos disponibles</p>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map(p => {
                    const sel = pmId === p.id;
                    const converted = sel ? convertToPaymentCurrency(combo.price_usd, p.id, rates) : null;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPMId(p.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all active:scale-[0.98] ${
                          sel
                            ? "border-brand-green bg-brand-green/5 shadow-sm"
                            : "border-slate-100 hover:border-brand-green/20"
                        }`}
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-slate-700">{p.name}</span>
                          {sel && converted && (
                            <span className="text-xs font-mono font-bold text-brand-green">
                              Pagarás: {converted.symbol}{converted.amount.toFixed(2)} {converted.code}
                            </span>
                          )}
                          {sel && !converted && (
                            <span className="text-xs text-slate-400">
                              Pagarás: ${combo.price_usd.toFixed(2)} USD
                            </span>
                          )}
                        </span>
                        {sel && <span className="text-brand-green text-lg flex-shrink-0">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                onClick={sendWA}
                disabled={!step2Valid}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white shadow-md shadow-[#25D366]/25 transition-all hover:bg-[#1fb855] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
              >
                <IconWhatsApp className="h-5 w-5" />
                Pedir por WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SKELETON CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function SkeletonCard() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-green/5 bg-white shadow-md">
      <div className="relative h-56 w-full skeleton-shimmer sm:h-64" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      <div className="absolute left-4 top-4">
        <div className="h-6 w-24 rounded-full skeleton-shimmer" />
      </div>
      <div className="absolute right-4 top-4">
        <div className="h-7 w-16 rounded-full skeleton-shimmer" />
      </div>
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <div className="h-6 w-3/4 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-full rounded-lg skeleton-shimmer" />
      </div>
      <div className="border-t border-slate-50 px-4 py-4">
        <div className="h-11 w-full rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMBO CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function ComboCard({ combo, onOrder }: { combo: Combo; onOrder: () => void }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasImage = Boolean(combo.image_url);
  const isAvailable = combo.available;

  return (
    <>
      {lightboxOpen && hasImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Ver imagen de ${combo.title}`}
        >
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            onClick={() => setLightboxOpen(false)}
            aria-label="Cerrar imagen"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={combo.image_url!}
            alt={combo.title}
            className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-6 left-0 right-0 text-center text-sm font-semibold text-white/80">
            {combo.title}
          </p>
        </div>
      )}

      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-green/5 bg-white shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-brand-green/10 hover:-translate-y-1.5">
        {/* Imagen */}
        <div className="relative h-56 w-full overflow-hidden sm:h-64">
          {hasImage ? (
            <>
              <button
                type="button"
                className="absolute inset-0 z-10 cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
                aria-label={`Ver imagen de ${combo.title}`}
              />
              <img
                src={combo.image_url!}
                alt={combo.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{ background: "linear-gradient(180deg, transparent 20%, rgba(0,61,38,0.45) 55%, rgba(0,61,38,0.82) 85%, rgba(0,45,28,0.95) 100%)" }}
              />
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,45,28,0.65) 50%, rgba(0,30,18,0.92) 85%, rgba(0,20,10,0.98) 100%)" }}
              />
            </>
          ) : (
            <div className="geo-placeholder relative flex h-full w-full items-center justify-center">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 256" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <pattern id={`geo-lines-${combo.id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <line x1="40" y1="0" x2="0" y2="40" stroke="rgba(0,104,71,0.07)" strokeWidth="1" />
                    <line x1="0" y1="0" x2="40" y2="40" stroke="rgba(0,104,71,0.05)" strokeWidth="0.5" />
                    <line x1="20" y1="0" x2="20" y2="40" stroke="rgba(0,104,71,0.04)" strokeWidth="1" />
                    <line x1="0" y1="20" x2="40" y2="20" stroke="rgba(0,104,71,0.04)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#geo-lines-${combo.id})`} />
                <circle cx="200" cy="128" r="60" fill="none" stroke="rgba(0,104,71,0.06)" strokeWidth="1" />
                <circle cx="200" cy="128" r="90" fill="none" stroke="rgba(0,104,71,0.04)" strokeWidth="1" />
                <circle cx="200" cy="128" r="120" fill="none" stroke="rgba(0,104,71,0.02)" strokeWidth="1" />
              </svg>
              <IconPackage className="relative z-10 h-16 w-16 text-brand-green/12" />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, transparent 20%, rgba(0,61,38,0.5) 55%, rgba(0,61,38,0.85) 85%, rgba(0,45,28,0.95) 100%)" }}
              />
            </div>
          )}

          {/* Badge disponible/agotado */}
          <span className="absolute left-3 top-3 z-20">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-lg backdrop-blur-md transition-all duration-300 ${
              isAvailable ? "bg-brand-green/90 text-white ring-1 ring-white/20" : "bg-red-600/90 text-white ring-1 ring-white/10"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-green-300 animate-pulse" : "bg-red-200"}`} aria-hidden="true" />
              {isAvailable ? "Disponible" : "Agotado"}
            </span>
          </span>

          {/* Badge precio */}
          <span className="absolute right-3 top-3 z-20">
            <span className="inline-flex items-center rounded-full bg-white/90 px-3.5 py-1.5 text-sm font-extrabold text-brand-green shadow-xl backdrop-blur-md ring-1 ring-black/5 transition-all duration-300 group-hover:bg-white group-hover:text-brand-green-dark group-hover:shadow-2xl">
              ${combo.price_usd.toFixed(2)}
            </span>
          </span>

          {/* Título */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-3">
            <h3 className="text-lg font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-xl">
              {combo.title}
            </h3>
            {combo.description && (
              <p className="mt-1 text-[13px] leading-snug text-white/85 line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                {combo.description}
              </p>
            )}
          </div>

          {!isAvailable && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
              <span className="rounded-full bg-slate-900/95 px-7 py-3 text-xs font-black uppercase tracking-[0.25em] text-white shadow-2xl ring-1 ring-white/10">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Botón */}
        <div className="relative z-20 -mt-2 border-t border-transparent bg-white px-3 pb-3 pt-3 transition-all duration-300 group-hover:border-brand-green/5">
          <button
            type="button"
            onClick={onOrder}
            disabled={!isAvailable}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#25D366]/25 transition-all duration-300 hover:bg-[#1fb855] hover:shadow-xl hover:shadow-[#25D366]/35 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-200 disabled:shadow-none"
            aria-label={`Pedir ${combo.title} por WhatsApp`}
          >
            <IconWhatsApp className="h-5 w-5" />
            Pedir por WhatsApp
          </button>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-[3px] origin-left scale-x-0 rounded-full bg-gradient-to-r from-brand-green via-[#00ff88] to-brand-green transition-transform duration-600 ease-out group-hover:scale-x-100"
          aria-hidden="true"
        />
      </article>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMBO CATALOG
   ═══════════════════════════════════════════════════════════════════════════ */

export function ComboCatalog() {
  const { combos, loading, error } = useCombos();
  const [orderingCombo, setOrderingCombo] = useState<Combo | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PMInfo[]>([]);
  const [rates, setRates] = useState<RateInfo[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  async function openOrder(combo: Combo) {
    setOrderingCombo(combo);
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

  /* LOADING */
  if (loading) {
    return (
      <section id="combos" aria-label="Catálogo de combos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl skeleton-shimmer" />
          <div className="mx-auto mt-4 h-8 w-64 rounded-lg skeleton-shimmer" />
          <div className="mx-auto mt-2 h-4 w-48 rounded-lg skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    );
  }

  /* ERROR */
  if (error) {
    return (
      <section id="combos" aria-label="Catálogo de combos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10 shadow-sm">
            <IconPackage className="h-7 w-7 text-brand-green" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Combos para Cuba</h2>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-red-50/50 p-8 shadow-lg shadow-red-100/50 sm:p-10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-100/60" aria-hidden="true" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-red-50/80" aria-hidden="true" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 shadow-sm ring-1 ring-red-200/50">
              <IconAlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="mt-5 text-base font-semibold text-slate-800">{error}</p>
            <p className="mt-1.5 text-sm text-slate-500">Intenta nuevamente en unos segundos</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2.5 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all duration-300 hover:bg-red-700 active:scale-[0.97]"
            >
              <IconRefresh className="h-4 w-4" />
              Reintentar
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* EMPTY */
  if (combos.length === 0) {
    return (
      <section id="combos" aria-label="Catálogo de combos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10 shadow-sm">
            <IconPackage className="h-7 w-7 text-brand-green" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Combos para Cuba</h2>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white py-16 shadow-md">
          <div className="absolute inset-0 geo-dots opacity-30" aria-hidden="true" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-green/5 ring-1 ring-brand-green/10">
              <IconBoxEmpty className="h-10 w-10 text-brand-green/25" />
            </div>
            <p className="mt-5 text-lg font-bold text-slate-700">No hay combos disponibles</p>
            <p className="mt-1.5 text-sm text-slate-400">Vuelve a consultar más tarde.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="combos" aria-label="Catálogo de combos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10 shadow-sm">
            <IconPackage className="h-7 w-7 text-brand-green" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Combos para Cuba</h2>
          <p className="mt-2 text-sm text-slate-500">Paquetes seleccionados para tu familia</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {combos.map((combo, index) => (
            <div
              key={combo.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
            >
              <ComboCard combo={combo} onOrder={() => openOrder(combo)} />
            </div>
          ))}
        </div>
      </section>

      {orderingCombo && (
        <ComboOrderModal
          combo={orderingCombo}
          onClose={() => setOrderingCombo(null)}
          paymentMethods={paymentMethods}
          rates={rates}
          loading={loadingData}
        />
      )}
    </>
  );
}
