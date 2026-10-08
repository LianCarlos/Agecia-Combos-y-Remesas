'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAccountsServerAction,
  createAccountServerAction,
  updateAccountServerAction,
  toggleAccountServerAction,
  deleteAccountServerAction,
  getCountriesServerAction,
} from '@/lib/actions/operations';
import { getAllCurrenciesAction } from '@/lib/actions/admin';
import type { Account, AccountType, Country } from '@/types';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'zelle', label: 'Zelle' },
  { value: 'bank_transfer', label: 'Transferencia bancaria' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'wallet', label: 'Billetera' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'other', label: 'Otro' },
];

type CurrencyOption = { id: string; code: string; name: string };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'zelle' as AccountType,
    currency_id: '',
    country_id: '',
    is_own: false,
    owner_name: '',
    owner_fee_percent: '0',
    account_details: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAccounts(await getAccountsServerAction());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    // Referencias para los selects (no bloquean el listado si fallan).
    getCountriesServerAction().then(setCountries).catch(() => {});
    getAllCurrenciesAction().then((c) => setCurrencies((c ?? []) as CurrencyOption[])).catch(() => {});
  }, [fetchAccounts]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openNew() {
    setEditingId(null);
    setForm({ name: '', type: 'zelle', currency_id: '', country_id: '', is_own: false, owner_name: '', owner_fee_percent: '0', account_details: '' });
    setShowForm(true);
  }

  function openEdit(a: Account) {
    setEditingId(a.id);
    setForm({
      name: a.name,
      type: a.type,
      currency_id: a.currency_id ?? '',
      country_id: a.country_id ?? '',
      is_own: a.is_own,
      owner_name: a.owner_name ?? '',
      owner_fee_percent: String(a.owner_fee_percent ?? 0),
      account_details: a.account_details ?? '',
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const data = {
      name: form.name.trim(),
      type: form.type,
      currency_id: form.currency_id || null,
      country_id: form.country_id || null,
      is_own: form.is_own,
      owner_name: form.is_own ? null : (form.owner_name.trim() || null),
      owner_fee_percent: form.is_own ? 0 : (Number(form.owner_fee_percent) || 0),
      account_details: form.account_details.trim() || null,
    };
    try {
      if (editingId) {
        await updateAccountServerAction(editingId, data);
      } else {
        await createAccountServerAction(data);
      }
      setShowForm(false);
      fetchAccounts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(a: Account) {
    try { await toggleAccountServerAction(a.id); fetchAccounts(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta cuenta?')) return;
    try { await deleteAccountServerAction(id); fetchAccounts(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error'); }
  }

  const typeLabel = (t: AccountType) => ACCOUNT_TYPES.find((x) => x.value === t)?.label ?? t;
  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 rounded bg-slate-200" />{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p className="font-medium text-red-700">⚠️ {error}</p><button onClick={fetchAccounts} className="mt-3 text-sm font-semibold text-brand-green hover:underline">Reintentar</button></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cuentas</h1>
          <p className="mt-1 text-sm text-slate-500">Cuentas donde se recibe el dinero del cliente</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
          <span className="text-lg leading-none">+</span> Agregar Cuenta
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Zelle Chase USD" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" autoFocus required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
                  <select value={form.type} onChange={e => set('type', e.target.value as AccountType)} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20">
                    {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">País (origen)</label>
                  <select value={form.country_id} onChange={e => set('country_id', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20">
                    <option value="">— Sin país —</option>
                    {countries.map((c) => <option key={c.id} value={c.id}>{c.flag_icon} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Moneda</label>
                  <select value={form.currency_id} onChange={e => set('currency_id', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20">
                    <option value="">— Sin moneda —</option>
                    {currencies.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input type="checkbox" checked={form.is_own} onChange={e => set('is_own', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green" />
                    Cuenta propia
                  </label>
                </div>
              </div>
              {!form.is_own && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Dueño</label>
                    <input value={form.owner_name} onChange={e => set('owner_name', e.target.value)} placeholder="Nombre del dueño" className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Comisión del dueño (%)</label>
                    <input type="number" step="0.01" min={0} value={form.owner_fee_percent} onChange={e => set('owner_fee_percent', e.target.value)} placeholder="0" className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Detalles de la cuenta</label>
                <textarea value={form.account_details} onChange={e => set('account_details', e.target.value)} rows={2} placeholder="Número de cuenta, titular, instrucciones..." className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={saving || !form.name.trim()} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">🏦</span>
          <p className="mt-3 font-medium text-slate-500">No hay cuentas</p>
          <p className="text-sm text-slate-400">Agrega la cuenta donde recibes el dinero</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className={thClass}>Cuenta</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Dueño</th>
                <th className={thClass}>Estado</th>
                <th className={thClass + ' text-right'}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {accounts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className={tdClass + ' font-medium'}>
                    {a.name}
                    {a.is_own && <span className="ml-2 rounded-full bg-brand-green/10 px-2 py-0.5 text-[11px] font-semibold text-brand-green">Propia</span>}
                  </td>
                  <td className={tdClass}>{typeLabel(a.type)}</td>
                  <td className={tdClass}>
                    {a.is_own ? '—' : (a.owner_name || '—')}{!a.is_own && a.owner_fee_percent > 0 ? ` (${a.owner_fee_percent}%)` : ''}
                  </td>
                  <td className={tdClass}>
                    <button onClick={() => toggleActive(a)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${a.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${a.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className={tdClass + ' text-right'}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(a)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">Editar</button>
                      <button onClick={() => handleDelete(a.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Eliminar</button>
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
