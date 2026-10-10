import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/server-auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, event_type, path, session_id } = body;

    if (!event_type || !path || !session_id) {
      return NextResponse.json({ error: 'Données analytiques incomplètes' }, { status: 400 });
    }

    const client = adminSupabase || supabase;
    if (isSupabaseConfigured && client) {
      const { error } = await client.from('analytics_events').insert([{
        id: id || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        created_at: body.created_at || new Date().toISOString(),
        session_id,
        event_type,
        path,
        page_title: body.page_title?.slice(0, 200) || '',
        referrer: body.referrer?.slice(0, 150) || 'Direct',
        device_type: body.device_type || 'desktop',
        browser: body.browser?.slice(0, 100) || '',
        country: body.country || 'BJ',
        target_id: body.target_id?.slice(0, 100),
        target_title: body.target_title?.slice(0, 200),
        metadata: body.metadata || {},
      }]);

      if (error) {
        console.warn('Erreur insertion analytics_events API:', error.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
