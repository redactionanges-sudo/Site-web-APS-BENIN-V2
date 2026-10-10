'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { TrashItem, TrashModule } from '@/types';
import { MODULE_META } from '@/lib/audit';
import {
  Trash2,
  RotateCcw,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  User,
  AlertTriangle,
  RefreshCw,
  FolderKanban,
  Newspaper,
  Briefcase,
  Handshake,
  Users,
  Building,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  BarChart3,
  Eye,
  X,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

const MODULE_ICONS: Record<TrashModule, React.ReactNode> = {
  projets: <FolderKanban className="w-4 h-4 text-blue-500" />,
  actualites: <Newspaper className="w-4 h-4 text-emerald-500" />,
  opportunites: <Briefcase className="w-4 h-4 text-amber-500" />,
  partenaires: <Handshake className="w-4 h-4 text-indigo-500" />,
  equipe: <Users className="w-4 h-4 text-teal-500" />,
  gouvernance: <Building className="w-4 h-4 text-cyan-500" />,
  documents: <FileText className="w-4 h-4 text-sky-500" />,
  mediatheque: <ImageIcon className="w-4 h-4 text-fuchsia-500" />,
  domaines: <ShieldCheck className="w-4 h-4 text-violet-500" />,
  statistiques: <BarChart3 className="w-4 h-4 text-orange-500" />,
};

const MODULE_LABELS: Record<TrashModule, string> = {
  projets: 'Projets',
  actualites: 'Actualités',
  opportunites: 'Opportunités',
  partenaires: 'Partenaires',
  equipe: 'Équipe',
  gouvernance: 'Gouvernance',
  documents: 'Documents & Rapports',
  mediatheque: 'Médiathèque',
  domaines: "Domaines d'action",
  statistiques: 'Chiffres Clés',
};

const ITEMS_PER_PAGE = 12;

export default function AdminCorbeillePage() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Action States
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<TrashItem | null>(null);
  const [itemToRestore, setItemToRestore] = useState<TrashItem | null>(null);
  const [itemToDeletePermanent, setItemToDeletePermanent] = useState<TrashItem | null>(null);
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadTrash = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await supabaseStore.getTrashItems();
      setTrashItems(items);
    } catch (err: any) {
      console.error('Erreur chargement corbeille:', err);
      setError(err.message || 'Impossible de charger la corbeille.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();

    const handleTrashChanged = () => {
      loadTrash();
    };

    window.addEventListener('aps_trash_changed', handleTrashChanged);
    return () => {
      window.removeEventListener('aps_trash_changed', handleTrashChanged);
    };
  }, []);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return trashItems
      .filter((item) => {
        const matchesModule = moduleFilter === 'all' || item.module === moduleFilter;
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          item.title?.toLowerCase().includes(q) ||
          item.original_id?.toLowerCase().includes(q) ||
          item.deleted_by_name?.toLowerCase().includes(q) ||
          item.deleted_by_email?.toLowerCase().includes(q);

        return matchesModule && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.deleted_at).getTime();
        const dateB = new Date(b.deleted_at).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [trashItems, search, moduleFilter, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, moduleFilter, sortOrder]);

  // Handle Restore
  const handleConfirmRestore = async () => {
    if (!itemToRestore) return;
    const current = itemToRestore;
    setItemToRestore(null);
    setActionInProgress(current.id);

    try {
      await supabaseStore.restoreTrashItem(current.id);
      showToast('success', `« ${current.title} » a été restauré avec succès dans le module ${MODULE_LABELS[current.module] || current.module}.`);
      await loadTrash();
    } catch (err: any) {
      showToast('error', `Erreur lors de la restauration : ${err.message || 'Opération impossible'}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Permanent Delete
  const handleConfirmDeletePermanent = async () => {
    if (!itemToDeletePermanent) return;
    const current = itemToDeletePermanent;
    setItemToDeletePermanent(null);
    setActionInProgress(current.id);

    try {
      await supabaseStore.deletePermanentlyTrashItem(current.id);
      showToast('success', `« ${current.title} » a été définitivement supprimé.`);
      await loadTrash();
    } catch (err: any) {
      showToast('error', `Erreur lors de la suppression définitive : ${err.message || 'Opération impossible'}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Empty Trash
  const handleConfirmEmptyTrash = async () => {
    setEmptyTrashConfirmOpen(false);
    setActionInProgress('empty-trash');

    try {
      await supabaseStore.emptyTrash();
      showToast('success', 'La corbeille a été vidée avec succès.');
      await loadTrash();
    } catch (err: any) {
      showToast('error', `Erreur lors du vidage de la corbeille : ${err.message || 'Opération impossible'}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const moduleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    trashItems.forEach((item) => {
      counts[item.module] = (counts[item.module] || 0) + 1;
    });
    return counts;
  }, [trashItems]);

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Corbeille & Restauration"
        subtitle="Gestion sécurisée des éléments supprimés avec restauration intégrale ou purge définitive"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
                : 'bg-rose-950 text-rose-200 border-rose-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* KPI & Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total dans la corbeille
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 font-heading">
                {trashItems.length}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modules concernés
              </p>
              <h3 className="text-2xl font-black text-[#92278F] mt-1 font-heading">
                {Object.keys(moduleCounts).length}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#92278F]">
              <Filter className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Protection des Médias
              </p>
              <p className="text-xs text-gray-600 mt-1 font-medium">
                Fichiers Storage conservés jusqu’à purge
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF8C00]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Sort, Actions */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par titre, ID d'origine, auteur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#92278F] focus:ring-1 focus:ring-[#92278F]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter by Module */}
            <div className="sm:w-56">
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-hidden focus:border-[#92278F] focus:ring-1 focus:ring-[#92278F]"
              >
                <option value="all">Tous les modules ({trashItems.length})</option>
                {Object.entries(MODULE_LABELS).map(([mod, label]) => {
                  const cnt = moduleCounts[mod] || 0;
                  return (
                    <option key={mod} value={mod}>
                      {label} ({cnt})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Sort Order */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              <span>{sortOrder === 'desc' ? 'Plus récents d’abord' : 'Plus anciens d’abord'}</span>
            </button>
          </div>

          {/* Action Buttons: Refresh, Empty Trash */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={loadTrash}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors disabled:opacity-50"
              title="Rafraîchir la liste"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            {trashItems.length > 0 && (
              <button
                type="button"
                onClick={() => setEmptyTrashConfirmOpen(true)}
                disabled={actionInProgress === 'empty-trash'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider la corbeille</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Section: Loading, Error, Empty State, or List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-[#92278F] animate-spin mx-auto" />
            <p className="text-xs font-semibold text-gray-600">Chargement de la corbeille...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-red-900">Erreur de chargement</h4>
            <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
            <button
              type="button"
              onClick={loadTrash}
              className="mt-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
            >
              Réessayer
            </button>
          </div>
        ) : trashItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 border border-gray-200 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900 font-heading">
              La corbeille est vide
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Aucun élément n’a été déplacé dans la corbeille. Les suppressions effectuées dans les modules éditoriaux apparaîtront ici et pourront être restaurées à tout moment.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center space-y-3">
            <Search className="w-8 h-8 text-gray-400 mx-auto" />
            <h4 className="text-sm font-bold text-gray-900">Aucun résultat trouvé</h4>
            <p className="text-xs text-gray-500">
              Aucun élément de la corbeille ne correspond à votre filtre de recherche.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setModuleFilter('all');
              }}
              className="text-xs font-bold text-[#92278F] hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Contenu & Titre</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Statut antérieur</th>
                    <th className="py-3 px-4">Date de suppression</th>
                    <th className="py-3 px-4">Auteur</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedItems.map((item) => {
                    const isBusy = actionInProgress === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Title & Info */}
                        <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                              {MODULE_ICONS[item.module] || <FileText className="w-4 h-4 text-gray-500" />}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 line-clamp-1 text-xs sm:text-sm">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 font-mono">
                                <span>ID: {item.original_id}</span>
                                <span>•</span>
                                <span>Table: {item.table_name}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Module */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-[#92278F] border border-purple-200">
                            {MODULE_LABELS[item.module] || item.module}
                          </span>
                        </td>

                        {/* Previous Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.previous_status ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                              {item.previous_status === 'published'
                                ? 'Publié'
                                : item.previous_status === 'draft'
                                ? 'Brouillon'
                                : item.previous_status === 'in_progress'
                                ? 'En cours'
                                : item.previous_status === 'completed'
                                ? 'Terminé'
                                : item.previous_status === 'active'
                                ? 'Actif'
                                : item.previous_status === 'open'
                                ? 'Ouverte'
                                : item.previous_status}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px] italic">Non spécifié</span>
                          )}
                        </td>

                        {/* Deletion Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                              {new Date(item.deleted_at).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>

                        {/* Author */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-700">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium text-xs">
                              {item.deleted_by_name || item.deleted_by_email || 'Utilisateur non identifié'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect details button */}
                            <button
                              type="button"
                              onClick={() => setSelectedItemForDetails(item)}
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Voir les données détaillées"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Restore button */}
                            <button
                              type="button"
                              onClick={() => setItemToRestore(item)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors disabled:opacity-50"
                              title="Restaurer cet élément dans son module"
                            >
                              {isBusy ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                              )}
                              <span>Restaurer</span>
                            </button>

                            {/* Delete permanent button */}
                            <button
                              type="button"
                              onClick={() => setItemToDeletePermanent(item)}
                              disabled={isBusy}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Affichage de {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} sur{' '}
                  {filteredItems.length} élément(s)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <span className="px-2 font-bold text-gray-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Item Details Modal */}
      {selectedItemForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#92278F] flex items-center justify-center">
                  {MODULE_ICONS[selectedItemForDetails.module] || <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-heading">
                    {selectedItemForDetails.title}
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-500">
                    Module : {MODULE_LABELS[selectedItemForDetails.module] || selectedItemForDetails.module} • ID d’origine : {selectedItemForDetails.original_id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForDetails(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Date de suppression</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(selectedItemForDetails.deleted_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Auteur de la suppression</span>
                  <span className="font-semibold text-gray-900">
                    {selectedItemForDetails.deleted_by_name || selectedItemForDetails.deleted_by_email || 'Utilisateur non identifié'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Statut d’origine</span>
                  <span className="font-semibold text-gray-900">
                    {selectedItemForDetails.previous_status || 'Non spécifié'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Table Supabase</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {selectedItemForDetails.table_name}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold mb-1">
                  Données éditoriales sauvegardées (JSON)
                </span>
                <pre className="p-3 bg-gray-900 text-gray-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed">
                  {JSON.stringify(selectedItemForDetails.data, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedItemForDetails(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  const it = selectedItemForDetails;
                  setSelectedItemForDetails(null);
                  setItemToRestore(it);
                }}
                className="px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurer cet élément</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToRestore)}
        title="Restaurer cet élément ?"
        message={`Voulez-vous restaurer « ${itemToRestore?.title} » ? L’élément réapparaîtra immédiatement dans le module ${MODULE_LABELS[itemToRestore?.module as TrashModule] || itemToRestore?.module} avec son identifiant et son état d’origine.`}
        confirmLabel="Confirmer la restauration"
        cancelLabel="Annuler"
        isDangerous={false}
        onConfirm={handleConfirmRestore}
        onCancel={() => setItemToRestore(null)}
      />

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToDeletePermanent)}
        title="Supprimer définitivement ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement « ${itemToDeletePermanent?.title} » ? Cette action est irréversible et supprimera le contenu de la corbeille de manière définitive.`}
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        isDangerous={true}
        onConfirm={handleConfirmDeletePermanent}
        onCancel={() => setItemToDeletePermanent(null)}
      />

      {/* Empty Trash Confirmation Modal */}
      <ConfirmModal
        isOpen={emptyTrashConfirmOpen}
        title="Vider entièrement la corbeille ?"
        message={`Attention : vous êtes sur le point de supprimer définitivement la totalité des ${trashItems.length} élément(s) actuellement dans la corbeille. Cette purge est totalement irréversible.`}
        confirmLabel="Vider définitivement la corbeille"
        cancelLabel="Annuler"
        isDangerous={true}
        onConfirm={handleConfirmEmptyTrash}
        onCancel={() => setEmptyTrashConfirmOpen(false)}
      />
    </AdminAuthGuard>
  );
}
