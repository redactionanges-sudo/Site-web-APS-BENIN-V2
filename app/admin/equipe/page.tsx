'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { TeamMember, TeamCategory } from '@/types';
import { Plus, Edit, Trash2, X, Award, Check, ImageIcon, User } from 'lucide-react';
import { ImagePickerField } from '@/components/admin/MediaSelectorModal';

export default function AdminEquipePage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const [form, setForm] = useState<Partial<TeamMember>>({
    name: '',
    role_fr: '',
    role_en: '',
    photo: '',
    bio_fr: '',
    bio_en: '',
    expertise_fr: '',
    expertise_en: '',
    category: 'operations',
    order_index: 1,
    is_active: true,
  });

  const loadData = async () => {
    const list = await supabaseStore.getTeam();
    setTeam(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingMember(null);
    setForm({
      name: '',
      role_fr: '',
      role_en: '',
      photo: '',
      bio_fr: '',
      bio_en: '',
      expertise_fr: '',
      expertise_en: '',
      category: 'operations',
      order_index: team.length + 1,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (m: TeamMember) => {
    setEditingMember(m);
    setForm({
      ...m,
      photo: m.photo || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.role_fr?.trim()) return;

    const payload: TeamMember = {
      id: editingMember?.id || 'team-' + Date.now(),
      name: form.name.trim(),
      role_fr: form.role_fr.trim(),
      role_en: (form.role_en || form.role_fr).trim(),
      photo: (form.photo || '').trim(),
      bio_fr: form.bio_fr || '',
      bio_en: form.bio_en || form.bio_fr || '',
      expertise_fr: form.expertise_fr || '',
      expertise_en: form.expertise_en || form.expertise_fr || '',
      category: (form.category as TeamCategory) || 'operations',
      order_index: Number(form.order_index) || 1,
      is_active: form.is_active !== undefined ? Boolean(form.is_active) : true,
    };

    try {
      await supabaseStore.saveTeamMember(payload);
      await loadData();
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer le membre de l'équipe dans Supabase"}`);
    }
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await supabaseStore.deleteTeamMember(memberToDelete.id);
      await loadData();
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message || "Impossible de supprimer le membre dans Supabase"}`);
    }
  };

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Gestion de l’Équipe"
        subtitle="Membres de la coordination exécutive, responsables techniques et points focaux"
        actionButton={
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#FF8C00]" />
            <span>Nouveau Membre</span>
          </button>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                {m.photo ? (
                  <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={m.photo}
                      alt={`Photo de ${m.name}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-purple-50 via-gray-50 to-purple-100 flex flex-col items-center justify-center text-[#92278F] p-4 border-b border-gray-100">
                    <div className="w-16 h-16 rounded-full bg-white shadow-2xs border border-purple-200/80 flex items-center justify-center mb-2">
                      <User className="w-8 h-8 text-[#92278F] stroke-[1.5]" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 italic">Aucune photo associée</span>
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm text-gray-900 font-heading">
                    {m.name}
                  </h3>
                  <p className="text-xs font-bold text-[#92278F]">
                    {m.role_fr}
                  </p>
                  <p className="text-[11px] text-gray-500 line-clamp-2">
                    {m.bio_fr}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-mono">
                  Ordre: {m.order_index}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(m)}
                    className="p-1 rounded hover:bg-purple-50 text-[#92278F]"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMemberToDelete(m);
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
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="font-bold text-base text-gray-900 font-heading">
                  {editingMember ? 'Modifier le membre' : 'Ajouter un membre d’équipe'}
                </h3>
                <button onClick={() => setModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Fonction / Rôle *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.role_fr}
                    onChange={(e) => setForm({ ...form, role_fr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Pôle / Catégorie
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as TeamCategory })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none bg-white"
                    >
                      <option value="direction">Direction / Coordination</option>
                      <option value="coordination">Coordination des programmes</option>
                      <option value="operations">Opérations terrain / Cellule VBG</option>
                      <option value="technical">Pôle technique / Administratif</option>
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

                {/* Photo du membre */}
                <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#92278F]" />
                      <span>Photo du membre</span>
                    </span>
                    {form.photo ? (
                      <span className="text-[11px] text-green-700 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-600" />
                        Photo associée
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">
                        Aucune photo associée
                      </span>
                    )}
                  </div>

                  <ImagePickerField
                    label="Portrait du membre"
                    value={form.photo || ''}
                    onChange={(url) => setForm({ ...form, photo: url })}
                    placeholder="Choisir dans la Médiathèque ou saisir une URL..."
                    helpText="Sélectionnez le portrait du membre depuis la Médiathèque centrale sans réuploader ni dupliquer le fichier."
                  />

                  {form.photo && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                      <span className="text-[10px] text-gray-500 font-mono truncate max-w-[260px]">
                        {form.photo}
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, photo: '' })}
                        className="text-[11px] text-red-600 hover:text-red-700 font-medium hover:underline inline-flex items-center gap-1 shrink-0"
                        title="Retire uniquement l'association de la photo au membre, sans supprimer le fichier de la Médiathèque"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Retirer l’association</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Domaine d'expertise
                  </label>
                  <input
                    type="text"
                    value={form.expertise_fr}
                    onChange={(e) => setForm({ ...form, expertise_fr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Biographie courte
                  </label>
                  <textarea
                    rows={3}
                    value={form.bio_fr}
                    onChange={(e) => setForm({ ...form, bio_fr: e.target.value })}
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
          title="Supprimer ce membre ?"
          message={`Êtes-vous sûr de vouloir supprimer définitivement « ${memberToDelete?.name} » ?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      </main>
    </AdminAuthGuard>
  );
}
