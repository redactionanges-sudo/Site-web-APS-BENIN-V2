'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';

/**
 * Configuration centralisée du délai d'inactivité du Back-Office APS-BÉNIN
 */
export const AUTO_LOGOUT_CONFIG = {
  // Délai d'inactivité total avant déconnexion automatique : 30 minutes
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000,
  // Avertissement visible 2 minutes avant l'expiration (soit après 28 minutes d'inactivité)
  WARNING_BEFORE_TIMEOUT_MS: 2 * 60 * 1000,
  // Fréquence minimale d'enregistrement du timestamp d'activité (throttle de 10 secondes)
  THROTTLE_INTERVAL_MS: 10 * 1000,
  // Clé de stockage locale pour le timestamp de dernière activité partagé entre onglets
  STORAGE_LAST_ACTIVITY_KEY: 'aps_admin_last_activity',
  // Clé de synchronisation inter-onglets pour propager immédiatement la déconnexion
  STORAGE_LOGOUT_SYNC_KEY: 'aps_admin_logout_sync',
};

export const AutoLogoutGuard: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, canAccessBackOffice } = useAuth();

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [isVerifying, setIsVerifying] = useState(false);

  const lastActivityRef = useRef<number>(0);
  const lastWriteRef = useRef<number>(0);
  const isLoggingOutRef = useRef<boolean>(false);

  // Initialise et lit la dernière activité connue
  const getLatestActivity = useCallback((): number => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = localStorage.getItem(AUTO_LOGOUT_CONFIG.STORAGE_LAST_ACTIVITY_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    } catch {}
    return lastActivityRef.current || 0;
  }, []);

  // Met à jour l'horodatage d'activité utilisateur (avec limitation de fréquence à 10s)
  const recordActivity = useCallback((forceSync: boolean = false) => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (forceSync || now - lastWriteRef.current >= AUTO_LOGOUT_CONFIG.THROTTLE_INTERVAL_MS) {
      lastWriteRef.current = now;
      try {
        localStorage.setItem(AUTO_LOGOUT_CONFIG.STORAGE_LAST_ACTIVITY_KEY, now.toString());
      } catch {}
    }
  }, []);

  // Exécution de la déconnexion d'inactivité
  const performInactivityLogout = useCallback(async (reason: 'inactivity' | 'session_expired' = 'inactivity') => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    setShowWarningModal(false);

    // Propager la déconnexion aux autres onglets ouverts
    try {
      localStorage.setItem(
        AUTO_LOGOUT_CONFIG.STORAGE_LOGOUT_SYNC_KEY,
        JSON.stringify({ timestamp: Date.now(), reason })
      );
    } catch {}

    try {
      await logout();
    } catch (err) {
      console.warn('Erreur lors de la déconnexion automatique:', err);
    }

    router.push(`/admin/login?reason=${reason}`);
  }, [logout, router]);

  // Action utilisateur : Poursuivre la session
  const handleContinueSession = async () => {
    setIsVerifying(true);
    try {
      // 1. Vérification de la validité réelle de la session d'authentification
      if (isSupabaseConfigured && supabase) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          // La session n'est plus valide sur le serveur
          setIsVerifying(false);
          await performInactivityLogout('session_expired');
          return;
        }
      }

      // 2. Si la session est valide, réinitialiser immédiatement le minuteur
      recordActivity(true);
      setShowWarningModal(false);
      setSecondsRemaining(Math.round(AUTO_LOGOUT_CONFIG.WARNING_BEFORE_TIMEOUT_MS / 1000));
    } catch (err) {
      console.error('Erreur vérification session:', err);
      recordActivity(true);
      setShowWarningModal(false);
    } finally {
      setIsVerifying(false);
    }
  };

  // Action utilisateur : Se déconnecter volontairement
  const handleManualLogout = async () => {
    await performInactivityLogout('inactivity');
  };

  // Écoute des événements d'activité utilisateur dans le document
  useEffect(() => {
    if (!canAccessBackOffice) return;

    // Initialisation au montage du composant
    const initialActivity = getLatestActivity() || Date.now();
    lastActivityRef.current = initialActivity;
    lastWriteRef.current = initialActivity;
    recordActivity(true);

    const onUserInteraction = () => {
      // Si la modale d'avertissement est déjà affichée, un simple mouvement de souris ne doit pas la fermer sans clic explicite
      if (!showWarningModal) {
        recordActivity(false);
      }
    };

    // Événements d'interaction pertinents
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => {
      window.addEventListener(evt, onUserInteraction, { passive: true });
    });

    // Synchronisation inter-onglets via StorageEvent
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === AUTO_LOGOUT_CONFIG.STORAGE_LAST_ACTIVITY_KEY && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (!isNaN(remoteTime)) {
          lastActivityRef.current = remoteTime;
          // Si une activité a eu lieu dans un autre onglet, refermer l'avertissement
          setShowWarningModal(false);
        }
      } else if (e.key === AUTO_LOGOUT_CONFIG.STORAGE_LOGOUT_SYNC_KEY && e.newValue) {
        // Un autre onglet s'est déconnecté -> déconnecter immédiatement cet onglet
        if (!isLoggingOutRef.current) {
          isLoggingOutRef.current = true;
          setShowWarningModal(false);
          logout().then(() => {
            router.push('/admin/login?reason=inactivity');
          });
        }
      }
    };

    window.addEventListener('storage', onStorageChange);

    // Minuteur périodique (toutes les secondes)
    const timerInterval = setInterval(() => {
      if (isLoggingOutRef.current) return;

      const latestActivity = Math.max(lastActivityRef.current, getLatestActivity());
      const elapsed = Date.now() - latestActivity;
      const remainingMs = AUTO_LOGOUT_CONFIG.INACTIVITY_TIMEOUT_MS - elapsed;

      if (remainingMs <= 0) {
        // Délai d'inactivité de 30 minutes atteint -> Déconnexion automatique
        performInactivityLogout('inactivity');
      } else if (remainingMs <= AUTO_LOGOUT_CONFIG.WARNING_BEFORE_TIMEOUT_MS) {
        // Moins de 2 minutes restantes -> Affichage de l'avertissement avec compte à rebours
        const secs = Math.max(0, Math.ceil(remainingMs / 1000));
        setSecondsRemaining(secs);
        setShowWarningModal(true);
      } else {
        // Activité normale -> S'assurer que l'avertissement est fermé
        setShowWarningModal(false);
      }
    }, 1000);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, onUserInteraction);
      });
      window.removeEventListener('storage', onStorageChange);
      clearInterval(timerInterval);
    };
  }, [canAccessBackOffice, getLatestActivity, logout, performInactivityLogout, recordActivity, router, showWarningModal]);

  if (!showWarningModal || !canAccessBackOffice) {
    return null;
  }

  // Formatage du temps restant
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-amber-200 space-y-5 text-center relative">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
            Avertissement d'inactivité
          </span>
          <h3 className="text-lg font-bold text-gray-900 font-heading">
            Votre session va bientôt expirer
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Par mesure de sécurité administrative, votre session sera automatiquement fermée après 30 minutes d'inactivité.
          </p>
        </div>

        {/* Compte à rebours visuel */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center space-y-1">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
            Temps restant avant déconnexion :
          </span>
          <span className="text-3xl font-extrabold text-amber-900 font-mono tracking-tight">
            {timeFormatted}
          </span>
          <span className="text-[10px] text-amber-700">
            ({mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''} et ` : ''}{secs} seconde{secs > 1 ? 's' : ''})
          </span>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleManualLogout}
            disabled={isVerifying}
            className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
            <span>Se déconnecter</span>
          </button>

          <button
            type="button"
            onClick={handleContinueSession}
            disabled={isVerifying}
            className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            {isVerifying ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Vérification...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#FF8C00]" />
                <span>Poursuivre la session</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoLogoutGuard;
