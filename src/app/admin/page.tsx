import { Suspense, type ReactNode } from 'react';
import { getDashboardStats } from '@/lib/services/dashboard';
import type {
  DashboardStats,
  OrderStatus,
  OrderType,
  RemittanceStatus,
} from '@/types';

export const dynamic = 'force-dynamic';

/* ─── Etiquetas y formato ─── */

const TYPE_LABEL: Record<OrderType, string> = {
  remittance: 'Remesa',
  combo: 'Combo',
  product: 'Producto',
  recharge: 'Recarga',
  cart: 'Carrito',
};

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  nuevo: 'Nuevo',
  procesando: 'Procesando',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const REM_STATUS_LABEL: Record<RemittanceStatus, string> = {
  pendiente_recibo: 'Pend. recibo',
  recibida: 'Recibida',
  en_reparto: 'En reparto',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
};

const REM_STATUS_STYLE: Record<RemittanceStatus, string> = {
  pendiente_recibo: 'bg-slate-100 text-slate-700',
  recibida: 'bg-sky-100 text-sky-700',
  en_reparto: 'bg-amber-100 text-amber-700',
  entregada: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-red-100 text-red-700',
};

function usd(n: number): string {
  return `$${n.toLocaleString('es-CU', { maximumFractionDigits: 2 })}`;
}
function cup(n: number): string {
  return `${n.toLocaleString('es-CU', { maximumFractionDigits: 0 })} CUP`;
}
function num(n: number): string {
  return n.toLocaleString('es-CU');
}

