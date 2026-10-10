'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * AnalyticsTracker - Composant client global pour la collecte automatique des visites de pages.
 *
 * RÈGLES STRICTES DE CONFIDENTIALITÉ :
 * - Aucune donnée personnelle identifiante (PII) n'est collectée.
 * - Utilise un jeton anonyme de session stocké en sessionStorage.
 * - Aucun cookie inter-sites, conforme aux exigences de vie privée.
 * - Déduplique les appels consécutifs rapides sur la même route.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Do not track internal admin API calls or dashboard views as public visitor stats
    if (pathname.startsWith('/api')) return;

    const timer = setTimeout(() => {
      trackPageView(pathname, document.title);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
