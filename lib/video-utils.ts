export interface VideoInfo {
  platform: 'youtube' | 'vimeo' | 'storage' | 'direct' | 'unknown';
  videoId?: string;
  embedUrl?: string;
  defaultThumbnail?: string;
  normalizedUrl: string;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=DC4nSUX9pCc
 * - https://youtu.be/DC4nSUX9pCc?si=...
 * - https://www.youtube.com/shorts/DC4nSUX9pCc
 * - https://www.youtube.com/embed/DC4nSUX9pCc
 * - https://www.youtube.com/live/DC4nSUX9pCc
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Pattern matching standard YouTube URL structures
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = cleanUrl.match(regExp);
  return match ? match[1] : null;
}

/**
 * Extracts Vimeo video ID from various Vimeo URL formats:
 * - https://vimeo.com/123456789
 * - https://player.vimeo.com/video/123456789
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  const regExp = /(?:vimeo\.com\/(?:video\/|channels\/(?:\w+\/)?|groups\/[^\/]+\/videos\/|album\/(?:\d+\/)?video\/)?|player\.vimeo\.com\/video\/)([0-9]+)/i;
  const match = cleanUrl.match(regExp);
  return match ? match[1] : null;
}

/**
 * Parses any video URL and returns structured metadata.
 */
export function parseVideoUrl(url: string = ''): VideoInfo {
  const trimmed = url.trim();

  // 1. YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return {
      platform: 'youtube',
      videoId: ytId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`,
      defaultThumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      normalizedUrl: `https://www.youtube.com/watch?v=${ytId}`,
    };
  }

  // 2. Vimeo
  const vimeoId = extractVimeoId(trimmed);
  if (vimeoId) {
    return {
      platform: 'vimeo',
      videoId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&dnt=1`,
      defaultThumbnail: '', // Will use custom thumbnail or fallback
      normalizedUrl: `https://vimeo.com/${vimeoId}`,
    };
  }

  // 3. Supabase Storage or Direct Video
  const isStorage = trimmed.includes('supabase.co/storage/v1/object/public/videos');
  const isVideoExt = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed);

  if (isStorage || isVideoExt) {
    return {
      platform: isStorage ? 'storage' : 'direct',
      embedUrl: trimmed,
      defaultThumbnail: '',
      normalizedUrl: trimmed,
    };
  }

  return {
    platform: 'unknown',
    normalizedUrl: trimmed,
  };
}

/**
 * Returns a secure embed URL for embedding in an article iframe or player.
 * Supports YouTube (watch, youtu.be, shorts, embed), Vimeo, and direct files.
 * Returns null if the URL is missing or cannot be recognized.
 */
export function getVideoEmbedUrl(url?: string | null, autoplay: boolean = false): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  const info = parseVideoUrl(trimmed);

  if (info.platform === 'youtube' && info.videoId) {
    return `https://www.youtube-nocookie.com/embed/${info.videoId}?rel=0${autoplay ? '&autoplay=1' : ''}`;
  }
  if (info.platform === 'vimeo' && info.videoId) {
    return `https://player.vimeo.com/video/${info.videoId}?dnt=1${autoplay ? '&autoplay=1' : ''}`;
  }
  if ((info.platform === 'storage' || info.platform === 'direct') && info.embedUrl) {
    return info.embedUrl;
  }
  return null;
}

/**
 * Validates a video URL based on expected platform.
 */
export function validateVideoUrl(
  url: string,
  expectedPlatform: 'youtube' | 'vimeo' | 'storage' | 'any' = 'any'
): { isValid: boolean; error?: string; info?: VideoInfo } {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'Veuillez saisir une URL de vidéo.' };
  }

  const info = parseVideoUrl(url);

  if (expectedPlatform === 'youtube') {
    if (info.platform !== 'youtube') {
      return {
        isValid: false,
        error: "L'URL renseignée n'est pas une URL YouTube valide (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...)",
      };
    }
    return { isValid: true, info };
  }

  if (expectedPlatform === 'vimeo') {
    if (info.platform !== 'vimeo') {
      return {
        isValid: false,
        error: "L'URL renseignée n'est pas une URL Vimeo valide (ex: https://vimeo.com/123456789)",
      };
    }
    return { isValid: true, info };
  }

  if (expectedPlatform === 'storage') {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return {
        isValid: false,
        error: 'Veuillez renseigner une URL valide commençant par https://',
      };
    }
    return { isValid: true, info };
  }

  // expectedPlatform === 'any'
  if (info.platform === 'unknown') {
    return {
      isValid: false,
      error: 'Veuillez renseigner une URL valide YouTube, Vimeo ou un lien vidéo direct (MP4).',
    };
  }

  return { isValid: true, info };
}

export const DEFAULT_VIDEO_FALLBACK_POSTER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="%230f172a"/><circle cx="400" cy="225" r="46" fill="%2392278F"/><polygon points="392,207 418,225 392,243" fill="%23FFFFFF"/><text x="400" y="310" fill="%23E2E8F0" font-family="sans-serif" font-size="16" font-weight="600" text-anchor="middle">APS-BÉNIN • Vidéo Officielle</text></svg>';

/**
 * Returns a guaranteed valid thumbnail URL for a video.
 * Handles custom thumbnail images, YouTube auto-generated covers, and fallbacks.
 */
export function getVideoThumbnail(
  videoUrl: string = '',
  customThumbnail?: string | null
): string {
  // If custom thumbnail is provided and looks like an image, not a video page link
  if (customThumbnail && customThumbnail.trim()) {
    const trimmed = customThumbnail.trim();
    const isVideoSiteLink =
      trimmed.includes('youtube.com/watch') ||
      trimmed.includes('youtu.be/') ||
      trimmed.includes('vimeo.com/');
    if (!isVideoSiteLink) {
      return trimmed;
    }
  }

  // Fallback to platform-derived thumbnail (YouTube HQ default)
  const parsed = parseVideoUrl(videoUrl);
  if (parsed.defaultThumbnail) {
    return parsed.defaultThumbnail;
  }

  return DEFAULT_VIDEO_FALLBACK_POSTER;
}

/**
 * Returns human-readable platform label
 */
export function getVideoPlatformLabel(
  platform?: string
): { label: string; color: string } {
  switch (platform) {
    case 'youtube':
      return { label: 'YouTube', color: 'bg-red-600 text-white' };
    case 'vimeo':
      return { label: 'Vimeo', color: 'bg-sky-500 text-white' };
    case 'storage':
      return { label: 'Fichier Supabase', color: 'bg-emerald-600 text-white' };
    case 'direct':
      return { label: 'Vidéo MP4', color: 'bg-purple-600 text-white' };
    default:
      return { label: 'Vidéo', color: 'bg-gray-800 text-white' };
  }
}
