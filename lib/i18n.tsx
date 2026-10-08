'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getLocalized: (item: any, field: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.organization': "L'Organisation",
    'nav.presentation': 'Présentation',
    'nav.history': 'Notre histoire',
    'nav.mission_vision_values': 'Mission, vision et valeurs',
    'nav.domains': "Domaines d'intervention",
    'nav.team': 'Équipe',
    'nav.governance': 'Gouvernance',
    'nav.documents': 'Documents institutionnels',
    'nav.projects': 'Nos projets',
    'nav.news': 'Actualités',
    'nav.opportunities': 'Opportunités',
    'nav.recruitments': 'Recrutements',
    'nav.internships': 'Stages',
    'nav.volunteering': 'Volontariat',
    'nav.tenders': "Appels d'offres",
    'nav.consultations': 'Consultations',
    'nav.mediatheque': 'Médiathèque',
    'nav.photos': 'Photos',
    'nav.videos': 'Vidéos',
    'nav.partners': 'Nos partenaires',
    'nav.contact': 'Contact',
    'nav.admin': 'Espace Admin',

    // Hero & Common
    'hero.badge': 'Organisation Non Gouvernementale',
    'hero.title': 'AGISSONS POUR SAUVER',
    'hero.slogan': 'Pour un monde plus juste et égalitaire',
    'hero.cta_discover': 'Découvrir APS-BÉNIN',
    'hero.cta_projects': 'Nos projets',
    'hero.cta_contact': 'Nous contacter',

    // Presentation Section
    'home.presentation_badge': 'Qui sommes-nous ?',
    'home.presentation_title': "Une force d'action pour la justice et l'égalité au Bénin",
    'home.presentation_readmore': "En savoir plus sur l'organisation",

    // Key Stats
    'stats.title': 'Chiffres Clés',
    'stats.subtitle': "L'impact concret de nos actions sur le terrain",

    // Domains Section
    'domains.badge': 'Nos Domaines',
    'domains.title': "Nos axes prioritaires d'intervention",
    'domains.subtitle': 'Des programmes structurants pour des transformations durables',
    'domains.view_all': 'Découvrir tous nos domaines',

    // Featured Projects
    'projects.badge': 'Actions sur le terrain',
    'projects.title': 'Nos projets phares',
    'projects.subtitle': 'Des initiatives tangibles au service des communautés',
    'projects.view_all': 'Tous nos projets',
    'projects.status_in_progress': 'En cours',
    'projects.status_completed': 'Terminé',
    'projects.status_upcoming': 'À venir',
    'projects.zone': 'Zone',
    'projects.beneficiaries': 'Bénéficiaires',
    'projects.period': 'Période',
    'projects.details_btn': 'Voir le projet',

    // News
    'news.badge': 'Dernières actualités',
    'news.title': 'À la une chez APS-BÉNIN',
    'news.subtitle': 'Restez informés de nos activités, événements et plaidoyers',
    'news.view_all': 'Toutes les actualités',
    'news.read_more': "Lire l'article",

    // Opportunities
    'opp.badge': 'Rejoignez-nous',
    'opp.title': 'Opportunités disponibles',
    'opp.subtitle': 'Recrutements, stages, volontariats et consultations',
    'opp.view_all': 'Toutes les opportunités',
    'opp.deadline': 'Date limite',
    'opp.location': 'Lieu',
    'opp.type_recruitment': 'Recrutement',
    'opp.type_internship': 'Stage',
    'opp.type_volunteering': 'Volontariat',
    'opp.type_tenders': "Appel d'offres",
    'opp.type_consultation': 'Consultation',
    'opp.status_open': 'Ouverte',
    'opp.status_closed': 'Clôturée',
    'opp.apply_btn': 'Postuler',

    // Mediatheque
    'media.badge': 'En images',
    'media.title': 'Médiathèque APS-BÉNIN',
    'media.subtitle': 'Découvrez les moments forts de nos actions',
    'media.view_photos': 'Voir les photos',
    'media.view_videos': 'Voir les vidéos',

    // Partners
    'partners.badge': 'Confiance & Synergie',
    'partners.title': 'Nos Partenaires',
    'partners.subtitle': 'Ils soutiennent nos initiatives et partagent notre engagement',
    'partners.view_all': 'Tous nos partenaires',
    'partners.type_technical': 'Partenaire Technique',
    'partners.type_financial': 'Partenaire Financier',
    'partners.type_institutional': 'Partenaire Institutionnel',
    'partners.type_network': 'Réseau / Coalition',

    // CTA
    'cta.title': 'Vous souhaitez soutenir ou collaborer avec APS-BÉNIN ?',
    'cta.subtitle': 'Ensemble, construisons un monde plus juste, équitable et solidaire.',
    'cta.btn_contact': 'Nous contacter',
    'cta.btn_projects': 'Explorer nos réalisations',

    // Footer
    'footer.headquarters': 'Siège Social',
    'footer.address': 'Djacoṭé-Comè, Département du Mono, République du Bénin',
    'footer.bp': 'BP 69 Comè – République du Bénin',
    'footer.legal_title': 'Mentions Légales & Enregistrement',
    'footer.reg': 'Enregistrement : N°9/040PDM/SG/STCCD- du 20 septembre 2017',
    'footer.jo': 'Journal Officiel : JO N°21 du 1er Novembre 2017',
    'footer.ifu': 'IFU N° : 6 2022 1407 5648',
    'footer.links_title': 'Navigation Rapide',
    'footer.follow_us': 'Suivez-nous',
    'footer.rights': 'Tous droits réservés.',
    'footer.terms': 'Mentions légales',
    'footer.privacy': 'Politique de confidentialité',

    // Contact Page
    'contact.title': 'Contactez APS-BÉNIN',
    'contact.subtitle': "Notre équipe est à votre écoute pour toute information, partenariat ou échange.",
    'contact.form_lastname': 'Nom',
    'contact.form_firstname': 'Prénom',
    'contact.form_email': 'Adresse email',
    'contact.form_phone': 'Numéro de téléphone',
    'contact.form_subject': 'Objet du message',
    'contact.form_message': 'Votre message',
    'contact.form_consent': "J'accepte que mes données soient traitées par APS-BÉNIN dans le cadre de ma demande.",
    'contact.form_submit': 'Envoyer le message',
    'contact.form_sending': 'Envoi en cours...',
    'contact.form_success': 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
    'contact.form_error': 'Une erreur est survenue lors de l’envoi. Veuillez réessayer ou nous joindre directement.',

    // Common words
    'common.search': 'Rechercher...',
    'common.filter_all': 'Tous',
    'common.download': 'Télécharger',
    'common.view': 'Consulter',
    'common.back': 'Retour',
    'common.close': 'Fermer',

    // Logo & Branding Settings
    'settings.logo_title': 'Logo Officiel du Site',
    'settings.logo_current': 'Logo actuel',
    'settings.logo_change': 'Modifier le logo',
    'settings.logo_choose': 'Choisir une image',
    'settings.logo_upload': 'Téléverser',
    'settings.logo_save': 'Enregistrer le nouveau logo',
    'settings.logo_uploading': 'Téléversement en cours...',
    'settings.logo_updated': 'Logo mis à jour avec succès',
    'settings.logo_upload_error': 'Erreur lors du téléversement',
    'settings.logo_invalid_format': 'Format non pris en charge (utilisez PNG, JPG, WEBP ou SVG)',
    'settings.logo_too_large': 'Fichier trop volumineux (taille maximale 5 Mo)',
    'settings.logo_cancel': 'Annuler la sélection',
    'settings.logo_hint': 'Le logo officiel APS-BÉNIN est circulaire. Utilisez une image carrée ou circulaire haute définition avec fond transparent ou blanc.',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.organization': 'The Organization',
    'nav.presentation': 'Overview',
    'nav.history': 'Our History',
    'nav.mission_vision_values': 'Mission, Vision & Values',
    'nav.domains': 'Areas of Intervention',
    'nav.team': 'Team',
    'nav.governance': 'Governance',
    'nav.documents': 'Institutional Documents',
    'nav.projects': 'Our Projects',
    'nav.news': 'News',
    'nav.opportunities': 'Opportunities',
    'nav.recruitments': 'Job Openings',
    'nav.internships': 'Internships',
    'nav.volunteering': 'Volunteering',
    'nav.tenders': 'Calls for Tenders',
    'nav.consultations': 'Consultancies',
    'nav.mediatheque': 'Media Center',
    'nav.photos': 'Photos',
    'nav.videos': 'Videos',
    'nav.partners': 'Our Partners',
    'nav.contact': 'Contact Us',
    'nav.admin': 'Admin Portal',

    // Hero & Common
    'hero.badge': 'Non-Governmental Organization',
    'hero.title': 'AGISSONS POUR SAUVER',
    'hero.slogan': 'For a more just and egalitarian world',
    'hero.cta_discover': 'Discover APS-BENIN',
    'hero.cta_projects': 'Our Projects',
    'hero.cta_contact': 'Contact Us',

    // Presentation Section
    'home.presentation_badge': 'Who are we?',
    'home.presentation_title': 'A driving force for justice and equality in Benin',
    'home.presentation_readmore': 'Learn more about the organization',

    // Key Stats
    'stats.title': 'Key Figures',
    'stats.subtitle': 'Concrete community impact through field action',

    // Domains Section
    'domains.badge': 'Our Areas',
    'domains.title': 'Our Core Priority Areas of Intervention',
    'domains.subtitle': 'Structured initiatives delivering sustainable transformations',
    'domains.view_all': 'Explore all intervention areas',

    // Featured Projects
    'projects.badge': 'Field Action',
    'projects.title': 'Featured Projects',
    'projects.subtitle': 'Tangible actions delivering community transformation',
    'projects.view_all': 'All projects',
    'projects.status_in_progress': 'In Progress',
    'projects.status_completed': 'Completed',
    'projects.status_upcoming': 'Upcoming',
    'projects.zone': 'Zone',
    'projects.beneficiaries': 'Beneficiaries',
    'projects.period': 'Period',
    'projects.details_btn': 'View Project',

    // News
    'news.badge': 'Latest Updates',
    'news.title': 'Highlights from APS-BENIN',
    'news.subtitle': 'Stay informed about our activities, field missions and advocacy',
    'news.view_all': 'All news stories',
    'news.read_more': 'Read Article',

    // Opportunities
    'opp.badge': 'Join Our Mission',
    'opp.title': 'Current Opportunities',
    'opp.subtitle': 'Jobs, internships, volunteering and consultancy calls',
    'opp.view_all': 'All opportunities',
    'opp.deadline': 'Deadline',
    'opp.location': 'Location',
    'opp.type_recruitment': 'Recruitment',
    'opp.type_internship': 'Internship',
    'opp.type_volunteering': 'Volunteering',
    'opp.type_tenders': 'Call for Tenders',
    'opp.type_consultation': 'Consultancy',
    'opp.status_open': 'Open',
    'opp.status_closed': 'Closed',
    'opp.apply_btn': 'Apply Now',

    // Mediatheque
    'media.badge': 'Gallery & Video',
    'media.title': 'APS-BENIN Media Center',
    'media.subtitle': 'Explore photographs and documentaries of our field activities',
    'media.view_photos': 'Browse Photos',
    'media.view_videos': 'Watch Videos',

    // Partners
    'partners.badge': 'Trust & Synergy',
    'partners.title': 'Our Valued Partners',
    'partners.subtitle': 'Supporting our mission and sharing our collective commitment',
    'partners.view_all': 'All Partners',
    'partners.type_technical': 'Technical Partner',
    'partners.type_financial': 'Financial Partner',
    'partners.type_institutional': 'Institutional Partner',
    'partners.type_network': 'Network / Coalition',

    // CTA
    'cta.title': 'Would you like to support or collaborate with APS-BENIN?',
    'cta.subtitle': 'Together, let us build a more equitable, fair and supportive world.',
    'cta.btn_contact': 'Get in Touch',
    'cta.btn_projects': 'Explore our Impact',

    // Footer
    'footer.headquarters': 'Headquarters',
    'footer.address': 'Djacoṭé-Comè, Department of Mono, Republic of Benin',
    'footer.bp': 'PO Box 69 Comè – Republic of Benin',
    'footer.legal_title': 'Legal References & Official Registration',
    'footer.reg': 'Registration: N°9/040PDM/SG/STCCD- of September 20, 2017',
    'footer.jo': 'Official Gazette: JO N°21 of November 1, 2017',
    'footer.ifu': 'IFU ID: 6 2022 1407 5648',
    'footer.links_title': 'Quick Links',
    'footer.follow_us': 'Follow Us',
    'footer.rights': 'All rights reserved.',
    'footer.terms': 'Legal Notice',
    'footer.privacy': 'Privacy Policy',

    // Contact Page
    'contact.title': 'Contact APS-BENIN',
    'contact.subtitle': 'Our team is at your disposal for information, partnerships, or inquiries.',
    'contact.form_lastname': 'Last Name',
    'contact.form_firstname': 'First Name',
    'contact.form_email': 'Email Address',
    'contact.form_phone': 'Phone Number',
    'contact.form_subject': 'Subject',
    'contact.form_message': 'Your Message',
    'contact.form_consent': 'I agree to have my personal information processed by APS-BENIN solely for handling this request.',
    'contact.form_submit': 'Send Message',
    'contact.form_sending': 'Sending...',
    'contact.form_success': 'Your message has been successfully sent. We will reply to you shortly.',
    'contact.form_error': 'An error occurred while sending. Please try again or reach out directly.',

    // Common words
    'common.search': 'Search...',
    'common.filter_all': 'All',
    'common.download': 'Download',
    'common.view': 'View',
    'common.back': 'Back',
    'common.close': 'Close',

    // Logo & Branding Settings
    'settings.logo_title': 'Official Website Logo',
    'settings.logo_current': 'Current logo',
    'settings.logo_change': 'Change logo',
    'settings.logo_choose': 'Choose image',
    'settings.logo_upload': 'Upload',
    'settings.logo_save': 'Save new logo',
    'settings.logo_uploading': 'Uploading...',
    'settings.logo_updated': 'Logo updated successfully',
    'settings.logo_upload_error': 'Error during upload',
    'settings.logo_invalid_format': 'Unsupported format (use PNG, JPG, WEBP or SVG)',
    'settings.logo_too_large': 'File too large (maximum size 5 MB)',
    'settings.logo_cancel': 'Cancel selection',
    'settings.logo_hint': 'The official APS-BENIN logo is circular. Use a high-resolution square or circular image with a transparent or white background.',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => {},
  t: (key: string) => key,
  getLocalized: () => '',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aps_language') as Language;
      if (saved === 'fr' || saved === 'en') {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('aps_language', lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['fr']?.[key] || key;
  };

  const getLocalized = (item: any, field: string): string => {
    if (!item) return '';
    const localizedKey = `${field}_${language}`;
    const fallbackKey = `${field}_fr`;
    return item[localizedKey] || item[fallbackKey] || item[field] || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLocalized }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
