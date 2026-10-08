import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { normalizeSocialLinks } from '@/lib/social';
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
} from '@/types';
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
} from './initial-data';

let rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (rawSupabaseUrl.endsWith('/')) rawSupabaseUrl = rawSupabaseUrl.slice(0, -1);
if (rawSupabaseUrl.endsWith('/rest/v1')) rawSupabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1$/, '');
const supabaseUrl = rawSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

async function mutateTable(table: string, action: 'upsert' | 'delete', dataOrId: any): Promise<void> {
  // 1. Direct Supabase operation using the authenticated browser client session
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

          let { error } = await supabase.from(table).upsert(upsertPayload);
          // If column missing on opportunities, retry direct upsert with external_link only
          if (error && table === 'opportunities' && error.message?.includes('column') && (error.message?.includes('main_image') || error.message?.includes('gallery'))) {
            const { main_image, gallery, ...safePayload } = upsertPayload;
            const retryDirect = await supabase.from(table).upsert(safePayload);
            if (!retryDirect.error) return;
            error = retryDirect.error;
          }
          if (!error) return;
          console.warn(`Direct client upsert failed on ${table}, trying server bridge:`, error.message);
        } else {
          const { error } = await supabase.from(table).delete().eq('id', dataOrId);
          if (!error) return;
          console.warn(`Direct client delete failed on ${table}, trying server bridge:`, error.message);
        }
      }
    } catch (directErr) {
      console.warn(`Direct client mutation failed on ${table}:`, directErr);
    }
  }

  // 2. Server API bridge (/api/admin/mutate)
  if (typeof window !== 'undefined') {
    const payload = action === 'upsert'
      ? { table, action, data: dataOrId }
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

    const res = await fetch('/api/admin/mutate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      throw new Error(json.error || `Erreur Supabase lors de l'enregistrement (${table})`);
    }
    return;
  }

  // 3. Server runtime fallback
  if (supabase) {
    if (action === 'upsert') {
      const { error } = await supabase.from(table).upsert(dataOrId);
      if (error) throw new Error(`Erreur Supabase (${table}): ${error.message}`);
    } else {
      const { error } = await supabase.from(table).delete().eq('id', dataOrId);
      if (error) throw new Error(`Erreur Supabase (${table}): ${error.message}`);
    }
  }
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
    await mutateTable('statistics', 'delete', id);
    invalidateCache('statistics');
    const all = await this.getStatistics();
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
    await mutateTable('domains', 'delete', id);
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
    await mutateTable('projects', 'delete', id);
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
    await mutateTable('news', 'delete', id);
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
    await mutateTable('opportunities', 'delete', id);
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
    await mutateTable('partners', 'delete', id);
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
    await mutateTable('team_members', 'delete', id);
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
    await mutateTable('governance', 'delete', id);
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
    await mutateTable('documents', 'delete', id);
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
    await mutateTable('albums', 'delete', id);
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
          const res = data as MediaItem[];
          setCachedData('media', res);
          setStoredItem('media', res);
          return res;
        }
      } catch (e) {
        console.warn('Supabase media fallback:', e);
      }
    }
    const local = getStoredItem('media', initialMedia);
    setCachedData('media', local);
    return local;
  },

  async getHeroPhotos(): Promise<MediaItem[]> {
    const allMedia = await this.getMedia();
    const heroPhotos = allMedia
      .filter(m => m.type === 'photo' && m.is_active !== false && m.show_in_hero)
      .sort((a, b) => (a.hero_order || 99) - (b.hero_order || 99));

    if (heroPhotos.length > 0) {
      return heroPhotos;
    }

    // Fallback to active photos
    return allMedia
      .filter(m => m.type === 'photo' && m.is_active !== false)
      .slice(0, 5);
  },

  async saveMedia(item: MediaItem): Promise<MediaItem[]> {
    await mutateTable('media', 'upsert', item);
    invalidateCache('media');
    return await this.getMedia();
  },

  async deleteMedia(id: string): Promise<MediaItem[]> {
    try {
      const allMedia = await this.getMedia();
      const target = allMedia.find(m => m.id === id);
      if (target?.url) {
        await deleteFileFromStorage(target.url, target.type === 'video' ? 'videos' : 'images');
      }
    } catch (cleanErr) {
      console.warn('Storage file cleanup on deleteMedia notice:', cleanErr);
    }
    await mutateTable('media', 'delete', id);
    invalidateCache('media');
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

  async sendMessage(msg: Omit<ContactMessage, 'id' | 'created_at' | 'status'>): Promise<ContactMessage> {
    const newMsg: ContactMessage = {
      ...msg,
      id: 'msg-' + Date.now(),
      created_at: new Date().toISOString(),
      status: 'unread',
    };
    await mutateTable('contact_messages', 'upsert', newMsg);
    invalidateCache('messages');
    return newMsg;
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

  // Optimized Dashboard KPI metrics fetcher
  async getDashboardStats() {
    const cachedProjects = getCachedData<ProjectItem[]>('projects');
    const cachedNews = getCachedData<NewsItem[]>('news');
    const cachedOpps = getCachedData<OpportunityItem[]>('opportunities');
    const cachedMedia = getCachedData<MediaItem[]>('media');
    const cachedPartners = getCachedData<PartnerItem[]>('partners');
    const cachedMessages = getCachedData<ContactMessage[]>('messages');

    if (cachedProjects && cachedNews && cachedOpps && cachedMedia && cachedPartners && cachedMessages) {
      return {
        projectsCount: cachedProjects.length,
        newsCount: cachedNews.length,
        oppCount: cachedOpps.length,
        photosCount: cachedMedia.filter(m => m.type === 'photo').length,
        videosCount: cachedMedia.filter(m => m.type === 'video').length,
        partnersCount: cachedPartners.length,
        messagesCount: cachedMessages.length,
        unreadMessages: cachedMessages.filter(m => m.status === 'unread').length,
        draftsCount: cachedNews.filter(n => n.status === 'draft').length,
        recentNews: cachedNews.slice(0, 4),
        recentMessages: cachedMessages.slice(0, 4),
      };
    }

    const [projects, news, opps, media, partners, msgs] = await Promise.all([
      this.getProjects(),
      this.getNews(),
      this.getOpportunities(),
      this.getMedia(),
      this.getPartners(),
      this.getMessages(),
    ]);

    return {
      projectsCount: projects.length,
      newsCount: news.length,
      oppCount: opps.length,
      photosCount: media.filter(m => m.type === 'photo').length,
      videosCount: media.filter(m => m.type === 'video').length,
      partnersCount: partners.length,
      messagesCount: msgs.length,
      unreadMessages: msgs.filter(m => m.status === 'unread').length,
      draftsCount: news.filter(n => n.status === 'draft').length,
      recentNews: news.slice(0, 4),
      recentMessages: msgs.slice(0, 4),
    };
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

  async saveUser(user: UserProfile): Promise<UserProfile[]> {
    await mutateTable('profiles', 'upsert', user);
    invalidateCache('users');
    return await this.getUsers();
  },

  async deleteUser(id: string): Promise<UserProfile[]> {
    await mutateTable('profiles', 'delete', id);
    invalidateCache('users');
    return await this.getUsers();
  },

  // Storage file operations
  async uploadFile(
    file: File,
    bucket: 'images' | 'videos' | 'documents' | 'logos' = 'images',
    folder: string = 'uploads'
  ) {
    return await uploadFileToStorage(file, bucket, folder);
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

/**
 * Uploads a file directly via authenticated Supabase client,
 * with seamless fallback to /api/admin/upload if needed.
 */
export async function uploadFileToStorage(
  file: File,
  bucket: StorageBucket = 'images',
  folder: string = 'uploads'
): Promise<{ success: boolean; publicUrl: string; path: string; error?: string }> {
  const cleanName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
  const filePath = `${folder}/${Date.now()}_${cleanName}`;

  // =========================================================================
  // [DIAGNOSTIC TEMPORAIRE UPLOAD STORAGE] DÉBUT
  // =========================================================================
  console.debug('[DIAGNOSTIC UPLOAD] ========== DÉBUT FLUX TÉLÉVERSEMENT ==========');
  console.debug('[DIAGNOSTIC UPLOAD] 3. Bucket cible :', bucket, '(exactement "images" ? :', bucket === 'images', ')');
  console.debug('[DIAGNOSTIC UPLOAD] 4. Chemin Storage généré :', filePath);
  console.debug('[DIAGNOSTIC UPLOAD] Fichier source :', {
    name: file.name,
    size: `${(file.size / 1024).toFixed(1)} Ko`,
    type: file.type || 'non défini',
  });

  // 1. Direct client upload using the user's Supabase Auth session
  if (supabase) {
    try {
      // 1. & 2. Vérification getSession()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;

      // Vérification getUser()
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      // Exécution temporaire de is_editor() via RPC avec le client et la session actuelle
      const { data: editorCheck, error: editorCheckError } = await supabase.rpc('is_editor');

      console.debug('[DIAGNOSTIC UPLOAD STORAGE] is_editor result', {
        'session présente': Boolean(currentSession),
        'session.user.id': currentSession?.user?.id || null,
        'session.user.email': currentSession?.user?.email || null,
        'getUser user.id': currentUser?.id || null,
        'getUser user.email': currentUser?.email || null,
        'getUser error': userError ? userError.message : null,
        'editorCheck': editorCheck,
        'editorCheckError.message': editorCheckError ? editorCheckError.message : null,
        'editorCheckError.code': editorCheckError ? (editorCheckError as any).code : null,
      });

      console.debug('[DIAGNOSTIC UPLOAD] 1. & 2. supabase.auth.getSession() ->', {
        'session présente': Boolean(currentSession),
        'session.user.id': currentSession?.user?.id || null,
        'session.user.email': currentSession?.user?.email || null,
        'présence access_token': Boolean(currentSession?.access_token),
        'erreur session': sessionError ? sessionError.message : null,
      });

      console.debug('[DIAGNOSTIC UPLOAD] 5. & 6. supabase.auth.getUser() ->', {
        'user présent': Boolean(currentUser),
        'user.id': currentUser?.id || null,
        'user.email': currentUser?.email || null,
        'éventuelle erreur': userError ? userError.message : null,
      });

      // Diagnostic PostgreSQL SECURITY DEFINER : vérification du contexte exact vu par la session
      console.debug('[DIAGNOSTIC AUTH CONTEXT] APPEL RPC DEBUG');
      const { data: authContext, error: authContextError } = await supabase.rpc('debug_current_auth_context');
      console.debug('[DIAGNOSTIC AUTH CONTEXT] RESULTAT', {
        data: authContext ?? null,
        error: authContextError ? authContextError.message : null,
      });

      console.debug('[DIAGNOSTIC AUTH CONTEXT]', {
        uid: authContext?.uid ?? null,
        role: authContext?.role ?? null,
        is_active: authContext?.is_active ?? null,
        is_editor: authContext?.is_editor ?? null,
        error: authContextError ? (authContextError.message || String(authContextError)) : null,
      });

      // 7. Effectuer l'upload normal avec supabase.storage.from(bucket).upload(...)
      console.debug(`[DIAGNOSTIC UPLOAD] 7. Appel supabase.storage.from('${bucket}').upload('${filePath}', ...)`);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      // 8. Vérification du résultat
      if (error) {
        console.error('[DIAGNOSTIC UPLOAD] 8. ❌ ÉCHEC DE L\'UPLOAD STORAGE :', {
          'error.message': error.message,
          'error.name': error.name,
          'error.statusCode': (error as any).statusCode || (error as any).status || null,
          'bucket': bucket,
          'chemin du fichier': filePath,
        });
      } else if (data) {
        console.debug('[DIAGNOSTIC UPLOAD] ✅ SUCCÈS DE L\'UPLOAD STORAGE :', {
          'path': data.path,
          'id': (data as any).id || null,
          'bucket': bucket,
        });

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        console.debug('[DIAGNOSTIC UPLOAD] URL publique générée :', publicUrl);
        console.debug('[DIAGNOSTIC UPLOAD] ========== FIN FLUX TÉLÉVERSEMENT ==========');

        return {
          success: true,
          publicUrl,
          path: filePath,
        };
      }
    } catch (directErr: any) {
      console.error('[DIAGNOSTIC UPLOAD] ❌ Exception inattendue lors de l\'upload direct :', {
        'error.message': directErr?.message || String(directErr),
        'error.name': directErr?.name || 'Error',
        'bucket': bucket,
        'chemin du fichier': filePath,
      });
    }
  } else {
    console.warn('[DIAGNOSTIC UPLOAD] Instance supabase non disponible côté client');
  }
  console.debug('[DIAGNOSTIC UPLOAD] ========== FIN FLUX CLIENT (Passage éventuel au fallback) ==========');
  // =========================================================================
  // [DIAGNOSTIC TEMPORAIRE UPLOAD STORAGE] FIN
  // =========================================================================

  // 2. Server API fallback (/api/admin/upload) with Bearer token
  if (typeof window !== 'undefined') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('folder', folder);

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

      const contentType = res.headers.get('content-type') || '';
      let resData: any = null;

      if (contentType.includes('application/json')) {
        try {
          resData = await res.json();
        } catch (jsonErr: any) {
          const rawText = await res.text().catch(() => '');
          console.error('[API UPLOAD FALLBACK] Erreur parsing JSON :', {
            status: res.status,
            rawText,
            jsonErr,
          });
          return {
            success: false,
            publicUrl: '',
            path: '',
            error: `Réponse serveur non-JSON (HTTP ${res.status}) : ${rawText || jsonErr.message}`,
          };
        }
      } else {
        // En cas de réponse non-JSON (ex: HTTP 413 "Request Entity Too Large" renvoyé par Vercel)
        const rawText = await res.text().catch(() => '');
        console.error('[API UPLOAD FALLBACK] Réponse serveur non-JSON reçue :', {
          status: res.status,
          statusText: res.statusText,
          contentType,
          rawText,
        });

        const isEntityTooLarge =
          res.status === 413 ||
          rawText.toLowerCase().includes('request entity') ||
          rawText.toLowerCase().includes('too large');

        const message = isEntityTooLarge
          ? `Le fichier sélectionné dépasse la taille maximale autorisée par le serveur Vercel (limite 4.5 Mo). Détail serveur : ${rawText || 'Request Entity Too Large (HTTP 413)'}`
          : `Réponse serveur non-JSON (HTTP ${res.status} ${res.statusText}) : ${rawText.slice(0, 300)}`;

        return {
          success: false,
          publicUrl: '',
          path: '',
          error: message,
        };
      }

      if (res.ok && resData?.success) {
        return {
          success: true,
          publicUrl: resData.publicUrl || resData.url,
          path: resData.path || filePath,
        };
      }

      return {
        success: false,
        publicUrl: '',
        path: '',
        error: resData?.error || `Erreur serveur (HTTP ${res.status}) lors du téléversement vers Supabase Storage.`,
      };
    } catch (err: any) {
      return {
        success: false,
        publicUrl: '',
        path: '',
        error: err.message || 'Erreur réseau lors du téléversement.',
      };
    }
  }

  return {
    success: false,
    publicUrl: '',
    path: '',
    error: 'Environnement de téléversement non disponible.',
  };
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

