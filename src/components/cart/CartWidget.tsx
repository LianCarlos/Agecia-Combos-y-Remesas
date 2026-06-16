"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { convertToPaymentCurrency } from "@/lib/utils/currency-convert";
import { generateWhatsAppOrderUrl } from "@/lib/utils/whatsapp";
import type { WhatsAppOrderData } from "@/types";

/* ─── Icons ─── */

function CartIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ─── Floating button ─── */

export function CartWidget() {
  const cart = useCart();
  const { items, count, totalUSD, isOpen, open, close, removeItem, setQuantity, clear, paymentMethods, rates, whatsappPhone } = cart;

  const [view, setView] = useState<"cart" | "checkout">("cart");
  const [name, setName] = useState("");
  const [ci, setCI] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pmId, setPMId] = useState("");

  const pm = paymentMethods.find((p) => p.id === pmId);
  const converted = pmId ? convertToPaymentCurrency(totalUSD, pmId, rates) : null;
  const canSend = name.trim().length > 0 && phone.trim().length >= 7 && pmId !== "";

  function handleClose() {
    close();
    setTimeout(() => setView("cart"), 200);
  }

  function sendWA() {
    const payAmountLabel = converted
      ? `${converted.symbol}${converted.amount.toFixed(2)} ${converted.code}`
      : `$${totalUSD.toFixed(2)} USD`;

    const orderData: WhatsAppOrderData = {
      beneficiary: {
        fullName: name.trim(),
        idCard: ci.trim(),
        phone: `+53${phone.trim()}`,
        address: address.trim(),
      },
      cart: {
        items,
        total: totalUSD,
        paymentMethod: pm?.name,
        payAmountLabel,
      },
      orderDate: new Date().toISOString(),
    };

    window.open(generateWhatsAppOrderUrl(orderData, whatsappPhone), "_blank", "noopener,noreferrer");
    clear();
    handleClose();
    setName(""); setCI(""); setPhone(""); setAddress(""); setPMId("");
  }

  return (
    <>
      {/* Floating button */}
      {count > 0 && (
        <button
          onClick={open}
          className="fixed bottom-5 right-5 z-[120] flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-white shadow-xl shadow-brand-green/40 transition-all hover:scale-105 hover:bg-emerald-700 active:scale-95"
          aria-label={`Abrir carrito (${count} artículos)`}
        >
          <CartIcon />
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-red px-1.5 text-xs font-bold text-white ring-2 ring-white">
            {count}
          </span>
        </button>
      )}

      {/* Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end" role="dialog" aria-modal="true" aria-label="Carrito">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <CartIcon className="h-5 w-5 text-brand-green" />
                {view === "cart" ? "Tu carrito" : "Finalizar pedido"}
              </h3>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200"
                aria-label="Cerrar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                  <CartIcon className="h-12 w-12 text-slate-200" />
                  <p className="mt-3 text-sm font-medium">Tu carrito está vacío</p>
                  <p className="text-xs">Agrega combos o productos para empezar</p>
                </div>
              ) : view === "cart" ? (
                <ul className="space-y-3">
                  {items.map((it) => (
                    <li key={`${it.kind}-${it.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-700">{it.title}</p>
                        <p className="text-xs text-slate-400">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase">
                            {it.kind === "combo" ? "Combo" : "Producto"}
                          </span>{" "}
                          ${it.price_usd.toFixed(2)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setQuantity(it.id, it.kind, it.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                          aria-label="Quitar uno"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-bold tabular-nums">{it.quantity}</span>
                        <button
                          onClick={() => setQuantity(it.id, it.kind, it.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                          aria-label="Agregar uno"
                        >
                          +
                        </button>
                      </div>
                      <div className="w-16 text-right">
                        <p className="text-sm font-bold text-brand-green">${(it.price_usd * it.quantity).toFixed(2)}</p>
                        <button
                          onClick={() => removeItem(it.id, it.kind)}
                          className="text-[11px] text-slate-400 hover:text-brand-red"
                        >
                          Quitar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                /* CHECKOUT */
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">¿Quién recibe el pedido?</p>
                    <div className="space-y-3">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo *"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20" />
                      <input value={ci} onChange={(e) => setCI(e.target.value)} placeholder="Carnet de identidad (opcional)"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20" />
                      <div className="flex items-center gap-2">
                        <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 whitespace-nowrap">🇨🇺 +53</span>
                        <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="5XXXXXXX *" maxLength={8}
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20" />
                      </div>
                      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección (opcional)"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20" />
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">¿Cómo vas a pagar?</p>
                    {paymentMethods.length === 0 ? (
                      <p className="py-2 text-center text-sm text-slate-400">No hay métodos disponibles</p>
                    ) : (
                      <div className="space-y-2">
                        {paymentMethods.map((p) => {
                          const sel = pmId === p.id;
                          const conv = sel ? convertToPaymentCurrency(totalUSD, p.id, rates) : null;
                          return (
                            <button key={p.id} onClick={() => setPMId(p.id)}
                              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all active:scale-[0.98] ${
                                sel ? "border-brand-green bg-brand-green/5 shadow-sm" : "border-slate-100 hover:border-brand-green/20"
                              }`}>
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-semibold text-slate-700">{p.name}</span>
                                {sel && (
                                  <span className="text-xs font-mono font-bold text-brand-green">
                                    Pagarás: {conv ? `${conv.symbol}${conv.amount.toFixed(2)} ${conv.code}` : `$${totalUSD.toFixed(2)} USD`}
                                  </span>
                                )}
                              </span>
                              {sel && <span className="text-lg text-brand-green">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total ({count} art.)</span>
                  <span className="text-xl font-extrabold text-slate-800">${totalUSD.toFixed(2)} USD</span>
                </div>
                {view === "cart" ? (
                  <button
                    onClick={() => setView("checkout")}
                    className="w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    Continuar
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={sendWA}
                      disabled={!canSend}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white shadow-md shadow-[#25D366]/25 transition-all hover:bg-[#1fb855] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
                    >
                      <WhatsAppIcon className="h-5 w-5" />
                      Pedir por WhatsApp
                    </button>
                    <button onClick={() => setView("cart")} className="w-full py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600">
                      ← Volver al carrito
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
