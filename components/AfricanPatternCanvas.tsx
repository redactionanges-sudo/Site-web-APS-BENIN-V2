import React from 'react';

/**
 * Composant d'arrière-plan texturé : Motif africain contemporain APS-BÉNIN
 *
 * Architecture de couches :
 * 1. Motif africain géométrique vectoriel (violet APS #92278F, symbolisant féminité, solidarité & dignité)
 * 2. Voile blanc semi-opaque institutionnel (couvre délicatement le motif pour laisser transparaître la texture)
 * 3. Contenu et structure du site
 * 4. Cartes, photos, formulaires et éléments interactifs (zones de protection opaques)
 */
export function AfricanPatternCanvas() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* MOTIF AFRICAIN GÉOMÉTRIQUE VECTORIEL APS-BÉNIN (#92278F) */}
      <div
        className="absolute inset-0 bg-repeat bg-[length:140px_140px] sm:bg-[length:160px_160px] opacity-[0.22] sm:opacity-[0.25]"
        style={{
          backgroundImage: "url('/patterns/african-motif.svg')",
        }}
      />
    </div>
  );
}
