export type Language = 'fr' | 'en';

export type UserRole = 'super_admin' | 'admin' | 'editor';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active?: boolean;
  created_at: string;
  last_sign_in?: string;
}

export interface BannerAnnouncement {
  id: string;
  text_fr: string;
  text_en?: string;
  link_url?: string;
  button_text_fr?: string;
  button_text_en?: string;
  start_date?: string;
  end_date?: string;
  order_index: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SocialLinksConfig {
  facebook: string;
  facebook_url?: string;
  facebook_enabled?: boolean;

  twitter: string;
  twitter_url?: string;
  twitter_enabled?: boolean;
  x?: string;
  x_url?: string;
  x_enabled?: boolean;

  linkedin: string;
  linkedin_url?: string;
  linkedin_enabled?: boolean;

  instagram: string;
  instagram_url?: string;
  instagram_enabled?: boolean;

  tiktok: string;
  tiktok_url?: string;
  tiktok_enabled?: boolean;

  youtube: string;
  youtube_url?: string;
  youtube_enabled?: boolean;

  [key: string]: any;
}

export interface SiteSettings {
  id: string;
  org_name: string;
  org_name_short: string;
  slogan_fr: string;
  slogan_en: string;
  description_fr: string;
  description_en: string;
  creation_date: string;
  official_registration_date: string;
  registration_reference: string;
  jo_reference: string;
  ifu_number: string;
  address_location: string;
  address_locality: string;
  postal_box: string;
  phones: string[];
  email: string;
  logo_url: string;
  favicon_url: string;
  social_links: SocialLinksConfig;
  seo: {
    meta_title_fr: string;
    meta_title_en: string;
    meta_description_fr: string;
    meta_description_en: string;
    og_image: string;
    hero_announcements?: BannerAnnouncement[];
    content_orders?: {
      projects?: string[];
      news?: string[];
      opportunities?: string[];
    };
    projects_order?: string[];
    news_order?: string[];
    opportunities_order?: string[];
  };
  footer_text_fr: string;
  footer_text_en: string;
}

export interface KeyStatistic {
  id: string;
  key: string;
  label_fr: string;
  label_en: string;
  value: string;
  order_index: number;
  description_fr?: string;
  description_en?: string;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DomainOfIntervention {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  short_desc_fr: string;
  short_desc_en: string;
  full_desc_fr: string;
  full_desc_en: string;
  icon_name: string;
  order_index: number;
  is_active: boolean;
}

export type ProjectStatus = 'upcoming' | 'in_progress' | 'completed';

export type PublicationType = 'project' | 'activity';

export type ActivityCategory =
  | 'sensibilisation'
  | 'formation'
  | 'atelier'
  | 'campagne'
  | 'plaidoyer'
  | 'distribution'
  | 'reunion'
  | 'autre';

export interface ProjectItem {
  id: string;
  slug: string;
  publication_type?: PublicationType; // 'project' (défaut) ou 'activity' (Activité phare)
  activity_category?: string; // Ex: Sensibilisation, Formation, Atelier, Campagne, etc.
  related_project_id?: string; // ID du projet cadre rattaché (ou vide si autonome)
  related_project_title?: string; // Titre dénormalisé du projet cadre pour affichage rapide
  participants_count?: string; // Ex: 150 participants
  observations_fr?: string;
  observations_en?: string;
  title_fr: string;
  title_en: string;
  excerpt_fr: string;
  excerpt_en: string;
  context_fr: string;
  context_en: string;
  problem_fr: string;
  problem_en: string;
  objectives_fr: string;
  objectives_en: string;
  activities_fr: string;
  activities_en: string;
  expected_results_fr: string;
  expected_results_en: string;
  achieved_results_fr: string;
  achieved_results_en: string;
  beneficiaries_fr: string;
  beneficiaries_en: string;
  intervention_zone: string;
  communes: string[];
  period: string;
  duration: string;
  partners: string[];
  financial_partner?: string;
  status: ProjectStatus;
  is_featured: boolean;
  order_index?: number;
  main_image: string;
  photos: string[];
  videos: string[];
  documents: Array<{ title: string; url: string; size?: string }>;
  views_count?: number;
  likes_count?: number;
  created_at: string;
  updated_at: string;
}

export type NewsStatus = 'draft' | 'published' | 'archived';

export interface NewsItem {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  summary_fr: string;
  summary_en: string;
  content_fr: string;
  content_en: string;
  author: string;
  category_fr: string;
  category_en: string;
  order_index?: number;
  main_image: string;
  gallery: string[];
  video_url?: string;
  documents: Array<{ title: string; url: string }>;
  status: NewsStatus;
  views_count?: number;
  likes_count?: number;
  published_at: string;
  created_at: string;
  seo_title?: string;
  seo_description?: string;
}

export type OpportunityType = 
  | 'recruitment' 
  | 'internship' 
  | 'volunteering' 
  | 'call_for_tenders' 
  | 'consultation' 
  | 'call_for_eoi' 
  | 'other';

export type OpportunityStatus = 'open' | 'closed' | 'archived';

export interface OpportunityItem {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  type: OpportunityType;
  description_fr: string;
  description_en: string;
  organization: string;
  published_at: string;
  deadline: string;
  location_fr: string;
  location_en: string;
  conditions_fr: string;
  conditions_en: string;
  documents_required_fr: string;
  documents_required_en: string;
  pdf_url?: string;
  external_link?: string;
  contact_email: string;
  status: OpportunityStatus;
  order_index?: number;
  main_image?: string;
  gallery?: string[];
  video_url?: string;
  created_at?: string;
}

export type PartnerCategory = 
  | 'technical' 
  | 'financial' 
  | 'institutional' 
  | 'partner_organization' 
  | 'network_coalition';

export interface PartnerItem {
  id: string;
  name: string;
  logo?: string;
  description_fr: string;
  description_en: string;
  category: PartnerCategory;
  collaboration_scope_fr: string;
  collaboration_scope_en: string;
  website_url?: string;
  order_index: number;
  is_active: boolean;
}

export type TeamCategory = 'direction' | 'coordination' | 'operations' | 'technical';

export interface TeamMember {
  id: string;
  name: string;
  role_fr: string;
  role_en: string;
  photo?: string;
  bio_fr: string;
  bio_en: string;
  expertise_fr: string;
  expertise_en: string;
  category: TeamCategory;
  order_index: number;
  is_active: boolean;
}

export interface GovernanceMember {
  id: string;
  name: string;
  title_fr: string;
  title_en: string;
  role_fr: string;
  role_en: string;
  bio_fr: string;
  bio_en: string;
  organ: 'ca' | 'cs' | 'direction'; // Conseil d'Administration, Comité de Surveillance, Direction Exécutive
  photo?: string;
  order_index: number;
}

export type DocumentCategory = 
  | 'institutional_document' 
  | 'annual_report' 
  | 'policy_procedure' 
  | 'charter' 
  | 'study_publication' 
  | 'publication' 
  | 'terms_of_reference' 
  | 'guide_manual' 
  | 'communication' 
  | 'audit_financial' 
  | 'other';

export interface InstitutionalDoc {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  category: DocumentCategory;
  description_fr: string;
  description_en: string;
  file_url: string;
  file_size: string;
  publication_year: number;
  is_public: boolean;
  created_at?: string;
}

export interface PhotoAlbum {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  cover_image: string;
  date: string;
  project_id?: string;
  photo_count?: number;
  media_count?: number;
  created_at?: string;
}

export type MediaTargetModule =
  | 'equipe'
  | 'partenaires'
  | 'projets'
  | 'actualites'
  | 'opportunites'
  | 'institutionnel'
  | 'documents'
  | 'mediatheque'
  | 'autre';

export interface MediaItem {
  id: string;
  title_fr: string;
  title_en: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail_url?: string;
  album_id?: string | null;
  project_id?: string;
  category: string;
  date: string;
  location?: string;
  alt_fr?: string;
  alt_en?: string;
  description_fr?: string;
  description_en?: string;
  video_platform?: 'youtube' | 'vimeo' | 'storage' | 'direct' | 'other';
  show_in_hero?: boolean;
  hero_order?: number;
  is_active?: boolean;
  show_in_public_gallery?: boolean;
  target_module?: MediaTargetModule;
}

export interface HistoryMilestone {
  id: string;
  year: string;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  order_index: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  firstname: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
  notes?: string;
}

export type AuditActionType =
  | 'creation'
  | 'modification'
  | 'publication'
  | 'depublication'
  | 'suppression'
  | 'corbeille'
  | 'restauration'
  | 'suppression_definitive'
  | 'connexion'
  | 'deconnexion'
  | 'export'
  | 'synchronisation'
  | 'securite';

export type AuditModule =
  | 'projets'
  | 'actualites'
  | 'opportunites'
  | 'partenaires'
  | 'equipe'
  | 'gouvernance'
  | 'documents'
  | 'mediatheque'
  | 'domaines'
  | 'statistiques'
  | 'pages_institutionnelles'
  | 'parametres'
  | 'bandeau'
  | 'messages'
  | 'utilisateurs'
  | 'authentification'
  | 'systeme'
  | 'corbeille';

export interface AuditLog {
  id: string;
  created_at: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  user_role?: string;
  action_type: AuditActionType;
  module: AuditModule;
  module_label?: string;
  target_id?: string;
  target_title?: string;
  summary: string;
  changes?: Record<string, any> | Array<{ field: string; label?: string; old_value?: any; new_value?: any }>;
  metadata?: Record<string, any>;
}

export type TrashModule =
  | 'projets'
  | 'actualites'
  | 'opportunites'
  | 'partenaires'
  | 'equipe'
  | 'gouvernance'
  | 'documents'
  | 'mediatheque'
  | 'domaines'
  | 'statistiques'
  | 'pages_institutionnelles';

export interface TrashItem {
  id: string;
  original_id: string;
  module: TrashModule;
  table_name: string;
  title: string;
  data: any;
  previous_status?: string;
  deleted_at: string;
  deleted_by_id?: string;
  deleted_by_email?: string;
  deleted_by_name?: string;
}

export type AnalyticsEventType =
  | 'page_view'
  | 'view_project'
  | 'view_news'
  | 'view_opportunity'
  | 'download_document'
  | 'click_call_headquarters'
  | 'click_cta';

export interface AnalyticsEvent {
  id: string;
  created_at: string;
  session_id: string;
  event_type: AnalyticsEventType;
  path: string;
  page_title?: string;
  referrer?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  country?: string;
  target_id?: string;
  target_title?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsPeriodSummary {
  period: '7d' | '30d' | '90d' | 'custom';
  startDate: string;
  endDate: string;
  hasData: boolean;
  totalPageViews: number;
  totalSessions: number;
  totalUniqueVisitors: number;
  callHeadquartersClicks: number;
  documentDownloads: number;
  projectViews: number;
  newsViews: number;
  opportunityViews: number;
  topPages: Array<{ path: string; title: string; views: number; percentage: number }>;
  trafficByDate: Array<{ date: string; pageViews: number; sessions: number }>;
  deviceBreakdown: Array<{ device: 'mobile' | 'desktop' | 'tablet'; count: number; percentage: number }>;
  sourcesBreakdown: Array<{ source: string; count: number; percentage: number }>;
  actionsBreakdown: Array<{ action: string; label: string; count: number }>;
  lastUpdated: string;
}

// -------------------------------------------------------------
// INSTITUTIONAL PAGES & EDITORIAL CONTENT (CMS BACK-OFFICE)
// -------------------------------------------------------------
export type InstitutionalPageSlug =
  | 'presentation'
  | 'histoire'
  | 'mission-vision-valeurs'
  | 'domaines';

export type InstitutionalBlockType =
  | 'paragraph'
  | 'pillar'
  | 'quote'
  | 'image'
  | 'callout'
  | 'cta'
  | 'vision'
  | 'mission'
  | 'goal'
  | 'objective'
  | 'value';

export interface InstitutionalPageBlock {
  id: string;
  type: InstitutionalBlockType;
  title_fr?: string;
  title_en?: string;
  content_fr?: string;
  content_en?: string;
  image_url?: string;
  image_alt_fr?: string;
  image_alt_en?: string;
  caption_fr?: string;
  caption_en?: string;
  icon_name?: string;
  button_text_fr?: string;
  button_text_en?: string;
  button_url?: string;
  order_index: number;
}

export interface InstitutionalObjective {
  id: string;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  icon_name?: string;
  order_index: number;
}

export interface InstitutionalValue {
  id: string;
  title_fr: string;
  title_en: string;
  desc_fr: string;
  desc_en: string;
  icon_name: string;
  order_index: number;
}

export interface InstitutionalPageImage {
  id: string;
  slot_key: string; // e.g. 'hero_background', 'headquarters_photo', 'community_action', 'gallery_item'
  label_fr: string;
  label_en: string;
  url: string;
  alt_fr: string;
  alt_en: string;
  caption_fr?: string;
  caption_en?: string;
  order_index?: number;
}

export interface InstitutionalPage {
  id: string;
  slug: InstitutionalPageSlug;
  title_fr: string;
  title_en: string;
  subtitle_fr?: string;
  subtitle_en?: string;
  badge_fr?: string;
  badge_en?: string;
  quote_fr?: string;
  quote_en?: string;
  intro_fr?: string;
  intro_en?: string;
  body_html_fr?: string;
  body_html_en?: string;
  hero_image?: string;
  hero_image_alt_fr?: string;
  hero_image_alt_en?: string;
  images: InstitutionalPageImage[];
  blocks: InstitutionalPageBlock[];
  meta_title_fr?: string;
  meta_title_en?: string;
  meta_description_fr?: string;
  meta_description_en?: string;
  is_published: boolean;
  updated_at?: string;
}

export type NewsletterStatus = 'active' | 'unsubscribed';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: NewsletterStatus;
  subscribed_at: string;
  unsubscribed_at?: string;
  consent_given: boolean;
  consent_ip?: string;
  source?: string;
}

export interface ContentMetrics {
  views: number;
  likes: number;
}
