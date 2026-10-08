'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { UserProfile, UserRole } from '@/types';
import { Plus, Edit, Trash2, UserCog, ShieldCheck, X } from 'lucide-react';

export default function AdminUtilisateursPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const [form, setForm] = useState<Partial<UserProfile>>({
    email: '',
    full_name: '',
    role: 'editor',
    is_active: true,
  });

  const loadData = async () => {
    const list = await supabaseStore.getUsers();
    setUsers(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingUser(null);
    setForm({
      email: '',
      full_name: '',
      role: 'editor',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setForm({
      ...u,
      is_active: u.is_active !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.full_name) return;

    const payload: UserProfile = {
      id: editingUser?.id || 'usr-' + Date.now(),
      email: form.email.trim().toLowerCase(),
      full_name: form.full_name,
      role: (form.role as UserRole) || 'editor',
      is_active: form.is_active !== false,
      created_at: editingUser?.created_at || new Date().toISOString(),
      last_sign_in: editingUser?.last_sign_in,
    };

    await supabaseStore.saveUser(payload);
    await loadData();
    setModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    await supabaseStore.deleteUser(userToDelete.id);
    await loadData();
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  return (
    <AdminAuthGuard requireSuperAdmin>
      <AdminHeader
        title="Gestion des Utilisateurs & Rôles"
        subtitle="Contrôle d’accès, gestion des comptes Super Administrateur et Éditeurs de contenus"
        actionButton={
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#FF8C00]" />
            <span>Nouvel Administrateur</span>
          </button>
        }
      />

      <main className="p-6 space-y-6 max-w-5xl">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Dernière connexion</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-gray-900">
                    {u.full_name}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'super_admin'
                          ? 'bg-purple-900 text-purple-100'
                          : u.role === 'admin'
                          ? 'bg-orange-100 text-orange-900 border border-orange-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {u.role === 'super_admin'
                        ? 'Super Administrateur'
                        : u.role === 'admin'
                        ? 'Administrateur'
                        : 'Éditeur'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.is_active !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.is_active !== false ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                    {u.last_sign_in ? new Date(u.last_sign_in).toLocaleString('fr-FR') : 'Jamais connecté'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="p-1 rounded hover:bg-purple-50 text-[#92278F]"
                        title="Modifier l'utilisateur"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserToDelete(u);
                          setDeleteConfirmOpen(true);
                        }}
                        disabled={users.length <= 1}
                        className="p-1 rounded hover:bg-red-50 text-red-600 disabled:opacity-30"
                        title="Révoquer l'accès"
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

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="font-bold text-base text-gray-900 font-heading">
                  {editingUser ? 'Modifier l’administrateur' : 'Créer un administrateur'}
                </h3>
                <button onClick={() => setModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nom & Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Adresse Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Niveau d'Accès / Rôle *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none bg-white font-medium"
                  >
                    <option value="editor">Éditeur (Gestion des contenus éditoriaux)</option>
                    <option value="admin">Administrateur (Gestion éditoriale et administrative)</option>
                    <option value="super_admin">Super Administrateur (Accès complet, rôles & paramètres)</option>
                  </select>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="user_is_active"
                    checked={form.is_active !== false}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-[#92278F] focus:ring-[#92278F]"
                  />
                  <label htmlFor="user_is_active" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Compte actif (autoriser la connexion au Back-Office)
                  </label>
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
          title="Supprimer cet utilisateur ?"
          message={`Êtes-vous sûr de vouloir révoquer l’accès pour « ${userToDelete?.email} » ?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      </main>
    </AdminAuthGuard>
  );
}
