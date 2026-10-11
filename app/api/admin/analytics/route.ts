import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, adminSupabase } from '@/lib/server-auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { computeSummaryFromEventList } from '@/lib/analytics';
import { AnalyticsEvent } from '@/types';

export async function GET(req: NextRequest) {
  // 1. Authentification admin (rôle editor minimum)
  const auth = await authenticateServerRequest(req, 'editor');
  if (!auth.ok || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Non autorisé' }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') || '30d') as '7d' | '30d' | '90d' | 'custom';
  const customStart = searchParams.get('startDate');
  const customEnd = searchParams.get('endDate');

  const now = new Date();
  let startDate = new Date();
  const endDate = new Date();

  if (period === '7d') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === '30d') {
    startDate.setDate(now.getDate() - 30);
  } else if (period === '90d') {
    startDate.setDate(now.getDate() - 90);
  } else if (period === 'custom' && customStart && customEnd) {
    startDate = new Date(customStart);
    startDate.setHours(0, 0, 0, 0);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
  }

  const client = adminSupabase || auth.client;
  if (!isSupabaseConfigured || !client) {
    return NextResponse.json({
      notConfigured: true,
      message: 'Supabase n\'est pas encore configuré sur le serveur.',
      ...computeSummaryFromEventList([], period, startDate, endDate),
    });
  }

  try {
    const { data, error } = await client
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      const isMissingTable =
        error.code === 'PGRST205' ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache');

      return NextResponse.json({
        notConfigured: isMissingTable,
        tableMissing: isMissingTable,
        error: isMissingTable
          ? 'La table analytics_events n\'a pas encore été créée dans la base Supabase. Veuillez exécuter le script de migration.'
          : error.message,
        ...computeSummaryFromEventList([], period, startDate, endDate),
      });
    }

    const events = (data || []) as AnalyticsEvent[];
    const summary = computeSummaryFromEventList(events, period, startDate, endDate);

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('Erreur GET /api/admin/analytics:', err);
    return NextResponse.json(
      {
        error: err?.message || 'Erreur interne lors de la récupération des statistiques.',
        ...computeSummaryFromEventList([], period, startDate, endDate),
      },
      { status: 500 }
    );
  }
}
