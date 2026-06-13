'use client';

import { useState, useEffect, useCallback } from 'react';

interface Currency { id: string; code: string; name: string; }
interface PaymentMethod { id: string; name: string; active: boolean; currency_id: string | null; }

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCurrencyId, setFormCurrencyId] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pmRes, curRes] = await Promise.all([
        fetch('/api/admin/payment-methods'),
        fetch('/api/admin/currencies'),
      ]);
      if (!pmRes.ok) throw new Error('Error al cargar métodos de pago');
      const pmData = await pmRes.json();
      setMethods(pmData);
      if (curRes.ok) {
        const curData = await curRes.json();
        setCurrencies(curData);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function getCurrencyLabel(id: string | null) {
    if (!id) return '—';
    const c = currencies.find(c => c.id === id);
    return c ? `${c.code} — ${c.name}` : '—';
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(prev =>
      prev.size === methods.length ? new Set() : new Set(methods.map(m => m.id))
    );
  }

  async function handleBulkDelete() {
    if (!confirm(`¿Eliminar ${selectedIds.size} método(s) de pago seleccionado(s)?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`/api/admin/payment-methods/${id}`, { method: 'DELETE' })
      ));
      setSelectedIds(new Set());
      fetchAll();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/payment-methods/${editingId}` : '/api/admin/payment-methods';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          currency_id: formCurrencyId || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Error ${res.status} al guardar`);
      }
      setShowForm(false);
      setEditingId(null);
      setFormName('');
      setFormCurrencyId('');
      fetchAll();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m: PaymentMethod) {
    try {
      const res = await fetch(`/api/admin/payment-methods/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !m.active }),
      });
      if (!res.ok) throw new Error('Error');
      fetchAll();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este método de pago?')) return;
    try {
      const res = await fetch(`/api/admin/payment-methods/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchAll();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  function openEdit(m: PaymentMethod) {
    setEditingId(m.id);
    setFormName(m.name);
    setFormCurrencyId(m.currency_id ?? '');
    setShowForm(true);
  }

  function openNew() {
    setEditingId(null);
    setFormName('');
    setFormCurrencyId('');
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
      <button onClick={fetchAll} className="mt-3 text-sm text-brand-green font-semibold hover:underline">Reintentar</button>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Métodos de Pago</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona los métodos de pago y su moneda de origen</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
          <span className="text-lg leading-none">+</span> Agregar Método
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              {editingId ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
                  placeholder="Ej: Zelle, Pix, USDT..."
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Moneda / País de origen
                </label>
                <select
                  value={formCurrencyId}
                  onChange={e => setFormCurrencyId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
                >
                  <option value="">Todas las monedas</option>
                  {currencies.map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  Si seleccionas una moneda, este método solo aparecerá para clientes de ese país.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
              <button type="submit" disabled={saving || !formName.trim()} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {methods.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">💳</span>
          <p className="mt-3 text-slate-500 font-medium">No hay métodos de pago</p>
          <p className="text-sm text-slate-400">Agrega tu primer método para empezar</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={methods.length > 0 && selectedIds.size === methods.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green cursor-pointer"
                  />
                </th>
                <th className={thClass}>Nombre</th>
                <th className={thClass}>Moneda</th>
                <th className={thClass}>Estado</th>
                <th className={thClass + ' text-right'}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {methods.map(m => (
                <tr key={m.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.has(m.id) ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green cursor-pointer"
                    />
                  </td>
                  <td className={tdClass + ' font-medium'}>{m.name}</td>
                  <td className={tdClass}>
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {getCurrencyLabel(m.currency_id)}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <button
                      onClick={() => toggleActive(m)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${m.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${m.active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className={tdClass + ' text-right'}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(m)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Editar</button>
                      <button onClick={() => handleDelete(m.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition">Eliminar</button>
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
