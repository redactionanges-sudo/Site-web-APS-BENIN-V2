import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, adminSupabase } from '@/lib/server-auth';
import { initialAuditLogs, sanitizeAuditData, MODULE_META } from '@/lib/audit';
import { AuditLog, AuditModule, AuditActionType } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.ok || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Non authentifié pour consulter le journal' },
        { status: 401 }
      );
    }

    if (auth.user.role !== 'super_admin' && auth.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès réservé aux Administrateurs et Super Administrateurs' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const moduleFilter = searchParams.get('module') as AuditModule | null;
    const actionFilter = searchParams.get('action') as AuditActionType | null;
    const userEmail = searchParams.get('user_email');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const client = adminSupabase || auth.client;

    if (client) {
      try {
        let query = client
          .from('audit_logs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(Math.min(limit, 300));

        if (moduleFilter) {
          query = query.eq('module', moduleFilter);
        }
        if (actionFilter) {
          query = query.eq('action_type', actionFilter);
        }
        if (userEmail) {
          query = query.eq('user_email', userEmail);
        }
        if (search) {
          query = query.or(`target_title.ilike.%${search}%,summary.ilike.%${search}%,user_name.ilike.%${search}%,user_email.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (!error && data) {
          // Filter out legacy mock data if any exist
          const cleaned = data.filter((item: any) => {
            if (['log-001', 'log-002', 'log-003', 'log-004', 'log-005', 'log-006', 'log-007'].includes(item.id)) return false;
            if (['Dr. Jean-Marc Houndété', 'Amina Dossou', 'Aïssatou Adekambi'].includes(item.user_name)) return false;
            return true;
          });

          return NextResponse.json({
            success: true,
            data: sanitizeAuditData(cleaned),
            total: count !== null && count !== undefined ? count : cleaned.length,
          });
        }
      } catch (dbErr) {
        console.warn('Erreur lecture Supabase audit_logs:', dbErr);
      }
    }

    // Return empty array when no genuine logs exist - never invent mock data or authors
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
    });
  } catch (err: any) {
    console.error('Erreur GET /api/admin/logs:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur interne lors de la récupération des logs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.ok || !auth.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { action_type, module, target_id, target_title, summary, changes, metadata } = body;

    if (!action_type || !module || !summary) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants (action_type, module, summary)' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const ua = req.headers.get('user-agent') || undefined;

    const entry: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      user_id: auth.user.id,
      user_email: auth.user.email,
      user_name: auth.user.full_name || auth.user.email || 'Utilisateur non identifié',
      user_role: auth.user.role,
      action_type,
      module,
      module_label: MODULE_META[module as AuditModule]?.label || module,
      target_id: target_id ? String(target_id) : undefined,
      target_title: target_title ? String(target_title) : undefined,
      summary: String(summary),
      changes: changes ? sanitizeAuditData(changes) : undefined,
      metadata: {
        ...(metadata || {}),
        ip: ip ? ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.xxx.xxx') : undefined,
        user_agent: ua ? ua.slice(0, 150) : undefined,
      },
    };

    const client = adminSupabase || auth.client;
    if (client) {
      try {
        await client.from('audit_logs').insert([entry]);
      } catch (insertErr) {
        console.warn('Erreur non-bloquante insert audit_logs API:', insertErr);
      }
    }

    return NextResponse.json({ success: true, data: entry });
  } catch (err: any) {
    console.error('Erreur POST /api/admin/logs:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur lors de la journalisation' },
      { status: 500 }
    );
  }
}
