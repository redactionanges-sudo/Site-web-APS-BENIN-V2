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

export interface ProjectItem {
  id: string;
  slug: string;
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
  main_image: string;
  photos: string[];
  videos: string[];
  documents: Array<{ title: string; url: string; size?: string }>;
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
  main_image: string;
  gallery: string[];
  video_url?: string;
  documents: Array<{ title: string; url: string }>;
  status: NewsStatus;
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
  main_image?: string;
  gallery?: string[];
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
}

export interface MediaItem {
  id: string;
  title_fr: string;
  title_en: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail_url?: string;
  album_id?: string;
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
