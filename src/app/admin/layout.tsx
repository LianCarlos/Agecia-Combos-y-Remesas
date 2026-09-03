import { type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserAndProfile } from '@/lib/auth';
import { AdminShell } from './components/AdminShell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mr Factus · Panel de Administración',
  description: 'Panel de administración de la plataforma Mr Factus',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // UNA sola llamada a Supabase — obtiene user + profile juntos
  const result = await getCurrentUserAndProfile();

  if (!result) {
    redirect('/login?redirect=/admin');
  }

  const { email, profile } = result;
  // Exige rol admin Y cuenta activa (una cuenta desactivada no entra al panel).
  const isAdminUser =
    (profile?.role === 'superadmin' || profile?.role === 'empleado') && profile?.is_active === true;
  const isSuperAdmin = profile?.role === 'superadmin' && profile?.is_active === true;

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
