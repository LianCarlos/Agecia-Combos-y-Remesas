'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCountriesServerAction,
  createCountryServerAction,
  updateCountryServerAction,
  toggleCountryServerAction,
  deleteCountryServerAction,
} from '@/lib/actions/operations';
import type { Country } from '@/types';

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formFlag, setFormFlag] = useState('');
  const [formCurrency, setFormCurrency] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCountries(await getCountriesServerAction());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCountries(); }, [fetchCountries]);

  function openNew() {
    setEditingId(null);
    setFormName('');
    setFormFlag('');
    setFormCurrency('');
    setShowForm(true);
  }

  function openEdit(c: Country) {
    setEditingId(c.id);
    setFormName(c.name);
    setFormFlag(c.flag_icon ?? '');
    setFormCurrency(c.currency_code ?? '');
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateCountryServerAction(editingId, {
          name: formName.trim(),
          flag_icon: formFlag.trim() || null,
          currency_code: formCurrency.trim() || null,
        });
      } else {
        await createCountryServerAction({
          name: formName.trim(),
          flag_icon: formFlag.trim() || null,
          currency_code: formCurrency.trim() || null,
        });
      }
      setShowForm(false);
      fetchCountries();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Country) {
    try { await toggleCountryServerAction(c.id); fetchCountries(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este país? Las comisiones asociadas quedarán huérfanas.')) return;
    try { await deleteCountryServerAction(id); fetchCountries(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error'); }
  }

  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 rounded bg-slate-200" />{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p className="font-medium text-red-700">⚠️ {error}</p><button onClick={fetchCountries} className="mt-3 text-sm font-semibold text-brand-green hover:underline">Reintentar</button></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Países de Origen</h1>
          <p className="mt-1 text-sm text-slate-500">Países desde los que se envían remesas (con su moneda)</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
          <span className="text-lg leading-none">+</span> Agregar País
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? 'Editar País' : 'Nuevo País'}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ej: México" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" autoFocus required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Bandera (emoji)</label>
                <input value={formFlag} onChange={e => setFormFlag(e.target.value)} placeholder="🇲🇽" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Código de moneda</label>
                <input value={formCurrency} onChange={e => setFormCurrency(e.target.value.toUpperCase())} placeholder="MXN" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={saving || !formName.trim()} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}

      {countries.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">🌎</span>
          <p className="mt-3 font-medium text-slate-500">No hay países de origen</p>
          <p className="text-sm text-slate-400">Agrega México, Brasil, etc. con su moneda</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className={thClass}>País</th>
                <th className={thClass}>Moneda</th>
                <th className={thClass}>Estado</th>
                <th className={thClass + ' text-right'}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {countries.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className={tdClass + ' font-medium'}>
                    <span className="mr-2">{c.flag_icon || '🏳️'}</span>
                    {c.name}
                  </td>
                  <td className={tdClass + ' font-mono'}>{c.currency_code || '—'}</td>
                  <td className={tdClass}>
                    <button onClick={() => toggleActive(c)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${c.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${c.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
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
