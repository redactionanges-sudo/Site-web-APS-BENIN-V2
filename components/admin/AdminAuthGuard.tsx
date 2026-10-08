'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AdminSidebar } from './AdminSidebar';
import { ShieldAlert } from 'lucide-react';

const AdminLayoutContext = createContext<boolean>(false);

export const AdminLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AdminLayoutContext.Provider value={true}>
      {children}
    </AdminLayoutContext.Provider>
  );
};

interface AdminAuthGuardProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({
  children,
  requireSuperAdmin = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isSuperAdmin, canAccessBackOffice } = useAuth();
  const isInsideLayout = useContext(AdminLayoutContext);

  const isPublicAuthPage = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'].includes(pathname);

  useEffect(() => {
    if (!loading && !canAccessBackOffice && !isPublicAuthPage) {
      router.push('/admin/login');
    }
  }, [loading, canAccessBackOffice, router, pathname, isPublicAuthPage]);

  // Sur les pages d'authentification, ne pas afficher le guard administratif
  if (isPublicAuthPage) {
    return <>{children}</>;
  }

  if (loading) {
    if (isInsideLayout) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500">
          <div className="w-8 h-8 border-3 border-[#92278F] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-gray-500">Vérification de la session administrative...</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#92278F] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-gray-400">Vérification de la session administrative...</p>
      </div>
    );
  }

  if (!canAccessBackOffice) {
    return null;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Accès Restreint</h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-md mb-6">
          Cette section est strictement réservée au rôle <strong>Super Administrateur</strong>. Votre profil actuel ne dispose pas des privilèges nécessaires.
        </p>
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="px-4 py-2 rounded-lg bg-[#92278F] text-white text-xs font-bold hover:bg-[#741772] transition-colors"
        >
          Retourner au tableau de bord
        </button>
      </div>
    );
  }

  // Si on est déjà dans le layout persistant, afficher directement les enfants
  if (isInsideLayout) {
    return <>{children}</>;
  }

  // Structure maîtresse persistante avec Sidebar unique
  return (
    <div className="min-h-screen flex bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminLayoutProvider>
          {children}
        </AdminLayoutProvider>
      </div>
    </div>
  );
};
