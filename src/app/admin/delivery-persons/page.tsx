'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDeliveryPersonsServerAction,
  createDeliveryPersonServerAction,
  updateDeliveryPersonServerAction,
  toggleDeliveryPersonServerAction,
  deleteDeliveryPersonServerAction,
} from '@/lib/actions/operations';
import type { DeliveryPerson } from '@/types';

export default function DeliveryPersonsPage() {
  const [people, setPeople] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPeople(await getDeliveryPersonsServerAction());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPeople(); }, [fetchPeople]);

  function openNew() {
    setEditingId(null);
    setFormName('');
    setFormPhone('');
    setShowForm(true);
  }

  function openEdit(p: DeliveryPerson) {
    setEditingId(p.id);
    setFormName(p.full_name);
    setFormPhone(p.phone ?? '');
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDeliveryPersonServerAction(editingId, { full_name: formName.trim(), phone: formPhone.trim() || null });
      } else {
        await createDeliveryPersonServerAction({ full_name: formName.trim(), phone: formPhone.trim() || null });
      }
      setShowForm(false);
      fetchPeople();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: DeliveryPerson) {
    try { await toggleDeliveryPersonServerAction(p.id); fetchPeople(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este repartidor?')) return;
    try { await deleteDeliveryPersonServerAction(id); fetchPeople(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error'); }
  }

  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 rounded bg-slate-200" />{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p className="font-medium text-red-700">⚠️ {error}</p><button onClick={fetchPeople} className="mt-3 text-sm font-semibold text-brand-green hover:underline">Reintentar</button></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Repartidores</h1>
          <p className="mt-1 text-sm text-slate-500">Personas que entregan el dinero en Cuba</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
          <span className="text-lg leading-none">+</span> Agregar Repartidor
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? 'Editar Repartidor' : 'Nuevo Repartidor'}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre completo</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ej: Pedro Rodríguez" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" autoFocus required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
                <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+53 5 123 4567" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={saving || !formName.trim()} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}

      {people.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">🛵</span>
          <p className="mt-3 font-medium text-slate-500">No hay repartidores</p>
          <p className="text-sm text-slate-400">Agrega tu primer repartidor para asignar entregas</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className={thClass}>Nombre</th>
                <th className={thClass}>Teléfono</th>
                <th className={thClass}>Estado</th>
                <th className={thClass + ' text-right'}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {people.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className={tdClass + ' font-medium'}>{p.full_name}</td>
                  <td className={tdClass}>{p.phone || '—'}</td>
                  <td className={tdClass}>
                    <button onClick={() => toggleActive(p)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${p.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className={tdClass + ' text-right'}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">Editar</button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Eliminar</button>
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
