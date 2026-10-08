'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseStore } from '@/lib/supabase';
import { SiteSettings } from '@/types';
import { initialSiteSettings } from '@/lib/initial-data';

export interface UseSiteLogoResult {
  logoUrl: string;
  orgName: string;
  loading: boolean;
  refreshLogo: () => Promise<void>;
}

/**
 * useSiteLogo - Hook centralisé garantissant une source unique de vérité
 * pour le logo institutionnel APS-BÉNIN à travers toute l'application.
 *
 * Fonctionnalités :
 * - État initial déterministe pour éviter toute disparité d'hydratation (SSR / Client)
 * - Récupération asynchrone sécurisée depuis site_settings
 * - Écoute temps-réel de l'événement 'aps_site_settings_changed' (mise à jour instantanée sans rechargement)
 * - Écoute inter-onglets via 'storage'
 * - Support d'une URL de prévisualisation temporaire (overrideUrl)
 */
export function useSiteLogo(overrideUrl?: string | null): UseSiteLogoResult {
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    if (overrideUrl) return overrideUrl;
    return initialSiteSettings.logo_url || '';
  });

  const [orgName, setOrgName] = useState<string>(
    initialSiteSettings.org_name_short || 'APS-BÉNIN'
  );

  const [loading, setLoading] = useState<boolean>(!logoUrl && !overrideUrl);

  const refreshLogo = useCallback(async () => {
    try {
      const s = await supabaseStore.getSettings();
      if (s) {
        if (!overrideUrl && s.logo_url !== undefined) {
          setLogoUrl(s.logo_url || '');
        }
        if (s.org_name_short) {
          setOrgName(s.org_name_short);
        }
      }
    } catch (e) {
      console.warn('Impossible de rafraîchir le logo institutionnel :', e);
    } finally {
      setLoading(false);
    }
  }, [overrideUrl]);

  useEffect(() => {
    if (overrideUrl !== undefined && overrideUrl !== null) {
      setLogoUrl(overrideUrl);
      setLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initial retrieval
    supabaseStore.getSettings().then((s) => {
      if (!isMounted) return;
      if (s) {
        if (s.logo_url !== undefined) {
          setLogoUrl(s.logo_url || '');
        }
        if (s.org_name_short) {
          setOrgName(s.org_name_short);
        }
      }
      setLoading(false);
    });

    // 2. Local real-time notification listener (CustomEvent)
    const handleSettingsChanged = (e: Event) => {
      const customEv = e as CustomEvent<SiteSettings>;
      const detail = customEv.detail;
      if (!isMounted || !detail) return;

      if (detail.logo_url !== undefined) {
        setLogoUrl(detail.logo_url || '');
      }
      if (detail.org_name_short) {
        setOrgName(detail.org_name_short);
      }
      setLoading(false);
    };

    // 3. Cross-tab storage event listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'aps_benin_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (!isMounted || !parsed) return;
          if (parsed.logo_url !== undefined) {
            setLogoUrl(parsed.logo_url || '');
          }
          if (parsed.org_name_short) {
            setOrgName(parsed.org_name_short);
          }
        } catch {}
      }
    };

    window.addEventListener('aps_site_settings_changed', handleSettingsChanged);
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('aps_site_settings_changed', handleSettingsChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, [overrideUrl]);

  return {
    logoUrl,
    orgName,
    loading,
    refreshLogo,
  };
}
