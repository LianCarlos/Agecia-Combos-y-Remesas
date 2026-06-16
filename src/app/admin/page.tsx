import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/* ─── Stat Card ─── */

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  borderColor: 'green' | 'red';
}

function StatCard({ icon, label, value, borderColor }: StatCardProps) {
  return (
    <div
      className={`group rounded-2xl border-t-4 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md ${
        borderColor === 'green' ? 'border-t-brand-green' : 'border-t-brand-red'
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
            borderColor === 'green' ? 'bg-brand-green/10' : 'bg-brand-red/10'
          }`}
        >
          {icon}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <p
        className={`text-3xl font-bold tracking-tight ${
          borderColor === 'green' ? 'text-brand-green' : 'text-brand-red'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatCardSkeleton({ borderColor }: { borderColor: 'green' | 'red' }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border-t-4 bg-white p-5 shadow-sm ${
        borderColor === 'green' ? 'border-t-brand-green' : 'border-t-brand-red'
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-200" />
        <div className="h-3 w-20 rounded bg-slate-200" />
      </div>
      <div className="h-8 w-16 rounded bg-slate-200" />
    </div>
  );
}

/* ─── Async Stats Loader ─── */

async function DashboardStats() {
  try {
    const [
      { count: activePayments },
      { count: activeDeliveries },
      { count: totalRates },
      { count: availableCombos },
      { count: activeEmployees },
    ] = await Promise.all([
      supabaseAdmin.from('payment_methods').select('*', { count: 'exact', head: true }).eq('active', true),
      supabaseAdmin.from('delivery_methods').select('*', { count: 'exact', head: true }).eq('active', true),
      supabaseAdmin.from('exchange_rates').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('combos').select('*', { count: 'exact', head: true }).eq('available', true),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'empleado').eq('is_active', true),
    ]);

    const stats = [
      { icon: '💳', label: 'Pagos activos',      value: activePayments    ?? 0, borderColor: 'green' as const },
      { icon: '🚚', label: 'Entregas activas',   value: activeDeliveries  ?? 0, borderColor: 'red'   as const },
      { icon: '📊', label: 'Tasas configuradas', value: totalRates        ?? 0, borderColor: 'green' as const },
      { icon: '📦', label: 'Combos disponibles', value: availableCombos   ?? 0, borderColor: 'red'   as const },
      { icon: '👥', label: 'Empleados activos',  value: activeEmployees   ?? 0, borderColor: 'green' as const },
    ];

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
    );
  } catch (e) {
    console.error('[DashboardStats] ERROR:', e);
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">
          Error al cargar las estadísticas. Intenta recargar la página.
        </p>
      </div>
    );
  }
}

/* ─── Page (Server Component) ─── */

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">Resumen general de la plataforma Mr Factus</p>

      {/* Stats — cargan sin bloquear la página */}
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCardSkeleton borderColor="green" />
            <StatCardSkeleton borderColor="red" />
            <StatCardSkeleton borderColor="green" />
            <StatCardSkeleton borderColor="red" />
            <StatCardSkeleton borderColor="green" />
          </div>
        }
      >
        <DashboardStats />
      </Suspense>

      {/* Quick Links — estáticos, se muestran al instante */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Accesos rápidos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/admin/payment-methods', icon: '💳', label: 'Gestionar Métodos de Pago', desc: 'Agregar, editar o desactivar métodos' },
            { href: '/admin/delivery-methods', icon: '🚚', label: 'Gestionar Entregas', desc: 'Configurar métodos de entrega' },
            { href: '/admin/exchange-rates', icon: '📊', label: 'Tasas de Cambio', desc: 'Editar matriz de tasas' },
            { href: '/admin/combos', icon: '📦', label: 'Catálogo de Combos', desc: 'Administrar combos y precios' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-brand-green/30 hover:shadow-md"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xl">
                {link.icon}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-700">{link.label}</p>
                <p className="text-xs text-slate-400">{link.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
