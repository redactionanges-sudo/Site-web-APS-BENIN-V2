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
      {/* COUCHE 1 : Fond de base institutionnel blanc cassé officiel APS-BÉNIN (#FAF8FB) */}
      <div className="absolute inset-0 bg-[#FAF8FB]" />

      {/* COUCHE 2 : Motif africain géométrique vectoriel APS-BÉNIN (#92278F) */}
      <div
        className="absolute inset-0 bg-repeat bg-[length:140px_140px] sm:bg-[length:160px_160px] opacity-[0.14] sm:opacity-[0.16]"
        style={{
          backgroundImage: "url('/patterns/african-motif.svg')",
        }}
      />

      {/* COUCHE 3 : Voile blanc semi-transparent d'atténuation & protection du contraste des textes */}
      <div className="absolute inset-0 bg-white/80 sm:bg-white/82 backdrop-blur-[0.5px]" />
    </div>
  );
}
