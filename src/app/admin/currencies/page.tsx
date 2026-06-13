'use client';

import { useState, useEffect, useCallback } from 'react';

interface Currency { id: string; code: string; name: string; symbol: string; active: boolean; created_at: string; }

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', symbol: '' });
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchCurrencies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/currencies');
      if (!res.ok) throw new Error('Error al cargar monedas');
      setCurrencies(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCurrencies(); }, [fetchCurrencies]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(prev =>
      prev.size === currencies.length ? new Set() : new Set(currencies.map(c => c.id))
    );
  }

  async function handleBulkDelete() {
    if (!confirm(`¿Eliminar ${selectedIds.size} moneda(s) seleccionada(s)? Esto desvinculará los métodos de pago asociados.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`/api/admin/currencies/${id}`, { method: 'DELETE' })
      ));
      setSelectedIds(new Set());
      fetchCurrencies();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || (!editingId && !form.code.trim())) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/currencies/${editingId}` : '/api/admin/currencies';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase().trim(),
          name: form.name.trim(),
          symbol: form.symbol.trim() || '$',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setShowForm(false);
      setEditingId(null);
      setForm({ code: '', name: '', symbol: '' });
      fetchCurrencies();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Currency) {
    try {
      const res = await fetch(`/api/admin/currencies/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !c.active }),
      });
      if (!res.ok) throw new Error('Error');
      fetchCurrencies();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  async function handleDelete(c: Currency) {
    if (!confirm(`¿Eliminar ${c.code} — ${c.name}? Esto desvinculará los métodos de pago asociados.`)) return;
    try {
      const res = await fetch(`/api/admin/currencies/${c.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchCurrencies();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  function openEdit(c: Currency) {
    setEditingId(c.id);
    setForm({ code: c.code, name: c.name, symbol: c.symbol });
    setShowForm(true);
  }

  function openNew() {
    setEditingId(null);
    setForm({ code: '', name: '', symbol: '$' });
    setShowForm(true);
  }

  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-slate-200" />
      {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-red-700 font-medium">⚠️ {error}</p>
      <button onClick={fetchCurrencies} className="mt-3 text-sm text-brand-green font-semibold hover:underline">Reintentar</button>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Países / Monedas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona los países de origen. Cada moneda representa un país desde el que aceptas remesas.
          </p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
          <span className="text-lg leading-none">+</span> Agregar País
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <strong>Cómo funciona:</strong> Agrega los países desde los que recibes remesas. En Métodos de Pago, asocia cada método a su moneda. El cliente verá solo los métodos disponibles para su país.
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              {editingId ? 'Editar País / Moneda' : 'Nuevo País / Moneda'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Código ISO <span className="text-slate-400 font-normal">(ej: USD, EUR, MXN)</span>
                </label>
                <input
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  disabled={!!editingId}
                  maxLength={5}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="USD"
                  required={!editingId}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  País / Nombre <span className="text-slate-400 font-normal">(ej: Estados Unidos — Dólar)</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
                  placeholder="Dólar estadounidense"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Símbolo <span className="text-slate-400 font-normal">(ej: $, €, R$)</span>
                </label>
                <input
                  value={form.symbol}
                  onChange={e => setForm({ ...form, symbol: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
                  placeholder="$"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {currencies.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">🌍</span>
          <p className="mt-3 text-slate-500 font-medium">No hay países / monedas configurados</p>
          <p className="text-sm text-slate-400">Agrega el primer país de origen</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={currencies.length > 0 && selectedIds.size === currencies.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green cursor-pointer"
                  />
                </th>
                <th className={thClass}>Código</th>
                <th className={thClass}>País / Nombre</th>
                <th className={thClass}>Símbolo</th>
                <th className={thClass}>Activo</th>
                <th className={thClass + ' text-right'}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currencies.map(c => (
                <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.has(c.id) ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green cursor-pointer"
                    />
                  </td>
                  <td className={tdClass}>
                    <span className="inline-flex items-center rounded-lg bg-brand-green/10 px-2.5 py-1 text-xs font-bold text-brand-green-dark tracking-widest">
                      {c.code}
                    </span>
                  </td>
                  <td className={tdClass + ' font-medium'}>{c.name}</td>
                  <td className={tdClass + ' font-mono text-slate-500'}>{c.symbol}</td>
                  <td className={tdClass}>
                    <button
                      onClick={() => toggleActive(c)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${c.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${c.active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className={tdClass + ' text-right'}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Editar</button>
                      <button onClick={() => handleDelete(c)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 shadow-2xl ring-1 ring-white/10">
          <span className="text-sm font-medium text-white">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition"
          >
            {bulkDeleting ? 'Eliminando...' : 'Eliminar seleccionados'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
