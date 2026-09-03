"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/types";

/* ─── Icons ─── */

function IconTag({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
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

function IconRotate({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

/* ─── Card con giro 3D ───
   Al tocar la imagen, la tarjeta se acerca al cliente (perspectiva + rotateY)
   y muestra las características completas en el reverso. Reemplaza al modal
   anterior (que quedaba mal anclado dentro de <Reveal>). Accesible: cara oculta
   `inert`, cierra con Escape, respeta prefers-reduced-motion. */
function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const hasImage = Boolean(product.image_url);

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
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green py-3 text-sm font-bold text-white shadow-md shadow-brand-green/25 transition-all hover:bg-emerald-700 active:scale-[0.97]"
      aria-label={`Agregar ${product.title} al carrito`}
    >
      <IconCartPlus className="h-4 w-4" />
      Agregar al carrito
    </button>
  );

  return (
    <div className="flip-scene group relative h-[20rem] transition-transform duration-500 hover:-translate-y-1 sm:h-[21rem]">
      <div className={`flip-card ${flipped ? "is-flipped" : ""}`}>

        {/* ═══ CARA FRONTAL ═══ */}
        <div
          className="flip-face flip-face-front flex flex-col overflow-hidden rounded-2xl bg-white shadow-md"
          inert={flipped || undefined}
        >
          <button
            type="button"
            className="relative h-40 w-full shrink-0 overflow-hidden bg-gradient-to-br from-brand-green/10 to-emerald-50 cursor-pointer sm:h-44"
            onClick={() => setFlipped(true)}
            aria-label={`Ver características de ${product.title}`}
          >
            {hasImage ? (
              <Image src={product.image_url!} alt={product.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <IconTag className="h-12 w-12 text-brand-green/25" />
              </div>
            )}
            <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-3 py-1 text-sm font-extrabold text-brand-green shadow-lg backdrop-blur-sm">
              ${product.price_usd.toFixed(2)}
            </span>
            <span className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
              <IconRotate className="h-3.5 w-3.5 rotate-180" />
              Toca para ver más
            </span>
          </button>

          <div className="flex min-h-0 flex-1 flex-col p-4">
            <h3 className="font-bold leading-tight text-slate-800">{product.title}</h3>
            {product.description && (
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{product.description}</p>
            )}
            <div className="mt-auto pt-3">{addBtn}</div>
          </div>
        </div>

        {/* ═══ CARA TRASERA (características) ═══ */}
        <div
          className="flip-face flip-face-back flex flex-col overflow-hidden rounded-2xl border border-brand-green/10 bg-white shadow-md"
          inert={!flipped || undefined}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-extrabold leading-tight text-slate-900">{product.title}</h3>
              <span className="text-sm font-extrabold text-brand-green">${product.price_usd.toFixed(2)}</span>
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
            {product.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{product.description}</p>
            ) : (
              <p className="text-sm italic text-slate-400">Sin descripción disponible.</p>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-50 px-3 pb-3 pt-3">{addBtn}</div>
        </div>

      </div>
    </div>
  );
}

/* ─── Catalog ─── */

function SectionHeader() {
  return (
    <div className="mb-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10 shadow-sm">
        <IconTag className="h-7 w-7 text-brand-green" />
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Productos</h2>
      <p className="mt-2 text-sm text-slate-500">Arma tu pedido y envíalo por WhatsApp</p>
    </div>
  );
}

export function ProductsCatalog({ initialData = [] }: { initialData?: Product[] }) {
  const { products, loading, error } = useProducts(initialData);
  const { addItem } = useCart();

  // Sin productos / error → no renderizar la sección (no estorba el layout)
  if (loading) {
    return (
      <section id="productos" aria-label="Catálogo de productos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeader />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      </section>
    );
  }

  if (error || products.length === 0) return null;

  return (
    <section id="productos" aria-label="Catálogo de productos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {products.map((product, index) => (
          <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}>
            <ProductCard
              product={product}
              onAdd={() => addItem({ id: product.id, kind: "product", title: product.title, price_usd: product.price_usd })}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
