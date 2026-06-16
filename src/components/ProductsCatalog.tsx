"use client";

import { useState } from "react";
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

/* ─── Card ─── */

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasImage = Boolean(product.image_url);

  return (
    <>
      {lightboxOpen && hasImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Ver imagen de ${product.title}`}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image_url!} alt={product.title} className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-green/10">
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-brand-green/10 to-emerald-50">
          {hasImage ? (
            <>
              <button type="button" className="absolute inset-0 z-10 cursor-zoom-in" onClick={() => setLightboxOpen(true)} aria-label={`Ver imagen de ${product.title}`} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image_url!} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <IconTag className="h-12 w-12 text-brand-green/25" />
            </div>
          )}
          <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-3 py-1 text-sm font-extrabold text-brand-green shadow-lg backdrop-blur-sm">
            ${product.price_usd.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-bold leading-tight text-slate-800">{product.title}</h3>
          {product.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{product.description}</p>}
          <button
            onClick={onAdd}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-green py-3 text-sm font-bold text-white shadow-md shadow-brand-green/25 transition-all hover:bg-emerald-700 active:scale-[0.97]"
            aria-label={`Agregar ${product.title} al carrito`}
          >
            <IconCartPlus className="h-4 w-4" />
            Agregar al carrito
          </button>
        </div>
      </article>
    </>
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
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 lg:gap-6">
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
