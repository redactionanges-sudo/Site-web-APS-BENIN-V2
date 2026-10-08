'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseStore } from '@/lib/supabase';
import { SiteSettings, SocialLinksConfig } from '@/types';
import { initialSiteSettings } from '@/lib/initial-data';
import { getActiveSocialPlatforms, ResolvedPlatformState } from '@/lib/social';

/**
 * Nettoie une chaîne de téléphone pour le protocole tel:
 * Conserve le '+' initial et supprime tous les autres caractères non numériques
 */
export function sanitizePhoneForTel(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  return hasPlus ? `+${digits}` : digits;
}

export interface UseSiteSettingsResult {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;

  // Propriétés institutionnelles réactives
  orgName: string;
  orgNameShort: string;
  sloganFr: string;
  sloganEn: string;
  addressLocation: string;
  addressLocality: string;
  postalBox: string;
  email: string;
  logoUrl: string;

  // Gestion des numéros de téléphone
  phones: string[];
  validPhones: string[];
  primaryPhone: string;
  primaryPhoneTelHref: string;
  hasValidPhone: boolean;

  // Réseaux sociaux
  socialLinks: SocialLinksConfig;
  activeSocials: ResolvedPlatformState[];
}

/**
 * useSiteSettings - Hook centralisé garantissant une SOURCE UNIQUE DE VÉRITÉ
 * pour l'ensemble des paramètres généraux d'APS-BÉNIN à travers l'application.
 *
 * Fonctionnalités :
 * - État initial déterministe basé sur initialSiteSettings (zéro hydration mismatch)
 * - Cache mémoire + local storage immédiat
 * - Réactivité temps réel : écoute 'aps_site_settings_changed' (synchronisation instantanée lors des modifications admin)
 * - Écoute inter-onglets via 'storage'
 * - Dérivation automatique du numéro principal du siège et du lien tel:
 * - Filtrage strict des réseaux sociaux actifs munis d'une URL
 */
export function useSiteSettings(): UseSiteSettingsResult {
  const [settings, setSettings] = useState<SiteSettings>(initialSiteSettings);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSettings = useCallback(async () => {
    try {
      const s = await supabaseStore.getSettings();
      if (s) {
        setSettings(s);
      }
    } catch (e) {
      console.warn('Impossible de rafraîchir les paramètres du site :', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial retrieval
    const cached = supabaseStore.getCachedSettings();
    if (cached && isMounted) {
      setSettings(cached);
      setLoading(false);
    }

    supabaseStore.getSettings().then((s) => {
      if (!isMounted) return;
      if (s) {
        setSettings(s);
      }
      setLoading(false);
    });

    // 2. Real-time event listener (même fenêtre / session)
    const handleSettingsChanged = (e: Event) => {
      const customEv = e as CustomEvent<SiteSettings>;
      if (!isMounted || !customEv.detail) return;
      setSettings(customEv.detail);
      setLoading(false);
    };

    // 3. Cross-tab storage event listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'aps_benin_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (!isMounted || !parsed) return;
          setSettings(parsed);
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
  }, []);

  // Extraction des numéros valides (doivent comporter au minimum 3 chiffres)
  const validPhones = useMemo(() => {
    const rawList = Array.isArray(settings.phones) ? settings.phones : [];
    return rawList
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter((p) => p.length > 0 && /\d{3,}/.test(p));
  }, [settings.phones]);

  // Le PREMIER numéro valide est toujours le numéro principal du siège
  const primaryPhone = validPhones.length > 0 ? validPhones[0] : '';

  const primaryPhoneTelHref = useMemo(() => {
    if (!primaryPhone) return '';
    const clean = sanitizePhoneForTel(primaryPhone);
    return clean ? `tel:${clean}` : '';
  }, [primaryPhone]);

  // Réseaux sociaux actifs avec URL valide
  const activeSocials = useMemo(() => {
    return getActiveSocialPlatforms(settings.social_links);
  }, [settings.social_links]);

  return {
    settings,
    loading,
    refreshSettings,

    orgName: settings.org_name || initialSiteSettings.org_name,
    orgNameShort: settings.org_name_short || initialSiteSettings.org_name_short,
    sloganFr: settings.slogan_fr || initialSiteSettings.slogan_fr,
    sloganEn: settings.slogan_en || initialSiteSettings.slogan_en,
    addressLocation: settings.address_location || initialSiteSettings.address_location,
    addressLocality: settings.address_locality || initialSiteSettings.address_locality,
    postalBox: settings.postal_box || initialSiteSettings.postal_box,
    email: settings.email || initialSiteSettings.email,
    logoUrl: settings.logo_url || initialSiteSettings.logo_url,

    phones: settings.phones || [],
    validPhones,
    primaryPhone,
    primaryPhoneTelHref,
    hasValidPhone: Boolean(primaryPhoneTelHref),

    socialLinks: settings.social_links,
    activeSocials,
  };
}
