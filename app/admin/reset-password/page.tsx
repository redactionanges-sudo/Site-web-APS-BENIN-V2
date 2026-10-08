'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { SiteLogo } from '@/components/SiteLogo';
import {
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      try {
        if (!isSupabaseConfigured || !supabase) {
          if (mounted) {
            setCheckingSession(false);
            setErrorMsg('Supabase n’est pas configuré sur cette instance.');
          }
          return;
        }

        // 1. Check current session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.user && !error) {
          if (mounted) {
            setHasValidSession(true);
            setUserEmail(session.user.email || null);
            setCheckingSession(false);
          }
          return;
        }

        // 2. Check if hash or search params have recovery token
        if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          const search = window.location.search;

          // Support PKCE flow with authorization code
          if (search.includes('code=')) {
            try {
              const urlParams = new URLSearchParams(search);
              const code = urlParams.get('code');
              if (code) {
                const { data: codeData, error: codeErr } = await supabase!.auth.exchangeCodeForSession(code);
                if (!codeErr && codeData?.session?.user) {
                  if (mounted) {
                    setHasValidSession(true);
                    setUserEmail(codeData.session.user.email || null);
                    setCheckingSession(false);
                  }
                  return;
                }
              }
            } catch (pkceErr) {
              console.warn('PKCE exchange notice:', pkceErr);
            }
          }

          if (
            hash.includes('access_token') ||
            hash.includes('type=recovery') ||
            search.includes('token=')
          ) {
            // Give Supabase client a moment to exchange code or hash
            setTimeout(async () => {
              if (!mounted) return;
              const { data: { session: delayedSession } } = await supabase!.auth.getSession();
              if (delayedSession?.user) {
                setHasValidSession(true);
                setUserEmail(delayedSession.user.email || null);
              } else {
                setHasValidSession(false);
              }
              setCheckingSession(false);
            }, 1200);
            return;
          }
        }

        if (mounted) {
          setHasValidSession(false);
          setCheckingSession(false);
        }
      } catch (err: any) {
        console.warn('Recovery session check error:', err);
        if (mounted) {
          setHasValidSession(false);
          setCheckingSession(false);
        }
      }
    };

    checkRecoverySession();

    // Listen to PASSWORD_RECOVERY or SIGNED_IN event
    let subscription: any = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session?.user) {
          setHasValidSession(true);
          setUserEmail(session.user.email || null);
          setCheckingSession(false);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await updatePassword(password);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/login');
        }, 2500);
      } else {
        setErrorMsg(res.error || 'Erreur lors de la mise à jour du mot de passe.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur inattendue.');
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
          <SiteLogo variant="auth" priority />
          <h1 className="text-xl font-extrabold tracking-tight font-heading">
            AGISSONS POUR SAUVER
          </h1>
          <p className="text-xs text-purple-200 mt-1 uppercase tracking-widest font-semibold">
            Nouveau mot de passe administrateur
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {checkingSession ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#92278F] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-gray-600">
                Vérification du lien de réinitialisation sécurisé...
              </p>
            </div>
          ) : success ? (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 font-heading mb-1.5">
                  Mot de passe modifié avec succès !
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Votre nouveau mot de passe est désormais actif. Vous allez être redirigé vers l’écran de connexion.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white font-bold text-xs transition-all shadow-md"
                >
                  <span>Accéder à la connexion</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : !hasValidSession ? (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 font-heading mb-1.5">
                  Lien expiré ou session introuvable
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                  Le lien de récupération a peut-être expiré ou a déjà été utilisé. Par mesure de sécurité, veuillez effectuer une nouvelle demande.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/admin/forgot-password"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white font-bold text-xs transition-all shadow-md"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#FF8C00]" />
                  <span>Demander un nouveau lien</span>
                </Link>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/admin/login"
                  className="text-xs font-semibold text-gray-500 hover:text-[#92278F]"
                >
                  ← Retour à la connexion
                </Link>
              </div>
            </div>
          ) : (
            <>
              {userEmail && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700">
                  <span className="text-gray-500 font-medium">Compte : </span>
                  <span className="font-bold text-gray-900">{userEmail}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      className="w-full pl-9 pr-10 py-2.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retapez le mot de passe"
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
                  <span>{loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}</span>
                </button>
              </form>

              <div className="pt-2 text-center">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#92278F]"
                >
                  <span>Annuler et retourner à la connexion</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
