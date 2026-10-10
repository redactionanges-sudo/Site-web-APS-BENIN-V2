import { AnalyticsEvent, AnalyticsEventType, AnalyticsPeriodSummary } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

const SESSION_STORAGE_KEY = 'aps_analytics_session_id';
const LOCAL_EVENTS_STORAGE_KEY = 'aps_local_analytics_events';
let lastTrackedPath = '';
let lastTrackedTime = 0;

export function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return 'in_memory_session';
  }
}

export function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (width >= 768 && width <= 1024)) {
    return 'tablet';
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    ) ||
    width < 768
  ) {
    return 'mobile';
  }
  return 'desktop';
}

export function categorizeReferrer(refUrl: string): string {
  if (!refUrl) return 'Direct';
  try {
    const url = new URL(refUrl);
    const host = url.hostname.toLowerCase();
    const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';

    if (host === currentHost) return 'Interne';
    if (host.includes('google')) return 'Google';
    if (host.includes('bing') || host.includes('yahoo') || host.includes('duckduckgo')) return 'Moteur de recherche';
    if (
      host.includes('facebook') ||
      host.includes('instagram') ||
      host.includes('twitter') ||
      host.includes('t.co') ||
      host.includes('x.com') ||
      host.includes('linkedin') ||
      host.includes('whatsapp') ||
      host.includes('tiktok') ||
      host.includes('youtube')
    ) {
      return 'Réseaux sociaux';
    }
    return host;
  } catch {
    return 'Direct';
  }
}

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