/* ─── Piezas de UI ─── */

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: 'green' | 'amber' | 'slate' }) {
  const toneCls =
    tone === 'green'
      ? 'border-t-brand-green text-brand-green'
      : tone === 'amber'
        ? 'border-t-amber-400 text-amber-600'
        : 'border-t-slate-300 text-slate-800';
  return (
    <div className={`rounded-2xl border-t-4 bg-white p-4 shadow-sm ${toneCls}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function BarRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 flex-shrink-0 text-sm text-slate-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-green" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 flex-shrink-0 text-right text-sm font-semibold text-slate-700">{count}</span>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const thClass = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400';
const tdClass = 'px-3 py-2.5 text-sm text-slate-700';

/* ─── Contenido que carga datos ─── */

async function DashboardContent() {
  const s: DashboardStats = await getDashboardStats();

  const typeEntries = (Object.entries(s.orders.byType) as [OrderType, number][]).sort((a, b) => b[1] - a[1]);
  const statusEntries = (Object.entries(s.orders.byStatus) as [OrderStatus, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Pedidos" value={num(s.orders.total)} sub="todos los tipos" tone="slate" />
        <KpiCard label="Remesas" value={num(s.remittances.total)} sub="procesadas" tone="slate" />
        <KpiCard label="USDT recibido" value={usd(s.remittances.usdtReceived)} tone="green" />
        <KpiCard label="CUP entregado" value={cup(s.remittances.cupDelivered)} tone="slate" />
        <KpiCard label="Ganancia" value={usd(s.remittances.profitUsdt)} sub="agencia" tone="green" />
        <KpiCard label="Comisiones pend." value={usd(s.commissions.pendingUsdt)} sub={`de ${usd(s.commissions.accruedUsdt)}`} tone="amber" />
      </div>

      {/* Pedidos por tipo / estado */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Pedidos por tipo">
          <div className="space-y-3">
            {typeEntries.map(([type, count]) => (
              <BarRow key={type} label={TYPE_LABEL[type]} count={count} total={s.orders.total} />
            ))}
          </div>
        </Section>
        <Section title="Pedidos por estado">
          <div className="space-y-3">
            {statusEntries.map(([status, count]) => (
              <BarRow key={status} label={ORDER_STATUS_LABEL[status]} count={count} total={s.orders.total} />
            ))}
          </div>
        </Section>
      </div>

      {/* Remesas por estado */}
      <Section title="Remesas por estado">
        <div className="flex flex-wrap gap-2">
          {(Object.entries(s.remittances.byStatus) as [RemittanceStatus, number][]).map(([status, count]) => (
            <span key={status} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${REM_STATUS_STYLE[status]}`}>
              {REM_STATUS_LABEL[status]}
              <span className="rounded-full bg-white/60 px-1.5">{count}</span>
            </span>
          ))}
        </div>
      </Section>

      {/* Por país */}
      <Section title="Por país de origen">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thClass}>País</th>
                <th className={thClass + ' text-right'}>Pedidos</th>
                <th className={thClass + ' text-right'}>USDT recibido</th>
                <th className={thClass + ' text-right'}>Ganancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {s.byCountry.map((c) => (
                <tr key={c.countryId} className="hover:bg-slate-50/50">
                  <td className={tdClass + ' font-medium'}>{c.countryName}</td>
                  <td className={tdClass + ' text-right'}>{num(c.orders)}</td>
                  <td className={tdClass + ' text-right'}>{usd(c.usdtReceived)}</td>
                  <td className={tdClass + ' text-right font-medium text-brand-green'}>{usd(c.profitUsdt)}</td>
                </tr>
              ))}
              {s.byCountry.length === 0 && (
                <tr><td colSpan={4} className={tdClass + ' text-center text-slate-400'}>Sin datos aún</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Por cuenta + por entregador */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Por cuenta de recepción">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Cuenta</th>
                  <th className={thClass + ' text-right'}>Remesas</th>
                  <th className={thClass + ' text-right'}>USDT recibido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {s.byAccount.map((a) => (
                  <tr key={a.accountId} className="hover:bg-slate-50/50">
                    <td className={tdClass + ' font-medium'}>
                      {a.accountName}
                      {a.isOwn && <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">propia</span>}
                    </td>
                    <td className={tdClass + ' text-right'}>{num(a.remittances)}</td>
                    <td className={tdClass + ' text-right'}>{usd(a.totalReceivedUsdt)}</td>
                  </tr>
                ))}
                {s.byAccount.length === 0 && (
                  <tr><td colSpan={3} className={tdClass + ' text-center text-slate-400'}>Sin cuentas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Por entregador">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Entregador</th>
                  <th className={thClass + ' text-right'}>Entregas</th>
                  <th className={thClass + ' text-right'}>Comisión dev.</th>
                  <th className={thClass + ' text-right'}>Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {s.byDeliveryPerson.map((d) => (
                  <tr key={d.deliveryPersonId} className="hover:bg-slate-50/50">
                    <td className={tdClass + ' font-medium'}>{d.name}</td>
                    <td className={tdClass + ' text-right'}>{num(d.deliveries)}</td>
                    <td className={tdClass + ' text-right'}>{usd(d.commissionAccruedUsdt)}</td>
                    <td className={tdClass + ' text-right'}>{usd(d.commissionPendingUsdt)}</td>
                  </tr>
                ))}
                {s.byDeliveryPerson.length === 0 && (
                  <tr><td colSpan={4} className={tdClass + ' text-center text-slate-400'}>Sin entregadores</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* Por referidor + tasas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Por referidor">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Referidor</th>
                  <th className={thClass + ' text-right'}>Clicks</th>
                  <th className={thClass + ' text-right'}>Pedidos</th>
                  <th className={thClass + ' text-right'}>Comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {s.byReferrer.map((r) => (
                  <tr key={r.referrerId} className="hover:bg-slate-50/50">
                    <td className={tdClass + ' font-medium'}>{r.name}</td>
                    <td className={tdClass + ' text-right'}>{num(r.clicks)}</td>
                    <td className={tdClass + ' text-right'}>{num(r.attributedOrders)}</td>
                    <td className={tdClass + ' text-right'}>{usd(r.commissionAccruedUsdt)}</td>
                  </tr>
                ))}
                {s.byReferrer.length === 0 && (
                  <tr><td colSpan={4} className={tdClass + ' text-center text-slate-400'}>Sin referidores</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Tasas de conversión (USDT)">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Par</th>
                  <th className={thClass + ' text-right'}>Tasa</th>
                  <th className={thClass + ' text-right'}>Actualizada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {s.rates.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className={tdClass + ' font-mono text-xs'}>{r.from_code} → {r.to_code}</td>
                    <td className={tdClass + ' text-right font-medium'}>{r.rate.toLocaleString('es-CU', { maximumFractionDigits: 4 })}</td>
                    <td className={tdClass + ' text-right text-xs text-slate-400'}>{new Date(r.updated_at).toLocaleString('es-CU')}</td>
                  </tr>
                ))}
                {s.rates.length === 0 && (
                  <tr><td colSpan={3} className={tdClass + ' text-center text-slate-400'}>Sin tasas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* Actividad reciente */}
      <Section title="Actividad reciente">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thClass}>Fecha</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Beneficiario</th>
                <th className={thClass + ' text-right'}>Monto</th>
                <th className={thClass}>Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {s.recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50">
                  <td className={tdClass + ' whitespace-nowrap text-xs text-slate-400'}>{new Date(o.created_at).toLocaleString('es-CU')}</td>
                  <td className={tdClass}>{TYPE_LABEL[o.order_type]}</td>
                  <td className={tdClass + ' font-medium'}>{o.beneficiary_name || o.sender_name || '—'}</td>
                  <td className={tdClass + ' text-right'}>
                    {o.amount_usd != null ? usd(o.amount_usd) : o.amount_origin != null ? `${num(o.amount_origin)} ${o.currency_code ?? ''}` : '—'}
                  </td>
                  <td className={tdClass}>{ORDER_STATUS_LABEL[o.status]}</td>
                </tr>
              ))}
              {s.recentOrders.length === 0 && (
                <tr><td colSpan={5} className={tdClass + ' text-center text-slate-400'}>Aún no hay pedidos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100" />)}
      </div>
      <div className="h-48 rounded-2xl bg-slate-100" />
      <div className="h-48 rounded-2xl bg-slate-100" />
      <div className="h-64 rounded-2xl bg-slate-100" />
    </div>
  );
}

/* ─── Page (Server Component) ─── */

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">Operación de pedidos, remesas, comisiones y referidos</p>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
