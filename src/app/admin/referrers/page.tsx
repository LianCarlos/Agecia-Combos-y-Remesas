'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getReferrersServerAction,
  createReferrerServerAction,
  updateReferrerServerAction,
  toggleReferrerServerAction,
  deleteReferrerServerAction,
} from '@/lib/actions/operations';
import type { Referrer } from '@/types';

export default function ReferrersPage() {
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReferrers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReferrers(await getReferrersServerAction());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReferrers(); }, [fetchReferrers]);

  function openNew() {
    setEditingId(null);
    setFormName('');
    setFormPhone('');
    setFormCode('');
    setFormLabel('');
    setShowForm(true);
  }

  function openEdit(r: Referrer) {
    setEditingId(r.id);
    setFormName(r.full_name);
    setFormPhone(r.phone ?? '');
    setFormCode(r.referral_code);
    setFormLabel(r.label ?? '');
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateReferrerServerAction(editingId, {
          full_name: formName.trim(),
          phone: formPhone.trim() || null,
          referral_code: formCode.trim(),
          label: formLabel.trim() || null,
        });
      } else {
        await createReferrerServerAction({
          full_name: formName.trim(),
          phone: formPhone.trim() || null,
          referral_code: formCode.trim(),
          label: formLabel.trim() || null,
        });
      }
      setShowForm(false);
      fetchReferrers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(r: Referrer) {
    try { await toggleReferrerServerAction(r.id); fetchReferrers(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este referidor? Sus pedidos atribuidos se conservarán sin dueño.')) return;
    try { await deleteReferrerServerAction(id); fetchReferrers(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error'); }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 rounded bg-slate-200" />{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p className="font-medium text-red-700">⚠️ {error}</p><button onClick={fetchReferrers} className="mt-3 text-sm font-semibold text-brand-green hover:underline">Reintentar</button></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Referidores</h1>
          <p className="mt-1 text-sm text-slate-500">Personas que refieren clientes con un enlace /r/código</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
          <span className="text-lg leading-none">+</span> Agregar Referidor
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? 'Editar Referidor' : 'Nuevo Referidor'}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre completo</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ej: María Pérez" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" autoFocus required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
                <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+1 555 123 4567" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Código de referido</label>
                <input value={formCode} onChange={e => setFormCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} placeholder="maria123" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-mono outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" required />
                {!editingId && formCode.trim() && (
                  <p className="mt-1 text-xs text-slate-400">Enlace: <span className="font-mono text-brand-green">{baseUrl}/r/{formCode.trim()}</span></p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Etiqueta (opcional)</label>
                <input value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="Ej: Zona Este" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={saving || !formName.trim() || !formCode.trim()} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}

      {referrers.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">🔗</span>
          <p className="mt-3 font-medium text-slate-500">No hay referidores</p>
          <p className="text-sm text-slate-400">Agrega el primero para generar enlaces de referido</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className={thClass}>Nombre</th>
                <th className={thClass}>Código</th>
                <th className={thClass}>Enlace</th>
                <th className={thClass}>Estado</th>
                <th className={thClass + ' text-right'}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {referrers.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className={tdClass + ' font-medium'}>
                    {r.full_name}
                    {r.label && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{r.label}</span>}
                  </td>
                  <td className={tdClass + ' font-mono'}>{r.referral_code}</td>
                  <td className={tdClass + ' font-mono text-slate-400'}>{baseUrl}/r/{r.referral_code}</td>
                  <td className={tdClass}>
                    <button onClick={() => toggleActive(r)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${r.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${r.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
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
