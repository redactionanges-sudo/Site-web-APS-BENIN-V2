import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, adminSupabase } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  try {
    // Requires at least admin role (super_admin or admin). Editors are forbidden.
    const auth = await authenticateServerRequest(req, 'admin');
    if (!auth.ok || !auth.user || !auth.client) {
      return NextResponse.json(
        { error: auth.error || 'Accès refusé' },
        { status: auth.status || 403 }
      );
    }

    const client = adminSupabase || auth.client;
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ users: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
