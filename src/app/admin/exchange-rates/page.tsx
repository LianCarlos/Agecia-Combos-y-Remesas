'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRateMatrixServerAction } from '../actions';
import {
  getAdminInitDataAction,
  updateExchangeRateInlineAction,
  deleteExchangeRateAction,
} from '@/lib/actions/admin';

interface PaymentMethod { id: string; name: string; active: boolean; }
interface DeliveryMethod { id: string; name: string; active: boolean; }
interface ExchangeRate {
  payment_method_id: string;
  delivery_method_id: string;
  rate: number;
  updated_at: string;
  payment_methods?: { id: string; name: string; active: boolean } | null;
  delivery_methods?: { id: string; name: string; active: boolean } | null;
}

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null); // "pmId:dmId"
  const [form, setForm] = useState({ payment_method_id: '', delivery_method_id: '', rate: '' });
  const [saving, setSaving] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [r, init] = await Promise.all([
        getRateMatrixServerAction(),
        getAdminInitDataAction(),
      ]);
      setRates((r ?? []) as unknown as ExchangeRate[]);
      setPaymentMethods(init.paymentMethods ?? []);
      setDeliveryMethods(init.deliveryMethods ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function getPMName(id: string) {
    return paymentMethods.find(p => p.id === id)?.name ?? id.slice(0, 8);
  }
  function getDMName(id: string) {
    return deliveryMethods.find(d => d.id === id)?.name ?? id.slice(0, 8);
  }

  function rateKey(r: ExchangeRate) {
    return `${r.payment_method_id}:${r.delivery_method_id}`;
  }

  function toggleSelect(key: string) {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedKeys(prev =>
      prev.size === rates.length ? new Set() : new Set(rates.map(rateKey))
    );
  }

  async function handleBulkDelete() {
    if (!confirm(`¿Eliminar ${selectedKeys.size} tasa(s) de cambio seleccionada(s)?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedKeys).map(key => {
        const [pmId, dmId] = key.split(':');
        return deleteExchangeRateAction(pmId, dmId);
      }));
      setSelectedKeys(new Set());
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const rateNum = parseFloat(form.rate);
    if (!form.payment_method_id || !form.delivery_method_id || isNaN(rateNum) || rateNum <= 0) return;

    setSaving(true);
    try {
      if (editingKey) {
        const [pmId, dmId] = editingKey.split(':');
        await updateExchangeRateInlineAction(pmId, dmId, rateNum);
      } else {
        await updateExchangeRateInlineAction(form.payment_method_id, form.delivery_method_id, rateNum);
      }
      setShowForm(false);
      setEditingKey(null);
      setForm({ payment_method_id: '', delivery_method_id: '', rate: '' });
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(r: ExchangeRate) {
    if (!confirm(`¿Eliminar tasa ${getPMName(r.payment_method_id)} → ${getDMName(r.delivery_method_id)}?`)) return;
    try {
      await deleteExchangeRateAction(r.payment_method_id, r.delivery_method_id);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  function openEdit(r: ExchangeRate) {
    setEditingKey(rateKey(r));
    setForm({
      payment_method_id: r.payment_method_id,
      delivery_method_id: r.delivery_method_id,
      rate: r.rate.toString(),
    });
    setShowForm(true);
  }

  function openNew() {
    setEditingKey(null);
    setForm({
      payment_method_id: paymentMethods[0]?.id ?? '',
      delivery_method_id: deliveryMethods[0]?.id ?? '',
      rate: '',
    });
    setShowForm(true);
  }

  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-slate-200" />
      {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-red-700 font-medium">⚠️ {error}</p>
      <button onClick={fetchData} className="mt-3 text-sm text-brand-green font-semibold hover:underline">Reintentar</button>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tasas de Cambio</h1>
          <p className="mt-1 text-sm text-slate-500">
            Matriz de tasas: Método de Pago × Método de Entrega → Tasa diaria
          </p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
          <span className="text-lg leading-none">+</span> Nueva Tasa
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              {editingKey ? 'Actualizar Tasa' : 'Nueva Tasa de Cambio'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago</label>
                <select
                  value={form.payment_method_id}
                  onChange={e => setForm({ ...form, payment_method_id: e.target.value })}
                  disabled={!!editingKey}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition disabled:bg-slate-50 disabled:text-slate-400"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {paymentMethods.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Método de Entrega</label>
                <select
                  value={form.delivery_method_id}
                  onChange={e => setForm({ ...form, delivery_method_id: e.target.value })}
                  disabled={!!editingKey}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition disabled:bg-slate-50 disabled:text-slate-400"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {deliveryMethods.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tasa (CUP por unidad de moneda de origen)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={form.rate}
                  onChange={e => setForm({ ...form, rate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
                  placeholder="Ej: 345.0000"
                  required
                />
                <p className="mt-1 text-xs text-slate-400">
                  monto × tasa = lo que recibirá en Cuba
                </p>
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

      {rates.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">📊</span>
          <p className="mt-3 text-slate-500 font-medium">No hay tasas configuradas</p>
          <p className="text-sm text-slate-400">Agrega la primera combinación de tasa</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm -mx-4 sm:mx-0">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={rates.length > 0 && selectedKeys.size === rates.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green cursor-pointer"
                  />
                </th>
                <th className={thClass}>Método de Pago</th>
                <th className={thClass}>Método de Entrega</th>
                <th className={thClass}>Tasa</th>
                <th className={thClass}>Actualizado</th>
                <th className={thClass + ' text-right'}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rates.map(r => (
                <tr key={rateKey(r)} className={`hover:bg-slate-50/50 transition-colors ${selectedKeys.has(rateKey(r)) ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(rateKey(r))}
                      onChange={() => toggleSelect(rateKey(r))}
                      className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green cursor-pointer"
                    />
                  </td>
                  <td className={tdClass + ' font-medium'}>
                    {r.payment_methods?.name ?? getPMName(r.payment_method_id)}
                  </td>
                  <td className={tdClass}>
                    {r.delivery_methods?.name ?? getDMName(r.delivery_method_id)}
                  </td>
                  <td className={tdClass + ' font-mono font-semibold text-brand-green text-base'}>
                    {Number(r.rate).toFixed(4)}
                  </td>
                  <td className={tdClass + ' text-slate-400'}>
                    {new Date(r.updated_at).toLocaleDateString('es-CU', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className={tdClass + ' text-right'}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(r)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Editar Tasa</button>
                      <button onClick={() => handleDelete(r)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedKeys.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 shadow-2xl ring-1 ring-white/10">
          <span className="text-sm font-medium text-white">
            {selectedKeys.size} seleccionada{selectedKeys.size !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition"
          >
            {bulkDeleting ? 'Eliminando...' : 'Eliminar seleccionadas'}
          </button>
          <button
            onClick={() => setSelectedKeys(new Set())}
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
