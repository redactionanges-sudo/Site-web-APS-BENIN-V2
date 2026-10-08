'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabaseStore } from '@/lib/supabase';
import {
  FolderKanban,
  Newspaper,
  Briefcase,
  Image as ImageIcon,
  Handshake,
  Mail,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    projectsCount: 0,
    newsCount: 0,
    oppCount: 0,
    photosCount: 0,
    videosCount: 0,
    partnersCount: 0,
    messagesCount: 0,
    unreadMessages: 0,
    draftsCount: 0,
  });

  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      const data = await supabaseStore.getDashboardStats();
      if (!isMounted) return;

      setStats({
        projectsCount: data.projectsCount,
        newsCount: data.newsCount,
        oppCount: data.oppCount,
        photosCount: data.photosCount,
        videosCount: data.videosCount,
        partnersCount: data.partnersCount,
        messagesCount: data.messagesCount,
        unreadMessages: data.unreadMessages,
        draftsCount: data.draftsCount,
      });

      setRecentNews(data.recentNews);
      setRecentMessages(data.recentMessages);
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Tableau de Bord Administratif"
        subtitle="Vue synthétique des activités, contenus et indicateurs du site APS-BÉNIN"
      />

      <main className="p-6 space-y-8 max-w-7xl">
        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Projets
              </span>
              <span className="text-2xl font-extrabold text-gray-900 font-heading">
                {stats.projectsCount}
              </span>
              <Link href="/admin/projets" className="text-[11px] text-[#92278F] hover:underline font-semibold block mt-1">
                Gérer les projets →
              </Link>
            </div>
            <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center text-[#92278F]">
              <FolderKanban className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Actualités
              </span>
              <span className="text-2xl font-extrabold text-gray-900 font-heading">
                {stats.newsCount}
              </span>
              <span className="text-[11px] text-gray-400 font-medium block mt-1">
                dont {stats.draftsCount} brouillon(s)
              </span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF8C00]">
              <Newspaper className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Opportunités
              </span>
              <span className="text-2xl font-extrabold text-gray-900 font-heading">
                {stats.oppCount}
              </span>
              <Link href="/admin/opportunites" className="text-[11px] text-[#92278F] hover:underline font-semibold block mt-1">
                Consulter les offres →
              </Link>
            </div>
            <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center text-[#92278F]">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Messages reçus
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-gray-900 font-heading">
                  {stats.messagesCount}
                </span>
                {stats.unreadMessages > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {stats.unreadMessages} non lu(s)
                  </span>
                )}
              </div>
              <Link href="/admin/messages" className="text-[11px] text-[#92278F] hover:underline font-semibold block mt-1">
                Boîte de réception →
              </Link>
            </div>
            <div className="w-11 h-11 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <Mail className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Secondary KPI bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-[#92278F]" />
            <div>
              <span className="text-sm font-bold text-gray-900">{stats.photosCount} photos</span>
              <p className="text-[10px] text-gray-500">Médiathèque active</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
            <Video className="w-5 h-5 text-[#FF8C00]" />
            <div>
              <span className="text-sm font-bold text-gray-900">{stats.videosCount} vidéos</span>
              <p className="text-[10px] text-gray-500">Reportages YouTube & stockage</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
            <Handshake className="w-5 h-5 text-[#92278F]" />
            <div>
              <span className="text-sm font-bold text-gray-900">{stats.partnersCount} partenaires</span>
              <p className="text-[10px] text-gray-500">Techniques & Financiers</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#FF8C00]" />
            <div>
              <span className="text-sm font-bold text-gray-900">{stats.draftsCount} en attente</span>
              <p className="text-[10px] text-gray-500">Brouillons à réviser</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
            Actions Rapides d’Édition
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/projets"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#FF8C00]" />
              <span>Nouveau Projet</span>
            </Link>

            <Link
              href="/admin/actualites"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#FF8C00]" />
              <span>Rédiger une Actualité</span>
            </Link>

            <Link
              href="/admin/opportunites"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#FF8C00]" />
              <span>Publier une Opportunité</span>
            </Link>

            <Link
              href="/admin/mediatheque"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-[#92278F]" />
              <span>Ajouter un Média</span>
            </Link>

            <Link
              href="/admin/messages"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#d97500] text-xs font-bold transition-colors border border-orange-200"
            >
              <Mail className="w-4 h-4" />
              <span>Traiter les Messages ({stats.unreadMessages})</span>
            </Link>
          </div>
        </div>

        {/* Dual Lists: Recent News & Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent News */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-[#92278F]" />
                <span>Dernières publications</span>
              </h3>
              <Link href="/admin/actualites" className="text-xs text-[#92278F] hover:underline font-semibold">
                Tout voir →
              </Link>
            </div>

            <div className="space-y-3">
              {recentNews.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-purple-50/50 transition-colors border border-gray-100"
                >
                  <div className="pr-4">
                    <span className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-wider block">
                      {item.category_fr}
                    </span>
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">
                      {item.title_fr}
                    </h4>
                    <span className="text-[10px] text-gray-400">
                      Statut : <strong>{item.status}</strong>
                    </span>
                  </div>

                  <Link
                    href="/admin/actualites"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#92278F] hover:bg-white"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FF8C00]" />
                <span>Derniers messages du formulaire</span>
              </h3>
              <Link href="/admin/messages" className="text-xs text-[#92278F] hover:underline font-semibold">
                Boîte de réception →
              </Link>
            </div>

            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-orange-50/40 transition-colors border border-gray-100 flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-gray-900">
                        {msg.firstname} {msg.name}
                      </span>
                      {msg.status === 'unread' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                          Non lu
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#92278F] line-clamp-1">
                      {msg.subject}
                    </p>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                      {msg.message}
                    </p>
                  </div>

                  <Link
                    href="/admin/messages"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#92278F]"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </AdminAuthGuard>
  );
}
