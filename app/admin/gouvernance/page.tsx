'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { GovernanceMember } from '@/types';
import { Plus, Edit, Trash2, X, Building } from 'lucide-react';

export default function AdminGouvernancePage() {
  const [members, setMembers] = useState<GovernanceMember[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<GovernanceMember | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<GovernanceMember | null>(null);

  const [form, setForm] = useState<Partial<GovernanceMember>>({
    name: '',
    title_fr: '',
    title_en: '',
    role_fr: '',
    role_en: '',
    bio_fr: '',
    bio_en: '',
    organ: 'ca',
    order_index: 1,
  });

  const loadData = async () => {
    const list = await supabaseStore.getGovernance();
    setMembers(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingMember(null);
    setForm({
      name: '',
      title_fr: 'Membre du Conseil',
      title_en: 'Board Member',
      role_fr: '',
      role_en: '',
      bio_fr: '',
      bio_en: '',
      organ: 'ca',
      order_index: members.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (m: GovernanceMember) => {
    setEditingMember(m);
    setForm({ ...m });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.title_fr) return;

    const payload: GovernanceMember = {
      id: editingMember?.id || 'gov-' + Date.now(),
      name: form.name,
      title_fr: form.title_fr,
      title_en: form.title_en || form.title_fr,
      role_fr: form.role_fr || '',
      role_en: form.role_en || form.role_fr || '',
      bio_fr: form.bio_fr || '',
      bio_en: form.bio_en || form.bio_fr || '',
      organ: form.organ || 'ca',
      order_index: Number(form.order_index) || 1,
    };

    try {
      await supabaseStore.saveGovernanceMember(payload);
      await loadData();
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer le membre de gouvernance dans Supabase"}`);
    }
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await supabaseStore.deleteGovernanceMember(memberToDelete.id);
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
        title="Gouvernance & Conseil d’Administration"
        subtitle="Membres du Conseil d'Administration et du Comité de Surveillance statutaires"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#92278F]">
                    {m.title_fr}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 uppercase">
                    {m.organ.toUpperCase()}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-gray-900 font-heading mb-1">
                  {m.name}
                </h3>
                <p className="text-xs font-semibold text-[#FF8C00] mb-2">
                  {m.role_fr}
                </p>
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {m.bio_fr}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(m)}
                  className="p-1.5 rounded hover:bg-purple-50 text-[#92278F]"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMemberToDelete(m);
                    setDeleteConfirmOpen(true);
                  }}
                  className="p-1.5 rounded hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="font-bold text-base text-gray-900 font-heading">
                  {editingMember ? 'Modifier le membre' : 'Ajouter un membre'}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Titre / Rôle statutaire *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title_fr}
                      onChange={(e) => setForm({ ...form, title_fr: e.target.value })}
                      placeholder="Présidence du CA, etc."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Organe
                    </label>
                    <select
                      value={form.organ}
                      onChange={(e) => setForm({ ...form, organ: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none bg-white"
                    >
                      <option value="ca">Conseil d’Administration</option>
                      <option value="cs">Comité de Surveillance</option>
                      <option value="direction">Direction</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mission au sein de l’organe
                  </label>
                  <input
                    type="text"
                    value={form.role_fr}
                    onChange={(e) => setForm({ ...form, role_fr: e.target.value })}
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
          message={`Êtes-vous sûr de vouloir supprimer « ${memberToDelete?.name} » ?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      </main>
    </AdminAuthGuard>
  );
}
