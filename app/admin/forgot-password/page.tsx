'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

export default function AdminForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await resetPassword(email);
      setFeedback(res.message);
      setSubmitted(true);
    } catch (err: any) {
      setFeedback('Si un compte administrateur est associé à cette adresse, un lien sécurisé a été envoyé.');
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4 selection:bg-[#92278F] selection:text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#92278F]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-[#FF8C00]/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 z-10">
        {/* Header */}
        <div className="bg-[#92278F] p-6 text-center text-white relative">
          <div className="w-14 h-14 mx-auto rounded-xl bg-white text-[#92278F] flex items-center justify-center font-extrabold text-2xl border-2 border-[#FF8C00] shadow-md mb-3">
            APS
          </div>
          <h1 className="text-xl font-extrabold tracking-tight font-heading">
            AGISSONS POUR SAUVER
          </h1>
          <p className="text-xs text-purple-200 mt-1 uppercase tracking-widest font-semibold">
            Récupération du mot de passe
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {submitted ? (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 font-heading mb-1.5">
                  Demande transmise
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                  {feedback || 'Si un compte administrateur est associé à cette adresse, vous recevrez un email contenant les instructions de réinitialisation.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-left text-[11px] text-[#92278F] space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Sécurité Supabase Auth
                </p>
                <p className="text-gray-600 leading-normal">
                  Le lien expédie une session temporaire sécurisée valable 1 heure. Pensez à vérifier votre dossier de courriers indésirables (spams).
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white font-bold text-xs transition-all shadow-md"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour à la page de connexion</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Indiquez l’adresse email rattachée à votre profil APS-BÉNIN. Un lien de réinitialisation sécurisé vous sera instantanément expédié.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white font-bold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
                >
                  <KeyRound className="w-4 h-4 text-[#FF8C00]" />
                  <span>{loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}</span>
                </button>
              </form>

              <div className="pt-2 text-center">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#92278F]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour à la connexion</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
