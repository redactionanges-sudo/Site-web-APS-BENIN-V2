'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { fetchAnalyticsData } from '@/lib/analytics';
import { exportAnalyticsToPDF } from '@/lib/analytics-pdf';
import { useAuth } from '@/lib/auth';
import { supabaseStore } from '@/lib/supabase';
import { AnalyticsPeriodSummary } from '@/types';
import {
  TrendingUp,
  Calendar,
  RefreshCw,
  FileDown,
  Eye,
  Users,
  Phone,
  FileText,
  FolderKanban,
  Newspaper,
  Briefcase,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Database,
  BarChart2,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  const [summary, setSummary] = useState<AnalyticsPeriodSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await fetchAnalyticsData(
        period,
        period === 'custom' ? customRange : undefined
      );

      setSummary(data);
      setLastRefreshedAt(new Date());

      if (isManualRefresh) {
        showToast('success', 'Statistiques actualisées avec les données les plus récentes.');
      }
    } catch (err: any) {
      console.error('Erreur chargement analytics:', err);
      setError(err.message || 'Impossible de charger les statistiques du site.');
      showToast('error', err.message || 'Erreur lors du chargement des statistiques.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRange.start || !customRange.end) {
      showToast('error', 'Veuillez renseigner les dates de début et de fin.');
      return;
    }
    if (new Date(customRange.start) > new Date(customRange.end)) {
      showToast('error', 'La date de début ne peut pas être postérieure à la date de fin.');
      return;
    }
    loadData();
  };

  const handleExportPDF = async () => {
    if (!summary || !summary.hasData || summary.totalPageViews === 0) {
      showToast('error', 'Aucune donnée collectée pour cette période. Impossible d’exporter un rapport vide.');
      return;
    }

    try {
      setExportingPdf(true);
      const settings = await supabaseStore.getSiteSettings();

      exportAnalyticsToPDF({
        summary,
        orgName: settings?.site_name || 'AGISSONS POUR SAUVER (APS-BÉNIN)',
        slogan: 'Pour un monde plus juste et égalitaire',
        generatedByName: user?.full_name || user?.email || 'Administrateur',
      });

      showToast('success', 'Rapport statistique PDF téléchargé avec succès.');
    } catch (err: any) {
      console.error('Erreur génération PDF:', err);
      showToast('error', err.message || 'Échec de la génération du PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  // Max value for daily chart scaling
  const maxDailyViews = useMemo(() => {
    if (!summary?.trafficByDate?.length) return 1;
    return Math.max(...summary.trafficByDate.map((d) => d.pageViews), 1);
  }, [summary]);

  return (
    <AdminAuthGuard requiredRole="editor">
      <div className="space-y-6 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-bottom-4 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-700/80'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-700/80'
                : 'bg-stone-900/95 text-stone-200 border-stone-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-sky-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Header */}
        <AdminHeader
          title="Statistiques & Fréquentation du Site"
          description="Mesures réelles et vérifiables des visites, consultations et interactions des utilisateurs sur le site public."
        />

        {/* Distinction Banner: Real Web Traffic vs Institutional Key Figures */}
        <div className="bg-gradient-to-r from-purple-950/50 via-gray-900 to-orange-950/40 border border-purple-900/50 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-gray-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-900/80 border border-purple-700/70 flex items-center justify-center shrink-0 text-purple-300">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>Mesure réelle de fréquentation du site web</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Zero-PII & Éthique
                </span>
              </div>
              <p className="text-gray-400 mt-0.5 leading-relaxed">
                Ce module analyse le trafic réel (pages consultées, lectures de projets/actualités, téléchargements de rapports, clics d'appel au siège).
                Il se distingue des{' '}
                <Link
                  href="/admin/statistiques"
                  className="text-orange-400 font-semibold underline underline-offset-2 hover:text-orange-300"
                >
                  Chiffres Clés institutionnels
                </Link>{' '}
                (bénéficiaires, communes, impact de l'ONG affichés sur l'accueil).
              </p>
            </div>
          </div>
          <Link
            href="/admin/statistiques"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-semibold shrink-0 transition"
          >
            <span>Voir les Chiffres Clés ONG</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Controls Bar: Filters, Refresh, Export PDF */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Period selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FF8C00]" />
              Période :
            </span>
            {(
              [
                { id: '7d', label: '7 jours' },
                { id: '30d', label: '30 jours' },
                { id: '90d', label: '90 jours' },
                { id: 'custom', label: 'Personnalisée' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  period === opt.id
                    ? 'bg-[#92278F] text-white shadow-lg shadow-purple-900/40 ring-1 ring-purple-400'
                    : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700/80 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Action buttons: Refresh + Export PDF */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-800">
            {lastRefreshedAt && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                Actualisé à {lastRefreshedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}

            <button
              onClick={() => loadData(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-200 border border-gray-700 text-xs font-semibold transition disabled:opacity-50"
              title="Récupérer les données les plus récentes sans réinitialisation"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={exportingPdf || loading || !summary?.hasData || summary?.totalPageViews === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                !summary?.hasData || summary?.totalPageViews === 0
                  ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-60'
                  : 'bg-[#FF8C00] hover:bg-[#e67e00] text-gray-950 font-extrabold shadow-orange-950/40 hover:shadow-orange-900/60 active:scale-95'
              }`}
              title={
                !summary?.hasData || summary?.totalPageViews === 0
                  ? 'Aucune donnée collectée à exporter'
                  : 'Télécharger un rapport statistique complet en PDF A4'
              }
            >
              <FileDown className="w-4 h-4 shrink-0" />
              <span>{exportingPdf ? 'Génération du PDF...' : 'Exporter en PDF'}</span>
            </button>
          </div>
        </div>

        {/* Custom Range Picker Form */}
        {period === 'custom' && (
          <form
            onSubmit={handleApplyCustomRange}
            className="bg-gray-900/90 border border-purple-900/40 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs"
          >
            <span className="font-semibold text-gray-300">Intervalle personnalisé :</span>
            <div className="flex items-center gap-2">
              <label htmlFor="start-date" className="text-gray-400">Du :</label>
              <input
                id="start-date"
                type="date"
                value={customRange.start}
                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#FF8C00]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="end-date" className="text-gray-400">Au :</label>
              <input
                id="end-date"
                type="date"
                value={customRange.end}
                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#FF8C00]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-[#92278F] hover:bg-[#7b1f78] text-white font-bold transition"
            >
              Appliquer la période
            </button>
          </form>
        )}

        {/* Loading State */}
        {loading && !refreshing && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-purple-900 border-t-[#FF8C00] animate-spin mx-auto" />
            <p className="text-gray-300 font-medium text-sm">Récupération des métriques réelles en cours...</p>
            <p className="text-gray-500 text-xs">Agrégation des événements réels de fréquentation</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-6 text-rose-200 space-y-2">
            <div className="flex items-center gap-2.5 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Erreur lors du chargement des statistiques</span>
            </div>
            <p className="text-xs text-rose-300/90">{error}</p>
            <button
              onClick={() => loadData(true)}
              className="mt-3 px-3 py-1.5 bg-rose-900 hover:bg-rose-850 rounded-lg text-xs font-semibold text-white transition"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Empty State (Explicit requirement: "Aucune donnée collectée pour cette période") */}
        {!loading && !error && summary && (!summary.hasData || summary.totalPageViews === 0) && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-800/80 border border-gray-700 flex items-center justify-center mx-auto text-gray-400">
              <BarChart2 className="w-7 h-7 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Aucune donnée collectée pour cette période</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                Aucune visite, consultation de projet, téléchargement ni clic d'action n'a encore été enregistré pour l'intervalle sélectionné ({summary.period}).
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setPeriod('90d')}
                className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-semibold text-gray-200 transition"
              >
                Élargir à 90 jours
              </button>
              <button
                onClick={() => setShowSqlGuide(!showSqlGuide)}
                className="px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800 text-xs font-semibold text-purple-200 transition inline-flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <span>Vérifier la table Supabase analytics_events</span>
              </button>
            </div>
          </div>
        )}

        {/* Real Data Dashboard View */}
        {!loading && summary && summary.hasData && summary.totalPageViews > 0 && (
          <div className="space-y-6">
            {/* 1. KEY KPI CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Pages Views */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-purple-600/50 transition">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pages Vues</span>
                  <Eye className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {summary.totalPageViews.toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  Consultations réelles
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#92278F]" />
              </div>

              {/* Unique Sessions / Visitors */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-orange-500/50 transition">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Sessions</span>
                  <Users className="w-4 h-4 text-[#FF8C00]" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {summary.totalSessions.toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  Sessions uniques anonymes
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF8C00]" />
              </div>

              {/* Call Headquarters Clicks */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-amber-500/50 transition">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Appels Siège</span>
                  <Phone className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {summary.callHeadquartersClicks.toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  Clics CTA officiel
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
              </div>

              {/* Document Downloads */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-sky-500/50 transition">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Documents</span>
                  <FileText className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {summary.documentDownloads.toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  Téléchargements PDF
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
              </div>

              {/* Project Views */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-emerald-500/50 transition">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Projets Lus</span>
                  <FolderKanban className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {summary.projectViews.toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  Fiches projets consultées
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
              </div>

              {/* News Views */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-indigo-500/50 transition">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Actualités</span>
                  <Newspaper className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {summary.newsViews.toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  Articles & communiqués
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
              </div>
            </div>

            {/* 2. TRAFFIC OVER TIME CHART */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#FF8C00]" />
                    <span>Évolution du Trafic Quotidien</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Consultations de pages (violet) et sessions uniques (orange) mesurées par jour
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#92278F]" />
                    <span className="text-gray-300 font-medium">Pages vues</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#FF8C00]" />
                    <span className="text-gray-300 font-medium">Sessions</span>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Bar Chart */}
              {summary.trafficByDate.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  Aucune variation quotidienne enregistrée
                </div>
              ) : (
                <div className="pt-2">
                  <div className="h-48 flex items-end gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {summary.trafficByDate.map((day) => {
                      const pvHeight = Math.max((day.pageViews / maxDailyViews) * 100, 4);
                      const sessHeight = Math.max((day.sessions / maxDailyViews) * 100, 3);
                      const label = day.date.slice(5); // MM-DD

                      return (
                        <div
                          key={day.date}
                          className="flex-1 min-w-[28px] max-w-[48px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                        >
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-12 z-20 bg-gray-950 text-white border border-gray-700 px-2.5 py-1.5 rounded-lg text-[10px] shadow-xl whitespace-nowrap">
                            <div className="font-bold text-[#FF8C00]">{day.date}</div>
                            <div>{day.pageViews} vues • {day.sessions} sessions</div>
                          </div>

                          {/* Bars */}
                          <div className="w-full flex items-end justify-center gap-0.5 h-full pb-1">
                            {/* PageViews Bar */}
                            <div
                              style={{ height: `${pvHeight}%` }}
                              className="w-1/2 bg-[#92278F] hover:bg-purple-600 rounded-t transition-all"
                            />
                            {/* Sessions Bar */}
                            <div
                              style={{ height: `${sessHeight}%` }}
                              className="w-1/2 bg-[#FF8C00] hover:bg-orange-400 rounded-t transition-all"
                            />
                          </div>

                          {/* Date Label */}
                          <span className="text-[9px] text-gray-400 group-hover:text-white truncate block">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. TWO COLUMNS: TOP PAGES & TECHNICAL BREAKDOWN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Pages */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="border-b border-gray-800 pb-3">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-400" />
                    <span>Pages les Plus Consultées</span>
                  </h3>
                  <p className="text-xs text-gray-400">Classement réel des URLs et titres les plus visités</p>
                </div>

                {summary.topPages.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">Aucune page enregistrée</p>
                ) : (
                  <div className="space-y-2.5">
                    {summary.topPages.map((page, idx) => (
                      <div
                        key={page.path}
                        className="bg-gray-950/80 border border-gray-850 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-md bg-gray-800 text-gray-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-white truncate block">
                              {page.title || page.path}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono truncate block">
                              {page.path}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-white font-mono">
                            {page.views.toLocaleString('fr-FR')} vues
                          </div>
                          <div className="text-[10px] text-purple-400 font-semibold">
                            {page.percentage}% du total
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Devices & Sources Breakdown */}
              <div className="space-y-6">
                {/* Devices */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-emerald-400" />
                      <span>Répartition par Type d'Appareil</span>
                    </h3>
                    <p className="text-xs text-gray-400">Ordinateur, mobile et tablette réels détectés</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {summary.deviceBreakdown.map((dev) => {
                      const Icon =
                        dev.device === 'mobile'
                          ? Smartphone
                          : dev.device === 'desktop'
                          ? Monitor
                          : Tablet;
                      const label =
                        dev.device === 'mobile'
                          ? 'Mobiles'
                          : dev.device === 'desktop'
                          ? 'Ordinateurs'
                          : 'Tablettes';

                      return (
                        <div
                          key={dev.device}
                          className="bg-gray-950/80 border border-gray-850 rounded-xl p-3 text-center space-y-1.5"
                        >
                          <Icon className="w-5 h-5 text-gray-400 mx-auto" />
                          <div className="text-base font-extrabold text-white">
                            {dev.percentage}%
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {label}
                          </div>
                          <div className="text-[9px] text-gray-500 font-mono">
                            {dev.count} interactions
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Traffic Sources */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Globe className="w-4 h-4 text-orange-400" />
                      <span>Sources de Trafic & Référents</span>
                    </h3>
                    <p className="text-xs text-gray-400">Origine des visiteurs (Direct, Réseaux, Moteurs)</p>
                  </div>

                  <div className="space-y-2">
                    {summary.sourcesBreakdown.map((src) => (
                      <div
                        key={src.source}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-950/60"
                      >
                        <span className="font-medium text-gray-200">{src.source}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 font-mono">{src.count}</span>
                          <span className="font-bold text-[#FF8C00] w-10 text-right">
                            {src.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. ACTIONS & USER ENGAGEMENT BREAKDOWN */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="border-b border-gray-800 pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF8C00]" />
                  <span>Actions & Événements d'Engagement</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Mesure précise des clics d'action des citoyens, partenaires et bénéficiaires
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {summary.actionsBreakdown.map((act) => (
                  <div
                    key={act.action}
                    className="bg-gray-950/80 border border-gray-850 rounded-xl p-3.5 space-y-1"
                  >
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      {act.label}
                    </span>
                    <div className="text-xl font-extrabold text-white font-mono">
                      {act.count.toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. DATABASE TABLE SETUP ACCORDION / HELPER */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 sm:p-5 text-xs text-gray-400 space-y-3">
          <button
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="w-full flex items-center justify-between text-left font-semibold text-gray-300 hover:text-white transition"
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Détails techniques : Table Supabase analytics_events & Politique RLS</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-orange-400">
              {showSqlGuide ? 'Masquer' : 'Afficher'}
            </span>
          </button>

          {showSqlGuide && (
            <div className="pt-2 border-t border-gray-800 space-y-3 font-mono text-[11px] text-gray-300">
              <p className="font-sans text-xs text-gray-400 leading-relaxed">
                La table <code className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded">analytics_events</code> stocke les événements anonymisés. Le script complet se trouve dans <code className="text-orange-300">supabase-migration-analytics.sql</code> :
              </p>
              <pre className="p-3 bg-gray-950 rounded-xl border border-gray-800 overflow-x-auto text-gray-300 text-[11px]">
{`CREATE TABLE IF NOT EXISTS public.analytics_events (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    device_type TEXT DEFAULT 'desktop',
    browser TEXT,
    country TEXT DEFAULT 'BJ',
    target_id TEXT,
    target_title TEXT,
    metadata JSONB
);

-- RLS & Privilèges
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can record analytics events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view analytics" ON public.analytics_events FOR SELECT TO authenticated USING (public.is_editor());`}
              </pre>
              <div className="font-sans flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>Exécutable directement dans l'onglet SQL du Dashboard Supabase.</span>
                <Link
                  href="/admin/database"
                  className="text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Ouvrir l'outil SQL Back-Office</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminAuthGuard>
  );
}
