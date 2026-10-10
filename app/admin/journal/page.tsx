'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabaseStore, supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { AuditLog, AuditActionType, AuditModule } from '@/types';
import {
  MODULE_META,
  ACTION_META,
  exportAuditLogsToCSV,
  exportAuditLogsToJSON,
} from '@/lib/audit';
import {
  History,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  X,
  Calendar,
  User,
  Shield,
  Clock,
  Layers,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function AdminJournalPage() {
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(0);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Detail modal state
  const [activeLog, setActiveLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    try {
      setRefreshing(true);
      setNowTimestamp(Date.now());

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (typeof window !== 'undefined' && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
        } catch {}
      }

      // Try to fetch via server API first with verified authentication
      const res = await fetch('/api/admin/logs', { headers }).catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.success && Array.isArray(json.data)) {
          setLogs(json.data);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // Client direct store fallback (real data, purged of mock values)
      const data = await supabaseStore.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.warn('Erreur chargement logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setNowTimestamp(Date.now());
    loadLogs();

    const handleNewLog = () => {
      loadLogs();
    };

    window.addEventListener('aps_audit_log_created', handleNewLog);
    return () => {
      window.removeEventListener('aps_audit_log_created', handleNewLog);
    };
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesTitle = log.target_title?.toLowerCase().includes(query);
        const matchesSummary = log.summary?.toLowerCase().includes(query);
        const matchesUser = log.user_name?.toLowerCase().includes(query) || log.user_email?.toLowerCase().includes(query);
        const matchesId = log.id.toLowerCase().includes(query) || log.target_id?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSummary && !matchesUser && !matchesId) {
          return false;
        }
      }

      // Module filter
      if (selectedModule !== 'all' && log.module !== selectedModule) {
        return false;
      }

      // Action filter
      if (selectedAction !== 'all' && log.action_type !== selectedAction) {
        return false;
      }

      // Period filter
      if (selectedPeriod !== 'all' && nowTimestamp > 0) {
        const logDate = new Date(log.created_at).getTime();
        if (selectedPeriod === 'today') {
          const oneDayAgo = nowTimestamp - 24 * 60 * 60 * 1000;
          if (logDate < oneDayAgo) return false;
        } else if (selectedPeriod === 'week') {
          const oneWeekAgo = nowTimestamp - 7 * 24 * 60 * 60 * 1000;
          if (logDate < oneWeekAgo) return false;
        } else if (selectedPeriod === 'month') {
          const oneMonthAgo = nowTimestamp - 30 * 24 * 60 * 60 * 1000;
          if (logDate < oneMonthAgo) return false;
        }
      }

      return true;
    });
  }, [logs, searchTerm, selectedModule, selectedAction, selectedPeriod, nowTimestamp]);

  // Statistical counters
  const stats = useMemo(() => {
    const oneDayAgo = nowTimestamp > 0 ? nowTimestamp - 24 * 60 * 60 * 1000 : 0;

    let todayCount = 0;
    let creationsCount = 0;
    let modificationsCount = 0;
    let suppressionsCount = 0;
    let authCount = 0;

    logs.forEach((l) => {
      if (oneDayAgo > 0 && new Date(l.created_at).getTime() >= oneDayAgo) {
        todayCount++;
      }
      if (l.action_type === 'creation' || l.action_type === 'publication') {
        creationsCount++;
      }
      if (l.action_type === 'modification') {
        modificationsCount++;
      }
      if (l.action_type === 'suppression') {
        suppressionsCount++;
      }
      if (l.action_type === 'connexion' || l.action_type === 'deconnexion') {
        authCount++;
      }
    });

    return {
      total: logs.length,
      today: todayCount,
      creations: creationsCount,
      modifications: modificationsCount,
      suppressions: suppressionsCount,
      auth: authCount,
    };
  }, [logs, nowTimestamp]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      if (!nowTimestamp) return formatDate(isoString);
      const diffMs = nowTimestamp - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "À l'instant";
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} j`;
      return formatDate(isoString);
    } catch {
      return isoString;
    }
  };

  return (
    <AdminAuthGuard requireAdmin>
      <AdminHeader
        title="Journal d'Activité & Historique"
        subtitle="Traçabilité continue des modifications éditoriales, accès et actions administratives"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadLogs}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-60"
              title="Actualiser le journal"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#92278F]' : ''}`} />
              <span>Actualiser</span>
            </button>

            <button
              type="button"
              onClick={() => exportAuditLogsToCSV(filteredLogs)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors"
              title="Exporter au format CSV (Excel)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => exportAuditLogsToJSON(filteredLogs)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#92278F] border border-purple-200 text-xs font-semibold transition-colors"
              title="Exporter au format JSON structuré"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Total Actions</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">{stats.total}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">Aujourd&apos;hui</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.today}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 block">Créations & Publi.</span>
            <span className="text-2xl font-black text-teal-700 mt-1 block">{stats.creations}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">Modifications</span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">{stats.modifications}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">Suppressions</span>
            <span className="text-2xl font-black text-rose-700 mt-1 block">{stats.suppressions}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">Sessions / Auth</span>
            <span className="text-2xl font-black text-purple-700 mt-1 block">{stats.auth}</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par titre de contenu, auteur, email, action..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#92278F] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Module Filter */}
            <div className="w-full md:w-52">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#92278F] font-medium"
              >
                <option value="all">Tous les modules ({logs.length})</option>
                {Object.entries(MODULE_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Type Filter */}
            <div className="w-full md:w-48">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#92278F] font-medium"
              >
                <option value="all">Toutes les actions</option>
                {Object.entries(ACTION_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Filter */}
            <div className="w-full md:w-44">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#92278F] font-medium"
              >
                <option value="all">Toute la période</option>
                <option value="today">Dernières 24h</option>
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips & Reset */}
          {(searchTerm || selectedModule !== 'all' || selectedAction !== 'all' || selectedPeriod !== 'all') && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex-wrap">
              <span className="font-semibold text-gray-700">Filtres actifs :</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px]">
                  Recherche : « {searchTerm} »
                  <button onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedModule !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px]">
                  Module : {MODULE_META[selectedModule as AuditModule]?.label || selectedModule}
                  <button onClick={() => setSelectedModule('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedAction !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px]">
                  Action : {ACTION_META[selectedAction as AuditActionType]?.label || selectedAction}
                  <button onClick={() => setSelectedAction('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedPeriod !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px]">
                  Période : {selectedPeriod === 'today' ? '24h' : selectedPeriod === 'week' ? '7j' : '30j'}
                  <button onClick={() => setSelectedPeriod('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedModule('all');
                  setSelectedAction('all');
                  setSelectedPeriod('all');
                }}
                className="text-[11px] text-[#92278F] font-bold hover:underline ml-2"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#92278F] mx-auto" />
              <p className="text-xs text-gray-500 font-medium">Chargement du journal d&apos;activité...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <History className="w-8 h-8 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-gray-700">Aucun événement ne correspond aux critères</h3>
              <p className="text-xs text-gray-500">Essayez d&apos;ajuster vos filtres ou effectuez de nouvelles actions pour alimenter le journal.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-44">Date & Heure</th>
                    <th className="py-3 px-4 w-32">Action</th>
                    <th className="py-3 px-4 w-36">Module</th>
                    <th className="py-3 px-4">Contenu & Résumé</th>
                    <th className="py-3 px-4 w-48">Auteur</th>
                    <th className="py-3 px-4 w-20 text-right">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredLogs.map((log) => {
                    const actionMeta = ACTION_META[log.action_type] || {
                      label: log.action_type,
                      badge: 'bg-gray-100 text-gray-700',
                    };
                    const moduleMeta = MODULE_META[log.module] || {
                      label: log.module_label || log.module,
                      badge: 'bg-gray-100 text-gray-700 border-gray-300',
                    };

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-purple-50/20 transition-colors group cursor-pointer"
                        onClick={() => setActiveLog(log)}
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 align-top">
                          <div className="font-semibold text-gray-900">{formatRelativeTime(log.created_at)}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{formatDate(log.created_at)}</div>
                        </td>

                        {/* Action badge */}
                        <td className="py-3 px-4 align-top">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${actionMeta.badge}`}>
                            {actionMeta.label}
                          </span>
                        </td>

                        {/* Module */}
                        <td className="py-3 px-4 align-top">
                          <span className="font-semibold text-gray-800 block">{moduleMeta.label}</span>
                          {log.target_id && (
                            <span className="text-[10px] font-mono text-gray-400 block truncate max-w-[120px]">
                              #{log.target_id}
                            </span>
                          )}
                        </td>

                        {/* Target Title & Summary */}
                        <td className="py-3 px-4 align-top">
                          {log.target_title && (
                            <div className="font-bold text-gray-900 line-clamp-1 group-hover:text-[#92278F] transition-colors">
                              {log.target_title}
                            </div>
                          )}
                          <div className="text-gray-600 text-xs line-clamp-2 mt-0.5">
                            {log.summary}
                          </div>
                        </td>

                        {/* User Identity */}
                        <td className="py-3 px-4 align-top">
                          <div className="font-semibold text-gray-900 truncate">
                            {log.user_name || log.user_email || 'Utilisateur non identifié'}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate font-mono">
                            {log.user_email || (log.user_id ? `ID: ${log.user_id.slice(0, 12)}...` : '—')}
                          </div>
                          {log.user_role && (
                            <span className="inline-block mt-0.5 text-[9px] font-bold uppercase text-purple-700 bg-purple-50 px-1 py-0.2 rounded">
                              {log.user_role === 'super_admin' ? 'Super Admin' : log.user_role === 'admin' ? 'Admin' : 'Éditeur'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 align-top text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLog(log);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#92278F] transition-colors"
                            title="Consulter les détails complets"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div>
              Affichage de <span className="font-bold text-gray-800">{filteredLogs.length}</span> événement(s) sur <span className="font-bold text-gray-800">{logs.length}</span> au total
            </div>
            <div className="text-[11px] text-gray-400">
              Chiffrement et protection d&apos;intégrité appliqués · Données sensibles masquées
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal / Drawer */}
      {activeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#92278F] flex items-center justify-center font-bold">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Détails de l&apos;Événement d&apos;Audit</h3>
                  <p className="text-[11px] font-mono text-gray-500">ID: {activeLog.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveLog(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Event Summary Banner */}
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ACTION_META[activeLog.action_type]?.badge || 'bg-gray-100'}`}>
                    {ACTION_META[activeLog.action_type]?.label || activeLog.action_type}
                  </span>
                  <span className="text-[11px] font-bold text-gray-700">
                    Module : {MODULE_META[activeLog.module]?.label || activeLog.module}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-gray-900 pt-1">
                  {activeLog.target_title || 'Élément sans titre'}
                </h4>
                <p className="text-gray-600 text-xs">{activeLog.summary}</p>
              </div>

              {/* General Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Horodatage précis</span>
                  <div className="font-mono text-gray-800 text-[11px] mt-0.5">
                    {formatDate(activeLog.created_at)}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {activeLog.created_at}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Auteur connecté</span>
                  <div className="font-bold text-gray-900 mt-0.5">{activeLog.user_name || activeLog.user_email || 'Utilisateur non identifié'}</div>
                  <div className="text-[11px] font-mono text-gray-500">{activeLog.user_email || (activeLog.user_id ? `ID: ${activeLog.user_id}` : '—')}</div>
                  <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                    Rôle : {activeLog.user_role || 'Non spécifié'}
                  </div>
                </div>

                {activeLog.target_id && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Identifiant cible</span>
                    <div className="font-mono text-gray-700 text-[11px] mt-0.5 truncate">{activeLog.target_id}</div>
                  </div>
                )}

                {activeLog.metadata?.ip && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Adresse IP (anonymisée)</span>
                    <div className="font-mono text-gray-700 text-[11px] mt-0.5">{activeLog.metadata.ip}</div>
                  </div>
                )}
              </div>

              {/* Changes Summary / Detailed Diffs */}
              {activeLog.changes && (
                <div className="space-y-2">
                  <h5 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#92278F]" />
                    <span>Détail des modifications apportées</span>
                  </h5>

                  {Array.isArray(activeLog.changes) ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] uppercase font-bold">
                          <tr>
                            <th className="p-2.5">Champ</th>
                            <th className="p-2.5">Ancienne valeur</th>
                            <th className="p-2.5">Nouvelle valeur</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {activeLog.changes.map((c: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="p-2.5 font-bold text-gray-800">{c.label || c.field}</td>
                              <td className="p-2.5 text-rose-700 bg-rose-50/30 font-mono text-[11px]">
                                {c.old_value !== undefined && c.old_value !== null ? String(c.old_value) : '—'}
                              </td>
                              <td className="p-2.5 text-emerald-700 bg-emerald-50/30 font-mono text-[11px]">
                                {c.new_value !== undefined && c.new_value !== null ? String(c.new_value) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : typeof activeLog.changes === 'object' ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-3 max-h-56 overflow-y-auto">
                      <pre className="text-[11px] font-mono text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(activeLog.changes, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Technical Context */}
              {activeLog.metadata && Object.keys(activeLog.metadata).length > 0 && (
                <div className="space-y-1.5 text-[11px] text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="font-bold text-gray-700 block">Contexte d&apos;exécution :</span>
                  {activeLog.metadata.user_agent && (
                    <div>Navigateur : <span className="font-mono text-gray-700">{activeLog.metadata.user_agent}</span></div>
                  )}
                  {activeLog.metadata.source && (
                    <div>Origine : <span className="font-medium text-gray-700">{activeLog.metadata.source}</span></div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveLog(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-black transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminAuthGuard>
  );
}
