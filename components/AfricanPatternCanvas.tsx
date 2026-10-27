import React from 'react';

/**
 * Composant d'arrière-plan texturé : Motif africain contemporain APS-BÉNIN
 *
 * Architecture de couches :
 * 1. Motif africain géométrique vectoriel (violet APS #92278F, symbolisant féminité, solidarité & dignité)
 * 2. Voile blanc protecteur renforcé (couvre délicatement le motif pour laisser transparaître une texture subtile sans nuire à la lisibilité)
 * 3. Contenu et structure du site
 * 4. Cartes, photos, formulaires et éléments interactifs (zones de protection 100% opaques)
 */
export function AfricanPatternCanvas() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* COUCHE 1 : MOTIF AFRICAIN GÉOMÉTRIQUE VECTORIEL APS-BÉNIN (#92278F) */}
      <div
        className="absolute inset-0 bg-repeat bg-[length:140px_140px] sm:bg-[length:160px_160px] opacity-[0.07] sm:opacity-[0.09]"
        style={{
          backgroundImage: "url('/patterns/african-motif.svg')",
        }}
      />
      {/* COUCHE 2 : VOILE BLANC INSTITUTIONNEL RENFORCÉ (Assure un confort de lecture optimal et adoucit la texture) */}
      <div className="absolute inset-0 bg-white/70" />
    </div>
  );
}
