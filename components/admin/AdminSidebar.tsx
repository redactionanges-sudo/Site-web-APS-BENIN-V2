'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabaseStore } from '@/lib/supabase';
import {
  LayoutDashboard,
  FolderKanban,
  Newspaper,
  Briefcase,
  Image as ImageIcon,
  ShieldCheck,
  Handshake,
  Users,
  Building,
  FileText,
  Mail,
  BarChart3,
  Bell,
  Settings,
  UserCog,
  Database,
  ExternalLink,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, isSuperAdmin } = useAuth();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    supabaseStore.getUnreadMessagesCount().then((count) => {
      if (isMounted) setUnreadMsgCount(count);
    });

    supabaseStore.getSettings().then((s) => {
      if (isMounted && s?.logo_url) {
        setLogoUrl(s.logo_url);
      }
    });

    // Rafraîchissement périodique (toutes les 5 minutes) plutôt qu'à chaque clic de navigation
    const interval = setInterval(() => {
      supabaseStore.getUnreadMessagesCount().then((count) => {
        if (isMounted) setUnreadMsgCount(count);
      });
    }, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin';
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: '/admin', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/admin/projets', label: 'Projets (CMS)', icon: <FolderKanban className="w-4 h-4" /> },
    { href: '/admin/actualites', label: 'Actualités (CMS)', icon: <Newspaper className="w-4 h-4" /> },
    { href: '/admin/opportunites', label: 'Opportunités', icon: <Briefcase className="w-4 h-4" /> },
    { href: '/admin/mediatheque', label: 'Médiathèque', icon: <ImageIcon className="w-4 h-4" /> },
    { href: '/admin/domaines', label: "Domaines d'action", icon: <ShieldCheck className="w-4 h-4" /> },
    { href: '/admin/partenaires', label: 'Partenaires', icon: <Handshake className="w-4 h-4" /> },
    { href: '/admin/equipe', label: 'Équipe', icon: <Users className="w-4 h-4" /> },
    { href: '/admin/gouvernance', label: 'Gouvernance', icon: <Building className="w-4 h-4" /> },
    { href: '/admin/documents', label: 'Documents & Rapports', icon: <FileText className="w-4 h-4" /> },
    {
      href: '/admin/messages',
      label: 'Messages Reçus',
      icon: <Mail className="w-4 h-4" />,
      badge: unreadMsgCount > 0 ? unreadMsgCount : undefined,
    },
    { href: '/admin/statistiques', label: 'Chiffres Clés', icon: <BarChart3 className="w-4 h-4" /> },
    { href: '/admin/bandeau', label: 'Bandeau Hero', icon: <Bell className="w-4 h-4 text-[#FF8C00]" /> },
  ];

  const adminOnlyItems = [
    { href: '/admin/parametres', label: 'Paramètres du Site', icon: <Settings className="w-4 h-4" /> },
    { href: '/admin/utilisateurs', label: 'Utilisateurs & Rôles', icon: <UserCog className="w-4 h-4" /> },
    { href: '/admin/database', label: 'Base de Données & SQL', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-gray-950 text-gray-300 min-h-screen flex flex-col justify-between border-r border-gray-800 shrink-0">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            {logoUrl ? (
              <div className="w-9 h-9 rounded-full border-2 border-[#FF8C00] bg-white p-0.5 shadow-sm overflow-hidden flex items-center justify-center shrink-0 relative">
                <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center">
                  <Image
                    src={logoUrl}
                    alt="APS-BÉNIN Logo"
                    fill
                    sizes="36px"
                    className="object-contain p-0.5"
                    referrerPolicy="no-referrer"
                    unoptimized={Boolean(logoUrl.startsWith('data:'))}
                  />
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#92278F] text-white flex items-center justify-center font-extrabold text-sm border-2 border-[#FF8C00] shrink-0">
                APS
              </div>
            )}
            <div>
              <span className="font-extrabold text-sm text-white tracking-wide block font-heading">
                APS-BÉNIN
              </span>
              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">
                Back-Office CMS
              </span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-white truncate line-clamp-1">
              {user?.full_name || 'Administrateur'}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                isSuperAdmin
                  ? 'bg-purple-900 text-purple-200 border border-purple-700'
                  : user?.role === 'admin'
                  ? 'bg-orange-950 text-orange-300 border border-orange-800'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              {isSuperAdmin ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Éditeur'}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 truncate block">
            {user?.email || 'admin@aps-benin.org'}
          </span>
        </div>

        {/* Navigation list */}
        <div className="px-3 py-2 space-y-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Gestion des Contenus
          </span>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive(item.href)
                  ? 'bg-[#92278F] text-white font-bold'
                  : 'hover:bg-gray-900 hover:text-white text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive(item.href) ? 'text-[#FF8C00]' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF8C00] text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {/* Super Admin Section */}
          {isSuperAdmin && (
            <div className="pt-4 mt-2 border-t border-gray-800 space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                Administration Globale
              </span>
              {adminOnlyItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive(item.href)
                      ? 'bg-[#92278F] text-white font-bold'
                      : 'hover:bg-gray-900 hover:text-white text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive(item.href) ? 'text-[#FF8C00]' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-[#FF8C00]" />
            <span>Voir le site public</span>
          </div>
          <ChevronRight className="w-3 h-3 text-gray-600" />
        </Link>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
