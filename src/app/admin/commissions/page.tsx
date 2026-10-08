'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCommissionsServerAction,
  upsertCommissionServerAction,
  deleteCommissionServerAction,
  getCountriesServerAction,
} from '@/lib/actions/operations';
import type { CommissionConfig, CommissionRoleType, Country } from '@/types';

const ROLES: { value: CommissionRoleType; label: string }[] = [
  { value: 'delivery', label: 'Repartidor' },
  { value: 'agencia', label: 'Agencia' },
  { value: 'referrer', label: 'Referidor' },
];

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<CommissionConfig[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formCountryId, setFormCountryId] = useState('');
  const [formRole, setFormRole] = useState<CommissionRoleType>('delivery');
  const [formPercent, setFormPercent] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCommissions(await getCommissionsServerAction());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommissions();
    getCountriesServerAction().then(setCountries).catch(() => {});
  }, [fetchCommissions]);

  function openNew() {
    setFormCountryId(countries[0]?.id ?? '');
    setFormRole('delivery');
    setFormPercent('');
    setShowForm(true);
  }

  function openEdit(c: CommissionConfig) {
    setFormCountryId(c.country_id);
    setFormRole(c.role_type);
    setFormPercent(String(c.percent));
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const percent = Number(formPercent);
    if (!formCountryId || !Number.isFinite(percent) || percent < 0) return;
    setSaving(true);
    try {
      await upsertCommissionServerAction(formCountryId, formRole, percent);
      setShowForm(false);
      fetchCommissions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta comisión?')) return;
    try { await deleteCommissionServerAction(id); fetchCommissions(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error'); }
  }

  const roleLabel = (r: CommissionRoleType) => ROLES.find((x) => x.value === r)?.label ?? r;
  const countryName = (id: string) => countries.find((c) => c.id === id)?.name ?? '';
  const countryFlag = (id: string) => countries.find((c) => c.id === id)?.flag_icon ?? '🏳️';
  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 rounded bg-slate-200" />{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p className="font-medium text-red-700">⚠️ {error}</p><button onClick={fetchCommissions} className="mt-3 text-sm font-semibold text-brand-green hover:underline">Reintentar</button></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Comisiones por País</h1>
          <p className="mt-1 text-sm text-slate-500">Porcentaje que cobra cada rol (repartidor, agencia, referidor)</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
          <span className="text-lg leading-none">+</span> Agregar Comisión
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Comisión</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">País</label>
                <select value={formCountryId} onChange={e => setFormCountryId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20">
                  {countries.length === 0 && <option value="">Sin países (crea uno primero)</option>}
                  {countries.map((c) => <option key={c.id} value={c.id}>{c.flag_icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Rol</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value as CommissionRoleType)} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Porcentaje (%)</label>
                <input type="number" step="0.01" min={0} value={formPercent} onChange={e => setFormPercent(e.target.value)} placeholder="5" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" autoFocus required />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={saving || !formCountryId || !Number.isFinite(Number(formPercent)) || Number(formPercent) < 0} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}

      {commissions.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">📊</span>
          <p className="mt-3 font-medium text-slate-500">No hay comisiones configuradas</p>
          <p className="text-sm text-slate-400">Define cuánto cobra cada rol por país</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className={thClass}>País</th>
                <th className={thClass}>Rol</th>
                <th className={thClass}>Comisión</th>
                <th className={thClass + ' text-right'}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className={tdClass + ' font-medium'}>
                    <span className="mr-2">{c.countries?.flag_icon || countryFlag(c.country_id)}</span>
                    {c.countries?.name || countryName(c.country_id) || c.country_id}
                  </td>
                  <td className={tdClass}>{roleLabel(c.role_type)}</td>
                  <td className={tdClass + ' font-semibold text-brand-green'}>{c.percent}%</td>
                  <td className={tdClass + ' text-right'}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">Editar</button>
                      <button onClick={() => handleDelete(c.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Eliminar</button>
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
