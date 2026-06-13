import { type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserAndProfile } from '@/lib/auth';
import { AdminShell } from './components/AdminShell';

export const metadata = {
  title: 'Mr Factus · Panel de Administración',
  description: 'Panel de administración de la plataforma Mr Factus',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  console.log('[TRACE] 🟪 AdminLayout → Renderizando layout admin', { timestamp: new Date().toISOString() });
  // UNA sola llamada a Supabase — obtiene user + profile juntos
  const result = await getCurrentUserAndProfile();

  console.log('[TRACE] 🟪 AdminLayout → getCurrentUserAndProfile resultado:', result ? { userId: result.userId, role: result.profile?.role } : 'NULL');

  if (!result) {
    console.log('[TRACE] 🟪 AdminLayout → Sin sesión, redirigiendo a login');
    redirect('/login?redirect=/admin');
  }

  const { userId, email, profile } = result;
  const isAdminUser = profile?.role === 'superadmin' || profile?.role === 'empleado';
  const isSuperAdmin = profile?.role === 'superadmin';

  if (!isAdminUser) {
    redirect('/login?redirect=/admin');
  }

  const adminName = profile?.full_name || email?.split('@')[0] || 'Admin';
  const adminEmail = email || '';

  return (
    <AdminShell isSuperAdmin={isSuperAdmin} adminName={adminName} adminEmail={adminEmail}>
      {children}
    </AdminShell>
  );
}
