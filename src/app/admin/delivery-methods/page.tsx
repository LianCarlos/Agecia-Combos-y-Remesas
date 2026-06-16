'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDeliveryMethodsServerAction,
  deleteDeliveryMethodServerAction,
} from '../actions';
import {
  createDeliveryMethodWithTypeAction,
  updateDeliveryMethodFullAction,
  toggleDeliveryMethodAction,
} from '@/lib/actions/admin';
import type { DeliveryMethod } from '@/types';

export default function DeliveryMethodsPage() {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRequiresBankData, setFormRequiresBankData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMethods(await getDeliveryMethodsServerAction());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

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
    if (!confirm(`¿Eliminar ${selectedIds.size} método(s) de entrega seleccionado(s)?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteDeliveryMethodServerAction(id)));
      setSelectedIds(new Set());
      fetchMethods();
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
      const name = formName.trim();
      const type: 'cash' | 'transfer' = formRequiresBankData ? 'transfer' : 'cash';
      if (editingId) {
        await updateDeliveryMethodFullAction(editingId, { name, type });
      } else {
        await createDeliveryMethodWithTypeAction(name, type);
      }
      setShowForm(false);
      setEditingId(null);
      setFormName('');
      setFormRequiresBankData(false);
      fetchMethods();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m: DeliveryMethod) {
    try {
      await toggleDeliveryMethodAction(m.id);
      fetchMethods();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este método de entrega?')) return;
    try {
      await deleteDeliveryMethodServerAction(id);
      fetchMethods();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  function openEdit(m: DeliveryMethod) {
    setEditingId(m.id);
    setFormName(m.name);
    setFormRequiresBankData(m.type === 'transfer' || m.type === 'card');
    setShowForm(true);
  }

  function openNew() {
    setEditingId(null);
    setFormName('');
    setFormRequiresBankData(false);
    setShowForm(true);
  }

  const requiresBankData = (m: DeliveryMethod) => m.type === 'transfer' || m.type === 'card';

  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-200" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700 font-medium">⚠️ {error}</p>
        <button onClick={fetchMethods} className="mt-3 text-sm text-brand-green font-semibold hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Métodos de Entrega</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona las vías de entrega en Cuba</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
        >
          <span className="text-lg leading-none">+</span> Agregar Método
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              {editingId ? 'Editar Método' : 'Nuevo Método de Entrega'}
            </h2>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
                  placeholder="Ej: CUP Efectivo, MLC Transferencia..."
                  autoFocus
                  required
                />
              </div>

              {/* Tipo: requiere datos bancarios */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de entrega
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormRequiresBankData(false)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                      !formRequiresBankData
                        ? 'border-brand-green bg-emerald-50 text-brand-green'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">💵</span>
                    <span>Efectivo</span>
                    <span className="text-[11px] font-normal text-slate-400 text-center leading-tight">
                      No pide datos bancarios
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRequiresBankData(true)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                      formRequiresBankData
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">💳</span>
                    <span>Transferencia</span>
                    <span className="text-[11px] font-normal text-slate-400 text-center leading-tight">
                      Pide tarjeta y teléfono
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !formName.trim()}
                className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {methods.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">🚚</span>
          <p className="mt-3 text-slate-500 font-medium">No hay métodos de entrega</p>
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
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Estado</th>
                <th className={thClass + ' text-right'}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {methods.map((m) => (
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
                    {requiresBankData(m) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        💳 Transferencia
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        💵 Efectivo
                      </span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <button
                      onClick={() => toggleActive(m)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        m.active ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          m.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className={tdClass + ' text-right'}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(m)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        Eliminar
                      </button>
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
