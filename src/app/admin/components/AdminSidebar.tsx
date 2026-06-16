'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

/* ─── SVG Icons ─── */

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

function PaymentIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

function DeliveryIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function RatesIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
    </svg>
  );
}

function CombosIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

function RecargasIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
    </svg>
  );
}

function CurrenciesIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function EmployeesIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

/* ─── Nav Link ─── */

interface NavLinkProps {
  href: string;
  icon: (props: { active: boolean }) => React.ReactNode;
  label: string;
  active: boolean;
  collapsed?: boolean;
}

function NavLink({ href, icon: Icon, label, active, collapsed }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-brand-green text-white shadow-md shadow-brand-green/20'
          : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
      }`}
      title={collapsed ? label : undefined}
      aria-label={label}
    >
      <span className="flex-shrink-0">
        <Icon active={active} />
      </span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

/* ─── Sidebar ─── */

interface AdminSidebarProps {
  isSuperAdmin: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
}

export function AdminSidebar({ isSuperAdmin, collapsed: collapsedProp, onCollapsedChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = collapsedProp ?? internalCollapsed;
  const setCollapsed = (v: boolean) => { setInternalCollapsed(v); onCollapsedChange?.(v); };

  const navItems = [
    { href: '/admin', icon: DashboardIcon, label: 'Dashboard' },
    { href: '/admin/currencies', icon: CurrenciesIcon, label: 'Países / Monedas' },
    { href: '/admin/payment-methods', icon: PaymentIcon, label: 'Métodos de Pago' },
    { href: '/admin/delivery-methods', icon: DeliveryIcon, label: 'Métodos de Entrega' },
    { href: '/admin/exchange-rates', icon: RatesIcon, label: 'Tasas de Cambio' },
    { href: '/admin/combos', icon: CombosIcon, label: 'Combos y Productos' },
    { href: '/admin/recargas', icon: RecargasIcon, label: 'Recargas' },
    ...(isSuperAdmin
      ? [{ href: '/admin/employees', icon: EmployeesIcon, label: 'Empleados' }]
      : []),
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-full flex-col border-r border-slate-200 bg-slate-900 transition-all duration-300 lg:flex ${
          collapsed ? 'w-[72px]' : 'w-60'
        }`}
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-slate-700/50 px-4 py-5 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-green text-sm font-bold text-white">
            MF
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white leading-tight">Mr Factus</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-brand-green-light">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Secciones del panel">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href)
              }
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-slate-700/50 px-3 py-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 19.5-7.5-7.5 7.5-7.5" />
              )}
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
