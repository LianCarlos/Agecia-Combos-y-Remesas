'use client';

import { useState, type ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { MobileBottomNav } from './MobileBottomNav';

interface AdminShellProps {
  isSuperAdmin: boolean;
  adminName: string;
  adminEmail: string;
  children: ReactNode;
}

export function AdminShell({ isSuperAdmin, adminName, adminEmail, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar isSuperAdmin={isSuperAdmin} collapsed={collapsed} onCollapsedChange={setCollapsed} />

      <div className={`flex flex-1 flex-col transition-[margin] duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-60'}`}>
        <AdminHeader adminName={adminName} adminEmail={adminEmail} />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6">
          {children}
        </main>
      </div>

      <MobileBottomNav isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
