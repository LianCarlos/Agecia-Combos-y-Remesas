'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface AdminHeaderProps {
  adminName: string;
  adminEmail: string;
}

export function AdminHeader({ adminName, adminEmail }: AdminHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  // Iniciales del nombre
  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Título (mobile-only) */}
        <div className="lg:hidden">
          <span className="text-lg font-bold text-slate-800">Mr Factus</span>
          <span className="ml-2 rounded-md bg-brand-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-green">
            ADMIN
          </span>
        </div>

        {/* Spacer */}
        <div className="hidden lg:block" />

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            aria-label="Menú de usuario"
            aria-expanded={menuOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-slate-700 leading-none">{adminName}</p>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{adminEmail}</p>
            </div>
            <svg className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-fade-in-up">
              <div className="border-b border-slate-100 px-4 py-2.5 sm:hidden">
                <p className="text-sm font-medium text-slate-700">{adminName}</p>
                <p className="text-[11px] text-slate-400">{adminEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
