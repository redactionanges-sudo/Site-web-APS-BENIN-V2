'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { supabase, isSupabaseConfigured, supabaseStore } from './supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  canAccessBackOffice: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  resetPassword: async () => ({ success: false, message: '' }),
  updatePassword: async () => ({ success: false, error: '' }),
  isSuperAdmin: false,
  isAdmin: false,
  isEditor: false,
  canAccessBackOffice: false,
});

/**
 * Dynamic resolution of Auth redirect URL.
 * Supports:
 * - Production: https://www.apsbeninong.org/admin/reset-password
 * - Local development: http://localhost:3000/admin/reset-password
 * - AI Studio / Cloud Run previews: current origin
 * - Vercel previews: current origin
 */
export function getAuthRedirectUrl(path: string = '/admin/reset-password'): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const origin = window.location.origin;

    // Production domain (with or without www)
    if (hostname === 'www.apsbeninong.org' || hostname === 'apsbeninong.org') {
      return `https://www.apsbeninong.org${path}`;
    }

    // Localhost or preview origin
    return `${origin}${path}`;
  }

  // Server-side fallback: check APP_URL environment variable
  const serverUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (serverUrl) {
    const clean = serverUrl.replace(/\/$/, '');
    return `${clean}${path}`;
  }

  // Canonical production fallback
  return `https://www.apsbeninong.org${path}`;
}

const AUTH_STORAGE_KEY = 'aps_admin_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile from Supabase with user JWT
  const fetchProfile = async (
    userId: string,
    email: string
  ): Promise<{ profile: UserProfile | null; error?: string }> => {
    if (!supabase) return { profile: null, error: 'Supabase non configuré' };
    try {
      // 1. By primary key (UUID)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return { profile: data as UserProfile };
      }

      if (error) {
        console.warn('Error fetching Supabase profile by ID:', error);
        if (error.message?.includes('permission denied')) {
          return {
            profile: null,
            error: `Erreur de permissions base de données : ${error.message} (vérifiez les privilèges de is_admin).`,
          };
        }
      }

      // 2. By email fallback
      if (email) {
        const { data: byEmail, error: emailErr } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', email)
          .maybeSingle();

        if (!emailErr && byEmail) {
          return { profile: byEmail as UserProfile };
        }

        if (emailErr && emailErr.message?.includes('permission denied')) {
          return {
            profile: null,
            error: `Erreur de permissions base de données : ${emailErr.message} (vérifiez les privilèges de is_admin).`,
          };
        }
      }
    } catch (e: any) {
      console.warn('Exception fetching Supabase profile:', e);
      return { profile: null, error: e?.message || 'Erreur inattendue de profil' };
    }
    return { profile: null };
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
          if (session?.user && !sessionErr) {
            const { profile } = await fetchProfile(session.user.id, session.user.email || '');
            if (profile) {
              if (profile.is_active === false) {
                console.warn('Compte administrateur désactivé.');
                await supabase.auth.signOut();
                if (mounted) {
                  setUser(null);
                  localStorage.removeItem(AUTH_STORAGE_KEY);
                  setLoading(false);
                }
                return;
              }
              if (mounted) {
                setUser(profile);
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
                setLoading(false);
                return;
              }
            }
          }
        }

        // Check local cache if offline or unauthenticated
        const savedSession = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (mounted) setUser(parsed);
          } catch {}
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen to real-time Supabase Auth state changes
    let subscription: any = null;
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const { data } = client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { profile } = await fetchProfile(session.user.id, session.user.email || '');
          if (profile && mounted) {
            if (profile.is_active === false) {
              await client.auth.signOut();
              setUser(null);
              localStorage.removeItem(AUTH_STORAGE_KEY);
              return;
            }
            setUser(profile);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!isSupabaseConfigured || !supabase) {
        return {
          success: false,
          error: 'Configuration Supabase incomplète. Veuillez vérifier les variables d’environnement.',
        };
      }

      const client = supabase;

      // Pure Supabase Auth login with credentials
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      // Handle real auth credential / rate limit errors
      if (error || !data.user) {
        const msg = error?.message || '';
        if (msg.includes('Invalid login credentials')) {
          return { success: false, error: 'Adresse email ou mot de passe incorrect.' };
        }
        if (msg.includes('Email not confirmed')) {
          return { success: false, error: 'Veuillez confirmer votre adresse email avant de vous connecter.' };
        }
        if (msg.toLowerCase().includes('rate limit')) {
          return { success: false, error: 'Trop de tentatives consécutives. Veuillez patienter un instant.' };
        }
        return { success: false, error: msg || 'Adresse email ou mot de passe incorrect.' };
      }

      // Retrieve associated profile from profiles table via authenticated client
      const { profile, error: profileErr } = await fetchProfile(data.user.id, cleanEmail);

      if (profileErr) {
        await client.auth.signOut();
        return {
          success: false,
          error: profileErr,
        };
      }

      if (!profile) {
        await client.auth.signOut();
        return {
          success: false,
          error: 'Ce compte utilisateur n’est associé à aucun profil d’administration configuré. Veuillez contacter le Super Administrateur.',
        };
      }

      // Check is_active
      if (profile.is_active === false) {
        await client.auth.signOut();
        return {
          success: false,
          error: 'Ce compte administrateur a été désactivé.',
        };
      }

      // Verify legitimate role: STRICTLY super_admin, admin, editor
      const allowedRoles: UserRole[] = ['super_admin', 'admin', 'editor'];
      if (!profile.role || !allowedRoles.includes(profile.role as UserRole)) {
        await client.auth.signOut();
        return {
          success: false,
          error: 'Ce compte ne dispose pas des privilèges nécessaires pour accéder au Back-Office.',
        };
      }

      // Update last_sign_in timestamp in Supabase
      try {
        await client
          .from('profiles')
          .update({ last_sign_in: new Date().toISOString() })
          .eq('id', profile.id);
      } catch (err) {
        console.warn('Could not update last_sign_in timestamp:', err);
      }

      const activeProfile: UserProfile = {
        ...profile,
        last_sign_in: new Date().toISOString(),
      };

      setUser(activeProfile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeProfile));
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return {
        success: false,
        error: err.message || 'Erreur inattendue lors de la connexion.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Supabase signOut error:', e);
      }
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Veuillez saisir une adresse email valide.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const redirectUrl = getAuthRedirectUrl('/admin/reset-password');

        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectUrl,
        });

        if (error) {
          console.warn('Supabase resetPasswordForEmail notice:', error.message);
        }
      } catch (err) {
        console.warn('resetPassword error:', err);
      }
    }

    // Never leak email existence - generic message
    return {
      success: true,
      message: 'Si un compte administrateur est associé à cette adresse, un lien sécurisé de réinitialisation vous a été envoyé.',
    };
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase n’est pas configuré sur cette instance.',
      };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Impossible de mettre à jour le mot de passe.',
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Aucune session active de réinitialisation trouvée.',
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Erreur inattendue lors de la mise à jour du mot de passe.',
      };
    }
  };

  const isSuperAdmin = Boolean(user && user.role === 'super_admin' && user.is_active !== false);
  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'super_admin') && user.is_active !== false);
  const isEditor = Boolean(user && user.role === 'editor' && user.is_active !== false);
  const canAccessBackOffice = Boolean(
    user &&
    (user.role === 'super_admin' || user.role === 'admin' || user.role === 'editor') &&
    user.is_active !== false
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        resetPassword,
        updatePassword,
        isSuperAdmin,
        isAdmin,
        isEditor,
        canAccessBackOffice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
