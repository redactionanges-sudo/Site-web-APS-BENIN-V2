'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabaseStore } from '@/lib/supabase';
import { BannerAnnouncement } from '@/types';
import {
  Bell,
  Plus,
  Save,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ExternalLink,
  Calendar,
  Clock,
  Link as LinkIcon,
  X,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

export default function AdminBandeauPage() {
  const [announcements, setAnnouncements] = useState<BannerAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BannerAnnouncement | null>(null);
  const [formData, setFormData] = useState({
    text_fr: '',
    text_en: '',
    link_url: '',
    button_text_fr: '',
    button_text_en: '',
    start_date: '',
    end_date: '',
    order_index: 1,
    is_published: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const items = await supabaseStore.getBannerAnnouncements();
      setAnnouncements(items);
    } catch (err) {
      console.error('Erreur chargement bandeau:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    const maxOrder = announcements.reduce(
      (max, a) => Math.max(max, a.order_index ?? 0),
      0
    );
    setFormData({
      text_fr: '',
      text_en: '',
      link_url: '',
      button_text_fr: '',
      button_text_en: '',
      start_date: '',
      end_date: '',
      order_index: maxOrder + 1,
      is_published: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: BannerAnnouncement) => {
    setEditingItem(item);
    setFormData({
      text_fr: item.text_fr || '',
      text_en: item.text_en || '',
      link_url: item.link_url || '',
      button_text_fr: item.button_text_fr || '',
      button_text_en: item.button_text_en || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      order_index: item.order_index ?? 1,
      is_published: item.is_published !== false,
    });
    setModalOpen(true);
  };

  const handleTogglePublish = async (item: BannerAnnouncement) => {
    const nextStatus = !item.is_published;
    const updated: BannerAnnouncement = {
      ...item,
      is_published: nextStatus,
      updated_at: new Date().toISOString(),
    };

    setAnnouncements((prev) =>
      prev.map((a) => (a.id === item.id ? updated : a))
    );

    try {
      await supabaseStore.saveBannerAnnouncement(updated);
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
      (direction === 'down' && index === announcements.length - 1)
    ) {
      return;
    }

    const list = [...announcements];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = list[index];
    const target = list[targetIndex];

    const tempOrder = current.order_index ?? index + 1;
    current.order_index = target.order_index ?? targetIndex + 1;
    target.order_index = tempOrder;

    list[index] = target;
    list[targetIndex] = current;

    list.forEach((item, idx) => {
      item.order_index = idx + 1;
    });

    setAnnouncements(list);
    setSaving(true);
    try {
      await supabaseStore.saveBannerAnnouncements(list);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(`Erreur lors du déplacement : ${err.message}`);
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabaseStore.deleteBannerAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirmId(null);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message}`);
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text_fr.trim()) {
      alert('Veuillez renseigner le texte français de l’information.');
      return;
    }

    setSaving(true);
    try {
      const id = editingItem?.id || `ann-${Date.now()}`;
      const payload: BannerAnnouncement = {
        id,
        text_fr: formData.text_fr.trim(),
        text_en: formData.text_en.trim() || formData.text_fr.trim(),
        link_url: formData.link_url.trim() || undefined,
        button_text_fr: formData.button_text_fr.trim() || undefined,
        button_text_en: formData.button_text_en.trim() || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        order_index: Number(formData.order_index) || 1,
        is_published: formData.is_published,
        created_at: editingItem?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabaseStore.saveBannerAnnouncement(payload);
      setModalOpen(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      await loadData();
    } catch (err: any) {
      alert(`Erreur lors de l’enregistrement : ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Helper date status
  const getDateStatus = (item: BannerAnnouncement) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (item.start_date && todayStr < item.start_date) {
      return {
        label: `Programmée à partir du ${new Date(item.start_date).toLocaleDateString('fr-FR')}`,
        isActiveNow: false,
        badgeClass: 'bg-blue-100 text-blue-800',
      };
    }
    if (item.end_date && todayStr > item.end_date) {
      return {
        label: `Expirée le ${new Date(item.end_date).toLocaleDateString('fr-FR')}`,
        isActiveNow: false,
        badgeClass: 'bg-red-100 text-red-800',
      };
    }
    if (item.start_date || item.end_date) {
      return {
        label: 'Période en cours',
        isActiveNow: true,
        badgeClass: 'bg-amber-100 text-amber-800',
      };
    }
    return {
      label: 'Permanent',
      isActiveNow: true,
      badgeClass: 'bg-purple-100 text-purple-800',
    };
  };

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Bandeau d'Information du Hero"
        subtitle="Administrez les actualités, alertes et annonces diffusées en boucle dans le bandeau du Hero"
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Top notification */}
        {savedSuccess && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Bandeau d'information mis à jour et synchronisé avec le Hero !</span>
            </div>
          </div>
        )}

        {/* Overview Bar */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#92278F]" />
              <span>Informations du bandeau ({announcements.length})</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {announcements.filter((a) => a.is_published && getDateStatus(a).isActiveNow).length}{' '}
              informations actuellement actives et visibles sur la page d'accueil
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4 text-[#FF8C00]" />
            <span>Ajouter une information</span>
          </button>
        </div>

        {/* Help Banner */}
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3 text-xs text-purple-900">
          <HelpCircle className="w-4 h-4 text-[#92278F] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Fonctionnement du bandeau dynamique :</p>
            <p className="text-purple-800/80 leading-relaxed">
              Les messages sont affichés en continu sous le Hero. S'ils possèdent un lien d'action (ex: <code className="bg-white/80 px-1 py-0.5 rounded font-bold text-[#92278F]">/documents</code>, <code className="bg-white/80 px-1 py-0.5 rounded font-bold text-[#92278F]">/opportunites</code>), un bouton discret permet aux visiteurs d'accéder directement au contenu. La période d'affichage (dates début et fin) est facultative pour les campagnes temporaires.
            </p>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-400">
              Chargement des annonces du bandeau...
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Bell className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-700">Aucune information dans le bandeau</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Ajoutez votre premier message ou annonce pour l'afficher sur le bandeau sous le Hero.
              </p>
              <button
                onClick={openAddModal}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#92278F] text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4 text-[#FF8C00]" />
                <span>Créer une annonce</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {announcements.map((item, index) => {
                const dateStatus = getDateStatus(item);
                const isPublished = item.is_published;
                const isEffectiveActive = isPublished && dateStatus.isActiveNow;
                const isConfirmingDelete = deleteConfirmId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      !isEffectiveActive ? 'bg-gray-50/70 opacity-75' : 'hover:bg-purple-50/20'
                    }`}
                  >
                    {/* Left: Reorder & Content */}
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
                          {item.order_index ?? index + 1}
                        </span>
                        <button
                          type="button"
                          disabled={index === announcements.length - 1 || saving}
                          onClick={() => handleMoveOrder(index, 'down')}
                          title="Descendre d'un rang"
                          className="p-1 text-gray-500 hover:text-[#92278F] disabled:opacity-30 disabled:hover:text-gray-500 rounded hover:bg-white transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Content details */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                          {item.text_fr}
                        </p>
                        {item.text_en && item.text_en !== item.text_fr && (
                          <p className="text-xs text-gray-500 italic mt-0.5">
                            {item.text_en}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {/* Publish status */}
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

                          {/* Date status badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${dateStatus.badgeClass}`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>{dateStatus.label}</span>
                          </span>

                          {/* Link info */}
                          {item.link_url && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#92278F] font-bold">
                              <LinkIcon className="w-3 h-3 text-[#FF8C00]" />
                              <span>{item.button_text_fr || 'Lien'}:</span>
                              <code className="text-[10px] text-gray-600 font-mono bg-gray-100 px-1 py-0.5 rounded">
                                {item.link_url}
                              </code>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      {/* Toggle Publish */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item)}
                        title={isPublished ? 'Masquer du bandeau' : 'Publier sur le bandeau'}
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
                        onClick={() => openEditModal(item)}
                        className="p-2 text-gray-600 hover:text-[#92278F] hover:bg-purple-50 rounded-lg transition-colors border border-gray-200"
                        title="Modifier cette annonce"
                      >
                        <Sparkles className="w-4 h-4 text-[#92278F]" />
                      </button>

                      {/* Delete with Confirmation */}
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
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
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
                          title="Supprimer cette annonce"
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

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-extrabold text-gray-900 font-heading">
                {editingItem ? 'Modifier l’information du bandeau' : 'Ajouter une information au bandeau'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Texte de l'information (Français) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="ex: À l'occasion des 16 jours d'activisme, découvrez notre campagne contre les violences numériques."
                  value={formData.text_fr}
                  onChange={(e) => setFormData({ ...formData, text_fr: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 font-medium outline-none focus:border-[#92278F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Texte de l'information (Anglais facultatif)
                </label>
                <textarea
                  rows={2}
                  placeholder="ex: Discover our grassroots campaign during the 16 Days of Activism."
                  value={formData.text_en}
                  onChange={(e) => setFormData({ ...formData, text_en: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 font-medium outline-none focus:border-[#92278F]"
                />
              </div>

              {/* Action / Link Section */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#FF8C00]" />
                  <span>Lien d'action facultatif</span>
                </span>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                    URL ou Route interne
                  </label>
                  <input
                    type="text"
                    placeholder="ex: /documents ou /opportunites ou https://..."
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white font-mono outline-none focus:border-[#92278F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                      Texte du bouton (FR)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Découvrir, Consulter"
                      value={formData.button_text_fr}
                      onChange={(e) => setFormData({ ...formData, button_text_fr: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white font-medium outline-none focus:border-[#92278F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                      Texte du bouton (EN)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Explore, View"
                      value={formData.button_text_en}
                      onChange={(e) => setFormData({ ...formData, button_text_en: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white font-medium outline-none focus:border-[#92278F]"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Dates & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                    Date début (facultatif)
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 outline-none focus:border-[#92278F]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                    Date fin (facultatif)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 outline-none focus:border-[#92278F]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order_index}
                    onChange={(e) =>
                      setFormData({ ...formData, order_index: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 font-bold outline-none focus:border-[#92278F]"
                  />
                </div>
              </div>

              {/* Published checkbox */}
              <div className="pt-2 border-t flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-[#92278F] rounded border-gray-300 focus:ring-[#92278F]"
                  />
                  <span className="text-xs font-bold text-gray-700">
                    Publier immédiatement sur le bandeau
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
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
