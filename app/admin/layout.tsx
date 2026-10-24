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

  // Pour les pages d'authentification publique, ne pas monter le guard ni la sidebar
  const publicAuthRoutes = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];
  if (publicAuthRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
