'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { SocialPlatformIcon } from '@/components/admin/SocialPlatformIcon';
import { Share2, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Barre latérale fixe des réseaux sociaux officiels d'APS-Bénin.
 * - Positionnée verticalement sur le bord gauche de l'écran.
 * - Fixe lors du défilement, sans décalage horizontal ni masquage de texte.
 * - Respecte la charte graphique : Orange #FF8C00, noir et blanc.
 * - Logo officiel de chaque plateforme, liens sécurisés avec rel="noopener noreferrer".
 * - Adaptative mobile : se replie discrètement pour ne jamais gêner la lecture ou la navigation.
 */
export const FixedSocialBar: React.FC = () => {
  const pathname = usePathname();
  const { activeSocials } = useSiteSettings();
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ne pas afficher dans l'espace administration ni lors du premier rendu SSR
  if (!mounted) return null;
  if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/api'))) {
    return null;
  }

  // Ne rien afficher si aucun réseau social officiel n'est configuré ou activé
  if (!activeSocials || activeSocials.length === 0) {
    return null;
  }

  return (
    <>
      {/* Version Desktop (md+) : Barre latérale élégante fixée au centre gauche */}
      <aside
        aria-label="Réseaux sociaux officiels d'APS-Bénin"
        className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 flex-col items-center bg-gray-950/95 backdrop-blur-md py-3 px-1.5 rounded-r-2xl border-y border-r border-[#FF8C00]/40 shadow-2xl transition-all duration-300 group"
      >
        {/* Petit indicateur visuel charte APS-Bénin */}
        <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#FF8C00] to-[#92278F] mb-2 opacity-80" />

        <nav className="flex flex-col items-center gap-2">
          {activeSocials.map((platform) => {
            return (
              <a
                key={platform.id}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Suivre APS-Bénin sur ${platform.name}`}
                title={`Suivre APS-Bénin sur ${platform.name}`}
                className="group/link relative w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-[#FF8C00] text-white transition-all duration-200 hover:scale-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <SocialPlatformIcon platform={platform.id} size={20} />
                </div>

                {/* Infobulle contextuelle à droite */}
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-gray-900 text-white text-[11px] font-bold font-sans tracking-wide whitespace-nowrap opacity-0 group-hover/link:opacity-100 transition-opacity duration-200 shadow-xl border border-gray-800 z-50 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C00]" />
                  <span>{platform.name}</span>
                </span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Version Mobile (< md) : Onglet discret rétractable sur le bord gauche */}
      <aside
        aria-label="Réseaux sociaux officiels d'APS-Bénin (mobile)"
        className={`md:hidden fixed left-0 top-[40%] -translate-y-1/2 z-40 transition-transform duration-300 ease-in-out ${
          isMobileCollapsed ? '-translate-x-[calc(100%-28px)]' : 'translate-x-0'
        }`}
      >
        <div className="flex items-center">
          {/* Contenu déployé */}
          <div className="bg-gray-950/95 backdrop-blur-md p-2 rounded-r-2xl border-y border-r border-[#FF8C00]/40 shadow-2xl flex flex-col items-center gap-2">
            {activeSocials.map((platform) => (
              <a
                key={platform.id}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Suivre APS-Bénin sur ${platform.name}`}
                title={`Suivre APS-Bénin sur ${platform.name}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 text-white hover:bg-[#FF8C00] active:scale-95 transition-all"
              >
                <SocialPlatformIcon platform={platform.id} size={18} />
              </a>
            ))}
          </div>

          {/* Bouton tirette / poignée de déploiement */}
          <button
            type="button"
            onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
            aria-label={isMobileCollapsed ? 'Afficher les réseaux sociaux' : 'Masquer les réseaux sociaux'}
            className="w-7 h-10 bg-gray-950/95 text-[#FF8C00] border-y border-r border-[#FF8C00]/40 rounded-r-xl flex items-center justify-center shadow-lg active:scale-95 transition-all focus:outline-none"
          >
            {isMobileCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[#FF8C00]" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-[#FF8C00]" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
