'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { UserProfile, UserRole } from '@/types';
import {
  Plus,
  Edit,
  Trash2,
  UserCog,
  ShieldCheck,
  X,
  Check,
  Copy,
  KeyRound,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldAlert,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface CreatedCredentials {
  email: string;
  fullName: string;
  role: UserRole;
  initialPassword?: string;
  recoveryLink?: string;
}

export default function AdminUtilisateursPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Success summary modal after new user created
  const [createdSummary, setCreatedSummary] = useState<CreatedCredentials | null>(null);
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form state
  const [formEmail, setFormEmail] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('admin');
  const [formIsActive, setFormIsActive] = useState(true);
  const [passwordMode, setPasswordMode] = useState<'auto' | 'custom'>('auto');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await supabaseStore.getUsers();
      setUsers(list);
    } catch (err: any) {
      console.error('Erreur chargement utilisateurs:', err);
      setFeedbackToast({ type: 'error', message: 'Impossible de charger la liste des utilisateurs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  const openNewModal = () => {
    setEditingUser(null);
    setFormEmail('');
    setFormFullName('');
    setFormRole('admin');
    setFormIsActive(true);
    setPasswordMode('auto');
    setFormPassword('');
    setShowPassword(false);
    setErrorMessage(null);
    setModalOpen(true);
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setFormEmail(u.email);
    setFormFullName(u.full_name);
    setFormRole(u.role);
    setFormIsActive(u.is_active !== false);
    setPasswordMode('auto');
    setFormPassword('');
    setShowPassword(false);
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailClean = formEmail.trim().toLowerCase();
    const nameClean = formFullName.trim();

    if (!emailClean || !nameClean) {
      setErrorMessage('Veuillez renseigner le nom complet et l’adresse email.');
      return;
    }

    if (!editingUser && passwordMode === 'custom' && formPassword.trim().length < 8) {
      setErrorMessage('Le mot de passe initial personnalisé doit contenir au minimum 8 caractères.');
      return;
    }

    if (editingUser && formPassword && formPassword.trim().length < 8) {
      setErrorMessage('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    setSubmitting(true);

    try {
      if (!editingUser) {
        // CRÉATION NOUVEL UTILISATEUR via route API serveur sécurisée
        const createPayload: {
          email: string;
          full_name: string;
          role: UserRole;
          is_active: boolean;
          password?: string;
        } = {
          email: emailClean,
          full_name: nameClean,
          role: formRole,
          is_active: formIsActive,
        };

        if (passwordMode === 'custom' && formPassword.trim()) {
          createPayload.password = formPassword.trim();
        }

        const res = await supabaseStore.createUser(createPayload);

        if (!res.success) {
          setErrorMessage(res.error || 'Erreur lors de la création du compte.');
          setSubmitting(false);
          return;
        }

        // Succès réel !
        setModalOpen(false);
        await loadData();

        // Afficher le modal récapitulatif avec les identifiants
        setCreatedSummary({
          email: emailClean,
          fullName: nameClean,
          role: formRole,
          initialPassword: res.initialPassword,
          recoveryLink: res.recoveryLink,
        });

        setFeedbackToast({
          type: 'success',
          message: `Utilisateur « ${nameClean} » créé avec succès avec le rôle ${formRole === 'super_admin' ? 'Super Administrateur' : formRole === 'admin' ? 'Administrateur' : 'Éditeur'}.`,
        });
      } else {
        // MODIFICATION D'UN UTILISATEUR EXISTANT via route API serveur
        const updatePayload: {
          id: string;
          full_name: string;
          role: UserRole;
          is_active: boolean;
          password?: string;
        } = {
          id: editingUser.id,
          full_name: nameClean,
          role: formRole,
          is_active: formIsActive,
        };

        if (formPassword.trim()) {
          updatePayload.password = formPassword.trim();
        }

        const res = await supabaseStore.updateUser(updatePayload);

        if (!res.success) {
          setErrorMessage(res.error || 'Erreur lors de la modification de l’utilisateur.');
          setSubmitting(false);
          return;
        }

        setModalOpen(false);
        await loadData();

        setFeedbackToast({
          type: 'success',
          message: `Profil de « ${nameClean} » mis à jour avec succès.`,
        });
      }
    } catch (err: any) {
      console.error('Erreur soumission formulaire:', err);
      setErrorMessage(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setSubmitting(true);
    try {
      const res = await supabaseStore.deleteUser(userToDelete.id);
      if (res && (res as any).error) {
        setFeedbackToast({
          type: 'error',
          message: (res as any).error || 'Impossible de supprimer l’utilisateur.',
        });
      } else {
        setFeedbackToast({
          type: 'success',
          message: `Le compte « ${userToDelete.full_name} » a été révoqué avec succès.`,
        });
      }
      await loadData();
    } catch (err: any) {
      console.error('Erreur suppression utilisateur:', err);
      setFeedbackToast({ type: 'error', message: err.message || 'Erreur lors de la suppression.' });
    } finally {
      setSubmitting(false);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const copyToClipboard = async (text: string, type: 'pwd' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'pwd') {
        setCopiedPwd(true);
        setTimeout(() => setCopiedPwd(false), 2500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <AdminAuthGuard requireSuperAdmin>
      <AdminHeader
        title="Gestion des Utilisateurs & Rôles"
        subtitle="Contrôle d’accès, gestion des comptes Super Administrateur, Administrateurs et Éditeurs"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
              title="Rafraîchir la liste depuis Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#92278F]' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              type="button"
              onClick={openNewModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#FF8C00]" />
              <span>Nouvel Administrateur</span>
            </button>
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-5xl">
        {/* Toast Feedback */}
        {feedbackToast && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 border shadow-xs transition-all ${
              feedbackToast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {feedbackToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs font-medium flex-1">{feedbackToast.message}</div>
            <button
              type="button"
              onClick={() => setFeedbackToast(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Informational banner about privileged security */}
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-orange-50/40 p-4 rounded-2xl border border-purple-100 flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-[#92278F] shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 space-y-1">
            <p className="font-bold text-gray-900">
              Architecture d’authentification sécurisée APS-BÉNIN
            </p>
            <p className="text-gray-600 leading-relaxed">
              La création d’un nouvel administrateur initialise directement son identité dans <strong>Supabase Auth</strong> et synchronise son profil dans la table <strong>public.profiles</strong> avec le rôle spécifié. Le nouvel administrateur peut immédiatement se connecter avec ses propres identifiants sur <code>/admin/login</code>.
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Comptes autorisés au Back-Office ({users.length})
              </h2>
              <p className="text-[11px] text-gray-500">
                Seul le Super Administrateur peut accorder ou révoquer les accès.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4">Adresse Email</th>
                  <th className="py-3 px-4">Rôle & Permissions</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Dernière connexion</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-[#92278F] font-bold flex items-center justify-center text-xs">
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">
                              {u.full_name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-purple-700 font-medium">
                                (Votre compte actuel)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600 text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            u.role === 'super_admin'
                              ? 'bg-purple-900 text-purple-100'
                              : u.role === 'admin'
                              ? 'bg-orange-100 text-orange-950 border border-orange-200'
                              : 'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.role === 'super_admin'
                                ? 'bg-purple-300'
                                : u.role === 'admin'
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          {u.role === 'super_admin'
                            ? 'Super Administrateur'
                            : u.role === 'admin'
                            ? 'Administrateur'
                            : 'Éditeur de contenus'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.is_active !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.is_active !== false ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                          {u.is_active !== false ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                        {u.last_sign_in
                          ? new Date(u.last_sign_in).toLocaleString('fr-FR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Jamais connecté'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg hover:bg-purple-50 text-[#92278F] transition-colors"
                            title="Modifier les permissions / informations"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUserToDelete(u);
                              setDeleteConfirmOpen(true);
                            }}
                            disabled={isCurrent || users.length <= 1}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title={
                              isCurrent
                                ? 'Impossible de révoquer votre propre compte'
                                : 'Révoquer l’accès'
                            }
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
        </div>

        {/* Modal Création / Modification */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#92278F] flex items-center justify-center">
                    <UserCog className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900 font-heading">
                      {editingUser ? 'Modifier l’administrateur' : 'Créer un nouvel administrateur'}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {editingUser
                        ? `Mise à jour des permissions de ${editingUser.full_name}`
                        : 'Compte Supabase Auth et profil public.profiles synchronisés'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error banner inside modal */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nom & Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex. Paul HOUNDÉGNON"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#92278F] focus:ring-1 focus:ring-[#92278F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Adresse Email professionnelle *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editingUser}
                    placeholder="administrateur@apsbeninong.org"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#92278F] focus:ring-1 focus:ring-[#92278F] outline-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed font-mono"
                  />
                  {editingUser && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      L’adresse email est l’identifiant principal Supabase Auth et ne peut être modifiée directement ici.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Rôle & Privilèges *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#92278F] focus:ring-1 focus:ring-[#92278F] outline-none bg-white font-medium text-gray-800"
                  >
                    <option value="admin">
                      Administrateur (Gestion des projets, actualités, médias, gouvernance)
                    </option>
                    <option value="editor">
                      Éditeur (Accès limité aux contenus éditoriaux)
                    </option>
                    <option value="super_admin">
                      Super Administrateur (Accès complet, rôles & configuration système)
                    </option>
                  </select>
                </div>

                {/* Password field / options */}
                {!editingUser ? (
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <label className="block text-xs font-bold text-gray-800">
                      Mot de passe initial
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordMode('auto');
                          setFormPassword('');
                        }}
                        className={`px-3 py-2 text-xs rounded-lg font-bold border transition-all text-center ${
                          passwordMode === 'auto'
                            ? 'bg-[#92278F] text-white border-[#92278F] shadow-xs'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Génération automatique
                      </button>
                      <button
                        type="button"
                        onClick={() => setPasswordMode('custom')}
                        className={`px-3 py-2 text-xs rounded-lg font-bold border transition-all text-center ${
                          passwordMode === 'custom'
                            ? 'bg-[#92278F] text-white border-[#92278F] shadow-xs'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Définir manuellement
                      </button>
                    </div>

                    {passwordMode === 'custom' ? (
                      <div className="relative pt-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimum 8 caractères"
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          className="w-full pl-3.5 pr-10 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-500 leading-normal">
                        Un mot de passe fort et sécurisé (14 caractères) sera automatiquement généré par le serveur et vous sera affiché immédiatement pour transmission.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <label className="block text-xs font-bold text-gray-800">
                      Réinitialiser le mot de passe (optionnel)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Laisser vide pour ne pas modifier le mot de passe"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Account active checkbox */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="user_is_active"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#92278F] focus:ring-[#92278F]"
                  />
                  <label
                    htmlFor="user_is_active"
                    className="text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    Compte actif (autoriser la connexion au Back-Office)
                  </label>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  >
                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingUser ? 'Enregistrer les modifications' : 'Créer l’administrateur'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Récapitulatif après création avec succès */}
        {createdSummary && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 font-heading">
                    Utilisateur créé avec succès
                  </h3>
                  <p className="text-xs text-gray-500">
                    Le compte a été enregistré dans Supabase Auth et public.profiles
                  </p>
                </div>
              </div>

              {/* Détails du compte */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Nom complet :</span>
                  <span className="font-bold text-gray-900">{createdSummary.fullName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Adresse email :</span>
                  <span className="font-mono font-bold text-gray-900">{createdSummary.email}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Rôle attribué :</span>
                  <span className="font-bold text-[#92278F]">
                    {createdSummary.role === 'super_admin'
                      ? 'Super Administrateur'
                      : createdSummary.role === 'admin'
                      ? 'Administrateur'
                      : 'Éditeur de contenus'}
                  </span>
                </div>

                {/* Mot de passe initial */}
                {createdSummary.initialPassword && (
                  <div className="pt-2">
                    <span className="block text-[11px] font-bold text-gray-700 mb-1">
                      Mot de passe initial :
                    </span>
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-purple-200 font-mono text-xs text-gray-900 font-bold">
                      <span className="tracking-wider">{createdSummary.initialPassword}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(createdSummary.initialPassword!, 'pwd')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#92278F] text-white text-[11px] font-sans font-bold hover:bg-[#741772] transition-colors"
                      >
                        {copiedPwd ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Lien d'initialisation officiel */}
                {createdSummary.recoveryLink && (
                  <div className="pt-2">
                    <span className="block text-[11px] font-bold text-gray-700 mb-1">
                      Lien d’initialisation de mot de passe (domaine officiel) :
                    </span>
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 font-mono text-[11px] text-gray-600 truncate">
                      <span className="truncate pr-2">{createdSummary.recoveryLink}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(createdSummary.recoveryLink!, 'link')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 text-[11px] font-sans shrink-0 font-medium"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <span className="font-bold">Important :</span> Transmettez ces identifiants de façon sécurisée au nouvel administrateur. Il peut se connecter directement à l’adresse <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 font-mono font-bold">https://www.apsbeninong.org/admin/login</code>.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCreatedSummary(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#92278F] text-white text-xs font-bold hover:bg-[#741772] transition-colors shadow-xs"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmation Suppression */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          title="Révoquer cet accès administrateur ?"
          message={`Êtes-vous certain de vouloir révoquer l’accès pour « ${userToDelete?.full_name} (${userToDelete?.email}) » ? Le compte sera supprimé de la base de données et de l'authentification Supabase.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setUserToDelete(null);
          }}
        />
      </main>
    </AdminAuthGuard>
  );
}
