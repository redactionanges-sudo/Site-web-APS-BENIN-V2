'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SiteLogo } from '@/components/SiteLogo';
import {
  Lock,
  Mail,
  Key,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Database,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetFeedback, setResetFeedback] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push('/admin');
      } else {
        setErrorMsg(res.error || 'Identifiants invalides. Veuillez réessayer.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    const res = await resetPassword(resetEmail);
    setResetFeedback(res.message);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4 selection:bg-[#92278F] selection:text-white">
      {/* Background glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#92278F]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-[#FF8C00]/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 z-10">
        {/* Header */}
        <div className="bg-[#92278F] p-6 text-center text-white relative">
          <SiteLogo variant="auth" priority />
          <h1 className="text-xl font-extrabold tracking-tight font-heading">
            AGISSONS POUR SAUVER
          </h1>
          <p className="text-xs text-purple-200 mt-1 uppercase tracking-widest font-semibold">
            Portail d'Administration Institutionnel
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Adresse email administrateur
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@aps-benin.org"
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">
                  Mot de passe
                </label>
                <Link
                  href="/admin/forgot-password"
                  className="text-[11px] text-[#92278F] hover:underline font-semibold"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white font-bold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
            >
              <Lock className="w-4 h-4 text-[#FF8C00]" />
              <span>{loading ? 'Connexion en cours...' : 'Se connecter au Back-Office'}</span>
            </button>
          </form>

          {/* Return link */}
          <div className="pt-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#92278F]"
            >
              <span>← Retour au site public APS-BÉNIN</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Reset Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 font-heading mb-2">
              Réinitialisation de mot de passe
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Saisissez l’adresse email associée à votre compte administrateur.
            </p>

            {resetFeedback ? (
              <div className="p-3 rounded-lg bg-green-50 text-green-800 text-xs mb-4">
                {resetFeedback}
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="nom@aps-benin.org"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalOpen(false);
                      setResetFeedback('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#92278F] text-white text-xs font-bold"
                  >
                    Envoyer le lien
                  </button>
                </div>
              </form>
            )}

            {resetFeedback && (
              <button
                type="button"
                onClick={() => {
                  setResetModalOpen(false);
                  setResetFeedback('');
                }}
                className="w-full py-2 rounded-lg bg-gray-100 text-gray-800 text-xs font-bold"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
