'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Composant d'arrière-plan texturé : Motif africain contemporain APS-BÉNIN
 *
 * Architecture de couches :
 * 1. Fond de base institutionnel blanc cassé (#FAF8FB)
 * 2. Motif africain géométrique vectoriel (#92278F) en filigrane ultra-discret (opacité 4.5% - 5%)
 * 3. Voile blanc semi-opaque protecteur d'atténuation
 * 4. Contenu et structure du site
 * 5. Cartes, formulaires et blocs de lecture 100% opaques (#ffffff)
 *
 * Les pages du back-office (/admin/*) sont strictement exemptées de motif
 * pour assurer une clarté et un confort de travail irréprochables aux administrateurs.
 */
export function AfricanPatternCanvas() {
  const pathname = usePathname();

  // Le back-office administratif et l'écran de connexion disposent d'un arrière-plan
  // professionnel dédié, sans aucun motif perturbateur
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* COUCHE 1 : Fond de base institutionnel blanc cassé officiel APS-BÉNIN (#FAF8FB) */}
      <div className="absolute inset-0 bg-[#FAF8FB]" />

      {/* COUCHE 2 : Motif africain géométrique vectoriel APS-BÉNIN (#92278F) en filigrane ultra-discret */}
      <div
        className="absolute inset-0 bg-repeat bg-[length:140px_140px] sm:bg-[length:160px_160px] opacity-[0.035] sm:opacity-[0.04]"
        style={{
          backgroundImage: "url('/patterns/african-motif.svg?v=4')",
        }}
      />

      {/* COUCHE 3 : Voile blanc semi-transparent d'atténuation & protection absolue du contraste des textes */}
      <div className="absolute inset-0 bg-white/70 sm:bg-white/75" />
    </div>
  );
}
