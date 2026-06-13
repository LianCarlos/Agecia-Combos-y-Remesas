'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Database } from '@/types/database.types';

/**
 * Inicializa el cliente Supabase de navegador SOLO cuando se necesita (lazy).
 * Evita que createBrowserClient intente restaurar sesión en cada carga de página,
 * lo cual disparaba la Auth API y causaba rate limit 429.
 */
let _supabase: ReturnType<typeof import('@supabase/ssr').createBrowserClient<Database>> | null = null;
async function getSupabase() {
  if (_supabase) return _supabase;
  console.log('[TRACE] 🟣 login → Creando cliente Supabase lazy (primera vez)');
  const { createBrowserClient } = await import('@supabase/ssr');
  _supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
  return _supabase;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verificar sesión: primero chequeo rápido de cookie, luego validación con servidor
  useEffect(() => {
    async function checkSession() {
      const allCookies = document.cookie.split(';').map(c => c.trim());
      const COOKIE_NAME = 'sb-ydgjnmbulsfsswmfgwap-auth-token=';
      const hasSessionCookie = allCookies.some((c) => c === COOKIE_NAME || c.startsWith(COOKIE_NAME));

      if (!hasSessionCookie) {
        setChecking(false);
        return;
      }

      // Cookie existe — verificar que sea válida antes de redirigir para evitar
      // el loop infinito cuando la sesión fue invalidada (ej: cambio de contraseña)
      try {
        const client = await getSupabase();
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          window.location.href = redirectTo;
          return;
        }
      } catch {
        // Error al verificar — mostrar formulario
      }

      // Cookie existe pero sesión inválida: mostrar formulario
      setChecking(false);
    }
    checkSession();
  }, [redirectTo]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Ingresa email y contraseña');
      return;
    }
    setLoading(true);
    try {
      console.log('[TRACE] 🟣 login/LoginForm → Llamando supabase.auth.signInWithPassword (email:', email.trim(), ')');
      const client = await getSupabase();
      const { error: authError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      console.log('[TRACE] 🟣 login/LoginForm → signInWithPassword resultado:', authError ? `ERROR: ${authError.message}` : 'OK');
      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : authError.message);
      } else {
        console.log('[TRACE] 🟣 login/LoginForm → Login OK, cookies actuales:', document.cookie.split(';').filter(c => c.includes('sb-')));
        // Forzar recarga COMPLETA (window.location.href) para que el servidor
        // reciba la cookie de sesión recién creada por createBrowserClient
        window.location.href = redirectTo;
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Mr <span className="text-brand-green">Factus</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Panel de Administración</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-1 text-lg font-bold text-slate-800">Iniciar Sesión</h2>
          <p className="mb-6 text-sm text-slate-500">Accede con tus credenciales de empleado</p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                placeholder="admin@mrfactus.com"
                autoFocus
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Mr Factus © {new Date().getFullYear()} — Remesas y Combos a Cuba
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
