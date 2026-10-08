'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabaseStore } from '@/lib/supabase';
import { KeyStatistic } from '@/types';
import {
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sparkles,
  BarChart3,
  Calendar,
  Users,
  MapPin,
  Handshake,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

export default function AdminStatistiquesPage() {
  const [stats, setStats] = useState<KeyStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New or Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<KeyStatistic | null>(null);
  const [formData, setFormData] = useState({
    value: '',
    label_fr: '',
    label_en: '',
    description_fr: '',
    description_en: '',
    order_index: 1,
    is_published: true,
    key: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await supabaseStore.getStatistics();
      const sorted = [...(data || [])].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
      );
      setStats(sorted);
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingStat(null);
    const maxOrder = stats.reduce(
      (max, s) => Math.max(max, s.order_index ?? 0),
      0
    );
    setFormData({
      value: '',
      label_fr: '',
      label_en: '',
      description_fr: '',
      description_en: '',
      order_index: maxOrder + 1,
      is_published: true,
      key: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (st: KeyStatistic) => {
    setEditingStat(st);
    setFormData({
      value: st.value || '',
      label_fr: st.label_fr || '',
      label_en: st.label_en || '',
      description_fr: st.description_fr || '',
      description_en: st.description_en || '',
      order_index: st.order_index ?? 1,
      is_published: st.is_published !== false,
      key: st.key || '',
    });
    setModalOpen(true);
  };

  const handleTogglePublish = async (st: KeyStatistic) => {
    const nextStatus = st.is_published === false;
    const updated: KeyStatistic = {
      ...st,
      is_published: nextStatus,
      updated_at: new Date().toISOString(),
    };

    setStats((prev) => prev.map((s) => (s.id === st.id ? updated : s)));

    try {
      await supabaseStore.saveStatistic(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(`Erreur : ${err.message || 'Impossible de modifier le statut'}`);
      loadData();
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === stats.length - 1)
    ) {
      return;
    }

    const newStats = [...stats];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentItem = newStats[index];
    const targetItem = newStats[targetIndex];

    // Swap order_index
    const tempOrder = currentItem.order_index ?? index + 1;
    currentItem.order_index = targetItem.order_index ?? targetIndex + 1;
    targetItem.order_index = tempOrder;

    // Swap positions in array
    newStats[index] = targetItem;
    newStats[targetIndex] = currentItem;

    // Re-normalize consecutive order indices
    newStats.forEach((s, idx) => {
      s.order_index = idx + 1;
    });

    setStats(newStats);
    setSaving(true);
    try {
      await supabaseStore.saveStatistics(newStats);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(`Erreur lors de la réorganisation : ${err.message}`);
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabaseStore.deleteStatistic(id);
      setStats((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirmId(null);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message}`);
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.value.trim() || !formData.label_fr.trim()) {
      alert('Veuillez renseigner au minimum la valeur et le libellé français.');
      return;
    }

    setSaving(true);
    try {
      const id = editingStat?.id || `stat-${Date.now()}`;
      const autoKey =
        formData.key.trim() ||
        (editingStat?.key
          ? editingStat.key
          : formData.label_fr
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '_')
              .slice(0, 30));

      const payload: KeyStatistic = {
        id,
        key: autoKey,
        value: formData.value.trim(),
        label_fr: formData.label_fr.trim(),
        label_en: (formData.label_en || formData.label_fr).trim(),
        description_fr: formData.description_fr.trim(),
        description_en: (formData.description_en || formData.description_fr).trim(),
        order_index: Number(formData.order_index) || 1,
        is_published: formData.is_published,
        created_at: editingStat?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabaseStore.saveStatistic(payload);
      setModalOpen(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      await loadData();
    } catch (err: any) {
      alert(`Erreur lors de l'enregistrement : ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatIcon = (key?: string) => {
    switch (key) {
      case 'creation_year':
        return <Calendar className="w-5 h-5 text-[#FF8C00]" />;
      case 'projects_count':
        return <TrendingUp className="w-5 h-5 text-[#FF8C00]" />;
      case 'beneficiaries':
        return <Users className="w-5 h-5 text-[#FF8C00]" />;
      case 'communes_covered':
        return <MapPin className="w-5 h-5 text-[#FF8C00]" />;
      case 'partners_count':
        return <Handshake className="w-5 h-5 text-[#FF8C00]" />;
      default:
        return <BarChart3 className="w-5 h-5 text-[#FF8C00]" />;
    }
  };

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Gestion des Chiffres Clés d'Impact"
        subtitle="Administrez les indicateurs statistiques affichés dynamiquement sur la page d'accueil d'APS-BÉNIN"
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Top notification */}
        {savedSuccess && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Changements enregistrés et synchronisés avec le site public !</span>
            </div>
          </div>
        )}

        {/* Overview Bar & Actions */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#92278F]" />
              <span>Indicateurs d'impact enregistrés ({stats.length})</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {stats.filter((s) => s.is_published !== false).length} indicateurs publiés sur le site public
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4 text-[#FF8C00]" />
            <span>Ajouter une statistique</span>
          </button>
        </div>

        {/* Format guidance alert */}
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3 text-xs text-purple-900">
          <HelpCircle className="w-4 h-4 text-[#92278F] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Formats de valeur supportés :</p>
            <p className="text-purple-800/80 leading-relaxed">
              La valeur accepte tous les formats flexibles : nombres simples (<code className="bg-white/80 px-1 py-0.5 rounded font-bold text-[#92278F]">12</code>), avec suffixe (<code className="bg-white/80 px-1 py-0.5 rounded font-bold text-[#92278F]">10+</code>, <code className="bg-white/80 px-1 py-0.5 rounded font-bold text-[#92278F]">1 500+</code>), pourcentages (<code className="bg-white/80 px-1 py-0.5 rounded font-bold text-[#92278F]">95 %</code>) ou années (<code className="bg-white/80 px-1 py-0.5 rounded font-bold text-[#92278F]">2014</code>). L'animation fluide sur la page d'accueil incrémente la partie numérique sans altérer les symboles.
            </p>
          </div>
        </div>

        {/* List of statistics */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-400">
              Chargement des indicateurs...
            </div>
          ) : stats.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <BarChart3 className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-700">Aucune statistique enregistrée</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Commencez par ajouter votre premier chiffre clé d'impact pour l'afficher sur la page d'accueil.
              </p>
              <button
                onClick={openAddModal}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#92278F] text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4 text-[#FF8C00]" />
                <span>Ajouter un premier indicateur</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.map((st, index) => {
                const isPublished = st.is_published !== false;
                const isConfirmingDelete = deleteConfirmId === st.id;

                return (
                  <div
                    key={st.id}
                    className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      !isPublished ? 'bg-gray-50/70 opacity-75' : 'hover:bg-purple-50/20'
                    }`}
                  >
                    {/* Left: Order, Icon, Value & Labels */}
                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                      {/* Order Controls */}
                      <div className="flex flex-col items-center gap-0.5 bg-gray-100 p-1 rounded-lg">
                        <button
                          type="button"
                          disabled={index === 0 || saving}
                          onClick={() => handleMoveOrder(index, 'up')}
                          title="Monter d'un rang"
                          className="p-1 text-gray-500 hover:text-[#92278F] disabled:opacity-30 disabled:hover:text-gray-500 rounded hover:bg-white transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-extrabold text-gray-700 px-1 select-none">
                          {st.order_index ?? index + 1}
                        </span>
                        <button
                          type="button"
                          disabled={index === stats.length - 1 || saving}
                          onClick={() => handleMoveOrder(index, 'down')}
                          title="Descendre d'un rang"
                          className="p-1 text-gray-500 hover:text-[#92278F] disabled:opacity-30 disabled:hover:text-gray-500 rounded hover:bg-white transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Icon Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                        {getStatIcon(st.key)}
                      </div>

                      {/* Value and details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                          <span className="text-2xl font-black text-[#92278F] tracking-tight font-heading">
                            {st.value}
                          </span>
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {st.label_fr}
                          </span>
                          {st.label_en && st.label_en !== st.label_fr && (
                            <span className="text-[11px] font-medium text-gray-400 italic">
                              ({st.label_en})
                            </span>
                          )}
                        </div>

                        {st.description_fr && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {st.description_fr}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {isPublished ? (
                              <>
                                <Eye className="w-2.5 h-2.5 text-green-700" />
                                <span>Publié</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-2.5 h-2.5 text-gray-500" />
                                <span>Masqué</span>
                              </>
                            )}
                          </span>

                          <span className="text-[10px] text-gray-400">
                            Clé: <code className="text-gray-600">{st.key}</code>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      {/* Toggle Publish */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(st)}
                        title={isPublished ? 'Masquer du site public' : 'Publier sur le site public'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isPublished
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {isPublished ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                            <span className="hidden sm:inline">Masquer</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-green-600" />
                            <span className="hidden sm:inline">Publier</span>
                          </>
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openEditModal(st)}
                        className="p-2 text-gray-600 hover:text-[#92278F] hover:bg-purple-50 rounded-lg transition-colors border border-gray-200"
                        title="Modifier cette statistique"
                      >
                        <Sparkles className="w-4 h-4 text-[#92278F]" />
                      </button>

                      {/* Delete with Confirmation */}
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                          <button
                            type="button"
                            onClick={() => handleDelete(st.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-[11px] font-bold hover:bg-red-700"
                          >
                            Confirmer
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(st.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
                          title="Supprimer cette statistique"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-extrabold text-gray-900 font-heading">
                {editingStat ? 'Modifier la statistique' : 'Ajouter une nouvelle statistique'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Valeur affichée *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 18 500+, 95 %, 10+"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 font-extrabold text-[#92278F] outline-none focus:border-[#92278F] focus:ring-1 focus:ring-[#92278F]"
                  />
                  <span className="text-[10px] text-gray-400">Accepte chiffres, +, %, espaces</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Ordre d'affichage (1, 2, 3...)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order_index}
                    onChange={(e) =>
                      setFormData({ ...formData, order_index: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 font-bold outline-none focus:border-[#92278F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Libellé (Français) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Bénéficiaires touchés, Projets réalisés..."
                  value={formData.label_fr}
                  onChange={(e) => setFormData({ ...formData, label_fr: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 font-medium outline-none focus:border-[#92278F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Libellé (Anglais)
                </label>
                <input
                  type="text"
                  placeholder="ex: Direct beneficiaries, Projects completed..."
                  value={formData.label_en}
                  onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 font-medium outline-none focus:border-[#92278F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Description / Sous-titre court (Français)
                </label>
                <textarea
                  rows={2}
                  placeholder="Courte précision facultative affichée sous le libellé..."
                  value={formData.description_fr}
                  onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 font-medium outline-none focus:border-[#92278F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Description / Sous-titre court (Anglais)
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional short subtitle in English..."
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 font-medium outline-none focus:border-[#92278F]"
                />
              </div>

              {/* Status & Options */}
              <div className="pt-2 border-t flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-[#92278F] rounded border-gray-300 focus:ring-[#92278F]"
                  />
                  <span className="text-xs font-bold text-gray-700">
                    Publier immédiatement sur la page d'accueil
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Save className="w-4 h-4 text-[#FF8C00]" />
                  <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminAuthGuard>
  );
}
