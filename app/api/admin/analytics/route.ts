import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, adminSupabase } from '@/lib/server-auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AnalyticsEvent, AnalyticsPeriodSummary } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') || '30d') as '7d' | '30d' | '90d' | 'custom';
  const customStart = searchParams.get('startDate');
  const customEnd = searchParams.get('endDate');

  // Calculate Date bounds
  const now = new Date();
  let startDate = new Date();

  if (period === '7d') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === '30d') {
    startDate.setDate(now.getDate() - 30);
  } else if (period === '90d') {
    startDate.setDate(now.getDate() - 90);
  } else if (period === 'custom' && customStart) {
    startDate = new Date(customStart);
  } else {
    startDate.setDate(now.getDate() - 30);
  }

  const endDate = period === 'custom' && customEnd ? new Date(customEnd) : now;

  // 1. Authenticate admin user
  const auth = await authenticateServerRequest(req, 'editor');
  if (!auth.ok || !auth.user) {
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        hasData: false,
        totalPageViews: 0,
        totalSessions: 0,
        totalUniqueVisitors: 0,
        callHeadquartersClicks: 0,
        documentDownloads: 0,
        projectViews: 0,
        newsViews: 0,
        opportunityViews: 0,
        topPages: [],
        trafficByDate: [],
        deviceBreakdown: [],
        sourcesBreakdown: [],
        actionsBreakdown: [],
        lastUpdated: new Date().toISOString(),
        notConfigured: true,
      });
    }
    return NextResponse.json({ error: auth.error || 'Non autorisé' }, { status: auth.status || 401 });
  }

  let events: AnalyticsEvent[] = [];
  const client = adminSupabase || auth.client;

  // 2. Fetch real events from Supabase
  if (isSupabaseConfigured && client) {
    try {
      const { data, error } = await client
        .from('analytics_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        events = data as AnalyticsEvent[];
      } else if (error) {
        console.warn('Erreur lecture Supabase analytics_events:', error.message);
      }
    } catch (err) {
      console.warn('Exception lecture analytics:', err);
    }
  }

  // 3. Compute real KPIs
  const hasData = events.length > 0;

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

  // Populate days interval to avoid missing dates in charts
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const key = cur.toISOString().slice(0, 10);
    dailyMap.set(key, { pageViews: 0, sessions: new Set() });
    cur.setDate(cur.getDate() + 1);
  }

  // Process real events
  for (const ev of events) {
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

    // Devices
    const dev = ev.device_type || 'desktop';
    deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

    // Sources
    const src = ev.referrer || 'Direct';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;

    // Daily
    const dayKey = ev.created_at.slice(0, 10);
    const dayData = dailyMap.get(dayKey);
    if (dayData) {
      if (ev.event_type === 'page_view') {
        dayData.pageViews++;
      }
      dayData.sessions.add(ev.session_id);
    }
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
    .slice(0, 10);

  // Traffic by Date
  const trafficByDate = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    pageViews: data.pageViews,
    sessions: data.sessions.size,
  }));

  // Device Breakdown
  const totalEvents = events.length || 1;
  const deviceBreakdown = (['desktop', 'mobile', 'tablet'] as const).map((dev) => ({
    device: dev,
    count: deviceCounts[dev] || 0,
    percentage: Math.round(((deviceCounts[dev] || 0) / totalEvents) * 100),
  }));

  // Sources Breakdown
  const sourcesBreakdown = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / totalEvents) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Actions Breakdown
  const actionsBreakdown = [
    { action: 'click_call_headquarters', label: 'Appels au siège', count: callHeadquartersClicks },
    { action: 'download_document', label: 'Téléchargements de documents', count: documentDownloads },
    { action: 'view_project', label: 'Consultations de projets', count: projectViews },
    { action: 'view_news', label: "Lectures d'actualités", count: newsViews },
    { action: 'view_opportunity', label: "Consultations d'offres", count: opportunityViews },
  ];

  const summary: AnalyticsPeriodSummary = {
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

  return NextResponse.json(summary);
}
