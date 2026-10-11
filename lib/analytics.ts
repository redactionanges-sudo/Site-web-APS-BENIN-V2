import { AnalyticsEvent, AnalyticsEventType, AnalyticsPeriodSummary } from '@/types';

const STORAGE_SESSION_KEY = 'aps_analytics_session_id';
const LOCAL_EVENTS_STORAGE_KEY = 'aps_local_analytics_events';
const MAX_LOCAL_EVENTS = 300;

/**
 * Récupère ou génère un identifiant anonyme de session.
 * Stocké dans sessionStorage (détruit dès la fermeture de l'onglet/navigateur).
 * Ne contient aucune donnée personnelle (PII).
 */
export function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';

  try {
    let sid = sessionStorage.getItem(STORAGE_SESSION_KEY);
    if (!sid) {
      sid = 'aps_sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      sessionStorage.setItem(STORAGE_SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'fallback_sess_' + Date.now();
  }
}

/**
 * Détecte le type d'appareil de manière respectueuse de la vie privée.
 */
export function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (width >= 640 && width <= 1024 && 'ontouchstart' in window)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua) || width < 640) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Détecte la famille du navigateur.
 */
export function detectBrowserFamily(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/MSIE|Trident/i.test(ua)) return 'Internet Explorer';
  return 'Autre';
}

/**
 * Récupère les événements réels stockés localement (fallback offline/résilient).
 */
export function getLocalStoredAnalyticsEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Sauvegarde un événement réel dans le stockage local (limité à 300 événements).
 */
export function saveLocalAnalyticsEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  try {
    const events = getLocalStoredAnalyticsEvents();
    // Évite les doublons stricts (même session, même type, même path dans la même seconde)
    const exists = events.some(
      (e) =>
        e.session_id === event.session_id &&
        e.event_type === event.event_type &&
        e.path === event.path &&
        Math.abs(new Date(e.created_at).getTime() - new Date(event.created_at).getTime()) < 1000
    );
    if (!exists) {
      events.unshift(event);
      if (events.length > MAX_LOCAL_EVENTS) {
        events.length = MAX_LOCAL_EVENTS;
      }
      localStorage.setItem(LOCAL_EVENTS_STORAGE_KEY, JSON.stringify(events));
    }
  } catch {
    // Ignore storage quota errors silently
  }
}

/**
 * Efface les événements locaux (uniquement sur demande admin).
 */
export function clearLocalAnalyticsEvents(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_EVENTS_STORAGE_KEY);
  } catch {}
}

/**
 * Enregistre un événement réel de consultation ou d'interaction.
 * - Envoi asynchrone non-bloquant vers /api/analytics/collect
 * - Sauvegarde locale en miroir pour résilience
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  data: {
    path?: string;
    page_title?: string;
    referrer?: string;
    target_id?: string;
    target_title?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  if (typeof window === 'undefined') return;

  const currentPath = data.path || window.location.pathname;

  // Ne jamais tracker les requêtes API ni les pages privées du back-office comme trafic visiteur
  if (currentPath.startsWith('/api') || currentPath.startsWith('/admin')) {
    return;
  }

  const sessionId = getAnonymousSessionId();
  const event: AnalyticsEvent = {
    id: 'evt_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
    created_at: new Date().toISOString(),
    session_id: sessionId,
    event_type: eventType,
    path: currentPath,
    page_title: data.page_title || (typeof document !== 'undefined' ? document.title : ''),
    referrer: data.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
    device_type: detectDeviceType(),
    browser: detectBrowserFamily(),
    country: 'BJ', // Pays officiel par défaut (Bénin)
    target_id: data.target_id,
    target_title: data.target_title,
    metadata: data.metadata,
  };

  // 1. Sauvegarde locale en miroir (permet de vérifier immédiatement les données réelles)
  saveLocalAnalyticsEvent(event);

  // 2. Envoi serveur vers l'API collect
  try {
    const payload = JSON.stringify(event);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/analytics/collect', blob);
      if (!sent) {
        fetch('/api/analytics/collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } else {
      fetch('/api/analytics/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Échec silencieux, ne perturbe jamais l'expérience de navigation
  }
}

// Mémoire pour déduplication des visites rapides
let lastTrackedPath = '';
let lastTrackedTime = 0;

/**
 * Enregistre une visite de page réelle avec déduplication anti-rebond (1 sec).
 */
