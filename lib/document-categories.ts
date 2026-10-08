import { DocumentCategory } from '@/types';

export interface DocumentCategoryMeta {
  id: DocumentCategory;
  label_fr: string;
  label_en: string;
  description_fr: string;
  description_en: string;
}

export const DOCUMENT_CATEGORIES: DocumentCategoryMeta[] = [
  {
    id: 'institutional_document',
    label_fr: 'Statuts & Textes fondamentaux',
    label_en: 'Statutes & Founding Texts',
    description_fr: 'Textes constitutifs, statuts révisés, règlements intérieurs et agréments officiels',
    description_en: 'Constitutive texts, statutes, bylaws and official accreditation',
  },
  {
    id: 'annual_report',
    label_fr: 'Rapports Annuels & d’Activités',
    label_en: 'Annual & Activity Reports',
    description_fr: 'Bilans annuels d’impact, rapports d’activités terrain et bilans moraux',
    description_en: 'Annual impact reviews, field activity reports, and moral reports',
  },
  {
    id: 'policy_procedure',
    label_fr: 'Politiques, Procédures & Chartes',
    label_en: 'Policies, Procedures & Charters',
    description_fr: 'Sauvegarde de l’enfance, politique genre, protection contre les VBG et procédures administratives',
    description_en: 'Child safeguarding, gender policy, GBV protection and administrative guidelines',
  },
  {
    id: 'charter',
    label_fr: 'Chartes Éthiques & Déontologie',
    label_en: 'Ethical Charters & Code of Conduct',
    description_fr: 'Chartes des valeurs, codes de bonne conduite et engagements déontologiques',
    description_en: 'Value charters, codes of conduct and ethical commitments',
  },
  {
    id: 'study_publication',
    label_fr: 'Études, Recherches & Enquêtes',
    label_en: 'Studies, Research & Surveys',
    description_fr: 'Études terrain, diagnostics communautaires, baromètres et analyses statistiques',
    description_en: 'Field research, community diagnostics, surveys and statistical analysis',
  },
  {
    id: 'publication',
    label_fr: 'Publications & Bulletins',
    label_en: 'Publications & Newsletters',
    description_fr: 'Bulletins d’information périodiques, revues thématiques et recueils de témoignages',
    description_en: 'Periodic newsletters, thematic journals and case story collections',
  },
  {
    id: 'terms_of_reference',
    label_fr: 'Termes de Référence (TDR)',
    label_en: 'Terms of Reference (ToR)',
    description_fr: 'TDR pour recrutements d’experts, audits opérationnels et appels à compétences',
    description_en: 'ToR for consultancy, evaluations and professional calls',
  },
  {
    id: 'guide_manual',
    label_fr: 'Notes & Guides Pratiques',
    label_en: 'Guides & Practical Manuals',
    description_fr: 'Manuels de formation, guides méthodologiques et boîtes à outils communautaires',
    description_en: 'Training manuals, methodological guides and community toolkits',
  },
  {
    id: 'communication',
    label_fr: 'Supports de Communication & Plaidoyer',
    label_en: 'Advocacy & Communication Materials',
    description_fr: 'Brochures institutionnelles, fiches de plaidoyer et affiches de sensibilisation',
    description_en: 'Institutional brochures, advocacy briefs and awareness posters',
  },
  {
    id: 'audit_financial',
    label_fr: 'Audits Financiers & Certifications',
    label_en: 'Financial Audits & Certifications',
    description_fr: 'Rapports d’audits comptables indépendants et certifications financières externes',
    description_en: 'Independent financial audit reports and external accounting certifications',
  },
  {
    id: 'other',
    label_fr: 'Autres Publications',
    label_en: 'Other Publications',
    description_fr: 'Divers documents et archives documentaires',
    description_en: 'Miscellaneous documents and documentation archives',
  },
];

export function getCategoryMeta(cat: string): DocumentCategoryMeta {
  const found = DOCUMENT_CATEGORIES.find((c) => c.id === cat);
  if (found) return found;
  return {
    id: 'other',
    label_fr: cat.replace(/_/g, ' '),
    label_en: cat.replace(/_/g, ' '),
    description_fr: 'Document',
    description_en: 'Document',
  };
}

export function detectDocFormat(url: string = ''): {
  format: 'PDF' | 'Word' | 'Excel' | 'PowerPoint' | 'Google Drive' | 'OneDrive' | 'Lien';
  isExternalLink: boolean;
  color: string;
} {
  const lower = url.toLowerCase();
  if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) {
    return { format: 'Google Drive', isExternalLink: true, color: 'text-amber-600 bg-amber-50 border-amber-200' };
  }
  if (lower.includes('onedrive') || lower.includes('1drv.ms') || lower.includes('sharepoint')) {
    return { format: 'OneDrive', isExternalLink: true, color: 'text-blue-600 bg-blue-50 border-blue-200' };
  }
  if (lower.endsWith('.pdf') || lower.includes('.pdf?')) {
    return { format: 'PDF', isExternalLink: false, color: 'text-red-600 bg-red-50 border-red-200' };
  }
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
    return { format: 'Word', isExternalLink: false, color: 'text-blue-700 bg-blue-50 border-blue-200' };
  }
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) {
    return { format: 'Excel', isExternalLink: false, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) {
    return { format: 'PowerPoint', isExternalLink: false, color: 'text-orange-700 bg-orange-50 border-orange-200' };
  }
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return { format: 'Lien', isExternalLink: true, color: 'text-purple-700 bg-purple-50 border-purple-200' };
  }
  return { format: 'PDF', isExternalLink: false, color: 'text-gray-700 bg-gray-50 border-gray-200' };
}
