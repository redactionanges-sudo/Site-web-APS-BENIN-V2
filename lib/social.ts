import { SocialLinksConfig } from '@/types';

export type SocialPlatformId = 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'tiktok' | 'youtube';

export interface SocialPlatformDefinition {
  id: SocialPlatformId;
  name: string;
  badge: string;
  placeholder: string;
  colorHex: string;
}

export const SOCIAL_PLATFORMS: SocialPlatformDefinition[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    badge: 'FB',
    placeholder: 'https://facebook.com/agissonspoursauver',
    colorHex: '#1877F2',
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    badge: 'X',
    placeholder: 'https://twitter.com/aps_benin',
    colorHex: '#000000',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    badge: 'IN',
    placeholder: 'https://linkedin.com/company/aps-benin',
    colorHex: '#0A66C2',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    badge: 'IG',
    placeholder: 'https://instagram.com/aps_benin',
    colorHex: '#E4405F',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    badge: 'TK',
    placeholder: 'https://tiktok.com/@aps_benin',
    colorHex: '#000000',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    badge: 'YT',
    placeholder: 'https://youtube.com/@aps-benin',
    colorHex: '#FF0000',
  },
];

export interface ResolvedPlatformState {
  id: SocialPlatformId;
  name: string;
  badge: string;
  url: string;
  enabled: boolean;
  isVisible: boolean;
}

/**
 * Normalizes and extracts the individual state for a given platform.
 * Strict rule:
 * isVisible === true ONLY IF (enabled === true AND url is non-empty)
 */
export function getPlatformState(
  links: SocialLinksConfig | null | undefined,
  platformId: SocialPlatformId
): { url: string; enabled: boolean; isVisible: boolean } {
  if (!links) {
    return { url: '', enabled: false, isVisible: false };
  }

  let url = '';
  let enabled = false;

  switch (platformId) {
    case 'facebook': {
      url = (links.facebook_url || links.facebook || '').trim();
      enabled = links.facebook_enabled !== undefined
        ? Boolean(links.facebook_enabled)
        : Boolean(url.length > 0);
      break;
    }
    case 'twitter': {
      url = (links.twitter_url || links.twitter || links.x_url || links.x || '').trim();
      enabled = links.twitter_enabled !== undefined
        ? Boolean(links.twitter_enabled)
        : (links.x_enabled !== undefined ? Boolean(links.x_enabled) : Boolean(url.length > 0));
      break;
    }
    case 'linkedin': {
      url = (links.linkedin_url || links.linkedin || '').trim();
      enabled = links.linkedin_enabled !== undefined
        ? Boolean(links.linkedin_enabled)
        : Boolean(url.length > 0);
      break;
    }
    case 'instagram': {
      url = (links.instagram_url || links.instagram || '').trim();
      enabled = links.instagram_enabled !== undefined
        ? Boolean(links.instagram_enabled)
        : Boolean(url.length > 0);
      break;
    }
    case 'tiktok': {
      url = (links.tiktok_url || links.tiktok || '').trim();
      enabled = links.tiktok_enabled !== undefined
        ? Boolean(links.tiktok_enabled)
        : Boolean(url.length > 0);
      break;
    }
    case 'youtube': {
      url = (links.youtube_url || links.youtube || '').trim();
      enabled = links.youtube_enabled !== undefined
        ? Boolean(links.youtube_enabled)
        : Boolean(url.length > 0);
      break;
    }
  }

  // SI enabled === true ET url est non vide -> Afficher
  // SINON -> Ne pas afficher.
  const isVisible = enabled === true && url.length > 0;

  return { url, enabled, isVisible };
}

/**
 * Returns list of platforms configured to be publicly displayed
 */
export function getActiveSocialPlatforms(
  links: SocialLinksConfig | null | undefined
): ResolvedPlatformState[] {
  if (!links) return [];

  return SOCIAL_PLATFORMS.map((platform) => {
    const state = getPlatformState(links, platform.id);
    return {
      id: platform.id,
      name: platform.name,
      badge: platform.badge,
      url: state.url,
      enabled: state.enabled,
      isVisible: state.isVisible,
    };
  }).filter((platform) => platform.isVisible);
}

/**
 * Updates a specific platform inside the SocialLinksConfig object
 * maintaining both legacy and explicit key structures
 */