export function trackPageView(path: string, pageTitle?: string): void {
  const now = Date.now();
  if (path === lastTrackedPath && now - lastTrackedTime < 1000) {
    return;
  }
  lastTrackedPath = path;
  lastTrackedTime = now;

  trackEvent('page_view', {
    path,
    page_title: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  });
}

/**
 * Calcule une synthèse statistique stricte et vérifiable à partir d'une liste réelle d'événements.
 * RÈGLE ABSOLUE : Zéro chiffre fictif ou inventé.
 */
export function computeSummaryFromEventList(
  events: AnalyticsEvent[],
  period: '7d' | '30d' | '90d' | 'custom',
  startDate: Date,
  endDate: Date
): AnalyticsPeriodSummary {
  // Filtrage dans la fenêtre temporelle exacte
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  const filteredEvents = events.filter((e) => {
    const t = new Date(e.created_at).getTime();
    return t >= startTime && t <= endTime;
  });

  const hasData = filteredEvents.length > 0;

  // Calcul des métriques
  let totalPageViews = 0;
  let callHeadquartersClicks = 0;
  let documentDownloads = 0;
  let projectViews = 0;
  let newsViews = 0;
  let opportunityViews = 0;

  const sessionIds = new Set<string>();
  const pageCounts: Record<string, { title: string; count: number }> = {};
  const dateBuckets: Record<string, { pageViews: number; sessions: Set<string> }> = {};
  const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
  const sourceCounts: Record<string, number> = {};
  const actionCounts: Record<string, { label: string; count: number }> = {};

  for (const ev of filteredEvents) {
    if (ev.session_id) {
      sessionIds.add(ev.session_id);
    }

    // Date bucket YYYY-MM-DD
    const dateStr = ev.created_at ? ev.created_at.substring(0, 10) : '';
    if (dateStr) {
      if (!dateBuckets[dateStr]) {
        dateBuckets[dateStr] = { pageViews: 0, sessions: new Set() };
      }
      if (ev.session_id) {
        dateBuckets[dateStr].sessions.add(ev.session_id);
      }
    }

    // Device
    const dev = ev.device_type || 'desktop';
    deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

    // Type d'événement
    switch (ev.event_type) {
      case 'page_view': {
        totalPageViews++;
        if (dateStr && dateBuckets[dateStr]) {
          dateBuckets[dateStr].pageViews++;
        }
        const p = ev.path || '/';
        const title = ev.page_title || p;
        if (!pageCounts[p]) {
          pageCounts[p] = { title, count: 0 };
        }
        pageCounts[p].count++;
        break;
      }
      case 'click_call_headquarters': {
        callHeadquartersClicks++;
        const key = 'call_headquarters';
        if (!actionCounts[key]) {
          actionCounts[key] = { label: 'Clic sur "Appeler le siège"', count: 0 };
        }
        actionCounts[key].count++;
        break;
      }
      case 'download_document': {
        documentDownloads++;
        const target = ev.target_title || ev.target_id || 'Document institutionnel';
        const key = `doc_${ev.target_id || target}`;
        if (!actionCounts[key]) {
          actionCounts[key] = { label: `Téléchargement: ${target}`, count: 0 };
        }
        actionCounts[key].count++;
        break;
      }
      case 'view_project': {
        projectViews++;
        const target = ev.target_title || ev.target_id || 'Projet';
        const key = `proj_${ev.target_id || target}`;
        if (!actionCounts[key]) {
          actionCounts[key] = { label: `Consultation projet: ${target}`, count: 0 };
        }
        actionCounts[key].count++;
        break;
      }
      case 'view_news': {
        newsViews++;
        const target = ev.target_title || ev.target_id || 'Actualité';
        const key = `news_${ev.target_id || target}`;
        if (!actionCounts[key]) {
          actionCounts[key] = { label: `Lecture actualité: ${target}`, count: 0 };
        }
        actionCounts[key].count++;
        break;
      }
      case 'view_opportunity': {
        opportunityViews++;
        const target = ev.target_title || ev.target_id || 'Opportunité';
        const key = `opp_${ev.target_id || target}`;
        if (!actionCounts[key]) {
          actionCounts[key] = { label: `Consultation opportunité: ${target}`, count: 0 };
        }
        actionCounts[key].count++;
        break;
      }
      default:
        break;
    }

    // Sources de trafic
    let sourceLabel = 'Accès Direct';
    if (ev.referrer) {
      try {
        const refUrl = new URL(ev.referrer);
        const host = refUrl.hostname.toLowerCase();
        if (host.includes('google')) sourceLabel = 'Google Search';
        else if (host.includes('bing')) sourceLabel = 'Bing';
        else if (host.includes('facebook') || host.includes('fb.me')) sourceLabel = 'Facebook';
        else if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) sourceLabel = 'X / Twitter';
        else if (host.includes('linkedin')) sourceLabel = 'LinkedIn';
        else if (host.includes('whatsapp')) sourceLabel = 'WhatsApp';
        else sourceLabel = host;
      } catch {
        sourceLabel = 'Autre site référent';
      }
    }
    sourceCounts[sourceLabel] = (sourceCounts[sourceLabel] || 0) + 1;
  }

  // Top Pages
  const topPages = Object.entries(pageCounts)
    .map(([path, data]) => ({
      path,
      title: data.title,
      views: data.count,
      percentage: totalPageViews > 0 ? Math.round((data.count / totalPageViews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 15);

  // Traffic by date (trié par date croissante)
  const trafficByDate = Object.entries(dateBuckets)
    .map(([date, data]) => ({
      date,
      pageViews: data.pageViews,
      sessions: data.sessions.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Device breakdown
  const totalDeviceEvents = filteredEvents.length;
  const deviceBreakdown = (['desktop', 'mobile', 'tablet'] as const).map((device) => {
    const count = deviceCounts[device] || 0;
    return {
      device,
      count,
      percentage: totalDeviceEvents > 0 ? Math.round((count / totalDeviceEvents) * 100) : 0,
    };
  });

  // Sources breakdown
  const sourcesBreakdown = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: totalDeviceEvents > 0 ? Math.round((count / totalDeviceEvents) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Actions breakdown
  const actionsBreakdown = Object.entries(actionCounts)
    .map(([action, data]) => ({
      action,
      label: data.label,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  const totalSessions = sessionIds.size;

  return {
    period,
    startDate: startDate.toISOString().substring(0, 10),
    endDate: endDate.toISOString().substring(0, 10),
    hasData,
    totalPageViews,
    totalSessions,
    totalUniqueVisitors: totalSessions,
    callHeadquartersClicks,
    documentDownloads,
    projectViews,
    newsViews,
    opportunityViews,
    topPages,
    trafficByDate,
    deviceBreakdown,
    sourcesBreakdown,
    actionsBreakdown,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Récupère les données réelles d'analytics pour le tableau de bord back-office.
 * Se connecte à /api/admin/analytics avec le token JWT de l'administrateur.
 * Si le serveur n'a pas encore la table analytics_events ou renvoie un code non configuré,
 * calcule la synthèse à partir des événements réels locaux pour permettre l'évaluation immédiate.
 */
export async function fetchAnalyticsData(
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: { start: string; end: string }
): Promise<AnalyticsPeriodSummary & { isFallbackLocal?: boolean; notConfigured?: boolean }> {
  // Calcul des dates par défaut
  const now = new Date();
  let startDate = new Date();
  const endDate = new Date();

  if (period === '7d') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === '30d') {
    startDate.setDate(now.getDate() - 30);
  } else if (period === '90d') {
    startDate.setDate(now.getDate() - 90);
  } else if (period === 'custom' && customRange?.start && customRange?.end) {
    startDate = new Date(customRange.start);
    startDate.setHours(0, 0, 0, 0);
    const end = new Date(customRange.end);
    end.setHours(23, 59, 59, 999);
  }

  // 1. Essai d'appel API serveur avec JWT Supabase si disponible
  try {
    let token = '';
    if (typeof window !== 'undefined') {
      // Récupère le token Supabase dans le localStorage
      const storageKey = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (storageKey) {
        try {
          const item = JSON.parse(localStorage.getItem(storageKey) || '{}');
          token = item.access_token || '';
        } catch {}
      }
    }

    const params = new URLSearchParams();
    params.set('period', period);
    if (customRange?.start) params.set('startDate', customRange.start);
    if (customRange?.end) params.set('endDate', customRange.end);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) {
        // Si le serveur a répondu et a des données
        if (data.hasData || (data.totalPageViews > 0)) {
          return data;
        }
      }
    }
  } catch {
    // Si l'API échoue, on continue vers le fallback local des événements réels
  }

  // 2. Fallback avec les événements réellement collectés dans le navigateur
  const localEvents = getLocalStoredAnalyticsEvents();
  const computed = computeSummaryFromEventList(localEvents, period, startDate, endDate);

  return {
    ...computed,
    isFallbackLocal: true,
  };
}
