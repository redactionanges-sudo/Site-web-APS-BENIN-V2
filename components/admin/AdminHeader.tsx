'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Globe, Database, ExternalLink, LogOut } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  actionButton,
}) => {
  const { user, logout, isSuperAdmin } = useAuth();
  const { language, setLanguage } = useLanguage();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-heading">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        {/* Backend status pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
            isSupabaseConfigured
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-purple-50 text-[#92278F] border-purple-200'
          }`}
          title={
            isSupabaseConfigured
              ? 'Connecté au cloud Supabase'
              : 'Mode local réactif actif. Pour connecter Supabase, renseignez les clés dans .env ou Paramètres.'
          }
        >
          <Database className="w-3 h-3 text-[#FF8C00]" />
          <span>{isSupabaseConfigured ? 'Supabase Connecté' : 'Stockage Réactif Actif'}</span>
        </div>

        {/* Action Button if provided */}
        {actionButton}

        {/* Public site link */}
        <Link
          href="/"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>Site Public</span>
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </Link>
      </div>
    </header>
  );
};
