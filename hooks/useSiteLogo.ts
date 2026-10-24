'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseStore, isValidOfficialLogoUrl } from '@/lib/supabase';
import { SiteSettings } from '@/types';
import { initialSiteSettings } from '@/lib/initial-data';

export const OFFICIAL_APS_LOGO = '/logo-aps-benin.png';

/**
 * Filtre strict garantissant qu'aucune photo générique, stock image Unsplash
 * ou média de démonstration ne puisse être utilisé comme logo officiel APS-BÉNIN.
 * Empêche qu'une photo de terrain ou de la médiathèque soit prise pour un logo.
 */
export function sanitizeOfficialLogo(url?: string | null): string {
  if (!url || typeof url !== 'string') return OFFICIAL_APS_LOGO;
  const trimmed = url.trim();
  if (!trimmed) return OFFICIAL_APS_LOGO;
  if (!isValidOfficialLogoUrl(trimmed)) {
    return OFFICIAL_APS_LOGO;
  }
  return trimmed;
}

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
 * Principes stricts appliqués :
 * - État initial déterministe avec le véritable fichier officiel /logo-aps-benin.png
 * - Élimination totale de tout flash d'image fictive au chargement initial
 * - Priorité absolue donnée à la ressource officielle enregistrée dans site_settings
 * - Garde-fou immédiat contre les URL Unsplash ou photos de médiathèque
 * - Synchronisation temps réel lors de la mise à jour administrative du logo
 */
export function useSiteLogo(overrideUrl?: string | null): UseSiteLogoResult {
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    if (overrideUrl) return sanitizeOfficialLogo(overrideUrl);
    const cached = supabaseStore.getCachedSettings();
    if (cached?.logo_url && isValidOfficialLogoUrl(cached.logo_url)) {
      return cached.logo_url;
    }
    return OFFICIAL_APS_LOGO;
  });

  const [orgName, setOrgName] = useState<string>(() => {
    const cached = supabaseStore.getCachedSettings();
    return cached?.org_name_short || initialSiteSettings.org_name_short || 'APS-BÉNIN';
  });

  const [loading, setLoading] = useState<boolean>(false);

  const refreshLogo = useCallback(async () => {
    try {
      const s = await supabaseStore.getSettings();
      if (s) {
        if (!overrideUrl && s.logo_url !== undefined) {
          setLogoUrl(sanitizeOfficialLogo(s.logo_url));
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
      setLogoUrl(sanitizeOfficialLogo(overrideUrl));
      setLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initial retrieval from store / Supabase
    supabaseStore.getSettings().then((s) => {
      if (!isMounted) return;
      if (s) {
        if (s.logo_url !== undefined) {
          setLogoUrl(sanitizeOfficialLogo(s.logo_url));
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
        setLogoUrl(sanitizeOfficialLogo(detail.logo_url));
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
            setLogoUrl(sanitizeOfficialLogo(parsed.logo_url));
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
