'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getOrdersAction,
  getOrderAction,
  updateOrderStatusAction,
} from '@/lib/actions/orders';
import type { Order, OrderStatus, OrderType } from '@/types';

const TYPE_LABELS: Record<OrderType, string> = {
  remittance: 'Remesa',
  combo: 'Combo',
  product: 'Producto',
  recharge: 'Recarga',
  cart: 'Carrito',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  nuevo: 'Nuevo',
  procesando: 'Procesando',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  nuevo: 'bg-slate-100 text-slate-700',
  procesando: 'bg-amber-100 text-amber-700',
  completado: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-red-100 text-red-700',
};

const ALL_STATUSES: OrderStatus[] = ['nuevo', 'procesando', 'completado', 'cancelado'];

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('es-CU', { maximumFractionDigits: 2 });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detail, setDetail] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await getOrdersAction());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    if (filterType && o.order_type !== filterType) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    return true;
  });

  async function openDetail(o: Order) {
    setDetailLoading(true);
    setDetail(o);
    try {
      const full = await getOrderAction(o.id);
      if (full) setDetail(full);
    } catch {
      /* se queda con los datos que ya tiene el listado */
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    try {
      await updateOrderStatusAction(id, status);
      fetchOrders();
      setDetail(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  }

  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';
  const inputClass = 'rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20';

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 rounded bg-slate-200" />{[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p className="font-medium text-red-700">⚠️ {error}</p><button onClick={fetchOrders} className="mt-3 text-sm font-semibold text-brand-green hover:underline">Reintentar</button></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pedidos</h1>
          <p className="mt-1 text-sm text-slate-500">Todo lo que entra del sitio (remesas, combos, productos, recargas y carritos)</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={inputClass}>
          <option value="">Todos los tipos</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputClass}>
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} de {orders.length} pedidos</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">🧾</span>
          <p className="mt-3 font-medium text-slate-500">No hay pedidos</p>
          <p className="text-sm text-slate-400">Los pedidos del checkout aparecerán aquí</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className={thClass}>Fecha</th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>Monto</th>
                  <th className={thClass}>País</th>
                  <th className={thClass}>Referido</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass + ' text-right'}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className={tdClass + ' whitespace-nowrap text-slate-400'}>{new Date(o.created_at).toLocaleString('es-CU')}</td>
                    <td className={tdClass + ' font-medium'}>{TYPE_LABELS[o.order_type]}</td>
                    <td className={tdClass}>{o.beneficiary_name || o.sender_name || '—'}</td>
                    <td className={tdClass}>
                      {o.amount_usd != null ? `$${fmtMoney(o.amount_usd)}` : o.amount_origin != null ? `${fmtMoney(o.amount_origin)} ${o.currency_code ?? ''}` : '—'}
                    </td>
                    <td className={tdClass}>{o.countries?.name || '—'}</td>
                    <td className={tdClass}>{o.referrers?.full_name || '—'}</td>
                    <td className={tdClass}>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                    </td>
                    <td className={tdClass + ' text-right'}>
                      <button onClick={() => openDetail(o)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-green hover:bg-emerald-50">Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detalle */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{TYPE_LABELS[detail.order_type]}</h2>
                <p className="text-xs text-slate-400">{detail.id} · {new Date(detail.created_at).toLocaleString('es-CU')}</p>
              </div>
              <button onClick={() => setDetail(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar">✕</button>
            </div>

            {detailLoading ? (
              <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Emisor</p>
                    <p className="text-sm font-medium text-slate-800">{detail.sender_name || '—'}</p>
                    <p className="text-xs text-slate-500">{detail.sender_phone || ''}</p>
                    <p className="text-xs text-slate-500">{detail.sender_country || ''}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Beneficiario</p>
                    <p className="text-sm font-medium text-slate-800">{detail.beneficiary_name || '—'}</p>
                    <p className="text-xs text-slate-500">{detail.beneficiary_ci ? `CI: ${detail.beneficiary_ci}` : ''}</p>
                    <p className="text-xs text-slate-500">{detail.beneficiary_phone || ''}</p>
                    <p className="text-xs text-slate-500">{detail.beneficiary_address || ''}</p>
                    {detail.beneficiary_card_number && <p className="text-xs text-slate-500">Tarjeta: {detail.beneficiary_card_number}</p>}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Monto origen</p>
                    <p className="text-lg font-bold text-slate-800">{fmtMoney(detail.amount_origin)} {detail.currency_code ?? ''}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Monto USD</p>
                    <p className="text-lg font-bold text-slate-800">{detail.amount_usd != null ? `$${fmtMoney(detail.amount_usd)}` : '—'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recibe en Cuba</p>
                    <p className="text-lg font-bold text-slate-800">{fmtMoney(detail.receiving_amount)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">País: {detail.countries?.name || '—'}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">Referido: {detail.referrers?.full_name || (detail.referral_code ? `#${detail.referral_code}` : '—')}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">Estado: {STATUS_LABELS[detail.status]}</span>
                </div>

                {detail.order_items && detail.order_items.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ítems</p>
                    <div className="space-y-1.5">
                      {detail.order_items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <span className="text-slate-700">{it.quantity}× {it.title}</span>
                          <span className="font-medium text-slate-800">${fmtMoney(it.price_usd)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detail.payload && Object.keys(detail.payload).length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Detalle (payload)</p>
                    <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-200">{JSON.stringify(detail.payload, null, 2)}</pre>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cambiar estado</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatus(detail.id, s)}
                        disabled={busyId === detail.id || s === detail.status}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                          s === detail.status
                            ? STATUS_STYLES[s]
                            : 'border border-slate-200 text-slate-600 hover:border-brand-green hover:text-brand-green'
                        } disabled:opacity-50`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
