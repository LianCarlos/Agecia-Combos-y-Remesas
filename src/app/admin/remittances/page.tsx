'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getRemittancesAction,
  getPendingRemittanceOrdersAction,
  getRemittanceFormOptionsAction,
  processRemittanceAction,
  updateRemittanceStatusAction,
  togglePayoutPaidAction,
} from '@/lib/actions/remittances';
import type {
  DeliveryCurrency,
  Order,
  PayoutRoleType,
  Remittance,
  RemittanceStatus,
} from '@/types';

type Tab = 'pendientes' | 'remesas';

const REMITTANCE_STATUS_LABELS: Record<RemittanceStatus, string> = {
  pendiente_recibo: 'Pendiente de recibo',
  recibida: 'Recibida',
  en_reparto: 'En reparto',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
};

const REMITTANCE_STATUS_STYLES: Record<RemittanceStatus, string> = {
  pendiente_recibo: 'bg-slate-100 text-slate-700',
  recibida: 'bg-sky-100 text-sky-700',
  en_reparto: 'bg-amber-100 text-amber-700',
  entregada: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-red-100 text-red-700',
};

const ALL_REMITTANCE_STATUSES: RemittanceStatus[] = [
  'pendiente_recibo',
  'recibida',
  'en_reparto',
  'entregada',
  'cancelada',
];

const ROLE_LABELS: Record<PayoutRoleType, string> = {
  owner: 'Dueño',
  delivery: 'Entregador',
  agencia: 'Agencia',
  referrer: 'Referidor',
};

interface FormOptions {
  accounts: { id: string; name: string; is_own: boolean; owner_fee_percent: number }[];
  deliveryPersons: { id: string; full_name: string }[];
  deliveryMethods: { id: string; name: string; type: string | null }[];
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('es-CU', { maximumFractionDigits: 2 });
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null) return '—';
  return `$${fmtMoney(n)}`;
}

