'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { SocialPlatformIcon } from '@/components/admin/SocialPlatformIcon';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Barre latérale fixe des réseaux sociaux officiels d'APS-Bénin.
 * - Présentation privilégiée : Icônes flottantes directes sans fond de panneau noir.
 * - Positionnée verticalement sur le bord gauche de l'écran, fixe lors du défilement.
 * - Visibilité parfaite sur tous les arrière-plans (badges blancs individuels détourés et ombrés).
 * - Respect strict de la charte graphique : Orange #FF8C00, violet #92278F, blanc.
 * - Infobulles accessibles et adaptabilité mobile rétractable sans obstruction.
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
      {/* Version Desktop (md+) : Icônes flottantes directes sans fond de panneau noir */}
      <aside
        aria-label="Réseaux sociaux officiels d'APS-Bénin"
        className="hidden md:flex fixed left-3 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-2.5"
      >
        <nav className="flex flex-col items-center gap-2.5">
          {activeSocials.map((platform) => {
            return (
              <a
                key={platform.id}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Suivre APS-Bénin sur ${platform.name}`}
                title={`Suivre APS-Bénin sur ${platform.name}`}
                className="group/link relative w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-200/90 shadow-md hover:border-[#FF8C00] hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <SocialPlatformIcon platform={platform.id} size={20} />
                </div>

                {/* Infobulle contextuelle claire à droite (fond blanc, bordure nette) */}
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-white text-gray-900 text-xs font-bold font-sans tracking-wide whitespace-nowrap opacity-0 group-hover/link:opacity-100 transition-opacity duration-200 shadow-xl border border-gray-200/90 z-50 flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-[#FF8C00]" />
                  <span>{platform.name}</span>
                </span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Version Mobile (< md) : Tiroir rétractable clair sans fond noir */}
      <aside
        aria-label="Réseaux sociaux officiels d'APS-Bénin (mobile)"
        className={`md:hidden fixed left-0 top-[40%] -translate-y-1/2 z-40 transition-transform duration-300 ease-in-out ${
          isMobileCollapsed ? '-translate-x-[calc(100%-28px)]' : 'translate-x-0'
        }`}
      >
        <div className="flex items-center">
          {/* Contenu déployé (fond blanc translucide, bordure subtile) */}
          <div className="bg-white/95 backdrop-blur-md p-2 rounded-r-2xl border-y border-r border-gray-200 shadow-xl flex flex-col items-center gap-2">
            {activeSocials.map((platform) => (
              <a
                key={platform.id}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Suivre APS-Bénin sur ${platform.name}`}
                title={`Suivre APS-Bénin sur ${platform.name}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-800 hover:border-[#FF8C00] active:scale-95 transition-all"
              >
                <SocialPlatformIcon platform={platform.id} size={18} />
              </a>
            ))}
          </div>

          {/* Bouton tirette / poignée de déploiement (blanc et orange APS-Bénin) */}
          <button
            type="button"
            onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
            aria-label={isMobileCollapsed ? 'Afficher les réseaux sociaux' : 'Masquer les réseaux sociaux'}
            className="w-7 h-10 bg-white text-[#FF8C00] border-y border-r border-[#FF8C00]/50 rounded-r-xl flex items-center justify-center shadow-md active:scale-95 transition-all focus:outline-none"
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
