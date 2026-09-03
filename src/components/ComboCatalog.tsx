"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCombos } from "@/hooks/useCombos";
import { useCart } from "@/components/cart/CartProvider";
import type { Combo } from "@/types";

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

function IconCartPlus({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
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
   SKELETON CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function SkeletonCard() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-green/5 bg-white shadow-md">
      <div className="relative h-56 w-full skeleton-shimmer sm:h-64" />
      <div className="border-t border-slate-50 px-4 py-4">
        <div className="h-11 w-full rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMBO CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function IconRotate({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

/**
 * Tarjeta de combo con giro 3D: al tocar la imagen, la tarjeta "sale hacia el
 * cliente" (perspectiva + rotateY) y muestra la descripción completa en el
 * reverso. Accesible: la cara oculta queda `inert` (sin foco ni clics), se
 * cierra con Escape y respeta `prefers-reduced-motion` (cross-fade sin giro).
 */
function ComboCard({ combo, onAdd }: { combo: Combo; onAdd: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const hasImage = Boolean(combo.image_url);
  const isAvailable = combo.available;

  // Cerrar el reverso con Escape mientras esté volteada.
  useEffect(() => {
    if (!flipped) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFlipped(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped]);

  const addBtn = (
    <button
      type="button"
      onClick={onAdd}
      disabled={!isAvailable}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-green/25 transition-all duration-300 hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-200 disabled:shadow-none"
      aria-label={`Agregar ${combo.title} al carrito`}
    >
      <IconCartPlus className="h-5 w-5" />
      Agregar al carrito
    </button>
  );

  return (
    <div className="flip-scene group relative h-[21rem] transition-transform duration-500 hover:-translate-y-1.5 sm:h-[23rem]">
      <div className={`flip-card ${flipped ? "is-flipped" : ""}`}>

        {/* ═══ CARA FRONTAL ═══ */}
        <div
          className="flip-face flip-face-front flex flex-col overflow-hidden rounded-2xl border border-brand-green/5 bg-white shadow-md"
          inert={flipped || undefined}
        >
          <button
            type="button"
            className="relative min-h-0 flex-1 w-full overflow-hidden text-left cursor-pointer"
            onClick={() => setFlipped(true)}
            aria-label={`Ver descripción de ${combo.title}`}
          >
            {hasImage ? (
              <>
                <Image
                  src={combo.image_url!}
                  alt={combo.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, transparent 20%, rgba(0,61,38,0.45) 55%, rgba(0,61,38,0.82) 85%, rgba(0,45,28,0.95) 100%)" }}
                />
              </>
            ) : (
              <div className="geo-placeholder relative flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-green/10 to-emerald-50">
                <IconPackage className="relative z-10 h-16 w-16 text-brand-green/15" />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, transparent 20%, rgba(0,61,38,0.5) 55%, rgba(0,61,38,0.85) 85%, rgba(0,45,28,0.95) 100%)" }}
                />
              </div>
            )}

            <span className="absolute left-3 top-3 z-20">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-lg backdrop-blur-md ${
                isAvailable ? "bg-brand-green/90 text-white ring-1 ring-white/20" : "bg-red-600/90 text-white ring-1 ring-white/10"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-green-300 animate-pulse" : "bg-red-200"}`} aria-hidden="true" />
                {isAvailable ? "Disponible" : "Agotado"}
              </span>
            </span>

            <span className="absolute right-3 top-3 z-20">
              <span className="inline-flex items-center rounded-full bg-white/90 px-3.5 py-1.5 text-sm font-extrabold text-brand-green shadow-xl backdrop-blur-md ring-1 ring-black/5">
                ${combo.price_usd.toFixed(2)}
              </span>
            </span>

            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-3">
              <h3 className="text-lg font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-xl">
                {combo.title}
              </h3>
              {combo.description && (
                <p className="mt-1 text-[13px] leading-snug text-white/85 line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                  {combo.description}
                </p>
              )}
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm">
                <IconRotate className="h-3.5 w-3.5 rotate-180" />
                Toca para ver el contenido
              </span>
            </div>

            {!isAvailable && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
                <span className="rounded-full bg-slate-900/95 px-7 py-3 text-xs font-black uppercase tracking-[0.25em] text-white shadow-2xl ring-1 ring-white/10">
                  Agotado
                </span>
              </div>
            )}
          </button>

          <div className="shrink-0 border-t border-slate-50 bg-white px-3 pb-3 pt-3">
            {addBtn}
          </div>
        </div>

        {/* ═══ CARA TRASERA (descripción) ═══ */}
        <div
          className="flip-face flip-face-back flex flex-col overflow-hidden rounded-2xl border border-brand-green/10 bg-white shadow-md"
          inert={!flipped || undefined}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-extrabold leading-tight text-slate-900">{combo.title}</h3>
              <span className="text-sm font-extrabold text-brand-green">${combo.price_usd.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-200"
              aria-label="Volver a la imagen"
            >
              <IconRotate className="h-3.5 w-3.5" />
              Volver
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {combo.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{combo.description}</p>
            ) : (
              <p className="text-sm italic text-slate-400">Sin descripción disponible.</p>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-50 px-3 pb-3 pt-3">
            {!isAvailable && (
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-red-500">Actualmente agotado</p>
            )}
            {addBtn}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMBO CATALOG
   ═══════════════════════════════════════════════════════════════════════════ */

function SectionHeader() {
  return (
    <div className="mb-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10 shadow-sm">
        <IconPackage className="h-7 w-7 text-brand-green" />
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Combos y Productos para Cuba</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Elige entre nuestros combos prearmados o selecciona productos sueltos — arma tu propio paquete a medida.
      </p>
    </div>
  );
}

export function ComboCatalog({ initialData = [] }: { initialData?: Combo[] }) {
  const { combos, loading, error } = useCombos(initialData);
  const { addItem } = useCart();

  if (loading) {
    return (
      <section id="combos" aria-label="Catálogo de combos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeader />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="combos" aria-label="Catálogo de combos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeader />
        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-red-50/50 p-8 text-center shadow-lg">
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 ring-1 ring-red-200/50">
              <IconAlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="mt-5 text-base font-semibold text-slate-800">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2.5 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-700 active:scale-[0.97]"
            >
              <IconRefresh className="h-4 w-4" />
              Reintentar
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (combos.length === 0) {
    return (
      <section id="combos" aria-label="Catálogo de combos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeader />
        <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white py-16 text-center shadow-md">
          <div className="flex flex-col items-center">
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
    <section id="combos" aria-label="Catálogo de combos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {combos.map((combo, index) => (
          <div key={combo.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}>
            <ComboCard
              combo={combo}
              onAdd={() => addItem({ id: combo.id, kind: "combo", title: combo.title, price_usd: combo.price_usd })}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
