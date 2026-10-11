'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabaseStore, DashboardStatsData } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
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
  RotateCw,
  ShieldCheck,
  Lock,
  BookOpen,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStatsData>({
    projectsTotal: 0,
    projectsPublished: 0,
    newsTotal: 0,
    newsPublished: 0,
    newsDrafts: 0,
    oppsTotal: 0,
    oppsPublished: 0,
    oppsClosed: 0,
    mediaTotal: 0,
    photosCount: 0,
    videosCount: 0,
    partnersCount: 0,
    canAccessMessages: true,
    messagesTotal: 0,
    unreadMessages: 0,
    recentNews: [],
    recentMessages: [],
    lastUpdated: '',
    projectsCount: 0,
    newsCount: 0,
    oppCount: 0,
    messagesCount: 0,
    draftsCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const isRefreshingRef = useRef(false);

  // Centralized fetcher
  const fetchStats = useCallback(
    async (isManual: boolean = false) => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;

      if (isManual) {
        setRefreshing(true);
        setRefreshError(null);
      }

      try {
        const data = await supabaseStore.getDashboardStats(user?.role, isManual);
        setStats(data);
        setRefreshError(null);
      } catch (err: any) {
        console.warn('Dashboard stats refresh error:', err);
        if (isManual) {
          setRefreshError(
            'Impossible d’actualiser les statistiques pour le moment. Les données actuelles restent affichées.'
          );
          setTimeout(() => setRefreshError(null), 6000);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        isRefreshingRef.current = false;
      }
    },
    [user]
  );

  // Auto-refresh: initial on mount + reasonable periodic timer (every 60s)
  useEffect(() => {
    let isMounted = true;

    // 1. Initial load
    fetchStats(false);

    // 2. Periodic background refresh (every 60 seconds)
    const intervalId = setInterval(() => {
      if (isMounted) {
        fetchStats(false);
      }
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchStats]);

  const formatLastUpdated = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const refreshButton = (
    <div className="flex items-center gap-2">
      {stats.lastUpdated && (
        <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium">
          <Clock className="w-3 h-3 text-gray-400" />
          <span>Actualisé à {formatLastUpdated(stats.lastUpdated)}</span>
        </span>
      )}
      <button
        type="button"
        onClick={() => fetchStats(true)}
        disabled={refreshing}
        title="Actualiser les statistiques en direct"
        aria-label="Actualiser les statistiques"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs ${
          refreshing
            ? 'bg-purple-50 text-[#92278F] border-purple-200 cursor-not-allowed opacity-80'
            : 'bg-white hover:bg-purple-50 text-gray-700 hover:text-[#92278F] border-gray-300 hover:border-purple-300 active:scale-95'
        }`}
      >
        <RotateCw
          className={`w-3.5 h-3.5 text-[#FF8C00] transition-transform ${
            refreshing ? 'animate-spin' : ''
          }`}
        />
        <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
      </button>
    </div>
  );

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Tableau de Bord Administratif"
        subtitle="Vue synthétique en temps réel des activités, contenus et indicateurs du site APS-BÉNIN"
        actionButton={refreshButton}
      />

      <main className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-7xl">
        {/* Discrete Error Alert if manual refresh failed */}
        {refreshError && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#FF8C00] shrink-0" />
              <span>{refreshError}</span>
            </div>
            <button
              type="button"
              onClick={() => setRefreshError(null)}
              className="text-[11px] font-bold text-amber-800 underline hover:no-underline"
            >
              Ignorer
            </button>
          </div>
        )}

        {/* Primary KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Projects KPI */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-purple-200 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Projets
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-gray-900 font-heading">
                    {stats.projectsTotal}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    total
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-[#92278F] shrink-0 border border-purple-100">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {stats.projectsPublished} publié(s)
              </span>
              <Link
                href="/admin/projets"
                className="text-[11px] text-[#92278F] hover:underline font-bold"
              >
                Gérer →
              </Link>
            </div>
          </div>

          {/* 2. News KPI */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-orange-200 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Actualités
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-gray-900 font-heading">
                    {stats.newsTotal}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    total
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0 border border-orange-100">
                <Newspaper className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-green-700 font-semibold">
                  {stats.newsPublished} publiée(s)
                </span>
                {stats.newsDrafts > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    {stats.newsDrafts} brouillon(s)
                  </span>
                )}
              </div>
              <Link
                href="/admin/actualites"
                className="text-[11px] text-[#92278F] hover:underline font-bold"
              >
                Gérer →
              </Link>
            </div>
          </div>

          {/* 3. Opportunities KPI */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-purple-200 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Opportunités
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-gray-900 font-heading">
                    {stats.oppsTotal}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    offres
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-[#92278F] shrink-0 border border-purple-100">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-gray-600">
                <strong className="text-[#92278F]">{stats.oppsPublished}</strong> ouverte(s) • {stats.oppsClosed} close(s)
              </span>
              <Link
                href="/admin/opportunites"
                className="text-[11px] text-[#92278F] hover:underline font-bold"
              >
                Offres →
              </Link>
            </div>
          </div>

          {/* 4. Contact Messages KPI (Role-guarded) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-red-200 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Messages reçus
                </span>
                {stats.canAccessMessages ? (
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-gray-900 font-heading">
                      {stats.messagesTotal ?? 0}
                    </span>
                    {(stats.unreadMessages ?? 0) > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                        {stats.unreadMessages} non lu(s)
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Accès administrateur</span>
                  </div>
                )}
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0 border border-red-100">
                <Mail className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              {stats.canAccessMessages ? (
                <>
                  <span className="text-[11px] text-gray-500">
                    Formulaire public de contact
                  </span>
                  <Link
                    href="/admin/messages"
                    className="text-[11px] text-[#92278F] hover:underline font-bold"
                  >
                    Boîte →
                  </Link>
                </>
              ) : (
                <span className="text-[11px] text-gray-400 italic">
                  Réservé au rôle Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Secondary KPI Bar: Mediatheque, Partners, Drafts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-[#92278F] shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 block font-heading">
                {stats.mediaTotal} médias
              </span>
              <p className="text-[10px] text-gray-500">
                {stats.photosCount} photos en médiathèque
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 block font-heading">
                {stats.videosCount} vidéos
              </span>
              <p className="text-[10px] text-gray-500">
                Reportages & web TV
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-[#92278F] shrink-0">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 block font-heading">
                {stats.partnersCount} partenaires
              </span>
              <p className="text-[10px] text-gray-500">
                Techniques & financiers
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 block font-heading">
                {stats.newsDrafts} brouillon(s)
              </span>
              <p className="text-[10px] text-gray-500">
                En attente de parution
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#92278F]" />
              <span>Actions Rapides d’Édition</span>
            </h2>
            <span className="text-[11px] text-gray-400 font-medium">
              Rôle connecté : <strong className="capitalize text-gray-700">{user?.role || 'Éditeur'}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/projets"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-2xs active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#FF8C00]" />
              <span>Nouveau Projet</span>
            </Link>

            <Link
              href="/admin/actualites"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-2xs active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#FF8C00]" />
              <span>Rédiger une Actualité</span>
            </Link>

            <Link
              href="/admin/opportunites"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-2xs active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#FF8C00]" />
              <span>Publier une Offre</span>
            </Link>

            <Link
              href="/admin/pages-institutionnelles"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#d97500] border border-orange-200 text-xs font-bold transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>Éditer les Pages Institutionnelles</span>
            </Link>

            <Link
              href="/admin/mediatheque"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#92278F] border border-purple-200 text-xs font-bold transition-all active:scale-95"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Gérer la Médiathèque</span>
            </Link>

            {stats.canAccessMessages && (
              <Link
                href="/admin/messages"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#d97500] border border-orange-200 text-xs font-bold transition-all active:scale-95"
              >
                <Mail className="w-4 h-4" />
                <span>Boîte Messages ({(stats.unreadMessages ?? 0)} non lus)</span>
              </Link>
            )}
          </div>
        </div>

        {/* Dual Lists: Recent News & Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent News */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-[#92278F]" />
                <span>Dernières publications d’actualités</span>
              </h3>
              <Link
                href="/admin/actualites"
                className="text-xs text-[#92278F] hover:underline font-bold"
              >
                Tout voir →
              </Link>
            </div>

            <div className="space-y-2.5">
              {stats.recentNews && stats.recentNews.length > 0 ? (
                stats.recentNews.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-purple-50/50 transition-colors border border-gray-100"
                  >
                    <div className="pr-4 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-wider truncate">
                          {item.category_fr}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            item.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1">
                        {item.title_fr}
                      </h4>
                    </div>

                    <Link
                      href="/admin/actualites"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#92278F] hover:bg-white transition-colors shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-4 text-center">
                  Aucune actualité enregistrée pour le moment.
                </p>
              )}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FF8C00]" />
                <span>Derniers messages reçus</span>
              </h3>
              {stats.canAccessMessages ? (
                <Link
                  href="/admin/messages"
                  className="text-xs text-[#92278F] hover:underline font-bold"
                >
                  Boîte de réception →
                </Link>
              ) : null}
            </div>

            {stats.canAccessMessages ? (
              <div className="space-y-2.5">
                {stats.recentMessages && stats.recentMessages.length > 0 ? (
                  stats.recentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-xl bg-gray-50 hover:bg-orange-50/40 transition-colors border border-gray-100 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-gray-900 truncate">
                            {msg.firstname} {msg.name}
                          </span>
                          {msg.status === 'unread' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 shrink-0">
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
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#92278F] shrink-0"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    Aucun message dans la boîte de réception.
                  </p>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Lock className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-semibold text-gray-600">
                  Accès restreint aux administrateurs
                </p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  La lecture des messages des usagers est strictement réservée aux membres de la direction exécutive et aux administrateurs.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </AdminAuthGuard>
  );
}
