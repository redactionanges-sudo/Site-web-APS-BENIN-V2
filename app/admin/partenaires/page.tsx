'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { PartnerItem, PartnerCategory } from '@/types';
import { ImagePickerField } from '@/components/admin/MediaSelectorModal';
import { Plus, Edit, Trash2, ExternalLink, X, Building2, Check, ImageIcon } from 'lucide-react';

export default function AdminPartenairesPage() {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<PartnerItem | null>(null);

  const [form, setForm] = useState<Partial<PartnerItem>>({
    name: '',
    logo: '',
    description_fr: '',
    description_en: '',
    category: 'institutional',
    collaboration_scope_fr: '',
    collaboration_scope_en: '',
    website_url: '',
    order_index: 1,
    is_active: true,
  });

  const loadData = async () => {
    const list = await supabaseStore.getPartners();
    setPartners(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingPartner(null);
    setForm({
      name: '',
      logo: '',
      description_fr: '',
      description_en: '',
      category: 'technical',
      collaboration_scope_fr: '',
      collaboration_scope_en: '',
      website_url: '',
      order_index: partners.length + 1,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (p: PartnerItem) => {
    setEditingPartner(p);
    setForm({
      ...p,
      logo: p.logo || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;

    const payload: PartnerItem = {
      id: editingPartner?.id || 'part-' + Date.now(),
      name: form.name.trim(),
      logo: (form.logo || '').trim(),
      description_fr: form.description_fr || '',
      description_en: form.description_en || form.description_fr || '',
      category: (form.category as PartnerCategory) || 'technical',
      collaboration_scope_fr: form.collaboration_scope_fr || '',
      collaboration_scope_en: form.collaboration_scope_en || form.collaboration_scope_fr || '',
      website_url: (form.website_url || '').trim(),
      order_index: Number(form.order_index) || 1,
      is_active: form.is_active !== undefined ? Boolean(form.is_active) : true,
    };

    try {
      await supabaseStore.savePartner(payload);
      await loadData();
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer le partenaire dans Supabase"}`);
    }
  };

  const confirmDelete = async () => {
    if (!partnerToDelete) return;
    try {
      await supabaseStore.deletePartner(partnerToDelete.id);
      await loadData();
      setDeleteConfirmOpen(false);
      setPartnerToDelete(null);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message || "Impossible de supprimer le partenaire dans Supabase"}`);
    }
  };

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Gestion des Partenaires"
        subtitle="Répertoire public des partenaires institutionnels, techniques et financiers d’APS-BÉNIN"
        actionButton={
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#FF8C00]" />
            <span>Nouveau Partenaire</span>
          </button>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {p.logo ? (
                    <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                      <img
                        src={p.logo}
                        alt={`Logo ${p.name}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-purple-50 border border-purple-200 text-[#92278F] flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 stroke-[1.75]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#92278F] uppercase tracking-wider block">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-sm text-gray-900 font-heading truncate">
                      {p.name}
                    </h3>
                    {!p.logo && (
                      <span className="text-[10px] text-gray-400 italic block">
                        Aucun logo associé
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-3">
                  {p.description_fr}
                </p>

                {p.collaboration_scope_fr && (
                  <p className="text-[11px] text-[#FF8C00] font-medium line-clamp-2">
                    Scope : {p.collaboration_scope_fr}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                {p.website_url ? (
                  <a
                    href={p.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-[#92278F] flex items-center gap-1"
                  >
                    <span>Lien</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : <span />}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="p-1 rounded hover:bg-purple-50 text-[#92278F]"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPartnerToDelete(p);
                      setDeleteConfirmOpen(true);
                    }}
                    className="p-1 rounded hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="font-bold text-base text-gray-900 font-heading">
                  {editingPartner ? 'Modifier le partenaire' : 'Ajouter un partenaire'}
                </h3>
                <button onClick={() => setModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nom du Partenaire *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as PartnerCategory })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none bg-white"
                    >
                      <option value="technical">Technique</option>
                      <option value="financial">Financier</option>
                      <option value="institutional">Institutionnel</option>
                      <option value="network_coalition">Réseau / Coalition</option>
                      <option value="partner_organization">Organisation Partenaire</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Ordre d'affichage
                    </label>
                    <input
                      type="number"
                      value={form.order_index}
                      onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                    />
                  </div>
                </div>

                {/* Logo / image du partenaire */}
                <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#92278F]" />
                      <span>Logo / identité visuelle du partenaire</span>
                    </span>
                    {form.logo ? (
                      <span className="text-[11px] text-green-700 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-600" />
                        Logo associé
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">
                        Aucun logo associé
                      </span>
                    )}
                  </div>

                  <ImagePickerField
                    label="Image du logo"
                    value={form.logo || ''}
                    onChange={(url) => setForm({ ...form, logo: url })}
                    placeholder="Choisir dans la Médiathèque ou saisir une URL..."
                    helpText="Ce logo est affiché sur la page publique des partenaires et le carrousel. Choisissez un logo existant dans la Médiathèque centrale sans créer de copie."
                  />

                  {form.logo && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                      <span className="text-[10px] text-gray-500 font-mono truncate max-w-[260px]">
                        {form.logo}
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, logo: '' })}
                        className="text-[11px] text-red-600 hover:text-red-700 font-medium hover:underline inline-flex items-center gap-1 shrink-0"
                        title="Retire uniquement l'association du logo au partenaire, sans supprimer le fichier de la Médiathèque"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Retirer l’association</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description institutionnelle
                  </label>
                  <textarea
                    rows={2}
                    value={form.description_fr}
                    onChange={(e) => setForm({ ...form, description_fr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Domaine de coopération / synergie
                  </label>
                  <input
                    type="text"
                    value={form.collaboration_scope_fr}
                    onChange={(e) => setForm({ ...form, collaboration_scope_fr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Site web officiel (URL)
                  </label>
                  <input
                    type="url"
                    value={form.website_url}
                    onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#92278F] text-white text-xs font-bold"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={deleteConfirmOpen}
          title="Supprimer ce partenaire ?"
          message={`Êtes-vous sûr de vouloir supprimer définitivement « ${partnerToDelete?.name} » ?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      </main>
    </AdminAuthGuard>
  );
}
