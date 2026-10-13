import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { normalizeSocialLinks } from '@/lib/social';
import type { UploadProgressData } from '@/components/admin/UploadProgressBar';
import {
  isMediaAllowedInPublicGallery,
  normalizeCategoryName,
} from '@/lib/media-categories';
import {
  SiteSettings,
  BannerAnnouncement,
  KeyStatistic,
  DomainOfIntervention,
  ProjectItem,
  NewsItem,
  OpportunityItem,
  PartnerItem,
  TeamMember,
  GovernanceMember,
  InstitutionalDoc,
  PhotoAlbum,
  MediaItem,
  HistoryMilestone,
  ContactMessage,
  UserProfile,
  UserRole,
  AuditLog,
  AuditActionType,
  AuditModule,
  TrashItem,
  TrashModule,
  InstitutionalPage,
  InstitutionalPageSlug,
  InstitutionalPageImage,
  InstitutionalPageBlock,
} from '@/types';
import { getAuditLogs, recordAuditLog } from './audit';
import {
  initialSiteSettings,
  initialStatistics,
  initialDomains,
  initialProjects,
  initialNews,
  initialOpportunities,
  initialPartners,
  initialTeam,
  initialGovernance,
  initialDocuments,
  initialHistory,
  initialAlbums,
  initialMedia,
  initialAdminUsers,
  initialInstitutionalPages,
} from './initial-data';

let rawSupabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
while (rawSupabaseUrl.endsWith('/')) rawSupabaseUrl = rawSupabaseUrl.slice(0, -1);
if (rawSupabaseUrl.endsWith('/rest/v1')) rawSupabaseUrl = rawSupabaseUrl.slice(0, -8);
while (rawSupabaseUrl.endsWith('/')) rawSupabaseUrl = rawSupabaseUrl.slice(0, -1);
const supabaseUrl = rawSupabaseUrl;
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local persistent storage key prefixes
const STORAGE_PREFIX = 'aps_benin_';

// In-Memory Session Cache with TTL (3 minutes) to avoid repeated round-trips
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export function getCachedData<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

export function setCachedData<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
  } else {
    for (const key of Array.from(memoryCache.keys())) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
  }
}

function getStoredItem<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function unpackStatistic(row: any): KeyStatistic {
  if (!row) return row;
  let label_en = row.label_en || '';
  let description_fr = row.description_fr || '';
  let description_en = row.description_en || '';
  let is_published = row.is_published !== false;
  let created_at = row.created_at || '';
  let updated_at = row.updated_at || '';

  if (typeof label_en === 'string' && label_en.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(label_en);
      label_en = parsed.en || parsed.label_en || row.label_fr || '';
      description_fr = parsed.desc_fr || parsed.description_fr || description_fr;
      description_en = parsed.desc_en || parsed.description_en || description_en;
      if (parsed.is_published !== undefined) is_published = Boolean(parsed.is_published);
      if (parsed.created_at) created_at = parsed.created_at;
      if (parsed.updated_at) updated_at = parsed.updated_at;
    } catch {
      // keep raw string if parsing fails
    }
  }

  return {
    id: row.id,
    key: row.key || row.id,
    label_fr: row.label_fr || '',
    label_en: label_en || row.label_fr || '',
    value: String(row.value ?? ''),
    order_index: Number(row.order_index ?? 0),
    description_fr,
    description_en,
    is_published,
    created_at,
    updated_at,
  };
}

export function packStatistic(stat: KeyStatistic): any {
  const is_published = stat.is_published !== false;
  const packedMeta = JSON.stringify({
    en: stat.label_en || stat.label_fr || '',
    desc_fr: stat.description_fr || '',
    desc_en: stat.description_en || '',
    is_published,
    created_at: stat.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return {
    id: stat.id,
    key: stat.key || stat.id,
    label_fr: stat.label_fr || '',
    label_en: packedMeta,
    value: String(stat.value ?? ''),
    order_index: Number(stat.order_index ?? 0),
  };
}

export function unpackMedia(row: any): MediaItem {
  if (!row) return row;
  let description_en = row.description_en || '';
  let show_in_hero = false;
  let hero_order = 99;
  let is_active = true;
  let show_in_public_gallery = false;
  let target_module = undefined;

  // 1. Robust recursive unwrap of metadata in description_en
  while (typeof description_en === 'string' && description_en.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(description_en);
      if (parsed.show_in_hero !== undefined) show_in_hero = Boolean(parsed.show_in_hero);
      if (parsed.hero_order !== undefined) hero_order = Number(parsed.hero_order) || 99;
      if (parsed.is_active !== undefined) is_active = Boolean(parsed.is_active);
      if (parsed.show_in_public_gallery !== undefined) {
        show_in_public_gallery = Boolean(parsed.show_in_public_gallery);
      }
      if (parsed.target_module !== undefined) {
        target_module = parsed.target_module;
      }
      description_en = parsed.desc_en !== undefined ? parsed.desc_en : (parsed.text !== undefined ? parsed.text : (parsed.description_en || ''));
    } catch {
      break;
    }
  }

  // 2. Direct row columns override if present
  if (row.show_in_hero !== undefined && row.show_in_hero !== null) show_in_hero = Boolean(row.show_in_hero);
  if (row.hero_order !== undefined && row.hero_order !== null) hero_order = Number(row.hero_order) || 99;
  if (row.is_active !== undefined && row.is_active !== null) is_active = row.is_active !== false;
  if (row.show_in_public_gallery !== undefined && row.show_in_public_gallery !== null) {
    show_in_public_gallery = Boolean(row.show_in_public_gallery);
  }
  if (row.target_module) target_module = row.target_module;

  return {
    id: row.id,
    title_fr: row.title_fr || '',
    title_en: row.title_en || row.title_fr || '',
    type: row.type || 'photo',
    url: row.url || '',
    thumbnail_url: row.thumbnail_url || row.url || '',
    album_id: row.album_id || undefined,
    project_id: row.project_id || undefined,
    category: row.category || 'Médiathèque publique',
    date: row.date || new Date().toISOString().split('T')[0],
    location: row.location || 'APS-BÉNIN',
    alt_fr: row.alt_fr || row.title_fr || '',
    alt_en: row.alt_en || row.title_en || row.title_fr || '',
    description_fr: row.description_fr || '',
    description_en: typeof description_en === 'string' ? description_en : '',
    video_platform: row.video_platform,
    show_in_hero,
    hero_order,
    is_active,
    show_in_public_gallery,
    target_module,
  };
}

export function packMedia(item: any): any {
  let original_desc_en = item.description_en || '';
  let show_in_hero = Boolean(item.show_in_hero);
  let hero_order = Number(item.hero_order) || 1;
  let is_active = item.is_active !== false;
  let show_in_public_gallery = Boolean(item.show_in_public_gallery);
  let target_module = item.target_module || undefined;

  // Unpack any nested JSON if description_en was already encapsulated
  while (typeof original_desc_en === 'string' && original_desc_en.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(original_desc_en);
      if (parsed.show_in_hero !== undefined && item.show_in_hero === undefined) {
        show_in_hero = Boolean(parsed.show_in_hero);
      }
      if (parsed.hero_order !== undefined && item.hero_order === undefined) {
        hero_order = Number(parsed.hero_order) || 1;
      }
      if (parsed.is_active !== undefined && item.is_active === undefined) {
        is_active = Boolean(parsed.is_active);
      }
      if (parsed.show_in_public_gallery !== undefined && item.show_in_public_gallery === undefined) {
        show_in_public_gallery = Boolean(parsed.show_in_public_gallery);
      }
      if (parsed.target_module !== undefined && item.target_module === undefined) {
        target_module = parsed.target_module;
      }
      original_desc_en = parsed.desc_en !== undefined ? parsed.desc_en : (parsed.text !== undefined ? parsed.text : (parsed.description_en || ''));
    } catch {
      break;
    }
  }

  const packedMeta = JSON.stringify({
    desc_en: typeof original_desc_en === 'string' ? original_desc_en : '',
    show_in_hero,
    hero_order,
    is_active,
    show_in_public_gallery,
    target_module,
    updated_at: new Date().toISOString(),
  });

  return {
    ...item,
    show_in_hero,
    hero_order,
    is_active,
    show_in_public_gallery,
    target_module,
    description_en: packedMeta,
  };
}

export function resolveMediaUrl(urlOrPath?: string | null): string {
  if (!urlOrPath || typeof urlOrPath !== 'string') return '';
  const trimmed = urlOrPath.trim();
  if (!trimmed) return '';

  // Already a full URL or data URI
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const base = supabaseUrl || 'https://ezbpbjtddeytbyedfioo.supabase.co';

  // Relative storage path starting with /storage/v1/
  if (trimmed.startsWith('/storage/v1/')) {
    return `${base}${trimmed}`;
  }

  // Relative storage path starting with storage/v1/
  if (trimmed.startsWith('storage/v1/')) {
    return `${base}/${trimmed}`;
  }

  // Supabase object paths like "uploads/..." or "images/uploads/..."
  if (trimmed.startsWith('uploads/')) {
    return `${base}/storage/v1/object/public/images/${trimmed}`;
  }
  if (trimmed.startsWith('images/')) {
    return `${base}/storage/v1/object/public/${trimmed}`;
  }

  // Local static root assets starting with /
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return trimmed;
}

