'use client';

import React, { useState, useEffect } from 'react';
import { useSiteLogo } from '@/hooks/useSiteLogo';

export type SiteLogoVariant =
  | 'header'   // En-tête public (Navbar)
  | 'auth'     // Écrans de connexion / récupération / réinitialisation
  | 'footer'   // Pied de page public
  | 'sidebar'  // Barre latérale d'administration
  | 'preview'  // Prévisualisation dans les paramètres
  | 'compact'; // Petit badge / en ligne

export interface SiteLogoProps {
  /**
   * Variante contextuelle définissant les contraintes de dimensions maximales,
   * le clear space et l'adaptation au fond.
   */
  variant?: SiteLogoVariant;
  /**
   * Classes CSS additionnelles pour le conteneur externe.
   */
  className?: string;
  /**
   * Classes CSS additionnelles pour l'élément <img>.
   */
  imgClassName?: string;
  /**
   * Texte alternatif accessible. Par défaut : "APS-BÉNIN Logo Officiel".
   */
  alt?: string;
  /**
   * URL de prévisualisation temporaire (ex. pendant le téléversement avant enregistrement).
   * Si non renseignée, utilise automatiquement la source unique site_settings.logo_url.
   */
  overrideUrl?: string | null;
  /**
   * Priorité de chargement de l'image (pour éviter tout Layout Shift au chargement).
   */
  priority?: boolean;
}

/**
 * Emblème vectoriel SVG officiel APS-BÉNIN utilisé en fallback propre
 * uniquement lorsqu'aucun logo n'est encore configuré ou en cas d'erreur de chargement.
 */
