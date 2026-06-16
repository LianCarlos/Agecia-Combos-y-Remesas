'use client';

import { useState } from 'react';
import { CatalogManager, type CatalogConfig } from './CatalogManager';

const COMBOS_CONFIG: CatalogConfig = {
  singular: 'Combo',
  kind: 'combo',
  activeField: 'available',
  emoji: '📦',
};

const PRODUCTS_CONFIG: CatalogConfig = {
  singular: 'Producto',
  kind: 'product',
  activeField: 'active',
  emoji: '🏷️',
};

export default function CombosPage() {
  const [tab, setTab] = useState<'combos' | 'productos'>('combos');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Combos y Productos</h1>
        <p className="mt-1 text-sm text-slate-500">Gestiona el catálogo de combos y productos</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setTab('combos')}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
            tab === 'combos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          📦 Combos
        </button>
        <button
          onClick={() => setTab('productos')}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
            tab === 'productos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          🏷️ Productos
        </button>
      </div>

      {/* Mantener ambos montados sería más simple, pero re-montar al cambiar de tab
          garantiza datos frescos sin estado cruzado. */}
      {tab === 'combos' ? (
        <CatalogManager config={COMBOS_CONFIG} />
      ) : (
        <CatalogManager config={PRODUCTS_CONFIG} />
      )}
    </div>
  );
}
