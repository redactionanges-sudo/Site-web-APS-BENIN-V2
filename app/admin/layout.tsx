'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Pour les pages d'authentification publique (/admin/login, etc.), fond opaque sombre dédié
  const publicAuthRoutes = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];
  if (publicAuthRoutes.includes(pathname)) {
    return (
      <div className="relative z-30 min-h-screen bg-gray-950 isolate">
        {children}
      </div>
    );
  }

  // Pour le back-office administratif, fond opaque clair dédié #F9FAFB (z-30 isolate)
  return (
    <div
      className="relative z-30 min-h-screen bg-gray-50 text-gray-900 isolate admin-portal"
      data-admin-portal="true"
    >
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </div>
  );
}
