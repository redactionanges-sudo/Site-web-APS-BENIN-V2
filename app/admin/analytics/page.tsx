'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { fetchAnalyticsData, trackEvent } from '@/lib/analytics';
import { exportAnalyticsToPDF } from '@/lib/analytics-pdf';
import { useAuth } from '@/lib/auth';
import { AnalyticsPeriodSummary } from '@/types';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  Users,
  Smartphone,
  Monitor,
  Tablet,
  PhoneCall,
  FileDown,
  Compass,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Info,
  Clock,
  Globe,
  Activity,
  Layers,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AnalyticsPeriodSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtres de période
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().substring(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return new Date().toISOString().substring(0, 10);
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'actions' | 'technical'>('overview');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [isFallbackLocal, setIsFallbackLocal] = useState<boolean>(false);
  const [testEventSent, setTestEventSent] = useState<string | null>(null);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const customRange =
        period === 'custom' && customStart && customEnd
          ? { start: customStart, end: customEnd }
          : undefined;

      const data = await fetchAnalyticsData(period, customRange);
      setSummary(data);
      setIsFallbackLocal(Boolean(data.isFallbackLocal));
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Erreur chargement analytics:', err);
      setError(err?.message || 'Impossible de récupérer les statistiques du site.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [period]);

  const handleApplyCustomDates = () => {
    if (!customStart || !customEnd) return;
    if (new Date(customStart) > new Date(customEnd)) {
      setError('La date de début ne peut pas être postérieure à la date de fin.');
      return;
    }
    loadData(false);
  };

  const handleExportPDF = async () => {
    if (!summary) return;
    setExportingPDF(true);
    try {
      await exportAnalyticsToPDF({
        summary,
        generatedBy: user ? `${user.full_name} (${user.email})` : 'Administrateur APS-BÉNIN',
      });
    } catch (err: any) {
      console.error('Erreur export PDF:', err);
      setError('Une erreur est survenue lors de la génération du document PDF.');
    } finally {
      setExportingPDF(false);
    }
  };

  // Test de collecte réelle immédiate
  const handleTriggerTestEvent = async () => {
    try {
      await trackEvent('page_view', {
        path: '/test-verification-audience',
        page_title: 'Test de Vérification de Collecte Réelle',
      });
      setTestEventSent('Événement réel de test enregistré avec succès.');
      setTimeout(() => setTestEventSent(null), 4000);
      await loadData(true);
    } catch {
      setError('Erreur lors de l\'enregistrement de l\'événement test.');
    }
  };

  // Calcul du max pour les graphiques SVG
  const maxDailyViews = useMemo(() => {
    if (!summary?.trafficByDate || summary.trafficByDate.length === 0) return 1;
    return Math.max(...summary.trafficByDate.map((t) => t.pageViews), 1);
  }, [summary]);

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Statistiques & KPI du Site Web"
        subtitle="Mesure d'audience réelle, comportement des usagers et consultation des ressources en ligne"
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Distinction Banner: Web Analytics vs Institutional KPIs */}
        <div className="bg-gradient-to-r from-purple-50 via-white to-blue-50 border border-purple-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#92278F]/10 rounded-xl text-[#92278F] shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Distinction Méthodologique : Audience Web vs Indicateurs Institutionnels
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Ce module mesure <strong className="text-gray-900">la fréquentation réelle du portail web</strong> (visites, pages consultées, clics d'appels et téléchargements). Les chiffres d'impact institutionnel de l'ONG (arbres plantés, personnes formées, communes couvertes) sont quant à eux gérés dans la section{' '}
                <Link href="/admin/statistiques" className="text-[#92278F] font-bold underline hover:text-[#741772]">
                  Chiffres Clés
                </Link>.
              </p>
            </div>
          </div>
          <Link
            href="/admin/statistiques"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-[#92278F] hover:border-[#92278F] shrink-0 transition-colors shadow-2xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#FF8C00]" />
            <span>Voir Chiffres Clés d'Impact</span>
          </Link>
        </div>

        {/* Charte d'intégrité & Tolérance Zéro Données Fictives */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-gray-700">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Engagement d'intégrité :</strong> Aucune donnée fictive, visiteur inventé ou simulation aléatoire. Seules les interactions réelles enregistrées sont affichées.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isFallbackLocal && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                <Activity className="w-3 h-3 text-amber-600" />
                Collecte miroir active
              </span>
            )}
            <button
              onClick={handleTriggerTestEvent}
              type="button"
              className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] transition-colors border border-gray-200"
              title="Génère un événement réel pour tester la chaîne de mesure"
            >
              + Simuler une vraie consultation
            </button>
          </div>
        </div>

        {testEventSent && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{testEventSent}</span>
          </div>
        )}

        {/* Filtres de Période & Actions Principales */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Boutons de période */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider mr-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#92278F]" />
                Période :
              </span>
              {(
                [
                  { id: '7d', label: '7 derniers jours' },
                  { id: '30d', label: '30 derniers jours' },
                  { id: '90d', label: '90 derniers jours' },
                  { id: 'custom', label: 'Personnalisée' },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setPeriod(btn.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    period === btn.id
                      ? 'bg-[#92278F] text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Actions : Actualiser & Exporter PDF */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors border border-gray-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#92278F] ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={exportingPDF || loading || !summary}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${exportingPDF ? 'animate-bounce' : ''}`} />
                <span>{exportingPDF ? 'Génération du PDF...' : 'Exporter en PDF'}</span>
              </button>
            </div>
          </div>

          {/* Sélecteur de date personnalisé si actif */}
          {period === 'custom' && (
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <label htmlFor="custom-start" className="font-semibold text-gray-600">
                  Du :
                </label>
                <input
                  id="custom-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-gray-800 focus:outline-hidden focus:border-[#92278F]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="custom-end" className="font-semibold text-gray-600">
                  Au :
                </label>
                <input
                  id="custom-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-gray-800 focus:outline-hidden focus:border-[#92278F]"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyCustomDates}
                className="px-3 py-1.5 rounded-lg bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold text-xs shadow-2xs transition-colors"
              >
                Filtrer cette plage
              </button>
            </div>
          )}

          {/* Horodatage de dernière actualisation */}
          <div className="text-[11px] text-gray-500 flex items-center justify-between pt-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {lastRefreshedAt ? (
                <>
                  Dernière actualisation effective :{' '}
                  <strong className="text-gray-700">
                    {lastRefreshedAt.toLocaleTimeString('fr-FR')} (le {lastRefreshedAt.toLocaleDateString('fr-FR')})
                  </strong>
                </>
              ) : (
                'En cours de chargement initial...'
              )}
            </span>

            {summary && (
              <span>
                Période couverte : Du <strong>{summary.startDate}</strong> au <strong>{summary.endDate}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Message d'erreur éventuel */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Avertissement</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Indicateur de chargement */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#92278F] animate-spin mx-auto" />
            <p className="text-xs font-semibold text-gray-600">
              Synchronisation des données réelles de fréquentation...
            </p>
          </div>
        ) : !summary || !summary.hasData ? (
          /* État d'absence de données explicite (Règle absolue : aucune donnée fictive) */
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-purple-50 text-[#92278F] rounded-2xl mx-auto flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base font-bold text-gray-900">
                Aucune donnée collectée pour cette période
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Aucun visiteur ou interaction n'a été enregistré entre le{' '}
                <strong className="text-gray-700">{summary?.startDate}</strong> et le{' '}
                <strong className="text-gray-700">{summary?.endDate}</strong>.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Conformément à la déontologie du site, aucun faux visiteur ni chiffre aléatoire n'est généré. La collecte s'active automatiquement dès que des usagers parcourent les pages publiques.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleTriggerTestEvent}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>Tester la collecte réelle maintenant</span>
              </button>
              <Link
                href="/admin/database"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors border border-gray-300"
              >
                <span>Vérifier la table Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* Tableau de bord complet avec données réelles */
          <div className="space-y-6">
            {/* Grille des 6 KPIs Principaux */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#92278F]" />
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Pages Vues
                  </span>
                  <Eye className="w-4 h-4 text-[#92278F]" />
                </div>
                <div className="text-2xl font-black text-gray-900 font-heading">
                  {summary.totalPageViews.toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Consultations totales</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Sessions
                  </span>
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-gray-900 font-heading">
                  {summary.totalSessions.toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Sessions de visite</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FF8C00]" />
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Appeler Siège
                  </span>
                  <PhoneCall className="w-4 h-4 text-[#FF8C00]" />
                </div>
                <div className="text-2xl font-black text-gray-900 font-heading">
                  {summary.callHeadquartersClicks.toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Clics d'appels directs</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Téléchargements
                  </span>
                  <FileDown className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-gray-900 font-heading">
                  {summary.documentDownloads.toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Rapports & documents</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Vues Projets
                  </span>
                  <Layers className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-gray-900 font-heading">
                  {summary.projectViews.toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Fiches projets ouvertes</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500" />
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Actus & Opps
                  </span>
                  <Globe className="w-4 h-4 text-teal-500" />
                </div>
                <div className="text-2xl font-black text-gray-900 font-heading">
                  {(summary.newsViews + summary.opportunityViews).toLocaleString('fr-FR')}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Articles & avis lus</div>
              </div>
            </div>

            {/* Onglets de navigation détaillée */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-[#92278F] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Vue d'ensemble & Trafic
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pages')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'pages'
                    ? 'bg-[#92278F] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Pages les plus consultées ({summary.topPages?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('actions')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'actions'
                    ? 'bg-[#92278F] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Interactions & Clics ({summary.actionsBreakdown?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('technical')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'technical'
                    ? 'bg-[#92278F] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Appareils & Sources
              </button>
            </div>

            {/* Contenu de l'onglet Vue d'ensemble */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Graphique de l'évolution du trafic */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#92278F]" />
                        <span>Évolution Chronologique du Trafic par Jour</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Nombre réel de pages vues et sessions observées sur chaque date
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-xs bg-[#92278F]" />
                        <span className="text-gray-600">Pages Vues</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-xs bg-[#FF8C00]" />
                        <span className="text-gray-600">Sessions</span>
                      </div>
                    </div>
                  </div>

                  {summary.trafficByDate && summary.trafficByDate.length > 0 ? (
                    <div className="pt-4">
                      {/* Diagramme en barres SVG adaptatif */}
                      <div className="h-56 w-full flex items-end gap-2 sm:gap-3 overflow-x-auto pb-6 border-b border-gray-100">
                        {summary.trafficByDate.map((item) => {
                          const viewHeight = Math.max((item.pageViews / maxDailyViews) * 160, 6);
                          const sessionHeight = Math.max((item.sessions / maxDailyViews) * 160, 4);

                          return (
                            <div
                              key={item.date}
                              className="flex flex-col items-center flex-1 min-w-[38px] group relative"
                            >
                              {/* Tooltip au survol */}
                              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] rounded-md px-2 py-1 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                <div><strong>{item.date}</strong></div>
                                <div>Pages : {item.pageViews}</div>
                                <div>Sessions : {item.sessions}</div>
                              </div>

                              <div className="flex items-end gap-1 w-full justify-center">
                                {/* Barre Pages Vues */}
                                <div
                                  style={{ height: `${viewHeight}px` }}
                                  className="w-3 sm:w-4 bg-[#92278F] rounded-t-xs hover:bg-[#741772] transition-colors"
                                  title={`${item.date} : ${item.pageViews} vues`}
                                />
                                {/* Barre Sessions */}
                                <div
                                  style={{ height: `${sessionHeight}px` }}
                                  className="w-2.5 sm:w-3 bg-[#FF8C00] rounded-t-xs hover:bg-[#e07b00] transition-colors"
                                  title={`${item.date} : ${item.sessions} sessions`}
                                />
                              </div>

                              <span className="text-[10px] font-mono text-gray-500 mt-2 truncate w-full text-center">
                                {item.date.slice(5)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-gray-400 pt-2 font-mono">
                        <span>Plafond : {maxDailyViews} vues/jour</span>
                        <span>{summary.trafficByDate.length} journées actives répertoriées</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-400">
                      Aucune série temporelle disponible pour l'intervalle sélectionné.
                    </div>
                  )}
                </div>

                {/* Grille : Top 5 Pages + Répartition Écrans */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Aperçu Top 5 Pages */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-[#92278F]" />
                        <span>Pages Clés les Plus Consultées</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab('pages')}
                        className="text-xs font-bold text-[#92278F] hover:underline"
                      >
                        Voir toutes ({summary.topPages?.length || 0})
                      </button>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {(summary.topPages || []).slice(0, 5).map((p, idx) => (
                        <div key={p.path} className="py-2.5 flex items-center justify-between text-xs gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-purple-50 text-[#92278F] font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <span className="font-semibold text-gray-900 block truncate">{p.title || p.path}</span>
                              <span className="text-[11px] font-mono text-gray-400 truncate block">{p.path}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-gray-900 block">{p.views} vues</span>
                            <span className="text-[10px] text-gray-400">{p.percentage}% du trafic</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Aperçu Appareils */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-[#FF8C00]" />
                      <span>Répartition par Type d'Écran</span>
                    </h4>

                    <div className="space-y-3">
                      {(summary.deviceBreakdown || []).map((d) => {
                        const Icon = d.device === 'mobile' ? Smartphone : d.device === 'tablet' ? Tablet : Monitor;
                        const label = d.device === 'mobile' ? 'Mobile' : d.device === 'tablet' ? 'Tablette' : 'Ordinateur (Desktop)';

                        return (
                          <div key={d.device} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2 font-medium text-gray-700">
                                <Icon className="w-3.5 h-3.5 text-gray-400" />
                                <span>{label}</span>
                              </span>
                              <span className="font-bold text-gray-900">
                                {d.count} ({d.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                style={{ width: `${d.percentage}%` }}
                                className={`h-full rounded-full ${
                                  d.device === 'mobile'
                                    ? 'bg-[#92278F]'
                                    : d.device === 'desktop'
                                    ? 'bg-[#FF8C00]'
                                    : 'bg-emerald-500'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contenu Onglet Pages */}
            {activeTab === 'pages' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Pages les plus Consultées
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Fréquentation détaillée de chaque URL publique du site APS-BÉNIN
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-500">
                    Total : {summary.totalPageViews} consultations
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-2">#</th>
                        <th className="py-3 px-2">Chemin / URL</th>
                        <th className="py-3 px-2">Titre de la page</th>
                        <th className="py-3 px-2 text-right">Consultations</th>
                        <th className="py-3 px-2 text-right">Part de trafic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(summary.topPages || []).map((p, idx) => (
                        <tr key={p.path} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-2 font-bold text-[#92278F]">{idx + 1}</td>
                          <td className="py-3 px-2 font-mono text-gray-600 font-medium">{p.path}</td>
                          <td className="py-3 px-2 font-semibold text-gray-900">{p.title || p.path}</td>
                          <td className="py-3 px-2 text-right font-bold text-gray-900">{p.views}</td>
                          <td className="py-3 px-2 text-right font-medium text-gray-500">{p.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Contenu Onglet Interactions & Clics */}
            {activeTab === 'actions' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Actions Citoyennes & Événements Spécifiques
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Téléchargements de documents officiels, clics vers le standard téléphonique et consultations de projets
                  </p>
                </div>

                {summary.actionsBreakdown && summary.actionsBreakdown.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-2">Intitulé de l'Interaction</th>
                          <th className="py-3 px-2">Identifiant Système</th>
                          <th className="py-3 px-2 text-right">Occurrences Réelles</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {summary.actionsBreakdown.map((a) => (
                          <tr key={a.action} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3 px-2 font-semibold text-gray-900">{a.label}</td>
                            <td className="py-3 px-2 font-mono text-[11px] text-gray-500">{a.action}</td>
                            <td className="py-3 px-2 text-right font-bold text-[#92278F]">{a.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400">
                    Aucune action citoyenne (téléchargement ou appel) enregistrée sur cette période.
                  </div>
                )}
              </div>
            )}

            {/* Contenu Onglet Profil Technique & Sources */}
            {activeTab === 'technical' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sources de Trafic */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#92278F]" />
                    <span>Sources & Canaux d'Acquisition</span>
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {(summary.sourcesBreakdown || []).map((s) => (
                      <div key={s.source} className="py-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">{s.source}</span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 block">{s.count} visites</span>
                          <span className="text-[10px] text-gray-400">{s.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Profil des Appareils */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#FF8C00]" />
                    <span>Répartition Détaillée des Écrans</span>
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {(summary.deviceBreakdown || []).map((d) => (
                      <div key={d.device} className="py-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 capitalize">{d.device}</span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 block">{d.count} visites</span>
                          <span className="text-[10px] text-gray-400">{d.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </AdminAuthGuard>
  );
}