export function unpackInstitutionalPage(row: any): InstitutionalPage {
  if (!row) return row;
  let images = row.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch {
      images = [];
    }
  }
  if (!Array.isArray(images)) images = [];

  const cleanedImages: InstitutionalPageImage[] = images
    .filter((img: any) => img && (typeof img === 'object' || typeof img === 'string'))
    .map((img: any, idx: number): InstitutionalPageImage => {
      if (typeof img === 'string') {
        const url = resolveMediaUrl(img);
        return {
          id: `img-${idx + 1}`,
          slot_key: `image_${idx + 1}`,
          label_fr: 'Photo illustrative',
          label_en: 'Illustrative photo',
          url,
          alt_fr: 'Photo descriptive APS-BÉNIN',
          alt_en: 'Descriptive photo APS-BENIN',
          caption_fr: '',
          caption_en: '',
          order_index: idx + 1,
        };
      }
      return {
        id: img.id || `img-${idx + 1}`,
        slot_key: img.slot_key || `image_${idx + 1}`,
        label_fr: img.label_fr || 'Photo illustrative',
        label_en: img.label_en || img.label_fr || 'Illustrative photo',
        url: resolveMediaUrl(img.url),
        alt_fr: img.alt_fr || img.label_fr || 'Photo descriptive APS-BÉNIN',
        alt_en: img.alt_en || img.label_en || img.alt_fr || 'Descriptive photo APS-BENIN',
        caption_fr: img.caption_fr || '',
        caption_en: img.caption_en || '',
        order_index: Number(img.order_index ?? idx + 1),
      };
    })
    .sort((a: InstitutionalPageImage, b: InstitutionalPageImage) => (a.order_index ?? 0) - (b.order_index ?? 0));

  let blocks = row.blocks;
  if (typeof blocks === 'string') {
    try {
      blocks = JSON.parse(blocks);
    } catch {
      blocks = [];
    }
  }
  if (!Array.isArray(blocks)) blocks = [];

  const cleanedBlocks: InstitutionalPageBlock[] = blocks
    .filter((blk: any) => blk && typeof blk === 'object')
    .map((blk: any, idx: number): InstitutionalPageBlock => ({
      id: blk.id || `blk-${idx + 1}`,
      type: blk.type || 'pillar',
      title_fr: blk.title_fr || '',
      title_en: blk.title_en || blk.title_fr || '',
      content_fr: blk.content_fr || '',
      content_en: blk.content_en || blk.content_fr || '',
      image_url: resolveMediaUrl(blk.image_url) || undefined,
      image_alt_fr: blk.image_alt_fr || undefined,
      image_alt_en: blk.image_alt_en || undefined,
      caption_fr: blk.caption_fr || undefined,
      caption_en: blk.caption_en || undefined,
      icon_name: blk.icon_name || 'ShieldCheck',
      button_text_fr: blk.button_text_fr || undefined,
      button_text_en: blk.button_text_en || undefined,
      button_url: blk.button_url || undefined,
      order_index: Number(blk.order_index ?? idx + 1),
    }))
    .sort((a: InstitutionalPageBlock, b: InstitutionalPageBlock) => (a.order_index ?? 0) - (b.order_index ?? 0));

  return {
    id: row.id || `page-${row.slug}`,
    slug: row.slug,
    title_fr: row.title_fr || '',
    title_en: row.title_en || row.title_fr || '',
    subtitle_fr: row.subtitle_fr || '',
    subtitle_en: row.subtitle_en || '',
    badge_fr: row.badge_fr || "L'Organisation",
    badge_en: row.badge_en || 'The Organization',
    quote_fr: row.quote_fr || '',
    quote_en: row.quote_en || '',
    intro_fr: row.intro_fr || '',
    intro_en: row.intro_en || '',
    body_html_fr: row.body_html_fr || '',
    body_html_en: row.body_html_en || '',
    hero_image: resolveMediaUrl(row.hero_image),
    hero_image_alt_fr: row.hero_image_alt_fr || '',
    hero_image_alt_en: row.hero_image_alt_en || '',
    images: cleanedImages,
    blocks: cleanedBlocks,
    meta_title_fr: row.meta_title_fr || '',
    meta_title_en: row.meta_title_en || '',
    meta_description_fr: row.meta_description_fr || '',
    meta_description_en: row.meta_description_en || '',
    is_published: row.is_published !== false,
    updated_at: row.updated_at,
  };
}

function mutateLocalStorageTable(table: string, action: 'upsert' | 'delete', dataOrId: any): void {
  const map: Record<string, { key: string; initial: any[] }> = {
    projects: { key: 'projects', initial: initialProjects },
    news: { key: 'news', initial: initialNews },
    opportunities: { key: 'opportunities', initial: initialOpportunities },
    partners: { key: 'partners', initial: initialPartners },
    team: { key: 'team', initial: initialTeam },
    governance: { key: 'governance', initial: initialGovernance },
    documents: { key: 'documents', initial: initialDocuments },
    media: { key: 'media', initial: initialMedia },
    albums: { key: 'albums', initial: initialAlbums },
    domains: { key: 'domains', initial: initialDomains },
    statistics: { key: 'statistics', initial: initialStatistics },
    history_milestones: { key: 'history', initial: initialHistory },
    profiles: { key: 'users', initial: initialAdminUsers },
    contact_messages: { key: 'contact_messages', initial: [] },
    institutional_pages: { key: 'institutional_pages', initial: initialInstitutionalPages },
  };

  const entry = map[table];
  if (!entry) return;

  const currentList = getStoredItem<any[]>(entry.key, entry.initial);
  let updatedList: any[];

  if (action === 'delete') {
    const idToDelete = typeof dataOrId === 'string' ? dataOrId : dataOrId?.id;
    updatedList = currentList.filter((item) => item.id !== idToDelete);
  } else {
    const payload = dataOrId;
    const idx = currentList.findIndex((item) => item.id === payload.id);
    if (idx >= 0) {
      updatedList = currentList.map((item) => (item.id === payload.id ? { ...item, ...payload } : item));
    } else {
      updatedList = [payload, ...currentList];
    }
  }

  setStoredItem(entry.key, updatedList);
  setCachedData(entry.key, updatedList);
  invalidateCache(entry.key);
}

async function logTableMutation(
  table: string,
  action: 'upsert' | 'delete',
  dataOrId: any
): Promise<void> {
  if (table === 'audit_logs') return;

  const TABLE_MODULES: Record<string, { module: AuditModule; label: string }> = {
    projects: { module: 'projets', label: 'Projets' },
    news: { module: 'actualites', label: 'Actualités' },
    opportunities: { module: 'opportunites', label: 'Opportunités' },
    partners: { module: 'partenaires', label: 'Partenaires' },
    team: { module: 'equipe', label: 'Équipe' },
    team_members: { module: 'equipe', label: 'Équipe' },
    governance: { module: 'gouvernance', label: 'Gouvernance' },
    documents: { module: 'documents', label: 'Documents & Rapports' },
    media: { module: 'mediatheque', label: 'Médiathèque' },
    albums: { module: 'mediatheque', label: 'Albums Photo' },
    domains: { module: 'domaines', label: "Domaines d'action" },
    statistics: { module: 'statistiques', label: 'Chiffres Clés' },
    site_settings: { module: 'parametres', label: 'Paramètres du Site' },
    history_milestones: { module: 'parametres', label: 'Historique & Jalons' },
    institutional_pages: { module: 'pages_institutionnelles', label: 'Pages Institutionnelles' },
    contact_messages: { module: 'messages', label: 'Messages Reçus' },
    profiles: { module: 'utilisateurs', label: 'Utilisateurs & Rôles' },
    trash_items: { module: 'corbeille', label: 'Corbeille' },
  };

  const meta = TABLE_MODULES[table] || { module: 'systeme' as AuditModule, label: table };
  let actionType: AuditActionType = 'modification';
  let targetId = '';
  let targetTitle = '';
  let summary = '';
  let changes: any = undefined;

  if (action === 'delete') {
    actionType = 'suppression';
    targetId = typeof dataOrId === 'string' ? dataOrId : dataOrId?.id || '';
    targetTitle = dataOrId?.title_fr || dataOrId?.title_en || dataOrId?.name || dataOrId?.full_name || targetId;
    summary = `Suppression de « ${targetTitle || 'élément'} » (${meta.label})`;
  } else {
    const data = dataOrId;
    targetId = data?.id ? String(data.id) : '';
    targetTitle =
      data?.title_fr ||
      data?.title_en ||
      data?.name ||
      data?.full_name ||
      data?.org_name ||
      data?.label_fr ||
      data?.subject ||
      (table === 'site_settings' ? 'Paramètres généraux du site' : '') ||
      (table === 'history_milestones' ? (data?.title_fr || `Jalon ${data?.year || ''}`) : '') ||
      (targetId ? `Élément #${targetId}` : 'Contenu éditorial');

    if (data?.status === 'published') {
      actionType = 'publication';
    } else if (data?.status === 'draft' || data?.status === 'archived') {
      actionType = 'depublication';
    } else if (!data?.created_at || new Date(data?.created_at).getTime() > Date.now() - 5000) {
      actionType = 'creation';
    } else {
      actionType = 'modification';
    }

    const actionVerb =
      actionType === 'creation'
        ? 'Création'
        : actionType === 'publication'
        ? 'Publication'
        : actionType === 'depublication'
        ? 'Dépublication'
        : 'Mise à jour';

    summary = `${actionVerb} de « ${targetTitle} » (${meta.label})`;

    if (data && typeof data === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [k, v] of Object.entries(data)) {
        if (!['password', 'password_hash', 'token', 'secret'].includes(k.toLowerCase()) && v !== undefined) {
          sanitized[k] = typeof v === 'object' && v !== null ? JSON.stringify(v).slice(0, 180) : v;
        }
      }
      changes = sanitized;
    }
  }

  // Retrieve authenticated admin user identity
  let userId: string | undefined = undefined;
  let userEmail: string | undefined = undefined;
  let userName: string | undefined = undefined;
  let userRole: string | undefined = undefined;

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('aps_admin_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        userId = parsed.id;
        userEmail = parsed.email;
        userName = parsed.full_name;
        userRole = parsed.role;
      }
    } catch {}

    if (supabase && (!userId || !userEmail)) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (!userId) userId = session.user.id;
          if (!userEmail) userEmail = session.user.email;
          if (!userName) userName = session.user.user_metadata?.full_name;
        }
      } catch {}
    }
  }

  // Strictly enforce real identity or « Utilisateur non identifié »
  if (!userName) {
    userName = userEmail || 'Utilisateur non identifié';
  }

  try {
    await recordAuditLog({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      user_role: userRole,
      action_type: actionType,
      module: meta.module,
      module_label: meta.label,
      target_id: targetId,
      target_title: targetTitle,
      summary,
      changes,
      metadata: { source: 'Back-Office CMS', table },
    });
  } catch (logErr) {
    console.warn('Logging mutation non-bloquant:', logErr);
  }
}

