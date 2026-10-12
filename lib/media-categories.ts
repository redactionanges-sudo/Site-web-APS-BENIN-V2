import { MediaItem, MediaTargetModule } from '@/types';

export interface MediaCategoryDefinition {
  id: string;
  label_fr: string;
  label_en: string;
  description_fr: string;
  isInternalByDefault: boolean; // True if intended for internal site modules (team, partners, site settings, docs)
  targetModule?: MediaTargetModule;
}

export const MEDIA_CATEGORIES: MediaCategoryDefinition[] = [
  {
    id: 'mediatheque_publique',
    label_fr: 'Médiathèque publique',
    label_en: 'Public Media Library',
    description_fr: 'Photographies et vidéos destinées à l’exposition dans la médiathèque publique.',
    isInternalByDefault: false,
    targetModule: 'mediatheque',
  },
  {
    id: 'activites_terrain',
    label_fr: 'Activités de terrain',
    label_en: 'Field Activities',
    description_fr: 'Ateliers, formations, visites de terrain et mobilisation communautaire.',
    isInternalByDefault: false,
    targetModule: 'mediatheque',
  },
  {
    id: 'sensibilisation',
    label_fr: 'Sensibilisation',
    label_en: 'Awareness',
    description_fr: 'Campagnes citoyennes, éducation populaire et actions de plaidoyer.',
    isInternalByDefault: false,
    targetModule: 'mediatheque',
  },
  {
    id: 'celebrations',
    label_fr: 'Célébrations & Événements',
    label_en: 'Celebrations & Events',
    description_fr: 'Journées internationales, commémorations et cérémonies officielles.',
    isInternalByDefault: false,
    targetModule: 'mediatheque',
  },
  {
    id: 'temoignages',
    label_fr: 'Témoignages & Reportages',
    label_en: 'Testimonies & Reports',
    description_fr: 'Récits de vie des bénéficiaires, interviews et reportages vidéo.',
    isInternalByDefault: false,
    targetModule: 'mediatheque',
  },
  {
    id: 'projets',
    label_fr: 'Projets & Réalisations',
    label_en: 'Projects & Achievements',
    description_fr: 'Visuels d’illustration et galeries rattachés aux projets d’APS-BÉNIN.',
    isInternalByDefault: true,
    targetModule: 'projets',
  },
  {
    id: 'actualites',
    label_fr: 'Actualités & Communiqués',
    label_en: 'News & Press',
    description_fr: 'Photos d’illustration des articles de blog et communiqués de presse.',
    isInternalByDefault: true,
    targetModule: 'actualites',
  },
  {
    id: 'opportunites',
    label_fr: 'Opportunités',
    label_en: 'Opportunities',
    description_fr: 'Visuels d’appels à candidatures, recrutements et consultations.',
    isInternalByDefault: true,
    targetModule: 'opportunites',
  },
  {
    id: 'equipe',
    label_fr: 'Équipe & Gouvernance',
    label_en: 'Team & Governance',
    description_fr: 'Portraits des membres de la Direction, de la Coordination et du CA.',
    isInternalByDefault: true,
    targetModule: 'equipe',
  },
  {
    id: 'partenaires',
    label_fr: 'Partenaires & Bailleurs',
    label_en: 'Partners & Donors',
    description_fr: 'Logos officiels des partenaires techniques et financiers.',
    isInternalByDefault: true,
    targetModule: 'partenaires',
  },
  {
    id: 'identite_logos',
    label_fr: 'Identité institutionnelle & Logos',
    label_en: 'Institutional Identity & Logos',
    description_fr: 'Logos officiels APS-BÉNIN, bannières et visuels de l’identité visuelle.',
    isInternalByDefault: true,
    targetModule: 'institutionnel',
  },
  {
    id: 'documents',
    label_fr: 'Documents & Rapports',
    label_en: 'Documents & Reports',
    description_fr: 'Couvertures de rapports annuels, audits et documents officiels.',
    isInternalByDefault: true,
    targetModule: 'documents',
  },
  {
    id: 'autre',
    label_fr: 'Autre',
    label_en: 'Other',
    description_fr: 'Médias divers non classés.',
    isInternalByDefault: true,
    targetModule: 'autre',
  },
];

/**
 * Normalise la catégorie pour correspondre aux libellés standardisés.
 */
