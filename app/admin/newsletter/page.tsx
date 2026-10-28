'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { NewsletterSubscriber } from '@/types';
import {
  Mail,
  Download,
  Search,
  CheckCircle2,
  Users,
  ShieldCheck,
  UserX,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [unsubscribedCount, setUnsubscribedCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aps_admin_token') || '' : '';
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        page: '1',
        limit: '100',
      });
      const res = await fetch(`/api/admin/newsletter?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribers || []);
        setTotal(data.total || 0);
        setActiveCount(data.activeCount || 0);
        setUnsubscribedCount(data.unsubscribedCount || 0);
      }
    } catch (err) {
      console.error('Failed to load newsletter subscribers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleExportCsv = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('aps_admin_token') || '' : '';
    window.location.href = `/api/admin/newsletter?action=export&token=${encodeURIComponent(token)}`;
  };

  const handleToggleUnsubscribe = async (sub: NewsletterSubscriber) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aps_admin_token') || '' : '';
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'unsubscribe',
          email: sub.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`L'abonné ${sub.email} a été désinscrit.`);
        fetchSubscribers();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      setFeedback(`Erreur : ${err.message || 'Impossible de modifier le statut'}`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AdminAuthGuard requiredRole="editor">
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8FB] min-h-screen">
        <AdminHeader
          title="Abonnés à la Newsletter"
          subtitle="Consultez la liste des abonnés officiels, filtrez les consentements et exportez la base en CSV."
          actionButton={
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs"
              title="Exporter tous les contacts au format tableur CSV"
            >
              <Download className="w-4 h-4 text-[#FF8C00]" />
              <span>Exporter en CSV</span>
            </button>
          }
        />

        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {feedback && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-[#92278F] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 block">Total inscrits</span>
                <span className="text-2xl font-extrabold text-gray-900 font-heading mt-1 block">
                  {total}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#92278F] flex items-center justify-center border border-purple-100">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 block">Abonnements actifs</span>
                <span className="text-2xl font-extrabold text-emerald-700 font-heading mt-1 block">
                  {activeCount}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 block">Désinscrits</span>
                <span className="text-2xl font-extrabold text-gray-600 font-heading mt-1 block">
                  {unsubscribedCount}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center border border-gray-200">
                <UserX className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tous ({total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Actifs ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unsubscribed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'unsubscribed'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Désinscrits ({unsubscribedCount})
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par adresse e-mail..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-gray-50"
                />
              </div>

              <button
                type="button"
                onClick={() => fetchSubscribers()}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                title="Actualiser la liste"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#92278F]' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#92278F] mx-auto" />
                <p className="text-xs font-semibold">Chargement des abonnés en cours...</p>
              </div>
            ) : subscribers.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-3">
                <Mail className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-bold text-gray-700">Aucun abonné trouvé</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  {search
                    ? 'Aucune adresse e-mail ne correspond à votre recherche.'
                    : 'Les personnes s’inscrivant depuis le formulaire en pied de page apparaîtront automatiquement ici.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Adresse e-mail</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4">Date d'inscription</th>
                      <th className="py-3 px-4">Consentement</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900 font-mono text-[11px]">
                          {sub.email}
                        </td>
                        <td className="py-3.5 px-4">
                          {sub.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              <span>Actif</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              <span>Désinscrit</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                          {formatDate(sub.subscribed_at)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Validé (RGPD)</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          <span className="text-[11px] font-mono bg-gray-100 px-2 py-0.5 rounded">
                            {sub.source || 'footer'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {sub.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handleToggleUnsubscribe(sub)}
                              className="text-[11px] font-bold text-gray-500 hover:text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                              title="Marquer ce contact comme désinscrit"
                            >
                              Désinscrire
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