export function setPlatformState(
  current: SocialLinksConfig | null | undefined,
  platformId: SocialPlatformId,
  updates: { url?: string; enabled?: boolean }
): SocialLinksConfig {
  const result: SocialLinksConfig = {
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    ...(current || {}),
  };

  if (updates.url !== undefined) {
    const cleanUrl = updates.url.trim();
    switch (platformId) {
      case 'facebook':
        result.facebook = cleanUrl;
        result.facebook_url = cleanUrl;
        break;
      case 'twitter':
        result.twitter = cleanUrl;
        result.twitter_url = cleanUrl;
        result.x = cleanUrl;
        result.x_url = cleanUrl;
        break;
      case 'linkedin':
        result.linkedin = cleanUrl;
        result.linkedin_url = cleanUrl;
        break;
      case 'instagram':
        result.instagram = cleanUrl;
        result.instagram_url = cleanUrl;
        break;
      case 'tiktok':
        result.tiktok = cleanUrl;
        result.tiktok_url = cleanUrl;
        break;
      case 'youtube':
        result.youtube = cleanUrl;
        result.youtube_url = cleanUrl;
        break;
    }
  }

  if (updates.enabled !== undefined) {
    const val = Boolean(updates.enabled);
    switch (platformId) {
      case 'facebook':
        result.facebook_enabled = val;
        break;
      case 'twitter':
        result.twitter_enabled = val;
        result.x_enabled = val;
        break;
      case 'linkedin':
        result.linkedin_enabled = val;
        break;
      case 'instagram':
        result.instagram_enabled = val;
        break;
      case 'tiktok':
        result.tiktok_enabled = val;
        break;
      case 'youtube':
        result.youtube_enabled = val;
        break;
    }
  }

  return result;
}

/**
 * Normalizes raw social links from database, ensuring all fields are present
 */
export function normalizeSocialLinks(links: any): SocialLinksConfig {
  const result: SocialLinksConfig = {
    facebook: '',
    facebook_url: '',
    facebook_enabled: false,
    twitter: '',
    twitter_url: '',
    twitter_enabled: false,
    x: '',
    x_url: '',
    x_enabled: false,
    linkedin: '',
    linkedin_url: '',
    linkedin_enabled: false,
    instagram: '',
    instagram_url: '',
    instagram_enabled: false,
    tiktok: '',
    tiktok_url: '',
    tiktok_enabled: false,
    youtube: '',
    youtube_url: '',
    youtube_enabled: false,
    ...(links || {}),
  };

  const fbUrl = (links?.facebook_url || links?.facebook || '').trim();
  const twUrl = (links?.twitter_url || links?.twitter || links?.x_url || links?.x || '').trim();
  const inUrl = (links?.linkedin_url || links?.linkedin || '').trim();
  const igUrl = (links?.instagram_url || links?.instagram || '').trim();
  const tkUrl = (links?.tiktok_url || links?.tiktok || '').trim();
  const ytUrl = (links?.youtube_url || links?.youtube || '').trim();

  result.facebook = fbUrl;
  result.facebook_url = fbUrl;
  result.facebook_enabled = links?.facebook_enabled !== undefined
    ? Boolean(links.facebook_enabled)
    : Boolean(fbUrl.length > 0);

  result.twitter = twUrl;
  result.twitter_url = twUrl;
  result.x = twUrl;
  result.x_url = twUrl;
  result.twitter_enabled = links?.twitter_enabled !== undefined
    ? Boolean(links.twitter_enabled)
    : (links?.x_enabled !== undefined ? Boolean(links.x_enabled) : Boolean(twUrl.length > 0));
  result.x_enabled = result.twitter_enabled;

  result.linkedin = inUrl;
  result.linkedin_url = inUrl;
  result.linkedin_enabled = links?.linkedin_enabled !== undefined
    ? Boolean(links.linkedin_enabled)
    : Boolean(inUrl.length > 0);

  result.instagram = igUrl;
  result.instagram_url = igUrl;
  result.instagram_enabled = links?.instagram_enabled !== undefined
    ? Boolean(links.instagram_enabled)
    : Boolean(igUrl.length > 0);

  result.tiktok = tkUrl;
  result.tiktok_url = tkUrl;
  result.tiktok_enabled = links?.tiktok_enabled !== undefined
    ? Boolean(links.tiktok_enabled)
    : Boolean(tkUrl.length > 0);

  result.youtube = ytUrl;
  result.youtube_url = ytUrl;
  result.youtube_enabled = links?.youtube_enabled !== undefined
    ? Boolean(links.youtube_enabled)
    : Boolean(ytUrl.length > 0);

  return result;
}