export function normalizeCategoryName(rawCategory?: string): string {
  if (!rawCategory) return 'Médiathèque publique';
  const clean = rawCategory.trim();
  const lower = clean.toLowerCase();

  if (lower === 'equipe' || lower.includes('équipe') || lower.includes('gouvernance')) {
    return 'Équipe & Gouvernance';
  }
  if (lower === 'partenaires' || lower.includes('partenaire') || lower.includes('bailleur')) {
    return 'Partenaires & Bailleurs';
  }
  if (lower === 'logo' || lower.includes('identité') || lower.includes('identite')) {
    return 'Identité institutionnelle & Logos';
  }
  if (lower === 'projets' || lower.includes('projet')) {
    return 'Projets & Réalisations';
  }
  if (lower === 'actualites' || lower.includes('actualité') || lower.includes('communiqué')) {
    return 'Actualités & Communiqués';
  }
  if (lower === 'opportunites' || lower.includes('opportunité')) {
    return 'Opportunités';
  }
  if (lower === 'documents' || lower.includes('rapport')) {
    return 'Documents & Rapports';
  }
  if (lower === 'activités de terrain' || lower.includes('terrain')) {
    return 'Activités de terrain';
  }
  if (lower === 'sensibilisation') {
    return 'Sensibilisation';
  }
  if (lower.includes('célébration') || lower.includes('celebration') || lower.includes('événement')) {
    return 'Célébrations & Événements';
  }
  if (lower.includes('témoignage') || lower.includes('temoignage') || lower.includes('reportage')) {
    return 'Témoignages & Reportages';
  }
  if (lower === 'médiathèque' || lower === 'mediatheque') {
    return 'Médiathèque publique';
  }

  return clean;
}

/**
 * Renvoie la catégorie par défaut selon le module d'origine lors d'un upload.
 */
export function getDefaultCategoryForModule(module?: string): {
  category: string;
  targetModule: MediaTargetModule;
  showInPublicGallery: boolean;
} {
  switch (module) {
    case 'equipe':
      return {
        category: 'Équipe & Gouvernance',
        targetModule: 'equipe',
        showInPublicGallery: false,
      };
    case 'partenaires':
      return {
        category: 'Partenaires & Bailleurs',
        targetModule: 'partenaires',
        showInPublicGallery: false,
      };
    case 'projets':
      return {
        category: 'Projets & Réalisations',
        targetModule: 'projets',
        showInPublicGallery: false,
      };
    case 'actualites':
      return {
        category: 'Actualités & Communiqués',
        targetModule: 'actualites',
        showInPublicGallery: false,
      };
    case 'opportunites':
      return {
        category: 'Opportunités',
        targetModule: 'opportunites',
        showInPublicGallery: false,
      };
    case 'pages_institutionnelles':
    case 'institutionnel':
      return {
        category: 'Identité institutionnelle & Logos',
        targetModule: 'institutionnel',
        showInPublicGallery: false,
      };
    case 'documents':
      return {
        category: 'Documents & Rapports',
        targetModule: 'documents',
        showInPublicGallery: false,
      };
    case 'mediatheque':
    default:
      return {
        category: 'Médiathèque publique',
        targetModule: 'mediatheque',
        showInPublicGallery: false, // Prudent : exclu par défaut sauf choix explicite
      };
  }
}

/**
 * Détermine si un média est strictement autorisé à être affiché dans la médiathèque publique.
 */
export function isMediaAllowedInPublicGallery(item: MediaItem): boolean {
  // 1. Doit être actif (pas un brouillon, inactif ou supprimé)
  if (item.is_active === false) return false;

  // 2. Doit être EXPLICITEMENT autorisé pour la médiathèque publique
  if (item.show_in_public_gallery !== true) return false;

  // 3. Garde-fou strict : exclure absolument les portraits d'équipe et logos partenaires
  const target = item.target_module;
  if (target === 'equipe' || target === 'partenaires' || target === 'institutionnel') {
    return false;
  }

  const catLower = (item.category || '').toLowerCase();
  if (
    catLower.includes('équipe') ||
    catLower.includes('equipe') ||
    catLower.includes('partenaire') ||
    catLower === 'logo' ||
    catLower.includes('identité') ||
    catLower.includes('identite')
  ) {
    return false;
  }

  return true;
}
