import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').trim();
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const sbClient = (serviceKey || anonKey) && rawUrl
  ? createClient(rawUrl, serviceKey || anonKey)
  : null;

export async function POST(req: NextRequest) {
  try {
    let body: any;
    const contentType = req.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        body = await req.json();
      } else {
        const text = await req.text();
        if (!text || !text.trim()) {
          return NextResponse.json({ error: 'Payload vide' }, { status: 400 });
        }
        body = JSON.parse(text);
      }
    } catch {
      return NextResponse.json({ error: 'Format JSON invalide' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || !body.event_type || !body.path) {
      return NextResponse.json({ error: 'Payload invalide : event_type et path requis' }, { status: 400 });
    }

    // Préparation de l'événement sécurisé
    const event = {
      id: body.id || 'evt_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      created_at: body.created_at || new Date().toISOString(),
      session_id: body.session_id || 'anon_sess',
      event_type: body.event_type,
      path: body.path.slice(0, 500),
      page_title: body.page_title ? String(body.page_title).slice(0, 300) : null,
      referrer: body.referrer ? String(body.referrer).slice(0, 500) : null,
      device_type: body.device_type || 'desktop',
      browser: body.browser ? String(body.browser).slice(0, 100) : null,
      country: body.country || 'BJ',
      target_id: body.target_id ? String(body.target_id).slice(0, 150) : null,
      target_title: body.target_title ? String(body.target_title).slice(0, 300) : null,
      metadata: body.metadata || null,
    };

    if (sbClient) {
      const { error } = await sbClient.from('analytics_events').insert([event]);
      if (error) {
        // Table may not exist yet in database or RLS check
        return NextResponse.json({ success: true, stored: 'unmigrated_table', warning: error.message });
      }
      return NextResponse.json({ success: true, stored: 'supabase' });
    }

    return NextResponse.json({ success: true, stored: 'local' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
