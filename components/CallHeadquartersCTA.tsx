'use client';

import React from 'react';
import { Phone } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export interface CallHeadquartersCTAProps {
  /**
   * Variante de style adaptée au contexte :
   * - 'primary' : Bouton standard violet institutionnel
   * - 'header'  : Badge discret pour le bandeau supérieur de l'en-tête
   * - 'footer'  : Bouton sobre pour la colonne contact du pied de page
   * - 'hero'    : Bouton d'action pour le bandeau d'accueil Hero
   * - 'contact' : Bouton d'action proéminent pour la page de contact
   */
  variant?: 'primary' | 'header' | 'footer' | 'hero' | 'contact';
  className?: string;
  iconClassName?: string;
}

/**
 * CallHeadquartersCTA - Bouton institutionnel officiel "Appeler le siège".
 *
 * RÈGLES STRICTES :
 * 1. Texte visible : strictement "Appeler le siège".
 * 2. Le numéro de téléphone n'est JAMAIS affiché dans ou à côté du texte visible du bouton.
 * 3. Utilise automatiquement le PREMIER numéro valide configuré dans les paramètres (settings.phones[0]).
 * 4. Si AUCUN numéro valide n'est configuré, le composant se masque silencieusement (renvoie null).
 * 5. Respecte la charte graphique sobre APS-BÉNIN (#92278F violet, #FF8C00 orange).
 */
export const CallHeadquartersCTA: React.FC<CallHeadquartersCTAProps> = ({
  variant = 'primary',
  className = '',
  iconClassName = '',
}) => {
  const { primaryPhoneTelHref, hasValidPhone } = useSiteSettings();

  // Si aucun numéro valide n'est configuré : masquage complet (aucun lien vide ni numéro fictif)
  if (!hasValidPhone || !primaryPhoneTelHref) {
    return null;
  }

  const baseClasses: Record<string, string> = {
    primary:
      'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white font-bold text-xs transition-all shadow-xs hover:shadow-sm active:scale-95 font-heading tracking-wide',
    header:
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors border border-white/25 font-heading',
    footer:
      'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs font-heading',
    hero:
      'hidden xl:inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-md hover:-translate-y-0.5 active:scale-95 font-heading',
    contact:
      'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs hover:bg-[#741772] active:scale-95 font-heading',
  };

  const defaultIconClasses: Record<string, string> = {
    primary: 'w-3.5 h-3.5 text-[#FF8C00] shrink-0',
    header: 'w-3 h-3 text-[#FF8C00] shrink-0',
    footer: 'w-3.5 h-3.5 text-[#FF8C00] shrink-0',
    hero: 'w-3.5 h-3.5 text-[#FF8C00] shrink-0',
    contact: 'w-3.5 h-3.5 text-[#FF8C00] shrink-0',
  };

  return (
    <a
      href={primaryPhoneTelHref}
      className={`${baseClasses[variant] || baseClasses.primary} ${className}`}
      title="Appeler le siège"
      aria-label="Appeler le siège"
    >
      <Phone
        className={`${defaultIconClasses[variant] || defaultIconClasses.primary} ${iconClassName}`}
      />
      <span>Appeler le siège</span>
    </a>
  );
};