export function saveLocalAnalyticsEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalStoredAnalyticsEvents();
    const updated = [event, ...current].slice(0, 1000);
    localStorage.setItem(LOCAL_EVENTS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export async function recordRealEvent(
  eventType: AnalyticsEventType,
  details: {
    path?: string;
    page_title?: string;
    referrer?: string;
    target_id?: string;
    target_title?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<AnalyticsEvent> {
  const currentPath = details.path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const currentTitle = details.page_title || (typeof window !== 'undefined' ? document.title : '');
  const ref = details.referrer !== undefined ? details.referrer : (typeof window !== 'undefined' ? document.referrer : '');

  const event: AnalyticsEvent = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    session_id: getAnonymousSessionId(),
    event_type: eventType,
    path: currentPath,
    page_title: currentTitle,
    referrer: categorizeReferrer(ref),
    device_type: detectDeviceType(),
    browser: typeof window !== 'undefined' ? navigator.userAgent.split(' ')[0] : 'Node',
    country: 'BJ',
    target_id: details.target_id,
    target_title: details.target_title,
    metadata: details.metadata,
  };

  // 1. Immediate local persistence for testing & offline mode
  saveLocalAnalyticsEvent(event);

  // 2. Direct Supabase insert if browser client configured
  if (typeof window !== 'undefined' && isSupabaseConfigured && supabase) {
    try {
      await supabase.from('analytics_events').insert([event]);
      return event;
    } catch (err) {
      console.warn('Analytics direct insert note:', err);
    }
  }

  // 3. Fallback to server collection route
  if (typeof window !== 'undefined') {
    try {
      fetch('/api/analytics/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true,
      }).catch(() => null);
    } catch {}
  }

  return event;
}

export async function trackPageView(path: string, pageTitle?: string): Promise<void> {
  const now = Date.now();
  // Throttle duplicate pageview within 2 seconds on the exact same route
  if (path === lastTrackedPath && now - lastTrackedTime < 2000) {
    return;
  }
  lastTrackedPath = path;
  lastTrackedTime = now;

  await recordRealEvent('page_view', { path, page_title: pageTitle });
}

export async function trackEvent(
  eventType: AnalyticsEventType,
  details: {
    path?: string;
    page_title?: string;
    target_id?: string;
    target_title?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  await recordRealEvent(eventType, details);
}

export function computeSummaryFromEventList(
  events: AnalyticsEvent[],
  period: '7d' | '30d' | '90d' | 'custom',
  startDate: Date,
  endDate: Date
): AnalyticsPeriodSummary {
  // Filter events within window
  const filteredEvents = events.filter((ev) => {
    const t = new Date(ev.created_at).getTime();
    return t >= startDate.getTime() && t <= endDate.getTime();
  });

  const hasData = filteredEvents.length > 0;
  let totalPageViews = 0;
  const sessionsSet = new Set<string>();
  let callHeadquartersClicks = 0;
  let documentDownloads = 0;
  let projectViews = 0;
  let newsViews = 0;
  let opportunityViews = 0;

  const pageCounts: Record<string, { title: string; count: number }> = {};
  const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
  const sourceCounts: Record<string, number> = {};
  const dailyMap: Map<string, { pageViews: number; sessions: Set<string> }> = new Map();

  const cur = new Date(startDate);
  while (cur <= endDate) {
    const key = cur.toISOString().slice(0, 10);
    dailyMap.set(key, { pageViews: 0, sessions: new Set() });
    cur.setDate(cur.getDate() + 1);
  }

  for (const ev of filteredEvents) {
    sessionsSet.add(ev.session_id);

    if (ev.event_type === 'page_view') {
      totalPageViews++;
      const p = ev.path || '/';
      if (!pageCounts[p]) {
        pageCounts[p] = { title: ev.page_title || p, count: 0 };
      }
      pageCounts[p].count++;
    } else if (ev.event_type === 'click_call_headquarters') {
      callHeadquartersClicks++;
    } else if (ev.event_type === 'download_document') {
      documentDownloads++;
    } else if (ev.event_type === 'view_project') {
      projectViews++;
    } else if (ev.event_type === 'view_news') {
      newsViews++;
    } else if (ev.event_type === 'view_opportunity') {
      opportunityViews++;
    }

    const dev = ev.device_type || 'desktop';
    deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

    const src = ev.referrer || 'Direct';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;

    const dayKey = ev.created_at.slice(0, 10);
    const dayData = dailyMap.get(dayKey);
    if (dayData) {
      if (ev.event_type === 'page_view') {
        dayData.pageViews++;
      }
      dayData.sessions.add(ev.session_id);
    }
  }

  const topPages = Object.entries(pageCounts)
    .map(([path, data]) => ({
      path,
      title: data.title,
      views: data.count,
      percentage: totalPageViews > 0 ? Math.round((data.count / totalPageViews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const trafficByDate = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    pageViews: data.pageViews,
    sessions: data.sessions.size,
  }));

  const totalEvents = filteredEvents.length || 1;
  const deviceBreakdown = (['desktop', 'mobile', 'tablet'] as const).map((dev) => ({
    device: dev,
    count: deviceCounts[dev] || 0,
    percentage: Math.round(((deviceCounts[dev] || 0) / totalEvents) * 100),
  }));

  const sourcesBreakdown = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / totalEvents) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const actionsBreakdown = [
    { action: 'click_call_headquarters', label: 'Appels au siège', count: callHeadquartersClicks },
    { action: 'download_document', label: 'Téléchargements de documents', count: documentDownloads },
    { action: 'view_project', label: 'Consultations de projets', count: projectViews },
    { action: 'view_news', label: "Lectures d'actualités", count: newsViews },
    { action: 'view_opportunity', label: "Consultations d'offres", count: opportunityViews },
  ];

  return {
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    hasData,
    totalPageViews,
    totalSessions: sessionsSet.size,
    totalUniqueVisitors: sessionsSet.size,
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

export async function fetchAnalyticsData(
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: { start: string; end: string }
): Promise<AnalyticsPeriodSummary> {
  const now = new Date();
  let startDate = new Date();

  if (period === '7d') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === '30d') {
    startDate.setDate(now.getDate() - 30);
  } else if (period === '90d') {
    startDate.setDate(now.getDate() - 90);
  } else if (period === 'custom' && customRange?.start) {
    startDate = new Date(customRange.start);
  } else {
    startDate.setDate(now.getDate() - 30);
  }

  const endDate = period === 'custom' && customRange?.end ? new Date(customRange.end) : now;

  // Query parameters
  const params = new URLSearchParams();
  params.set('period', period);
  if (period === 'custom' && customRange) {
    params.set('startDate', customRange.start);
    params.set('endDate', customRange.end);
  }

  // Auth header if session exists
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined' && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {}
  }

  try {
    const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      const serverData = await res.json();
      if (serverData.hasData) {
        return serverData;
      }
      // If server has no events yet, check if there are locally tracked events
      const localEvents = getLocalStoredAnalyticsEvents();
      if (localEvents.length > 0) {
        const localSummary = computeSummaryFromEventList(localEvents, period, startDate, endDate);
        if (localSummary.hasData) {
          return localSummary;
        }
      }
      return serverData;
    }
  } catch (err) {
    console.warn('API Analytics non accessible, fallback sur événements locaux réels:', err);
  }

  // Fallback to real locally collected events
  const localEvents = getLocalStoredAnalyticsEvents();
  return computeSummaryFromEventList(localEvents, period, startDate, endDate);
}