async function mutateTable(table: string, action: 'upsert' | 'delete', dataOrId: any): Promise<void> {
  let directSuccess = false;

  // 1. Direct Supabase operation using authenticated browser client session
  if (typeof window !== 'undefined' && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (action === 'upsert') {
          let upsertPayload = dataOrId;
          if (table === 'opportunities') {
            const main_image = dataOrId.main_image || '';
            const gallery = Array.isArray(dataOrId.gallery) ? dataOrId.gallery : [];
            const existingUrl = dataOrId.external_link && !dataOrId.external_link.startsWith('{') ? dataOrId.external_link : undefined;
            if (main_image || gallery.length > 0) {
              upsertPayload = {
                ...dataOrId,
                external_link: JSON.stringify({
                  url: existingUrl,
                  main_image,
                  gallery,
                }),
              };
            }
          }

          if (table === 'media') {
            const packed = packMedia(dataOrId);
            const {
              show_in_hero: _,
              hero_order: __,
              is_active: ___,
              show_in_public_gallery: ____,
              target_module: _____,
              ...sqlPayload
            } = packed;
            upsertPayload = sqlPayload;
          }

          let { error } = await supabase.from(table).upsert(upsertPayload);
          // Retry for opportunities if image columns differ
          if (error && table === 'opportunities' && error.message?.includes('column') && (error.message?.includes('main_image') || error.message?.includes('gallery'))) {
            const { main_image, gallery, ...safePayload } = upsertPayload;
            const retryDirect = await supabase.from(table).upsert(safePayload);
            if (!retryDirect.error) error = null;
          }

          if (!error) {
            directSuccess = true;
          } else {
            console.warn(`Direct client upsert failed on ${table}, trying server bridge:`, error.message);
          }
        } else {
          const { error } = await supabase.from(table).delete().eq('id', dataOrId);
          if (!error) {
            directSuccess = true;
          } else {
            console.warn(`Direct client delete failed on ${table}, trying server bridge:`, error.message);
          }
        }
      }
    } catch (directErr) {
      console.warn(`Direct client mutation failed on ${table}:`, directErr);
    }
  }

  // If direct Supabase mutation succeeded, record audit log immediately and return!
  if (directSuccess) {
    await logTableMutation(table, action, dataOrId);
    return;
  }

  // 2. Server API bridge (/api/admin/mutate)
  if (typeof window !== 'undefined') {
    const sendData = (action === 'upsert' && table === 'media') ? packMedia(dataOrId) : dataOrId;
    const payload = action === 'upsert'
      ? { table, action, data: sendData }
      : { table, action, id: dataOrId };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch {}
    }

    try {
      const res = await fetch('/api/admin/mutate', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && !json.error) {
        if (json?.auditLog) {
          try {
            const stored = localStorage.getItem('aps_audit_logs_v1');
            const parsed = stored ? JSON.parse(stored) : [];
            const updated = [json.auditLog, ...parsed.filter((item: any) => item.id !== json.auditLog.id)].slice(0, 300);
            localStorage.setItem('aps_audit_logs_v1', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('aps_audit_log_created', { detail: json.auditLog }));
          } catch {}
        } else {
          await logTableMutation(table, action, dataOrId);
        }
        return;
      }

      if (!isSupabaseConfigured) {
        // Local mode fallback
        mutateLocalStorageTable(table, action, dataOrId);
        await logTableMutation(table, action, dataOrId);
        return;
      }

      throw new Error(json.error || `Erreur Supabase lors de l'enregistrement (${table})`);
    } catch (bridgeErr: any) {
      if (!isSupabaseConfigured) {
        mutateLocalStorageTable(table, action, dataOrId);
        await logTableMutation(table, action, dataOrId);
        return;
      }
      throw bridgeErr;
    }
  }

  // 3. Server runtime fallback
  if (supabase) {
    if (action === 'upsert') {
      let sendData = dataOrId;
      if (table === 'media') {
        const packed = packMedia(dataOrId);
        const { show_in_hero: _, hero_order: __, is_active: ___, ...sqlPayload } = packed;
        sendData = sqlPayload;
      }
      const { error } = await supabase.from(table).upsert(sendData);
      if (error) throw new Error(`Erreur Supabase (${table}): ${error.message}`);
    } else {
      const { error } = await supabase.from(table).delete().eq('id', dataOrId);
      if (error) throw new Error(`Erreur Supabase (${table}): ${error.message}`);
    }
    await logTableMutation(table, action, dataOrId);
  }
}

export interface DashboardStatsData {
  projectsTotal: number;
  projectsPublished: number;
  newsTotal: number;
  newsPublished: number;
  newsDrafts: number;
  oppsTotal: number;
  oppsPublished: number;
  oppsClosed: number;
  mediaTotal: number;
  photosCount: number;
  videosCount: number;
  partnersCount: number;
  canAccessMessages: boolean;
  messagesTotal: number | null;
  unreadMessages: number | null;
  recentNews: any[];
  recentMessages: any[];
  lastUpdated: string;

  // Backward compatibility aliases
  projectsCount: number;
  newsCount: number;
  oppCount: number;
  messagesCount: number;
  draftsCount: number;
}

