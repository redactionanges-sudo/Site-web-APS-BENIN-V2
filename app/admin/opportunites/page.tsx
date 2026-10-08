'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { OpportunityItem, OpportunityStatus, OpportunityType } from '@/types';
import { ImagePickerField, MultiImageGalleryField } from '@/components/admin/MediaSelectorModal';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  X,
  Clock,
  Briefcase,
} from 'lucide-react';

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<OpportunityItem | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [oppToDelete, setOppToDelete] = useState<OpportunityItem | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<OpportunityItem>>({
    title_fr: '',
    title_en: '',
    slug: '',
    type: 'recruitment',
    description_fr: '',
    description_en: '',
    organization: 'AGISSONS POUR SAUVER – APS-BÉNIN',
    published_at: '',
    deadline: '',
    location_fr: 'Djacoṭé-Comè (Département du Mono)',
    location_en: 'Djacoṭé-Comè (Mono Department)',
    conditions_fr: '',
    conditions_en: '',
    documents_required_fr: '',
    documents_required_en: '',
    pdf_url: '',
    contact_email: 'agissonspoursauver@gmail.com',
    status: 'open',
    main_image: '',
    gallery: [],
  });

  const loadOpportunities = async () => {
    const list = await supabaseStore.getOpportunities();
    setOpportunities(list);
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const openNewModal = () => {
    setEditingOpp(null);
    setForm({
      title_fr: '',
      title_en: '',
      slug: '',
      type: 'recruitment',
      description_fr: '',
      description_en: '',
      organization: 'AGISSONS POUR SAUVER – APS-BÉNIN',
      published_at: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      location_fr: 'Djacoṭé-Comè (Département du Mono)',
      location_en: 'Djacoṭé-Comè (Mono Department)',
      conditions_fr: '',
      conditions_en: '',
      documents_required_fr: '',
      documents_required_en: '',
      pdf_url: '',
      contact_email: 'agissonspoursauver@gmail.com',
      status: 'open',
      main_image: '',
      gallery: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (item: OpportunityItem) => {
    setEditingOpp(item);
    setForm({
      ...item,
      published_at: item.published_at.split('T')[0],
      deadline: item.deadline.split('T')[0],
      main_image: item.main_image || '',
      gallery: item.gallery || [],
    });
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    const slugified = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setForm((prev) => ({
      ...prev,
      title_fr: val,
      slug: editingOpp ? prev.slug : slugified,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_fr || !form.slug) {
      alert('Veuillez renseigner le titre et le slug de l’opportunité.');
      return;
    }

    const payload: OpportunityItem = {
      id: editingOpp?.id || 'opp-' + Date.now(),
      slug: form.slug!,
      title_fr: form.title_fr || '',
      title_en: form.title_en || form.title_fr || '',
      type: form.type as OpportunityType || 'recruitment',
      description_fr: form.description_fr || '',
      description_en: form.description_en || form.description_fr || '',
      organization: form.organization || 'AGISSONS POUR SAUVER – APS-BÉNIN',
      published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : new Date().toISOString(),
      location_fr: form.location_fr || 'Comè',
      location_en: form.location_en || 'Comè',
      conditions_fr: form.conditions_fr || '',
      conditions_en: form.conditions_en || '',
      documents_required_fr: form.documents_required_fr || '',
      documents_required_en: form.documents_required_en || '',
      pdf_url: form.pdf_url || '',
      contact_email: form.contact_email || 'agissonspoursauver@gmail.com',
      status: form.status as OpportunityStatus || 'open',
      main_image: form.main_image || '',
      gallery: form.gallery || [],
    };

    try {
      await supabaseStore.saveOpportunity(payload);
      await loadOpportunities();
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer l'opportunité dans Supabase"}`);
    }
  };

  const confirmDelete = async () => {
    if (!oppToDelete) return;
    try {
      await supabaseStore.deleteOpportunity(oppToDelete.id);
      await loadOpportunities();
      setDeleteConfirmOpen(false);
      setOppToDelete(null);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message || "Impossible de supprimer l'opportunité dans Supabase"}`);
    }
  };

  const filtered = opportunities.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || item.title_fr.toLowerCase().includes(q) || item.slug.includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Gestion des Opportunités"
        subtitle="Publiez des avis de recrutement, stages, volontariat, appels d’offres et consultations"
        actionButton={
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#FF8C00]" />
            <span>Nouvelle Opportunité</span>
          </button>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        {/* Filter bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'all' ? 'bg-[#92278F] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Toutes ({opportunities.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'open' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Ouvertes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'closed' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Clôturées
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une offre..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Intitulé</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Date Limite</th>
                  <th className="py-3 px-4">Lieu</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        {item.main_image ? (
                          <img
                            src={item.main_image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0 bg-gray-50">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="line-clamp-1 max-w-md">{item.title_fr}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-gray-400">/{item.slug}</span>
                            {item.gallery && item.gallery.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-[#92278F] font-semibold">
                                +{item.gallery.length} photos
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#92278F] border border-purple-100 capitalize">
                        {item.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status === 'open' ? 'Ouverte' : 'Clôturée'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#92278F]">
                      {new Date(item.deadline).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.location_fr}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/opportunites/${item.slug}`}
                          target="_blank"
                          title="Aperçu public"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="Modifier"
                          className="p-1.5 rounded hover:bg-purple-50 text-[#92278F]"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOppToDelete(item);
                            setDeleteConfirmOpen(true);
                          }}
                          title="Supprimer"
                          className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Create/Edit */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 font-heading">
                  {editingOpp ? 'Modifier l’opportunité' : 'Publier une nouvelle opportunité'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Intitulé de l’opportunité (Français) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title_fr}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Title (English)
                    </label>
                    <input
                      type="text"
                      value={form.title_en}
                      onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Slug URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Type d'opportunité
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as OpportunityType })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                    >
                      <option value="recruitment">Recrutement</option>
                      <option value="internship">Stage</option>
                      <option value="volunteering">Volontariat</option>
                      <option value="call_for_tenders">Appel d'offres</option>
                      <option value="consultation">Consultation</option>
                      <option value="call_for_eoi">Appel à manifestation d'intérêt</option>
                      <option value="other">Autre opportunité</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Statut
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as OpportunityStatus })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                    >
                      <option value="open">Ouverte (Candidatures acceptées)</option>
                      <option value="closed">Clôturée</option>
                      <option value="archived">Archivée</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Date Limite de dépôt *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.deadline}
                      onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Lieu d'affectation
                    </label>
                    <input
                      type="text"
                      value={form.location_fr}
                      onChange={(e) => setForm({ ...form, location_fr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Email de réception des candidatures
                    </label>
                    <input
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                {/* Visuals: Main Image & Multi-Image Gallery */}
                <div className="space-y-4">
                  <ImagePickerField
                    label="Image principale de l’opportunité (Couverture)"
                    value={form.main_image || ''}
                    onChange={(url) => setForm({ ...form, main_image: url })}
                    placeholder="https://... ou choisir dans la médiathèque"
                    helpText="Image de couverture utilisée sur les listes, les cartes et dans l'en-tête de l'offre."
                  />

                  <MultiImageGalleryField
                    label="Galerie d’images de l’opportunité"
                    description="Sélectionnez plusieurs photos depuis la Médiathèque pour illustrer les activités, les missions ou les locaux."
                    images={form.gallery || []}
                    onChange={(gallery) => setForm({ ...form, gallery })}
                    onSetMainImage={(url) => setForm({ ...form, main_image: url })}
                    mainImageUrl={form.main_image}
                  />
                </div>

                {/* Description FR & EN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Description de la mission (Français)
                    </label>
                    <textarea
                      rows={4}
                      value={form.description_fr}
                      onChange={(e) => setForm({ ...form, description_fr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Description (English)
                    </label>
                    <textarea
                      rows={4}
                      value={form.description_en}
                      onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                {/* Conditions & Pièces à fournir */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Profil recherché & Conditions
                    </label>
                    <textarea
                      rows={4}
                      value={form.conditions_fr}
                      onChange={(e) => setForm({ ...form, conditions_fr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Dossier / Pièces à fournir
                    </label>
                    <textarea
                      rows={4}
                      value={form.documents_required_fr}
                      onChange={(e) => setForm({ ...form, documents_required_fr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold shadow-xs"
                  >
                    {editingOpp ? 'Enregistrer les modifications' : 'Créer l’opportunité'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          title="Supprimer cette offre ?"
          message={`Êtes-vous sûr de vouloir supprimer définitivement « ${oppToDelete?.title_fr} » ?`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setOppToDelete(null);
          }}
        />
      </main>
    </AdminAuthGuard>
  );
}