export const DefaultApsEmblem: React.FC<{
  variant?: SiteLogoVariant;
  className?: string;
}> = ({ variant = 'header', className = '' }) => {
  // Ajustement des dimensions selon le contexte
  const sizeMap: Record<SiteLogoVariant, { w: number; h: number; text: string; sub: string }> = {
    header: { w: 42, h: 42, text: 'APS', sub: 'BÉNIN' },
    auth: { w: 56, h: 56, text: 'APS', sub: 'BÉNIN' },
    footer: { w: 40, h: 40, text: 'APS', sub: 'BÉNIN' },
    sidebar: { w: 34, h: 34, text: 'APS', sub: '' },
    preview: { w: 84, h: 84, text: 'APS', sub: 'BÉNIN' },
    compact: { w: 30, h: 30, text: 'APS', sub: '' },
  };

  const config = sizeMap[variant] || sizeMap.header;

  return (
    <svg
      width={config.w}
      height={config.h}
      viewBox="0 0 100 100"
      className={`shrink-0 select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="APS-BÉNIN Emblème Institutionnel Officiel"
    >
      <rect width="100" height="100" rx="20" fill="#92278F" />
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke="#FF8C00"
        strokeWidth="3"
        strokeDasharray="5 3"
      />
      <circle cx="50" cy="50" r="33" fill="#741772" />
      <text
        x="50"
        y={config.sub ? '54' : '58'}
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Montserrat, system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize={config.sub ? '24' : '26'}
        letterSpacing="0.5"
      >
        {config.text}
      </text>
      {config.sub && (
        <text
          x="50"
          y="72"
          textAnchor="middle"
          fill="#FF8C00"
          fontFamily="Montserrat, system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="9"
          letterSpacing="1.2"
        >
          {config.sub}
        </text>
      )}
    </svg>
  );
};

/**
 * SiteLogo - Composant institutionnel centralisé pour l'affichage du logo APS-BÉNIN.
 *
 * Principes stricts appliqués :
 * 1. Source unique de vérité : Consomme systématiquement site_settings.logo_url via useSiteLogo.
 * 2. Gestion automatique des proportions : max-width / max-height + object-fit: contain + width: auto + height: auto.
 *    Garantit qu'aucun logo ne sera jamais étiré, déformé, coupé ou agrandi excessivement,
 *    qu'il soit horizontal (rectangle large), carré, circulaire ou vertical.
 * 3. Clear space & fond : Conteneur protecteur adapté à chaque contexte garantissant lisibilité
 *    sans ajouter d'effet indésirable.
 * 4. Fallback élégant : Basculement automatique et immédiat sur l'emblème officiel en SVG si pas de logo configuré.
 */
export const SiteLogo: React.FC<SiteLogoProps> = ({
  variant = 'header',
  className = '',
  imgClassName = '',
  alt,
  overrideUrl,
  priority = true,
}) => {
  const { logoUrl, orgName } = useSiteLogo(overrideUrl);
  const [loadError, setLoadError] = useState(false);

  // Réinitialiser l'état d'erreur si l'URL change (ex: nouveau logo téléversé)
  useEffect(() => {
    setLoadError(false);
  }, [logoUrl]);

  const effectiveAlt = alt || `${orgName || 'APS-BÉNIN'} Logo Officiel`;
  const hasValidLogo = Boolean(logoUrl && !loadError);

  // Configurations contextuelles de dimensions maximales, clear space et conteneur
  switch (variant) {
    case 'header': {
      // En-tête public : Logo compact, lisible, ne pousse pas la hauteur du Header.
      // S'intègre naturellement avec le nom "APS-BÉNIN".
      return (
        <div
          suppressHydrationWarning
          className={`inline-flex items-center justify-center shrink-0 transition-transform group-hover:scale-[1.02] ${className}`}
        >
          {hasValidLogo ? (
            <div
              suppressHydrationWarning
              className="flex items-center justify-center p-0.5 rounded-lg max-h-11 sm:max-h-12 max-w-[160px] sm:max-w-[200px]"
            >
              <img
                src={logoUrl}
                alt={effectiveAlt}
                loading={priority ? 'eager' : 'lazy'}
                referrerPolicy="no-referrer"
                onError={() => setLoadError(true)}
                suppressHydrationWarning
                className={`max-h-10 sm:max-h-11 max-w-[150px] sm:max-w-[190px] w-auto h-auto object-contain select-none transition-all ${imgClassName}`}
              />
            </div>
          ) : (
            <DefaultApsEmblem variant="header" />
          )}
        </div>
      );
    }

    case 'auth': {
      // Pages d'authentification (/admin/login, /admin/forgot-password, /admin/reset-password)
      // Placé dans l'en-tête de la carte auth. Conteneur blanc propre pour assurer 100% de lisibilité.
      return (
        <div
          suppressHydrationWarning
          className={`flex items-center justify-center mx-auto mb-3.5 ${className}`}
        >
          {hasValidLogo ? (
            <div
              suppressHydrationWarning
              className="bg-white p-2 rounded-xl shadow-md border-2 border-[#FF8C00]/80 inline-flex items-center justify-center max-w-[220px] max-h-16 sm:max-h-20 min-w-[56px] min-h-[56px]"
            >
              <img
                src={logoUrl}
                alt={effectiveAlt}
                loading="eager"
                referrerPolicy="no-referrer"
                onError={() => setLoadError(true)}
                suppressHydrationWarning
                className={`max-h-12 sm:max-h-14 max-w-[180px] sm:max-w-[200px] w-auto h-auto object-contain select-none ${imgClassName}`}
              />
            </div>
          ) : (
            <div className="bg-white p-1 rounded-xl shadow-md border-2 border-[#FF8C00] inline-flex items-center justify-center">
              <DefaultApsEmblem variant="auth" />
            </div>
          )}
        </div>
      );
    }

    case 'footer': {
      // Pied de page public : S'affiche sur le fond sombre gray-950.
      // Conteneur blanc protecteur propre garantissant le contraste quel que soit le logo.
      return (
        <div
          suppressHydrationWarning
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
        >
          {hasValidLogo ? (
            <div
              suppressHydrationWarning
              className="bg-white p-1 rounded-lg border border-purple-300/40 shadow-xs inline-flex items-center justify-center max-w-[160px] max-h-11 min-w-[42px] min-h-[42px]"
            >
              <img
                src={logoUrl}
                alt={effectiveAlt}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setLoadError(true)}
                suppressHydrationWarning
                className={`max-h-9 sm:max-h-10 max-w-[140px] sm:max-w-[150px] w-auto h-auto object-contain select-none ${imgClassName}`}
              />
            </div>
          ) : (
            <div className="bg-white p-0.5 rounded-lg border border-[#FF8C00]/60 inline-flex items-center justify-center">
              <DefaultApsEmblem variant="footer" />
            </div>
          )}
        </div>
      );
    }

    case 'sidebar': {
      // Barre latérale d'administration : Compact, s'intègre sur le fond sombre de la sidebar.
      return (
        <div
          suppressHydrationWarning
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
        >
          {hasValidLogo ? (
            <div
              suppressHydrationWarning
              className="bg-white p-1 rounded-lg border border-[#FF8C00]/60 inline-flex items-center justify-center max-w-[100px] max-h-10 min-w-[36px] min-h-[36px] shadow-2xs"
            >
              <img
                src={logoUrl}
                alt={effectiveAlt}
                loading="eager"
                referrerPolicy="no-referrer"
                onError={() => setLoadError(true)}
                suppressHydrationWarning
                className={`max-h-8 max-w-[88px] w-auto h-auto object-contain select-none ${imgClassName}`}
              />
            </div>
          ) : (
            <div className="bg-white p-0.5 rounded-lg border border-[#FF8C00]/60 inline-flex items-center justify-center">
              <DefaultApsEmblem variant="sidebar" />
            </div>
          )}
        </div>
      );
    }

    case 'preview': {
      // Prévisualisation dans les paramètres administratifs :
      // Cadre généreux permettant de voir les vraies proportions (horizontal, carré, etc.)
      return (
        <div
          suppressHydrationWarning
          className={`relative inline-flex items-center justify-center rounded-2xl border-2 border-dashed border-[#92278F]/30 bg-white p-2 sm:p-3 shadow-xs min-w-[80px] min-h-[80px] max-w-[260px] max-h-28 overflow-hidden ${className}`}
        >
          {hasValidLogo ? (
            <img
              src={logoUrl}
              alt={effectiveAlt}
              loading="eager"
              referrerPolicy="no-referrer"
              onError={() => setLoadError(true)}
              suppressHydrationWarning
              className={`max-h-20 sm:max-h-24 max-w-[220px] sm:max-w-[240px] w-auto h-auto object-contain select-none transition-all ${imgClassName}`}
            />
          ) : (
            <DefaultApsEmblem variant="preview" />
          )}
        </div>
      );
    }

    case 'compact':
    default: {
      return (
        <div
          suppressHydrationWarning
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
        >
          {hasValidLogo ? (
            <img
              src={logoUrl}
              alt={effectiveAlt}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setLoadError(true)}
              suppressHydrationWarning
              className={`max-h-8 max-w-[120px] w-auto h-auto object-contain select-none ${imgClassName}`}
            />
          ) : (
            <DefaultApsEmblem variant="compact" />
          )}
        </div>
      );
    }
  }
};