// Unified Store with real Supabase bridge + reactive local fallback + In-Memory Cache
export const supabaseStore = {
  // Settings
  async getSettings(): Promise<SiteSettings> {
    const cached = getCachedData<SiteSettings>('settings');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').single();
        if (!error && data) {
          const res = {
            ...(data as SiteSettings),
            social_links: normalizeSocialLinks(data.social_links),
          };
          setCachedData('settings', res);
          setStoredItem('settings', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to local data:', e);
      }
    }
    const localRaw = getStoredItem('settings', initialSiteSettings);
    const local = {
      ...localRaw,
      social_links: normalizeSocialLinks(localRaw.social_links),
    };
    setCachedData('settings', local);
    return local;
  },

  getCachedSettings(): SiteSettings | null {
    const mem = getCachedData<SiteSettings>('settings');
    if (mem) return mem;
    return getStoredItem<SiteSettings | null>('settings', null);
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = await this.getSettings();
    const updatedSocialLinks = settings.social_links !== undefined
      ? normalizeSocialLinks(settings.social_links)
      : current.social_links;

    const updated = {
      ...current,
      ...settings,
      social_links: updatedSocialLinks,
      updated_at: new Date().toISOString(),
    };
    await mutateTable('site_settings', 'upsert', updated);
    invalidateCache('settings');
    setStoredItem('settings', updated);
    setCachedData('settings', updated);

    // Notify all active components and tabs immediately in real-time
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('aps_site_settings_changed', { detail: updated })
        );
      } catch (evErr) {
        console.warn('Failed to dispatch settings event:', evErr);
      }
    }

    return updated;
  },

  // Dynamic Banner Announcements
  async getBannerAnnouncements(): Promise<BannerAnnouncement[]> {
    const settings = await this.getSettings();
    const list = settings?.seo?.hero_announcements || [];
    return [...list].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  },

  async saveBannerAnnouncement(item: BannerAnnouncement): Promise<BannerAnnouncement[]> {
    const settings = await this.getSettings();
    const currentList = settings?.seo?.hero_announcements || [];
    const idx = currentList.findIndex((a) => a.id === item.id);
    let updatedList: BannerAnnouncement[];
    if (idx >= 0) {
      updatedList = currentList.map((a) => (a.id === item.id ? item : a));
    } else {
      updatedList = [...currentList, item];
    }
    updatedList.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    const updatedSettings: SiteSettings = {
      ...settings,
      seo: {
        ...settings.seo,
        hero_announcements: updatedList,
      },
    };
    await this.updateSettings(updatedSettings);
    return updatedList;
  },

  async saveBannerAnnouncements(items: BannerAnnouncement[]): Promise<BannerAnnouncement[]> {
    const settings = await this.getSettings();
    const sorted = [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    const updatedSettings: SiteSettings = {
      ...settings,
      seo: {
        ...settings.seo,
        hero_announcements: sorted,
      },
    };
    await this.updateSettings(updatedSettings);
    return sorted;
  },

  async deleteBannerAnnouncement(id: string): Promise<BannerAnnouncement[]> {
    const settings = await this.getSettings();
    const currentList = settings?.seo?.hero_announcements || [];
    const filtered = currentList.filter((a) => a.id !== id);
    const updatedSettings: SiteSettings = {
      ...settings,
      seo: {
        ...settings.seo,
        hero_announcements: filtered,
      },
    };
    await this.updateSettings(updatedSettings);
    return filtered;
  },

// Statistics
  async getStatistics(): Promise<KeyStatistic[]> {
    const cached = getCachedData<KeyStatistic[]>('statistics');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('statistics').select('*').order('order_index', { ascending: true });
        if (!error && data) {
          const res = data.map((item: any) => unpackStatistic(item));
          setCachedData('statistics', res);
          setStoredItem('statistics', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase stats fetch fallback:', e);
      }
    }
    const local = getStoredItem('statistics', initialStatistics).map(unpackStatistic);
    setCachedData('statistics', local);
    return local;
  },

  async saveStatistic(stat: KeyStatistic): Promise<KeyStatistic> {
    const prepared = packStatistic(stat);
    await mutateTable('statistics', 'upsert', prepared);
    invalidateCache('statistics');
    const all = await this.getStatistics();
    const existingIndex = all.findIndex((s) => s.id === stat.id);
    let updatedList: KeyStatistic[];
    if (existingIndex >= 0) {
      updatedList = all.map((s) => (s.id === stat.id ? stat : s));
    } else {
      updatedList = [...all, stat];
    }
    updatedList.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    setStoredItem('statistics', updatedList);
    setCachedData('statistics', updatedList);
    return stat;
  },

  async saveStatistics(stats: KeyStatistic[]): Promise<KeyStatistic[]> {
    const prepared = stats.map(packStatistic);
    await mutateTable('statistics', 'upsert', prepared);
    invalidateCache('statistics');
    const sorted = [...stats].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    setStoredItem('statistics', sorted);
    setCachedData('statistics', sorted);
    return sorted;
  },

  async deleteStatistic(id: string): Promise<void> {
    const all = await this.getStatistics();
    const target = all.find((s) => s.id === id);
    if (target) {
      await this.moveToTrash('statistiques', target);
    } else {
      await mutateTable('statistics', 'delete', id);
    }
    invalidateCache('statistics');
    const filtered = all.filter((s) => s.id !== id);
    setStoredItem('statistics', filtered);
    setCachedData('statistics', filtered);
  },

  // Domains
  async getDomains(): Promise<DomainOfIntervention[]> {
    const cached = getCachedData<DomainOfIntervention[]>('domains');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('domains').select('*').order('order_index', { ascending: true });
        if (!error && data) {
          const res = data as DomainOfIntervention[];
          setCachedData('domains', res);
          setStoredItem('domains', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase domains fallback:', e);
      }
    }
    const local = getStoredItem('domains', initialDomains);
    setCachedData('domains', local);
    return local;
  },

  async saveDomain(domain: DomainOfIntervention): Promise<DomainOfIntervention[]> {
    await mutateTable('domains', 'upsert', domain);
    invalidateCache('domains');
    return await this.getDomains();
  },

  async deleteDomain(id: string): Promise<DomainOfIntervention[]> {
    const list = await this.getDomains();
    const target = list.find((d) => d.id === id);
    if (target) {
      await this.moveToTrash('domaines', target);
    } else {
      await mutateTable('domains', 'delete', id);
    }
    invalidateCache('domains');
    return await this.getDomains();
  },

  // Projects
  async getProjects(): Promise<ProjectItem[]> {
    const cached = getCachedData<ProjectItem[]>('projects');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          const res = data as ProjectItem[];
          setCachedData('projects', res);
          setStoredItem('projects', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase projects fallback:', e);
      }
    }
    const local = getStoredItem('projects', initialProjects);
    setCachedData('projects', local);
    return local;
  },

  async getProjectBySlug(slug: string): Promise<ProjectItem | null> {
    const projects = await this.getProjects();
    return projects.find(p => p.slug === slug) || null;
  },

  async saveProject(project: ProjectItem): Promise<ProjectItem[]> {
    await mutateTable('projects', 'upsert', project);
    invalidateCache('projects');
    return await this.getProjects();
  },

  async deleteProject(id: string): Promise<ProjectItem[]> {
    const list = await this.getProjects();
    const target = list.find((p) => p.id === id);
    if (target) {
      await this.moveToTrash('projets', target);
    } else {
      await mutateTable('projects', 'delete', id);
    }
    invalidateCache('projects');
    return await this.getProjects();
  },

  // News
  async getNews(): Promise<NewsItem[]> {
    const cached = getCachedData<NewsItem[]>('news');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('news').select('*').order('published_at', { ascending: false });
        if (!error && data) {
          const res = data as NewsItem[];
          setCachedData('news', res);
          setStoredItem('news', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase news fallback:', e);
      }
    }
    const local = getStoredItem('news', initialNews);
    setCachedData('news', local);
    return local;
  },

  async getNewsBySlug(slug: string): Promise<NewsItem | null> {
    const all = await this.getNews();
    return all.find(n => n.slug === slug) || null;
  },

  async saveNews(news: NewsItem): Promise<NewsItem[]> {
    await mutateTable('news', 'upsert', news);
    invalidateCache('news');
    return await this.getNews();
  },

  async deleteNews(id: string): Promise<NewsItem[]> {
    const list = await this.getNews();
    const target = list.find((n) => n.id === id);
    if (target) {
      await this.moveToTrash('actualites', target);
    } else {
      await mutateTable('news', 'delete', id);
    }
    invalidateCache('news');
    return await this.getNews();
  },

  // Opportunities
  async getOpportunities(): Promise<OpportunityItem[]> {
    const cached = getCachedData<OpportunityItem[]>('opportunities');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('opportunities').select('*').order('published_at', { ascending: false });
        if (!error && data) {
          const localList = getStoredItem<OpportunityItem[]>('opportunities', initialOpportunities);
          const localMap = new Map(localList.map(item => [item.id, item]));

          const res = (data as any[]).map(item => {
            let main_image = item.main_image || '';
            let gallery: string[] = Array.isArray(item.gallery) ? item.gallery : [];
            let external_link = item.external_link;

            // Extract visual metadata stored in database
            if (item.external_link && typeof item.external_link === 'string' && item.external_link.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(item.external_link);
                if (!main_image && parsed.main_image) {
                  main_image = parsed.main_image;
                }
                if ((!gallery || gallery.length === 0) && Array.isArray(parsed.gallery)) {
                  gallery = parsed.gallery;
                }
                external_link = parsed.url;
              } catch {}
            }

            // Fallback to local store if available
            const local = localMap.get(item.id);
            if (!main_image && local?.main_image) {
              main_image = local.main_image;
            }
            if ((!gallery || gallery.length === 0) && local?.gallery && local.gallery.length > 0) {
              gallery = local.gallery;
            }

            return {
              ...item,
              main_image,
              gallery,
              external_link,
            } as OpportunityItem;
          });

          setCachedData('opportunities', res);
          setStoredItem('opportunities', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase opportunities fallback:', e);
      }
    }
    const local = getStoredItem('opportunities', initialOpportunities);
    setCachedData('opportunities', local);
    return local;
  },

  async getOpportunityBySlug(slug: string): Promise<OpportunityItem | null> {
    const list = await this.getOpportunities();
    return list.find(o => o.slug === slug) || null;
  },

  async saveOpportunity(opp: OpportunityItem): Promise<OpportunityItem[]> {
    // 1. Pack visual metadata into external_link so it persists in Supabase table
    const main_image = opp.main_image || '';
    const gallery = Array.isArray(opp.gallery) ? opp.gallery : [];
    const existingUrl = opp.external_link && !opp.external_link.startsWith('{') ? opp.external_link : undefined;

    const packedOpp = {
      ...opp,
      external_link: (main_image || gallery.length > 0)
        ? JSON.stringify({
            url: existingUrl,
            main_image,
            gallery,
          })
        : existingUrl || null,
    };

    // 2. Optimistically update local store and in-memory cache
    const localList = getStoredItem<OpportunityItem[]>('opportunities', initialOpportunities);
    const updatedLocal = localList.some(o => o.id === opp.id)
      ? localList.map(o => o.id === opp.id ? { ...opp } : o)
      : [opp, ...localList];
    setStoredItem('opportunities', updatedLocal);
    setCachedData('opportunities', updatedLocal);

    // 3. Mutate database
    await mutateTable('opportunities', 'upsert', packedOpp);
    invalidateCache('opportunities');
    return await this.getOpportunities();
  },

  async deleteOpportunity(id: string): Promise<OpportunityItem[]> {
    const list = await this.getOpportunities();
    const target = list.find((o) => o.id === id);
    if (target) {
      await this.moveToTrash('opportunites', target);
    } else {
      await mutateTable('opportunities', 'delete', id);
    }
    invalidateCache('opportunities');
    return await this.getOpportunities();
  },

  // Partners
  async getPartners(): Promise<PartnerItem[]> {
    const cached = getCachedData<PartnerItem[]>('partners');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('partners').select('*').order('order_index', { ascending: true });
        if (!error && data) {
          const res = data as PartnerItem[];
          setCachedData('partners', res);
          setStoredItem('partners', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase partners fallback:', e);
      }
    }
    const local = getStoredItem('partners', initialPartners);
    setCachedData('partners', local);
    return local;
  },

  async savePartner(partner: PartnerItem): Promise<PartnerItem[]> {
    await mutateTable('partners', 'upsert', partner);
    invalidateCache('partners');
    return await this.getPartners();
  },

  async deletePartner(id: string): Promise<PartnerItem[]> {
    const list = await this.getPartners();
    const target = list.find((p) => p.id === id);
    if (target) {
      await this.moveToTrash('partenaires', target);
    } else {
      await mutateTable('partners', 'delete', id);
    }
    invalidateCache('partners');
    return await this.getPartners();
  },

  // Team
  async getTeam(): Promise<TeamMember[]> {
    const cached = getCachedData<TeamMember[]>('team');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('team_members').select('*').order('order_index', { ascending: true });
        if (!error && data) {
          const res = data as TeamMember[];
          setCachedData('team', res);
          setStoredItem('team', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase team fallback:', e);
      }
    }
    const local = getStoredItem('team', initialTeam);
    setCachedData('team', local);
    return local;
  },

  async saveTeamMember(member: TeamMember): Promise<TeamMember[]> {
    await mutateTable('team_members', 'upsert', member);
    invalidateCache('team');
    return await this.getTeam();
  },

  async deleteTeamMember(id: string): Promise<TeamMember[]> {
    const list = await this.getTeam();
    const target = list.find((t) => t.id === id);
    if (target) {
      await this.moveToTrash('equipe', target);
    } else {
      await mutateTable('team_members', 'delete', id);
    }
    invalidateCache('team');
    return await this.getTeam();
  },

  // Governance
  async getGovernance(): Promise<GovernanceMember[]> {
    const cached = getCachedData<GovernanceMember[]>('governance');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('governance').select('*').order('order_index', { ascending: true });
        if (!error && data) {
          const res = data as GovernanceMember[];
          setCachedData('governance', res);
          setStoredItem('governance', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase governance fallback:', e);
      }
    }
    const local = getStoredItem('governance', initialGovernance);
    setCachedData('governance', local);
    return local;
  },

  async saveGovernanceMember(member: GovernanceMember): Promise<GovernanceMember[]> {
    await mutateTable('governance', 'upsert', member);
    invalidateCache('governance');
    return await this.getGovernance();
  },

  async deleteGovernanceMember(id: string): Promise<GovernanceMember[]> {
    const list = await this.getGovernance();
    const target = list.find((g) => g.id === id);
    if (target) {
      await this.moveToTrash('gouvernance', target);
    } else {
      await mutateTable('governance', 'delete', id);
    }
    invalidateCache('governance');
    return await this.getGovernance();
  },

  // Documents
  async getDocuments(): Promise<InstitutionalDoc[]> {
    const cached = getCachedData<InstitutionalDoc[]>('documents');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('documents').select('*').order('publication_year', { ascending: false });
        if (!error && data) {
          const res = data as InstitutionalDoc[];
          setCachedData('documents', res);
          setStoredItem('documents', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase docs fallback:', e);
      }
    }
    const local = getStoredItem('documents', initialDocuments);
    setCachedData('documents', local);
    return local;
  },

  async saveDocument(doc: InstitutionalDoc): Promise<InstitutionalDoc[]> {
    await mutateTable('documents', 'upsert', doc);
    invalidateCache('documents');
    return await this.getDocuments();
  },

  async deleteDocument(id: string): Promise<InstitutionalDoc[]> {
    const list = await this.getDocuments();
    const target = list.find((d) => d.id === id);
    if (target) {
      await this.moveToTrash('documents', target);
    } else {
      await mutateTable('documents', 'delete', id);
    }
    invalidateCache('documents');
    return await this.getDocuments();
  },

  // Albums & Media
  async getAlbums(): Promise<PhotoAlbum[]> {
    const cached = getCachedData<PhotoAlbum[]>('albums');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('albums').select('*').order('date', { ascending: false });
        if (!error && data) {
          const res = data as PhotoAlbum[];
          setCachedData('albums', res);
          setStoredItem('albums', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase albums fallback:', e);
      }
    }
    const local = getStoredItem('albums', initialAlbums);
    setCachedData('albums', local);
    return local;
  },

  async saveAlbum(album: PhotoAlbum): Promise<PhotoAlbum[]> {
    await mutateTable('albums', 'upsert', album);
    invalidateCache('albums');
    return await this.getAlbums();
  },

  async deleteAlbum(id: string): Promise<PhotoAlbum[]> {
    const list = await this.getAlbums();
    const target = list.find((a) => a.id === id);
    if (target) {
      await this.moveToTrash('mediatheque', target);
    } else {
      await mutateTable('albums', 'delete', id);
    }
    invalidateCache('albums');
    return await this.getAlbums();
  },

  async getMedia(): Promise<MediaItem[]> {
    const cached = getCachedData<MediaItem[]>('media');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('media').select('*').order('date', { ascending: false });
        if (!error && data) {
          const res = (data as any[]).map(unpackMedia);
          setCachedData('media', res);
          setStoredItem('media', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase media fallback:', e);
      }
    }
    const local = getStoredItem<any[]>('media', initialMedia).map(unpackMedia);
    setCachedData('media', local);
    return local;
  },

  async getHeroPhotos(): Promise<MediaItem[]> {
    const allMedia = await this.getMedia();
    const heroPhotos = allMedia
      .filter((m) => m.type === 'photo' && m.is_active !== false && m.show_in_hero)
      .sort((a, b) => (Number(a.hero_order) || 99) - (Number(b.hero_order) || 99));

    if (heroPhotos.length > 0) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aps_hero_slides_v1', JSON.stringify(heroPhotos));
        } catch {}
      }
      return heroPhotos;
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('aps_hero_slides_v1');
      } catch {}
    }
    return [];
  },

  async getPublishedVideos(): Promise<MediaItem[]> {
    return await this.getPublicGalleryVideos();
  },

  async getPublicGalleryPhotos(albumId?: string): Promise<MediaItem[]> {
    const allMedia = await this.getMedia();
    return allMedia
      .filter((m) => {
        if (m.type !== 'photo') return false;
        if (!isMediaAllowedInPublicGallery(m)) return false;
        if (albumId && albumId !== 'all' && m.album_id !== albumId) return false;
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  async getPublicGalleryVideos(albumId?: string): Promise<MediaItem[]> {
    const allMedia = await this.getMedia();
    return allMedia
      .filter((m) => {
        if (m.type !== 'video') return false;
        if (!isMediaAllowedInPublicGallery(m)) return false;
        if (albumId && albumId !== 'all' && m.album_id !== albumId) return false;
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  async saveMedia(item: MediaItem): Promise<MediaItem[]> {
    const packed = packMedia(item);
    await mutateTable('media', 'upsert', packed);
    invalidateCache('media');

    // Immediately synchronize local storage and session cache
    if (typeof window !== 'undefined') {
      try {
        const existingList = getStoredItem<any[]>('media', initialMedia).map(unpackMedia);
        const idx = existingList.findIndex((m) => m.id === item.id);
        const updatedItem = unpackMedia(packed);
        let newList: MediaItem[];
        if (idx >= 0) {
          newList = [...existingList];
          newList[idx] = updatedItem;
        } else {
          newList = [updatedItem, ...existingList];
        }
        setStoredItem('media', newList);
        setCachedData('media', newList);

        const heroList = newList
          .filter((m) => m.type === 'photo' && m.is_active !== false && m.show_in_hero)
          .sort((a, b) => (Number(a.hero_order) || 99) - (Number(b.hero_order) || 99));
        if (heroList.length > 0) {
          localStorage.setItem('aps_hero_slides_v1', JSON.stringify(heroList));
        } else {
          localStorage.removeItem('aps_hero_slides_v1');
        }

        window.dispatchEvent(new Event('aps_media_changed'));
        localStorage.setItem('aps_media_last_updated', Date.now().toString());
      } catch {}
    }
    return await this.getMedia();
  },

  async deleteMedia(id: string): Promise<MediaItem[]> {
    const allMedia = await this.getMedia();
    const target = allMedia.find(m => m.id === id);
    if (target) {
      // NOTE: File in storage is PRESERVED so that media can be restored from trash!
      await this.moveToTrash('mediatheque', target);
    } else {
      await mutateTable('media', 'delete', id);
    }
    invalidateCache('media');

    if (typeof window !== 'undefined') {
      try {
        const remaining = allMedia.filter(m => m.id !== id);
        const heroList = remaining
          .filter((m) => m.type === 'photo' && m.is_active !== false && m.show_in_hero)
          .sort((a, b) => (Number(a.hero_order) || 99) - (Number(b.hero_order) || 99));
        if (heroList.length > 0) {
          localStorage.setItem('aps_hero_slides_v1', JSON.stringify(heroList));
        } else {
          localStorage.removeItem('aps_hero_slides_v1');
        }
        window.dispatchEvent(new Event('aps_media_changed'));
        localStorage.setItem('aps_media_last_updated', Date.now().toString());
      } catch {}
    }
    return await this.getMedia();
  },

  // History
  async getHistory(): Promise<HistoryMilestone[]> {
    const cached = getCachedData<HistoryMilestone[]>('history');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('history_milestones').select('*').order('order_index', { ascending: true });
        if (!error && data) {
          const res = data as HistoryMilestone[];
          setCachedData('history', res);
          setStoredItem('history', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase history fallback:', e);
      }
    }
    const local = getStoredItem('history', initialHistory);
    setCachedData('history', local);
    return local;
  },

  async saveHistory(milestones: HistoryMilestone[]): Promise<HistoryMilestone[]> {
    await mutateTable('history_milestones', 'upsert', milestones);
    invalidateCache('history');
    return await this.getHistory();
  },

  async deleteHistoryMilestone(id: string): Promise<HistoryMilestone[]> {
    await mutateTable('history_milestones', 'delete', id);
    invalidateCache('history');
    return await this.getHistory();
  },

  // Institutional Pages (Présentation, Histoire, Mission-Vision-Valeurs, Domaines)
  async getInstitutionalPages(forceRefresh = false): Promise<InstitutionalPage[]> {
    if (!forceRefresh) {
      const cached = getCachedData<InstitutionalPage[]>('institutional_pages');
      if (cached) return cached;
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('institutional_pages')
          .select('*');
        if (!error && data && data.length > 0) {
          const fetchedMap = new Map<string, InstitutionalPage>();
          data.forEach((p: any) => {
            const unpacked = unpackInstitutionalPage(p);
            fetchedMap.set(unpacked.slug, unpacked);
          });

          // Ensure all standard initial pages exist in the array with defaults merged
          const merged: InstitutionalPage[] = initialInstitutionalPages.map((init) => {
            const dbPage = fetchedMap.get(init.slug);
            if (!dbPage) return unpackInstitutionalPage(init);
            return {
              ...unpackInstitutionalPage(init),
              ...dbPage,
              // Strictly respect db images/blocks if defined on database row
              images: Array.isArray(dbPage.images) ? dbPage.images : unpackInstitutionalPage(init).images,
              blocks: Array.isArray(dbPage.blocks) ? dbPage.blocks : unpackInstitutionalPage(init).blocks,
            };
          });

          // Add any additional slugs that might be in database
          data.forEach((p: any) => {
            if (!merged.some((m) => m.slug === p.slug)) {
              merged.push(unpackInstitutionalPage(p));
            }
          });

          setCachedData('institutional_pages', merged);
          setStoredItem('institutional_pages', merged);
          return merged;
        }
      } catch (e) {
        console.warn('Supabase institutional_pages fallback:', e);
      }
    }

    const localRaw = getStoredItem<any[]>('institutional_pages', initialInstitutionalPages);
    const local = localRaw.map(unpackInstitutionalPage);
    setCachedData('institutional_pages', local);
    return local;
  },

  async getInstitutionalPageBySlug(slug: InstitutionalPageSlug | string, forceRefresh = false): Promise<InstitutionalPage | null> {
    if (forceRefresh && supabase) {
      try {
        const { data, error } = await supabase
          .from('institutional_pages')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        if (!error && data) {
          const unpacked = unpackInstitutionalPage(data);
          const currentList = getCachedData<InstitutionalPage[]>('institutional_pages') || [];
          const updated = currentList.filter((p) => p.slug !== slug).concat([unpacked]);
          setCachedData('institutional_pages', updated);
          setStoredItem('institutional_pages', updated);
          return unpacked;
        }
      } catch (e) {
        console.warn(`Direct fetch for slug ${slug} fallback:`, e);
      }
    }

    const pages = await this.getInstitutionalPages(forceRefresh);
    const found = pages.find((p) => p.slug === slug);
    if (found) return found;

    // Fallback to initial pages if not found
    const initial = initialInstitutionalPages.find((p) => p.slug === slug);
    return initial ? unpackInstitutionalPage(initial) : null;
  },

  async saveInstitutionalPage(page: InstitutionalPage): Promise<InstitutionalPage> {
    const unpacked = unpackInstitutionalPage(page);
    const payload = {
      ...unpacked,
      updated_at: new Date().toISOString(),
    };

    await mutateTable('institutional_pages', 'upsert', payload);
    invalidateCache('institutional_pages');

    // Immediately synchronize local storage and session cache so any view updates without delay
    if (typeof window !== 'undefined') {
      try {
        const currentList = getStoredItem<any[]>('institutional_pages', initialInstitutionalPages).map(unpackInstitutionalPage);
        const idx = currentList.findIndex((p) => p.slug === payload.slug);
        let updatedList: InstitutionalPage[];
        if (idx >= 0) {
          updatedList = [...currentList];
          updatedList[idx] = payload;
        } else {
          updatedList = [...currentList, payload];
        }
        setStoredItem('institutional_pages', updatedList);
        setCachedData('institutional_pages', updatedList);

        window.dispatchEvent(new CustomEvent('aps_page_changed', { detail: payload }));
        localStorage.setItem('aps_page_last_updated', Date.now().toString());
      } catch {}
    }

    return payload;
  },

  // Contact Messages
  async getMessages(): Promise<ContactMessage[]> {
    const cached = getCachedData<ContactMessage[]>('messages');
    if (cached) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          const res = data as ContactMessage[];
          setCachedData('messages', res);
          setStoredItem('messages', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase messages fallback:', e);
      }
    }
    const local = getStoredItem<ContactMessage[]>('messages', [
      {
        id: 'msg-1',
        name: 'Dossou',
        firstname: 'Patrice',
        email: 'p.dossou@example.org',
        phone: '+229 97 00 11 22',
        subject: 'Demande de partenariat technique sur Grand-Popo',
        message: 'Bonjour l’équipe APS-BÉNIN, nous souhaiterions échanger avec vous concernant un projet d’alphabétisation fonctionnelle des femmes mareyeuses.',
        consent: true,
        status: 'unread' as const,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'msg-2',
        name: 'Gbaguidi',
        firstname: 'Amina',
        email: 'amina.g@example.bj',
        phone: '+229 95 33 44 55',
        subject: 'Demande d’orientation pour une jeune fille',
        message: 'Nous avons identifié une jeune fille déscolarisée à Comè qui souhaiterait rejoindre votre programme d’apprentissage professionnel.',
        consent: true,
        status: 'read' as const,
        created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
      }
    ]);
    setCachedData('messages', local);
    return local;
  },

  async getUnreadMessagesCount(): Promise<number> {
    const cached = getCachedData<ContactMessage[]>('messages');
    if (cached) {
      return cached.filter(m => m.status === 'unread').length;
    }
    if (supabase) {
      try {
        const { count, error } = await supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'unread');
        if (!error && count !== null) return count;
      } catch (e) {
        console.warn('Supabase unread messages count error:', e);
      }
    }
    const list = await this.getMessages();
    return list.filter(m => m.status === 'unread').length;
  },

  async sendMessage(msg: {
    name: string;
    firstname: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    consent: boolean;
  }): Promise<ContactMessage> {
    // 1. Normalisation des données
    const trimmedName = (msg.name || '').trim();
    const trimmedFirstname = (msg.firstname || '').trim();
    const trimmedEmail = (msg.email || '').trim().toLowerCase();
    const trimmedPhone = msg.phone ? msg.phone.trim() : '';
    const trimmedSubject = (msg.subject || '').trim();
    const trimmedMessage = (msg.message || '').trim();

    // 2. Validations strictes (compatibles avec la RLS)
    if (!trimmedName || trimmedName.length > 150) {
      throw new Error('Le nom est requis et ne doit pas dépasser 150 caractères.');
    }
    if (!trimmedFirstname || trimmedFirstname.length > 150) {
      throw new Error('Le prénom est requis et ne doit pas dépasser 150 caractères.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail) || trimmedEmail.length > 255) {
      throw new Error('Une adresse email valide est requise (maximum 255 caractères).');
    }
    if (trimmedPhone && trimmedPhone.length > 50) {
      throw new Error('Le numéro de téléphone ne doit pas dépasser 50 caractères.');
    }
    if (!trimmedSubject || trimmedSubject.length > 300) {
      throw new Error("L'objet du message est requis et ne doit pas dépasser 300 caractères.");
    }
    if (trimmedMessage.length < 5 || trimmedMessage.length > 5000) {
      throw new Error('Le message doit comporter entre 5 et 5000 caractères.');
    }
    if (msg.consent !== true) {
      throw new Error('Le consentement au traitement des données est obligatoire.');
    }

    // 3. Génération d'un identifiant unique (UUID ou fallback horodaté)
    const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 4. Payload autorisé strictement conforme (AUCUN champ notes envoyé)
    const payload = {
      id,
      name: trimmedName,
      firstname: trimmedFirstname,
      email: trimmedEmail,
      phone: trimmedPhone || null,
      subject: trimmedSubject,
      message: trimmedMessage,
      consent: true,
      status: 'unread' as const,
      created_at: new Date().toISOString(),
    };

    // 5. Insertion directe via le client Supabase public (rôle anonyme) et politique RLS INSERT
    if (supabase) {
      const { error } = await supabase
        .from('contact_messages')
        .insert(payload);

      if (error) {
        console.error('Erreur Supabase insertion contact_messages :', error);
        throw new Error(error.message || "Erreur lors de l'enregistrement de votre message.");
      }
    }

    // 6. Mise à jour du cache local et invalidation pour la réactivité
    const savedRecord: ContactMessage = {
      ...payload,
      phone: payload.phone || '',
    };

    try {
      const localList = getStoredItem<ContactMessage[]>('messages', []);
      setStoredItem('messages', [savedRecord, ...localList]);
    } catch {}
    invalidateCache('messages');

    return savedRecord;
  },

  async updateMessageStatus(id: string, status: 'unread' | 'read' | 'replied', notes?: string): Promise<ContactMessage[]> {
    const list = await this.getMessages();
    const existing = list.find(m => m.id === id);
    if (!existing) throw new Error('Message introuvable');
    const updated = { ...existing, status, notes: notes ?? existing.notes };
    await mutateTable('contact_messages', 'upsert', updated);
    invalidateCache('messages');
    return await this.getMessages();
  },

  async deleteMessage(id: string): Promise<ContactMessage[]> {
    await mutateTable('contact_messages', 'delete', id);
    invalidateCache('messages');
    return await this.getMessages();
  },

  // Optimized Dashboard KPI metrics fetcher with direct count queries and role security
  async getDashboardStats(userRole?: string, forceRefresh: boolean = false): Promise<DashboardStatsData> {
    const cacheKey = `dashboard_stats_${userRole || 'all'}`;
    if (!forceRefresh) {
      const cached = getCachedData<DashboardStatsData>(cacheKey);
      if (cached) return cached;
    }

    // 1. Direct Supabase count queries using head: true to avoid fetching unnecessary rows
    if (supabase) {
      try {
        const canAccessMessages = userRole === 'admin' || userRole === 'super_admin';

        const [
          pTotalRes,
          nTotalRes,
          nPubRes,
          nDraftRes,
          oTotalRes,
          oPubRes,
          mTotalRes,
          mPhotosRes,
          mVideosRes,
          partRes,
          recentNewsRes,
        ] = await Promise.all([
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          supabase.from('news').select('*', { count: 'exact', head: true }),
          supabase.from('news').select('*', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('news').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
          supabase.from('opportunities').select('*', { count: 'exact', head: true }),
          supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'open'),
          supabase.from('media').select('*', { count: 'exact', head: true }),
          supabase.from('media').select('*', { count: 'exact', head: true }).eq('type', 'photo'),
          supabase.from('media').select('*', { count: 'exact', head: true }).eq('type', 'video'),
          supabase.from('partners').select('*', { count: 'exact', head: true }),
          supabase.from('news').select('id, slug, title_fr, published_at, category_fr, status').order('published_at', { ascending: false }).limit(4),
        ]);

        let messagesTotal: number | null = null;
        let unreadMessages: number | null = null;
        let recentMessages: any[] = [];
        let hasMessageAccess = canAccessMessages;

        if (canAccessMessages) {
          try {
            const [mTotal, mUnread, mRecent] = await Promise.all([
              supabase.from('contact_messages').select('*', { count: 'exact', head: true }),
              supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
              supabase.from('contact_messages').select('id, firstname, name, subject, message, status, created_at').order('created_at', { ascending: false }).limit(4),
            ]);

            if (!mTotal.error) {
              messagesTotal = mTotal.count ?? 0;
              unreadMessages = mUnread.count ?? 0;
              recentMessages = mRecent.data ?? [];
            } else {
              hasMessageAccess = false;
            }
          } catch {
            hasMessageAccess = false;
          }
        }

        if (pTotalRes.count !== null && pTotalRes.count !== undefined) {
          const projectsTotal = pTotalRes.count ?? 0;
          const projectsPublished = projectsTotal;
          const newsTotal = nTotalRes.count ?? 0;
          const newsPublished = nPubRes.count ?? 0;
          const newsDrafts = nDraftRes.count ?? 0;
          const oppsTotal = oTotalRes.count ?? 0;
          const oppsPublished = oPubRes.count ?? 0;
          const oppsClosed = Math.max(0, oppsTotal - oppsPublished);
          const mediaTotal = mTotalRes.count ?? 0;
          const photosCount = mPhotosRes.count ?? 0;
          const videosCount = mVideosRes.count ?? 0;
          const partnersCount = partRes.count ?? 0;
          const recentNews = recentNewsRes.data ?? [];

          const result: DashboardStatsData = {
            projectsTotal,
            projectsPublished,
            newsTotal,
            newsPublished,
            newsDrafts,
            oppsTotal,
            oppsPublished,
            oppsClosed,
            mediaTotal,
            photosCount,
            videosCount,
            partnersCount,
            canAccessMessages: hasMessageAccess,
            messagesTotal,
            unreadMessages,
            recentNews,
            recentMessages,
            lastUpdated: new Date().toISOString(),

            // Backward compatibility
            projectsCount: projectsTotal,
            newsCount: newsTotal,
            oppCount: oppsTotal,
            messagesCount: messagesTotal ?? 0,
            draftsCount: newsDrafts,
          };

          setCachedData(cacheKey, result);
          return result;
        }
      } catch (e) {
        console.warn('Direct count queries failed, falling back to cached or local store:', e);
      }
    }

    // 2. Fallback to store arrays if direct queries failed or offline
    const [projects, news, opps, media, partners, msgs] = await Promise.all([
      this.getProjects(),
      this.getNews(),
      this.getOpportunities(),
      this.getMedia(),
      this.getPartners(),
      (userRole === 'admin' || userRole === 'super_admin') ? this.getMessages() : Promise.resolve([]),
    ]);

    const canAccessMessages = userRole === 'admin' || userRole === 'super_admin';
    const projectsTotal = projects.length;
    const projectsPublished = projects.length;
    const newsTotal = news.length;
    const newsPublished = news.filter((n) => n.status === 'published').length;
    const newsDrafts = news.filter((n) => n.status === 'draft').length;
    const oppsTotal = opps.length;
    const oppsPublished = opps.filter((o) => o.status === 'open').length;
    const oppsClosed = opps.filter((o) => o.status !== 'open').length;
    const mediaTotal = media.length;
    const photosCount = media.filter((m) => m.type === 'photo').length;
    const videosCount = media.filter((m) => m.type === 'video').length;
    const partnersCount = partners.length;
    const messagesTotal = canAccessMessages ? msgs.length : null;
    const unreadMessages = canAccessMessages ? msgs.filter((m) => m.status === 'unread').length : null;

    const fallbackResult: DashboardStatsData = {
      projectsTotal,
      projectsPublished,
      newsTotal,
      newsPublished,
      newsDrafts,
      oppsTotal,
      oppsPublished,
      oppsClosed,
      mediaTotal,
      photosCount,
      videosCount,
      partnersCount,
      canAccessMessages,
      messagesTotal,
      unreadMessages,
      recentNews: news.slice(0, 4),
      recentMessages: canAccessMessages ? msgs.slice(0, 4) : [],
      lastUpdated: new Date().toISOString(),

      projectsCount: projectsTotal,
      newsCount: newsTotal,
      oppCount: oppsTotal,
      messagesCount: messagesTotal ?? 0,
      draftsCount: newsDrafts,
    };

    setCachedData(cacheKey, fallbackResult);
    return fallbackResult;
  },

  // Admin Users & Auth
  async getUsers(): Promise<UserProfile[]> {
    const cached = getCachedData<UserProfile[]>('users');
    if (cached) return cached;

    // 1. Prioritize direct client Supabase call with user session
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const res = data as UserProfile[];
          setCachedData('users', res);
          setStoredItem('users', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase direct profiles query error:', e);
      }
    }

    // 2. Server API fallback (/api/admin/users)
    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = {};
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
        }

        const res = await fetch('/api/admin/users', { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.users && json.users.length > 0) {
            setCachedData('users', json.users);
            setStoredItem('users', json.users);
            return json.users;
          }
        }
      } catch (e) {
        console.warn('API users fetch error:', e);
      }
    }

    const local = getStoredItem('users', initialAdminUsers);
    setCachedData('users', local);
    return local;
  },

  async createUser(data: {
    email: string;
    full_name: string;
    role: UserRole;
    password?: string;
    is_active?: boolean;
  }): Promise<{ success: boolean; user?: UserProfile; initialPassword?: string; recoveryLink?: string; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (typeof window !== 'undefined' && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error || 'Erreur lors de la création de l’utilisateur.',
        };
      }
      invalidateCache('users');
      return {
        success: true,
        user: json.user,
        initialPassword: json.initialPassword,
        recoveryLink: json.recoveryLink,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Impossible de joindre le serveur.',
      };
    }
  },

  async updateUser(data: {
    id: string;
    full_name?: string;
    role?: UserRole;
    is_active?: boolean;
    password?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (typeof window !== 'undefined' && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error || 'Erreur lors de la mise à jour de l’utilisateur.',
        };
      }
      invalidateCache('users');
      return {
        success: true,
        user: json.user,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Impossible de joindre le serveur.',
      };
    }
  },

  async saveUser(user: UserProfile & { password?: string }): Promise<UserProfile[]> {
    const isNew = !user.id || user.id.startsWith('usr-');
    if (isNew) {
      const res = await this.createUser({
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        password: user.password,
        is_active: user.is_active,
      });
      if (!res.success) {
        throw new Error(res.error || 'Erreur lors de la création de l’utilisateur.');
      }
    } else {
      const res = await this.updateUser({
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        password: user.password,
      });
      if (!res.success) {
        throw new Error(res.error || 'Erreur lors de la modification de l’utilisateur.');
      }
    }
    invalidateCache('users');
    return await this.getUsers();
  },

  async deleteUser(id: string): Promise<UserProfile[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (typeof window !== 'undefined' && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        console.warn('API delete user error:', json.error);
      }
    } catch (e) {
      console.warn('API delete user exception:', e);
    }
    invalidateCache('users');
    return await this.getUsers();
  },

  // Audit Logs (Historique & Journal d'activités)
  async getAuditLogs(): Promise<AuditLog[]> {
    return await getAuditLogs();
  },

  async recordAuditLog(
    log: Omit<AuditLog, 'id' | 'created_at'> & { id?: string; created_at?: string }
  ): Promise<AuditLog> {
    return await recordAuditLog(log);
  },

  // ==========================================
  // Corbeille & Restauration (Trash Management)
  // ==========================================
  async getTrashItems(): Promise<TrashItem[]> {
    if (typeof window !== 'undefined') {
      const cached = getCachedData<TrashItem[]>('trash_items');
      if (cached) return cached;
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('trash_items')
          .select('*')
          .order('deleted_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const res = data as TrashItem[];
          setCachedData('trash_items', res);
          setStoredItem('trash_items', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase getTrashItems fallback:', e);
      }
    }

    // Try API route fallback
    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = {};
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
        }
        const res = await fetch('/api/admin/trash', { headers }).catch(() => null);
        if (res && res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.trash && Array.isArray(json.trash)) {
            setCachedData('trash_items', json.trash);
            setStoredItem('trash_items', json.trash);
            return json.trash;
          }
        }
      } catch (apiErr) {
        console.warn('API fallback getTrashItems error:', apiErr);
      }
    }

    const local = getStoredItem<TrashItem[]>('trash_items', []);
    setCachedData('trash_items', local);
    return local;
  },

  async moveToTrash(module: TrashModule, itemOrId: any): Promise<TrashItem> {
    const MODULE_TABLE_CONFIG: Record<TrashModule, { table: string }> = {
      projets: { table: 'projects' },
      actualites: { table: 'news' },
      opportunites: { table: 'opportunities' },
      partenaires: { table: 'partners' },
      equipe: { table: 'team_members' },
      gouvernance: { table: 'governance' },
      documents: { table: 'documents' },
      mediatheque: { table: 'media' },
      domaines: { table: 'domains' },
      statistiques: { table: 'statistics' },
      pages_institutionnelles: { table: 'institutional_pages' },
    };

    const cfg = MODULE_TABLE_CONFIG[module] || { table: 'projects' };
    let itemData: any = null;
    let itemId: string = '';

    if (typeof itemOrId === 'object' && itemOrId !== null) {
      itemData = itemOrId;
      itemId = String(itemOrId.id);
    } else {
      itemId = String(itemOrId);
      if (module === 'projets') {
        const list = await this.getProjects();
        itemData = list.find((x) => x.id === itemId);
      } else if (module === 'actualites') {
        const list = await this.getNews();
        itemData = list.find((x) => x.id === itemId);
      } else if (module === 'opportunites') {
        const list = await this.getOpportunities();
        itemData = list.find((x) => x.id === itemId);
      } else if (module === 'partenaires') {
        const list = await this.getPartners();
        itemData = list.find((x) => x.id === itemId);
      } else if (module === 'equipe') {
        const list = await this.getTeam();
        itemData = list.find((x) => x.id === itemId);
      } else if (module === 'gouvernance') {
        const list = await this.getGovernance();
        itemData = list.find((x) => x.id === itemId);
      } else if (module === 'documents') {
        const list = await this.getDocuments();
        itemData = list.find((x) => x.id === itemId);
      } else if (module === 'mediatheque') {
        const list = await this.getMedia();
        itemData = list.find((x) => x.id === itemId);
        if (!itemData) {
          const albums = await this.getAlbums();
          itemData = albums.find((x) => x.id === itemId);
          if (itemData) cfg.table = 'albums';
        }
      } else if (module === 'domaines') {
        const list = await this.getDomains();
        itemData = list.find((x) => x.id === itemId);
      } else if (module === 'statistiques') {
        const list = await this.getStatistics();
        itemData = list.find((x) => x.id === itemId);
      }
    }

    if (!itemData) {
      itemData = { id: itemId };
    }

    const itemTitle =
      itemData.title_fr ||
      itemData.title_en ||
      itemData.name ||
      itemData.label_fr ||
      itemData.label_en ||
      itemData.key ||
      itemId;

    let prevStatus = itemData.status;
    if (prevStatus === undefined) {
      if (typeof itemData.is_active === 'boolean') {
        prevStatus = itemData.is_active ? 'active' : 'inactive';
      } else if (typeof itemData.is_public === 'boolean') {
        prevStatus = itemData.is_public ? 'public' : 'private';
      }
    }

    let userId: string | undefined = undefined;
    let userEmail: string | undefined = undefined;
    let userName: string | undefined = undefined;

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aps_admin_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          userId = parsed.id;
          userEmail = parsed.email;
          userName = parsed.full_name;
        }
      } catch {}
    }

    if (!userName && userEmail) userName = userEmail;
    if (!userName) userName = 'Utilisateur non identifié';

    const trashEntry: TrashItem = {
      id: `trash-${cfg.table}-${itemId}-${Date.now()}`,
      original_id: itemId,
      module,
      table_name: cfg.table,
      title: itemTitle,
      data: itemData,
      previous_status: prevStatus,
      deleted_at: new Date().toISOString(),
      deleted_by_id: userId,
      deleted_by_email: userEmail,
      deleted_by_name: userName,
    };

    // 1. Direct Supabase insertion or API
    let savedToTrash = false;
    if (supabase) {
      try {
        const { error } = await supabase.from('trash_items').insert([trashEntry]);
        if (!error) savedToTrash = true;
      } catch (err) {
        console.warn('Supabase direct trash insert note:', err);
      }
    }

    if (!savedToTrash && typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        await fetch('/api/admin/trash', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'move_to_trash', trashItem: trashEntry }),
        });
        savedToTrash = true;
      } catch (apiErr) {
        console.warn('API route move_to_trash note:', apiErr);
      }
    }

    // 2. Persist in local storage
    if (typeof window !== 'undefined') {
      try {
        const currentTrash = getStoredItem<TrashItem[]>('trash_items', []);
        const updatedTrash = [trashEntry, ...currentTrash.filter((t) => t.id !== trashEntry.id)];
        setStoredItem('trash_items', updatedTrash);
        setCachedData('trash_items', updatedTrash);
      } catch {}
    }

    // 3. Remove from original table in database & cache
    await mutateTable(cfg.table, 'delete', itemId);

    // 4. Log audit event
    await recordAuditLog({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      action_type: 'corbeille',
      module,
      target_id: itemId,
      target_title: itemTitle,
      summary: `Mise en corbeille de « ${itemTitle} » (${module})`,
      metadata: { source: 'Back-Office CMS', table: cfg.table },
    });

    // 5. Invalidate caches and broadcast event
    invalidateCache('trash_items');
    invalidateCache(cfg.table);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aps_trash_changed', { detail: { action: 'move_to_trash', item: trashEntry } }));
    }

    return trashEntry;
  },

  async restoreTrashItem(trashId: string): Promise<any> {
    const trashList = await this.getTrashItems();
    const item = trashList.find((t) => t.id === trashId);
    if (!item) {
      throw new Error("Élément introuvable dans la corbeille");
    }

    const restorePayload = { ...(item.data || {}) };
    restorePayload.id = item.original_id;

    if (item.previous_status) {
      if (['projects', 'news', 'opportunities'].includes(item.table_name)) {
        restorePayload.status = item.previous_status;
      } else if (['team_members', 'partners', 'domains'].includes(item.table_name)) {
        restorePayload.is_active = item.previous_status === 'active';
      } else if (item.table_name === 'documents') {
        restorePayload.is_public = item.previous_status === 'public';
      }
    } else {
      if (item.table_name === 'news') {
        restorePayload.status = 'draft';
      } else if (item.table_name === 'projects') {
        restorePayload.status = 'in_progress';
      } else if (item.table_name === 'opportunities') {
        restorePayload.status = 'closed';
      }
    }

    // 1. Put back into original table
    await mutateTable(item.table_name, 'upsert', restorePayload);

    // 2. Remove from trash_items in Supabase / API
    if (supabase) {
      try {
        await supabase.from('trash_items').delete().eq('id', trashId);
      } catch (e) {
        console.warn('Supabase delete trash item note:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        await fetch('/api/admin/trash', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'restore', id: trashId, trashItem: item }),
        }).catch(() => null);
      } catch {}

      const currentTrash = getStoredItem<TrashItem[]>('trash_items', []);
      const filtered = currentTrash.filter((t) => t.id !== trashId);
      setStoredItem('trash_items', filtered);
      setCachedData('trash_items', filtered);
    }

    // 3. User identity for log
    let userName = 'Utilisateur non identifié';
    let userEmail: string | undefined = undefined;
    let userId: string | undefined = undefined;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aps_admin_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          userId = parsed.id;
          userEmail = parsed.email;
          userName = parsed.full_name || parsed.email || userName;
        }
      } catch {}
    }

    // 4. Record audit log
    await recordAuditLog({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      action_type: 'restauration',
      module: item.module,
      target_id: item.original_id,
      target_title: item.title,
      summary: `Restauration de « ${item.title} » depuis la corbeille vers le module ${item.module}`,
      metadata: { source: 'Back-Office CMS', table: item.table_name },
    });

    // 5. Invalidate caches and broadcast event
    invalidateCache('trash_items');
    invalidateCache(item.table_name);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aps_trash_changed', { detail: { action: 'restore', item } }));
    }

    return restorePayload;
  },

  async deletePermanentlyTrashItem(trashId: string): Promise<void> {
    const trashList = await this.getTrashItems();
    const item = trashList.find((t) => t.id === trashId);

    // 1. Storage media safe check: if media item, only clean if not referenced anywhere
    if (item && item.module === 'mediatheque' && item.table_name === 'media' && item.data?.url) {
      try {
        const mediaUrl = item.data.url;
        const projects = await this.getProjects();
        const news = await this.getNews();
        const isReferencedInProjects = projects.some(p => p.main_image === mediaUrl || p.photos?.includes(mediaUrl));
        const isReferencedInNews = news.some(n => n.main_image === mediaUrl || n.gallery?.includes(mediaUrl));

        if (!isReferencedInProjects && !isReferencedInNews) {
          await deleteFileFromStorage(mediaUrl, item.data.type === 'video' ? 'videos' : 'images');
        }
      } catch (mediaErr) {
        console.warn('Storage safe check error:', mediaErr);
      }
    }

    // 2. Remove from trash_items in Supabase
    if (supabase) {
      try {
        await supabase.from('trash_items').delete().eq('id', trashId);
      } catch (e) {
        console.warn('Supabase delete trash item note:', e);
      }
    }

    // 3. API route delete
    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        await fetch('/api/admin/trash', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'delete_permanent', id: trashId }),
        }).catch(() => null);
      } catch {}

      const currentTrash = getStoredItem<TrashItem[]>('trash_items', []);
      const filtered = currentTrash.filter((t) => t.id !== trashId);
      setStoredItem('trash_items', filtered);
      setCachedData('trash_items', filtered);
    }

    // 4. Log audit
    let userName = 'Utilisateur non identifié';
    let userEmail: string | undefined = undefined;
    let userId: string | undefined = undefined;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aps_admin_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          userId = parsed.id;
          userEmail = parsed.email;
          userName = parsed.full_name || parsed.email || userName;
        }
      } catch {}
    }

    await recordAuditLog({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      action_type: 'suppression_definitive',
      module: item?.module || 'corbeille',
      target_id: item?.original_id || trashId,
      target_title: item?.title || 'Élément corbeille',
      summary: `Suppression définitive de « ${item?.title || 'Élément'} » de la corbeille`,
      metadata: { source: 'Back-Office CMS' },
    });

    invalidateCache('trash_items');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aps_trash_changed', { detail: { action: 'delete_permanent', id: trashId } }));
    }
  },

  async emptyTrash(): Promise<void> {
    const trashList = await this.getTrashItems();
    const count = trashList.length;

    if (supabase) {
      try {
        await supabase.from('trash_items').delete().neq('id', 'keep_all_guard');
      } catch (e) {
        console.warn('Supabase empty trash note:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        await fetch('/api/admin/trash', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'empty' }),
        }).catch(() => null);
      } catch {}

      setStoredItem('trash_items', []);
      setCachedData('trash_items', []);
    }

    let userName = 'Utilisateur non identifié';
    let userEmail: string | undefined = undefined;
    let userId: string | undefined = undefined;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aps_admin_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          userId = parsed.id;
          userEmail = parsed.email;
          userName = parsed.full_name || parsed.email || userName;
        }
      } catch {}
    }

    await recordAuditLog({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      action_type: 'suppression_definitive',
      module: 'corbeille',
      summary: `Vidage complet de la corbeille (${count} éléments purgés définitivement)`,
      metadata: { source: 'Back-Office CMS' },
    });

    invalidateCache('trash_items');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aps_trash_changed', { detail: { action: 'empty' } }));
    }
  },

  // Storage file operations
  async uploadFile(
    file: File,
    bucket: 'images' | 'videos' | 'documents' | 'logos' = 'images',
    folder: string = 'uploads',
    onProgress?: UploadProgressCallback
  ) {
    return await uploadFileToStorage(file, bucket, folder, onProgress);
  },

  async deleteFile(
    urlOrPath: string,
    bucket: 'images' | 'videos' | 'documents' | 'logos' = 'images'
  ) {
    return await deleteFileFromStorage(urlOrPath, bucket);
  },

  // Connection diagnostics
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Variables Supabase non configurées (NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY). Le site utilise actuellement la persistance locale haute fidélité.',
      };
    }
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from('site_settings').select('org_name').limit(1);
      if (error) {
        return {
          success: false,
          message: `Connexion établie mais erreur sur la requête : ${error.message}. Avez-vous exécuté le script SQL fourni dans l'éditeur Supabase ?`,
          details: error,
        };
      }
      return {
        success: true,
        message: 'Connexion à Supabase PostgreSQL réussie ! Toutes les opérations sont synchronisées en direct.',
        details: data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Erreur de connexion : ${err.message || String(err)}`,
        details: err,
      };
    }
  }
};

export type StorageBucket = 'images' | 'videos' | 'documents' | 'logos';

export type UploadProgressCallback = (data: UploadProgressData) => void;

/**
 * Téléverse un fichier via l'API serveur sécurisée (/api/admin/upload)
 * en utilisant XMLHttpRequest côté navigateur pour mesurer la progression réelle du transfert réseau (octets et pourcentage).
 */
export async function uploadFileToStorage(
  file: File,
  bucket: StorageBucket = 'images',
  folder: string = 'uploads',
  onProgress?: UploadProgressCallback,
  profile: 'hero' | 'content' | 'portrait' | 'thumbnail' | 'auto' = 'auto'
): Promise<{
  success: boolean;
  publicUrl: string;
  path: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  optimized?: boolean;
  optimization?: any;
  error?: string;
}> {
  const cleanName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
  const filePath = `${folder}/${Date.now()}_${cleanName}`;

  onProgress?.({
    phase: 'preparing',
    percent: 0,
    fileName: file.name,
    totalBytes: file.size,
    loadedBytes: 0,
    message: 'Préparation et analyse de l\'image...',
  });

  // 1. Environnement navigateur avec XMLHttpRequest pour mesure de progression réelle
  if (typeof window !== 'undefined' && typeof XMLHttpRequest !== 'undefined') {
    return new Promise(async (resolve) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('folder', folder);
        formData.append('profile', profile);

        let token = '';
        if (supabase) {
          try {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.access_token) {
              token = data.session.access_token;
            }
          } catch {}
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/upload');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        if (xhr.upload) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
              const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
              onProgress?.({
                phase: 'uploading',
                percent,
                loadedBytes: event.loaded,
                totalBytes: event.total,
                fileName: file.name,
                message: `Téléversement (${percent}%)...`,
              });
            } else {
              onProgress?.({
                phase: 'uploading',
                percent: 50,
                fileName: file.name,
                message: 'Téléversement en cours...',
              });
            }
          };

          xhr.upload.onload = () => {
            // Le flux d'octets a été intégralement envoyé au serveur
            onProgress?.({
              phase: 'processing',
              percent: 100,
              fileName: file.name,
              totalBytes: file.size,
              loadedBytes: file.size,
              message: 'Enregistrement sur Supabase Storage...',
            });
          };
        }

        xhr.onload = () => {
          const contentType = xhr.getResponseHeader('content-type') || '';
          let resData: any = null;

          if (contentType.includes('application/json')) {
            try {
              resData = JSON.parse(xhr.responseText);
            } catch (jsonErr: any) {
              const errMsg = `Réponse serveur non-JSON (HTTP ${xhr.status})`;
              onProgress?.({ phase: 'error', percent: 0, fileName: file.name, error: errMsg });
              return resolve({ success: false, publicUrl: '', path: '', error: errMsg });
            }
          } else {
            const isEntityTooLarge =
              xhr.status === 413 ||
              xhr.responseText.toLowerCase().includes('request entity') ||
              xhr.responseText.toLowerCase().includes('too large');

            const message = isEntityTooLarge
              ? 'Le fichier sélectionné dépasse la taille maximale autorisée par le serveur (limite 4.5 Mo).'
              : `Réponse serveur invalide (HTTP ${xhr.status} ${xhr.statusText})`;

            onProgress?.({ phase: 'error', percent: 0, fileName: file.name, error: message });
            return resolve({ success: false, publicUrl: '', path: '', error: message });
          }

          if (xhr.status >= 200 && xhr.status < 300 && resData?.success) {
            const publicUrl = resData.publicUrl || resData.url || '';
            const path = resData.path || filePath;
            const savingsMsg = resData.optimization?.savingsPercent
              ? ` (${resData.optimization.savingsPercent}% de réduction)`
              : '';
            onProgress?.({
              phase: 'success',
              percent: 100,
              fileName: file.name,
              totalBytes: file.size,
              loadedBytes: file.size,
              message: `Téléversement et optimisation automatique réussis !${savingsMsg}`,
            });
            return resolve({
              success: true,
              publicUrl,
              path,
              thumbnailUrl: resData.thumbnailUrl || publicUrl,
              originalUrl: resData.originalUrl || publicUrl,
              optimized: resData.optimized,
              optimization: resData.optimization,
            });
          }

          const errMsg = resData?.error || `Erreur serveur (HTTP ${xhr.status}) lors du téléversement.`;
          onProgress?.({ phase: 'error', percent: 0, fileName: file.name, error: errMsg });
          return resolve({ success: false, publicUrl: '', path: '', error: errMsg });
        };

        xhr.onerror = () => {
          const errMsg = 'Erreur réseau lors du téléversement vers le serveur.';
          onProgress?.({ phase: 'error', percent: 0, fileName: file.name, error: errMsg });
          resolve({ success: false, publicUrl: '', path: '', error: errMsg });
        };

        xhr.ontimeout = () => {
          const errMsg = 'Délai d’attente dépassé (timeout) lors du téléversement.';
          onProgress?.({ phase: 'error', percent: 0, fileName: file.name, error: errMsg });
          resolve({ success: false, publicUrl: '', path: '', error: errMsg });
        };

        xhr.send(formData);
      } catch (err: any) {
        const errMsg = err?.message || 'Erreur inattendue lors de l’envoi.';
        onProgress?.({ phase: 'error', percent: 0, fileName: file.name, error: errMsg });
        resolve({ success: false, publicUrl: '', path: '', error: errMsg });
      }
    });
  }

  // 2. Fallback pour environnement sans XHR (ex: tests côté serveur)
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('folder', folder);

    onProgress?.({
      phase: 'uploading',
      percent: 50,
      fileName: file.name,
      message: 'Téléversement en cours...',
    });

    const headers: Record<string, string> = {};
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch {}
    }

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    const resData = await res.json().catch(() => null);

    if (res.ok && resData?.success) {
      onProgress?.({
        phase: 'success',
        percent: 100,
        fileName: file.name,
        message: 'Téléversement et optimisation automatique réussis !',
      });
      return {
        success: true,
        publicUrl: resData.publicUrl || resData.url,
        path: resData.path || filePath,
        thumbnailUrl: resData.thumbnailUrl || resData.publicUrl || resData.url,
        originalUrl: resData.originalUrl,
        optimized: resData.optimized,
        optimization: resData.optimization,
      };
    }

    const errMsg = resData?.error || `Erreur serveur (HTTP ${res.status})`;
    onProgress?.({ phase: 'error', percent: 0, fileName: file.name, error: errMsg });
    return { success: false, publicUrl: '', path: '', error: errMsg };
  } catch (err: any) {
    const errMsg = err?.message || 'Erreur réseau';
    onProgress?.({ phase: 'error', percent: 0, fileName: file.name, error: errMsg });
    return { success: false, publicUrl: '', path: '', error: errMsg };
  }
}

/**
 * Deletes a file from Supabase storage if it was stored there.
 */
export async function deleteFileFromStorage(
  urlOrPath: string,
  bucket: StorageBucket = 'images'
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !urlOrPath) return { success: false };
  try {
    let path = urlOrPath;
    let targetBucket: string = bucket;

    // Detect if url is a full Supabase storage URL
    const match = urlOrPath.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      targetBucket = match[1];
      path = decodeURIComponent(match[2]);
    }

    // Only delete if it's an uploaded file (not external unsplash/picsum)
    if (!path.startsWith('uploads/') && !match) {
      return { success: true };
    }

    const { error } = await supabase.storage.from(targetBucket).remove([path]);
    if (error) {
      console.warn('Storage file deletion note:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('deleteFileFromStorage error:', err);
    return { success: false, error: err.message };
  }
}