export default function RemittancesPage() {
  const [tab, setTab] = useState<Tab>('pendientes');
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [pending, setPending] = useState<Order[]>([]);
  const [options, setOptions] = useState<FormOptions>({ accounts: [], deliveryPersons: [], deliveryMethods: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulario de procesar
  const [processOrder, setProcessOrder] = useState<Order | null>(null);
  const [form, setForm] = useState({
    accountId: '',
    deliveryPersonId: '',
    deliveryMethodId: '',
    deliveryCurrency: 'CUP' as DeliveryCurrency,
    notes: '',
  });
  const [processing, setProcessing] = useState(false);

  // Detalle de remesa
  const [detail, setDetail] = useState<Remittance | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [r, p, o] = await Promise.all([
        getRemittancesAction(),
        getPendingRemittanceOrdersAction(),
        getRemittanceFormOptionsAction(),
      ]);
      setRemittances(r);
      setPending(p);
      setOptions(o);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openProcess(o: Order) {
    setProcessOrder(o);
    setForm({
      accountId: options.accounts[0]?.id ?? '',
      deliveryPersonId: '',
      deliveryMethodId: '',
      deliveryCurrency: 'CUP',
      notes: '',
    });
  }

  async function submitProcess() {
    if (!processOrder) return;
    setProcessing(true);
    try {
      await processRemittanceAction({
        orderId: processOrder.id,
        accountId: form.accountId,
        deliveryPersonId: form.deliveryPersonId || null,
        deliveryMethodId: form.deliveryMethodId || null,
        deliveryCurrency: form.deliveryCurrency,
        notes: form.notes || null,
      });
      setProcessOrder(null);
      fetchAll();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setProcessing(false);
    }
  }

  async function changeStatus(id: string, status: RemittanceStatus) {
    setBusyId(id);
    try {
      await updateRemittanceStatusAction(id, status);
      fetchAll();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  }

  async function togglePaid(id: string) {
    setBusyId(id);
    try {
      await togglePayoutPaidAction(id);
      const fresh = remittances.find((r) =>
        r.remittance_payouts?.some((p) => p.id === id)
      );
      // Refrescar la lista y el detalle abierto.
      const [r] = await Promise.all([getRemittancesAction()]);
      setRemittances(r);
      if (fresh && detail) {
        setDetail(r.find((x) => x.id === detail.id) ?? detail);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  }

  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';
  const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20';
  const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400';

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 rounded bg-slate-200" />{[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p className="font-medium text-red-700">⚠️ {error}</p><button onClick={fetchAll} className="mt-3 text-sm font-semibold text-brand-green hover:underline">Reintentar</button></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Remesas</h1>
        <p className="mt-1 text-sm text-slate-500">Procesa pedidos de remesa y sigue su ciclo hasta la entrega</p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setTab('pendientes')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'pendientes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pendientes de procesar ({pending.length})
        </button>
        <button
          onClick={() => setTab('remesas')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'remesas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Remesas ({remittances.length})
        </button>
      </div>

      {tab === 'pendientes' ? (
        pending.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <span className="text-4xl">✅</span>
            <p className="mt-3 font-medium text-slate-500">No hay remesas pendientes</p>
            <p className="text-sm text-slate-400">Todo lo recibido ya fue procesado</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className={thClass}>Fecha</th>
                    <th className={thClass}>Beneficiario</th>
                    <th className={thClass}>Monto origen</th>
                    <th className={thClass}>País</th>
                    <th className={thClass}>Referido</th>
                    <th className={thClass + ' text-right'}>Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pending.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className={tdClass + ' whitespace-nowrap text-slate-400'}>{new Date(o.created_at).toLocaleString('es-CU')}</td>
                      <td className={tdClass + ' font-medium'}>{o.beneficiary_name || '—'}</td>
                      <td className={tdClass}>{fmtMoney(o.amount_origin)} {o.currency_code ?? ''}</td>
                      <td className={tdClass}>{o.countries?.name || '—'}</td>
                      <td className={tdClass}>{o.referrers?.full_name || '—'}</td>
                      <td className={tdClass + ' text-right'}>
                        <button onClick={() => openProcess(o)} className="rounded-lg bg-brand-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-green-dark">
                          Procesar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : remittances.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">💸</span>
          <p className="mt-3 font-medium text-slate-500">Aún no hay remesas</p>
          <p className="text-sm text-slate-400">Procesa un pedido para crear la primera</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className={thClass}>Referencia</th>
                  <th className={thClass}>Beneficiario</th>
                  <th className={thClass}>Monto origen</th>
                  <th className={thClass}>Recibe</th>
                  <th className={thClass}>Cuenta</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass + ' text-right'}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {remittances.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className={tdClass + ' font-mono text-xs'}>{r.reference || '—'}</td>
                    <td className={tdClass + ' font-medium'}>{r.beneficiary_name || '—'}</td>
                    <td className={tdClass}>{fmtMoney(r.amount_origin)}</td>
                    <td className={tdClass}>{fmtMoney(r.amount_receive)} {r.delivery_currency}</td>
                    <td className={tdClass}>{r.accounts?.name || '—'}</td>
                    <td className={tdClass}>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${REMITTANCE_STATUS_STYLES[r.status]}`}>
                        {REMITTANCE_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className={tdClass + ' text-right'}>
                      <button onClick={() => setDetail(r)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-green hover:bg-emerald-50">Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal procesar */}
      {processOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Procesar remesa</h2>
                <p className="text-xs text-slate-400">{processOrder.beneficiary_name || 'Beneficiario'} · {fmtMoney(processOrder.amount_origin)} {processOrder.currency_code ?? ''} · {processOrder.countries?.name || ''}</p>
              </div>
              <button onClick={() => setProcessOrder(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Cuenta de recepción</label>
                <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className={inputClass}>
                  {options.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.is_own ? ' (propia)' : ` — ${a.owner_fee_percent}% dueño`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Entregador</label>
                  <select value={form.deliveryPersonId} onChange={(e) => setForm({ ...form, deliveryPersonId: e.target.value })} className={inputClass}>
                    <option value="">Sin asignar</option>
                    {options.deliveryPersons.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Método de entrega</label>
                  <select value={form.deliveryMethodId} onChange={(e) => setForm({ ...form, deliveryMethodId: e.target.value })} className={inputClass}>
                    <option value="">Sin método</option>
                    {options.deliveryMethods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Moneda de entrega</label>
                <div className="flex gap-2">
                  {(['CUP', 'USD'] as DeliveryCurrency[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, deliveryCurrency: c })}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        form.deliveryCurrency === c ? 'bg-brand-green text-white' : 'border border-slate-200 text-slate-600 hover:border-brand-green'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} placeholder="Opcional" />
              </div>

              <button
                onClick={submitProcess}
                disabled={processing || !form.accountId}
                className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-green-dark disabled:opacity-50"
              >
                {processing ? 'Procesando…' : 'Calcular y procesar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{detail.reference || 'Remesa'}</h2>
                <p className="text-xs text-slate-400">{detail.id} · {new Date(detail.created_at).toLocaleString('es-CU')}</p>
              </div>
              <button onClick={() => setDetail(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar">✕</button>
            </div>

            <div className="space-y-4">
              {/* Beneficiario y cuenta */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Beneficiario</p>
                  <p className="text-sm font-medium text-slate-800">{detail.beneficiary_name || '—'}</p>
                  <p className="text-xs text-slate-500">{detail.beneficiary_phone || ''}</p>
                  <p className="text-xs text-slate-500">{detail.beneficiary_address || ''}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cuenta y reparto</p>
                  <p className="text-sm font-medium text-slate-800">{detail.accounts?.name || '—'}</p>
                  <p className="text-xs text-slate-500">{detail.delivery_persons?.full_name || 'Sin entregador'}</p>
                  <p className="text-xs text-slate-500">{detail.referrers?.full_name || 'Sin referido'}</p>
                </div>
              </div>

              {/* Desglose */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Monto origen</p>
                  <p className="text-lg font-bold text-slate-800">{fmtMoney(detail.amount_origin)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">USDT recibido</p>
                  <p className="text-lg font-bold text-slate-800">{fmtMoney(detail.usdt_received)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recibe {detail.delivery_currency}</p>
                  <p className="text-lg font-bold text-slate-800">{fmtMoney(detail.amount_receive)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2.5 py-1">Tasa origen→USDT: {detail.rate_to_usdt}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">Tasa USDT→{detail.delivery_currency}: {detail.rate_usdt_to_delivery}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">País: {detail.countries?.name || '—'}</span>
              </div>

              {/* Payouts */}
              {detail.remittance_payouts && detail.remittance_payouts.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pagos (comisiones)</p>
                  <div className="space-y-1.5">
                    {detail.remittance_payouts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{ROLE_LABELS[p.role_type]}</p>
                          <p className="text-xs text-slate-400">{p.participant_name || ''} · {p.percent}%</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-700">{fmtUsd(p.amount_usdt)}</span>
                          <button
                            onClick={() => togglePaid(p.id)}
                            disabled={busyId === p.id}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                              p.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                            } disabled:opacity-50`}
                          >
                            {p.paid ? 'Pagado' : 'Pendiente'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.notes && (
                <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{detail.notes}</div>
              )}

              {/* Estados */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_REMITTANCE_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(detail.id, s)}
                      disabled={busyId === detail.id || s === detail.status}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                        s === detail.status
                          ? REMITTANCE_STATUS_STYLES[s]
                          : 'border border-slate-200 text-slate-600 hover:border-brand-green hover:text-brand-green'
                      } disabled:opacity-50`}
                    >
                      {REMITTANCE_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
