import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, adminSupabase } from '@/lib/server-auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { TrashItem } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await authenticateServerRequest(req, 'editor');
  if (!auth.ok || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Non autorisé' }, { status: auth.status || 401 });
  }

  const client = adminSupabase || auth.client;
  if (!isSupabaseConfigured || !client) {
    return NextResponse.json({ trash: [] });
  }

  try {
    const { data, error } = await client
      .from('trash_items')
      .select('*')
      .order('deleted_at', { ascending: false });

    if (error) {
      console.warn('Erreur lecture Supabase trash_items:', error.message);
      // Table might not exist yet before migration
      return NextResponse.json({ trash: [], tableMissing: error.message.includes('relation') });
    }

    return NextResponse.json({ trash: data || [] });
  } catch (err: any) {
    console.error('Erreur GET /api/admin/trash:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur', trash: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateServerRequest(req, 'editor');
  if (!auth.ok || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Non autorisé' }, { status: auth.status || 401 });
  }

  const client = adminSupabase || auth.client;
  const user = auth.user;

  try {
    const body = await req.json();
    const { action, id, trashItem } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action requise' }, { status: 400 });
    }

    // 1. Move to Trash
    if (action === 'move_to_trash') {
      if (!trashItem || !trashItem.table_name || !trashItem.original_id) {
        return NextResponse.json({ error: 'Données de corbeille incomplètes' }, { status: 400 });
      }

      const itemToInsert: TrashItem = {
        id: trashItem.id || `trash-${trashItem.original_id}-${Date.now()}`,
        original_id: trashItem.original_id,
        module: trashItem.module,
        table_name: trashItem.table_name,
        title: trashItem.title || 'Élément',
        data: trashItem.data || {},
        previous_status: trashItem.previous_status,
        deleted_at: new Date().toISOString(),
        deleted_by_id: user.id,
        deleted_by_email: user.email,
        deleted_by_name: user.full_name,
      };

      if (client) {
        // First insert into trash_items
        const { error: insErr } = await client.from('trash_items').insert([itemToInsert]);
        if (insErr) {
          console.warn('Erreur insertion trash_items:', insErr.message);
        }

        // Then remove from original table
        const { error: delErr } = await client.from(trashItem.table_name).delete().eq('id', trashItem.original_id);
        if (delErr) {
          console.warn(`Erreur suppression table d'origine (${trashItem.table_name}):`, delErr.message);
        }

        // Record audit log
        try {
          await client.from('audit_logs').insert([{
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            created_at: new Date().toISOString(),
            user_id: user.id,
            user_email: user.email,
            user_name: user.full_name || user.email,
            user_role: user.role,
            action_type: 'corbeille',
            module: trashItem.module,
            module_label: trashItem.module,
            target_id: trashItem.original_id,
            target_title: trashItem.title,
            summary: `Mise en corbeille de « ${trashItem.title} » (${trashItem.module})`,
            metadata: { source: 'Back-Office CMS', table: trashItem.table_name },
          }]);
        } catch {}
      }

      return NextResponse.json({ success: true, item: itemToInsert });
    }

    // 2. Restore
    if (action === 'restore') {
      if (!id) return NextResponse.json({ error: 'ID requis pour restaurer' }, { status: 400 });

      let targetItem: TrashItem | null = null;
      if (client) {
        const { data, error } = await client.from('trash_items').select('*').eq('id', id).single();
        if (!error && data) targetItem = data;
      }

      if (!targetItem && trashItem) {
        targetItem = trashItem;
      }

      if (!targetItem) {
        return NextResponse.json({ error: 'Élément introuvable dans la corbeille' }, { status: 404 });
      }

      // Restore into original table
      if (client) {
        const restoreData = { ...(targetItem.data || {}) };
        restoreData.id = targetItem.original_id;
        
        // Restore previous status or safe fallback
        if (targetItem.previous_status) {
          if (['projects', 'news', 'opportunities'].includes(targetItem.table_name)) {
            restoreData.status = targetItem.previous_status;
          } else if (['team_members', 'partners', 'domains'].includes(targetItem.table_name)) {
            restoreData.is_active = targetItem.previous_status === 'active';
          }
        }

        const { error: upsertErr } = await client.from(targetItem.table_name).upsert(restoreData);
        if (upsertErr) {
          return NextResponse.json({ error: `Erreur restauration dans ${targetItem.table_name}: ${upsertErr.message}` }, { status: 500 });
        }

        // Remove from trash_items
        await client.from('trash_items').delete().eq('id', id);

        // Record audit log
        try {
          await client.from('audit_logs').insert([{
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            created_at: new Date().toISOString(),
            user_id: user.id,
            user_email: user.email,
            user_name: user.full_name || user.email,
            user_role: user.role,
            action_type: 'restauration',
            module: targetItem.module,
            module_label: targetItem.module,
            target_id: targetItem.original_id,
            target_title: targetItem.title,
            summary: `Restauration de « ${targetItem.title} » depuis la corbeille`,
            metadata: { source: 'Back-Office CMS', table: targetItem.table_name },
          }]);
        } catch {}
      }

      return NextResponse.json({ success: true, restoredId: targetItem.original_id });
    }

    // 3. Delete permanent
    if (action === 'delete_permanent') {
      if (!id) return NextResponse.json({ error: 'ID requis pour suppression définitive' }, { status: 400 });

      let targetItem: TrashItem | null = null;
      if (client) {
        const { data } = await client.from('trash_items').select('*').eq('id', id).maybeSingle();
        targetItem = data;

        await client.from('trash_items').delete().eq('id', id);

        // Record audit log
        try {
          await client.from('audit_logs').insert([{
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            created_at: new Date().toISOString(),
            user_id: user.id,
            user_email: user.email,
            user_name: user.full_name || user.email,
            user_role: user.role,
            action_type: 'suppression_definitive',
            module: targetItem?.module || 'corbeille',
            target_id: targetItem?.original_id || id,
            target_title: targetItem?.title || 'Élément',
            summary: `Suppression définitive de « ${targetItem?.title || id} » de la corbeille`,
            metadata: { source: 'Back-Office CMS' },
          }]);
        } catch {}
      }

      return NextResponse.json({ success: true });
    }

    // 4. Empty trash
    if (action === 'empty') {
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return NextResponse.json({ error: 'Action réservée aux administrateurs' }, { status: 403 });
      }

      if (client) {
        const { count } = await client.from('trash_items').select('*', { count: 'exact', head: true });
        await client.from('trash_items').delete().neq('id', 'keep_all_guard');

        try {
          await client.from('audit_logs').insert([{
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            created_at: new Date().toISOString(),
            user_id: user.id,
            user_email: user.email,
            user_name: user.full_name || user.email,
            user_role: user.role,
            action_type: 'suppression_definitive',
            module: 'corbeille',
            summary: `Vidage complet de la corbeille (${count || 0} éléments purgés définitivement)`,
            metadata: { source: 'Back-Office CMS' },
          }]);
        } catch {}
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (err: any) {
    console.error('Erreur POST /api/admin/trash:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
