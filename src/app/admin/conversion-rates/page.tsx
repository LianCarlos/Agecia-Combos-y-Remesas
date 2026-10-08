'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getConversionRatesServerAction,
  upsertConversionRateServerAction,
  deleteConversionRateServerAction,
} from '@/lib/actions/operations';
import type { ConversionRate } from '@/types';

export default function ConversionRatesPage() {
  const [rates, setRates] = useState<ConversionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formFrom, setFormFrom] = useState('');
  const [formTo, setFormTo] = useState('');
  const [formRate, setFormRate] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRates(await getConversionRatesServerAction());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  function openNew() {
    setEditingId(null);
    setFormFrom('');
    setFormTo('USDT');
    setFormRate('');
    setShowForm(true);
  }

  function openEdit(r: ConversionRate) {
    setEditingId(r.id);
    setFormFrom(r.from_code);
    setFormTo(r.to_code);
    setFormRate(String(r.rate));
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const rate = Number(formRate);
    if (!formFrom.trim() || !formTo.trim() || !Number.isFinite(rate) || rate <= 0) return;
    setSaving(true);
    try {
      await upsertConversionRateServerAction(formFrom.trim(), formTo.trim(), rate);
      setShowForm(false);
      fetchRates();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta tasa?')) return;
    try {
      await deleteConversionRateServerAction(id);
      fetchRates();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';

  if (loading) {
    return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 rounded bg-slate-200" />{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">⚠️ {error}</p>
        <button onClick={fetchRates} className="mt-3 text-sm font-semibold text-brand-green hover:underline">Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tasas de Conversión (USDT)</h1>
          <p className="mt-1 text-sm text-slate-500">Tasas contables: cuántas unidades de la moneda destino por 1 de la origen</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
          <span className="text-lg leading-none">+</span> Agregar Tasa
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? 'Editar Tasa' : 'Nueva Tasa'}</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">De (código)</label>
                <input value={formFrom} onChange={e => setFormFrom(e.target.value.toUpperCase())} placeholder="MXN" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" autoFocus required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">A (código)</label>
                <input value={formTo} onChange={e => setFormTo(e.target.value.toUpperCase())} placeholder="USDT" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tasa</label>
                <input type="number" step="0.000001" min={0} value={formRate} onChange={e => setFormRate(e.target.value)} placeholder="0.05" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" required />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}

      {rates.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">💱</span>
          <p className="mt-3 font-medium text-slate-500">No hay tasas de conversión</p>
          <p className="text-sm text-slate-400">Agrega la primera, p. ej. MXN → USDT</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className={thClass}>De</th>
                <th className={thClass}>A</th>
                <th className={thClass}>Tasa</th>
                <th className={thClass}>Actualizado</th>
                <th className={thClass + ' text-right'}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rates.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className={tdClass + ' font-mono font-semibold'}>{r.from_code}</td>
                  <td className={tdClass + ' font-mono font-semibold'}>{r.to_code}</td>
                  <td className={tdClass + ' font-mono'}>{r.rate}</td>
                  <td className={tdClass + ' text-slate-400'}>{new Date(r.updated_at).toLocaleString('es-CU')}</td>
                  <td className={tdClass + ' text-right'}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(r)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">Editar</button>
                      <button onClick={() => handleDelete(r.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
