'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { DomainOfIntervention } from '@/types';
import { Plus, Edit, Trash2, ShieldCheck, X } from 'lucide-react';

export default function AdminDomainesPage() {
  const [domains, setDomains] = useState<DomainOfIntervention[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainOfIntervention | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<DomainOfIntervention | null>(null);

  const [form, setForm] = useState<Partial<DomainOfIntervention>>({
    title_fr: '',
    title_en: '',
    slug: '',
    short_desc_fr: '',
    short_desc_en: '',
    full_desc_fr: '',
    full_desc_en: '',
    icon_name: 'ShieldCheck',
    order_index: 1,
    is_active: true,
  });

  const loadData = async () => {
    const list = await supabaseStore.getDomains();
    setDomains(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingDomain(null);
    setForm({
      title_fr: '',
      title_en: '',
      slug: '',
      short_desc_fr: '',
      short_desc_en: '',
      full_desc_fr: '',
      full_desc_en: '',
      icon_name: 'ShieldCheck',
      order_index: domains.length + 1,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (d: DomainOfIntervention) => {
    setEditingDomain(d);
    setForm({ ...d });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_fr) return;
    const slug = form.slug || form.title_fr.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const payload: DomainOfIntervention = {
      id: editingDomain?.id || 'dom-' + Date.now(),
      slug,
      title_fr: form.title_fr,
      title_en: form.title_en || form.title_fr,
      short_desc_fr: form.short_desc_fr || '',
      short_desc_en: form.short_desc_en || form.short_desc_fr || '',
      full_desc_fr: form.full_desc_fr || '',
      full_desc_en: form.full_desc_en || form.full_desc_fr || '',
      icon_name: form.icon_name || 'ShieldCheck',
      order_index: Number(form.order_index) || 1,
      is_active: Boolean(form.is_active),
    };

    try {
      await supabaseStore.saveDomain(payload);
      await loadData();
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer le domaine dans Supabase"}`);
    }
  };

  const confirmDelete = async () => {
    if (!domainToDelete) return;
    try {
      await supabaseStore.deleteDomain(domainToDelete.id);
      await loadData();
      setDeleteConfirmOpen(false);
      setDomainToDelete(null);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message || "Impossible de supprimer le domaine dans Supabase"}`);
    }
  };

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Domaines d’Intervention"
        subtitle="Configurez les axes prioritaires d’action de l’organisation APS-BÉNIN"
        actionButton={
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#FF8C00]" />
            <span>Nouveau Domaine</span>
          </button>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((dom) => (
            <div
              key={dom.id}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#FF8C00] uppercase tracking-wider">
                    Ordre : {dom.order_index}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      dom.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {dom.is_active ? 'Actif' : 'Désactivé'}
                  </span>
                </div>

                <h3 className="font-bold text-base text-gray-900 font-heading mb-2">
                  {dom.title_fr}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                  {dom.short_desc_fr}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(dom)}
                  className="p-1.5 rounded hover:bg-purple-50 text-[#92278F]"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDomainToDelete(dom);
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
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="font-bold text-base text-gray-900">
                  {editingDomain ? 'Modifier le domaine' : 'Ajouter un domaine d’action'}
                </h3>
                <button onClick={() => setModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Titre (Français) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title_fr}
                      onChange={(e) => setForm({ ...form, title_fr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Titre (Anglais)
                    </label>
                    <input
                      type="text"
                      value={form.title_en}
                      onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description courte (Français)
                  </label>
                  <textarea
                    rows={2}
                    value={form.short_desc_fr}
                    onChange={(e) => setForm({ ...form, short_desc_fr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description détaillée (Français)
                  </label>
                  <textarea
                    rows={4}
                    value={form.full_desc_fr}
                    onChange={(e) => setForm({ ...form, full_desc_fr: e.target.value })}
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
          title="Supprimer ce domaine ?"
          message={`Êtes-vous sûr de vouloir supprimer définitivement le domaine « ${domainToDelete?.title_fr} » ?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      </main>
    </AdminAuthGuard>
  );
}
