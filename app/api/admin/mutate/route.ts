import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, checkTablePermission, adminSupabase } from '@/lib/server-auth';
import { unpackMedia } from '@/lib/supabase';

const ALLOWED_TABLES = new Set([
  'site_settings',
  'statistics',
  'domains',
  'projects',
  'news',
  'opportunities',
  'partners',
  'team_members',
  'governance',
  'documents',
  'albums',
  'media',
  'history_milestones',
  'contact_messages',
  'profiles',
  'audit_logs',
  'trash_items',
  'institutional_pages'
]);

const TABLE_COLUMNS: Record<string, string[]> = {
  site_settings: [
    'id', 'org_name', 'org_name_short', 'slogan_fr', 'slogan_en',
    'description_fr', 'description_en', 'creation_date',
    'official_registration_date', 'registration_reference', 'jo_reference',
    'ifu_number', 'address_location', 'address_locality', 'postal_box',
    'phones', 'email', 'logo_url', 'favicon_url', 'social_links', 'seo',
    'footer_text_fr', 'footer_text_en', 'updated_at'
  ],
  domains: [
    'id', 'slug', 'title_fr', 'title_en', 'short_desc_fr', 'short_desc_en',
    'full_desc_fr', 'full_desc_en', 'icon_name', 'order_index', 'is_active', 'created_at'
  ],
  projects: [
    'id', 'slug', 'title_fr', 'title_en', 'excerpt_fr', 'excerpt_en',
    'context_fr', 'context_en', 'problem_fr', 'problem_en',
    'objectives_fr', 'objectives_en', 'activities_fr', 'activities_en',
    'expected_results_fr', 'expected_results_en', 'achieved_results_fr',
    'achieved_results_en', 'beneficiaries_fr', 'beneficiaries_en',
    'intervention_zone', 'communes', 'period', 'duration',
    'partners', 'financial_partner', 'status', 'is_featured',
    'main_image', 'photos', 'videos', 'documents', 'created_at', 'updated_at'
  ],
  news: [
    'id', 'slug', 'title_fr', 'title_en', 'summary_fr', 'summary_en',
    'content_fr', 'content_en', 'author', 'category_fr', 'category_en',
    'main_image', 'gallery', 'video_url', 'documents', 'status',
    'published_at', 'created_at', 'seo_title', 'seo_description'
  ],
  opportunities: [
    'id', 'slug', 'title_fr', 'title_en', 'type', 'description_fr',
    'description_en', 'organization', 'published_at', 'deadline',
    'location_fr', 'location_en', 'conditions_fr', 'conditions_en',
    'documents_required_fr', 'documents_required_en', 'pdf_url',
    'external_link', 'contact_email', 'status', 'main_image', 'gallery', 'created_at'
  ],
  media: [
    'id', 'title_fr', 'title_en', 'type', 'url', 'thumbnail_url',
    'album_id', 'project_id', 'category', 'date', 'location',
    'alt_fr', 'alt_en', 'description_fr', 'description_en',
    'video_platform', 'created_at'
  ],
  albums: [
    'id', 'slug', 'title_fr', 'title_en', 'description_fr',
    'description_en', 'cover_image', 'date', 'project_id', 'photo_count'
  ],
  partners: [
    'id', 'name', 'logo', 'description_fr', 'description_en',
    'category', 'collaboration_scope_fr', 'collaboration_scope_en',
    'website_url', 'order_index', 'is_active'
  ],
  team_members: [
    'id', 'name', 'role_fr', 'role_en', 'photo', 'bio_fr',
    'bio_en', 'expertise_fr', 'expertise_en', 'category',
    'order_index', 'is_active'
  ],
  governance: [
    'id', 'name', 'title_fr', 'title_en', 'role_fr', 'role_en',
    'bio_fr', 'bio_en', 'organ', 'photo', 'order_index'
  ],
  documents: [
    'id', 'slug', 'title_fr', 'title_en', 'category', 'description_fr',
    'description_en', 'file_url', 'file_size', 'publication_year',
    'is_public', 'created_at'
  ],
  statistics: [
    'id', 'key', 'label_fr', 'label_en', 'value', 'order_index',
    'description_fr', 'description_en', 'is_published', 'created_at', 'updated_at'
  ],
  profiles: [
    'id', 'email', 'full_name', 'role', 'created_at', 'last_sign_in'
  ],
  history_milestones: [
    'id', 'year', 'title_fr', 'title_en', 'description_fr', 'description_en', 'order_index'
  ],
  contact_messages: [
    'id', 'name', 'email', 'phone', 'subject', 'message', 'status', 'created_at'
  ],
  audit_logs: [
    'id', 'created_at', 'user_id', 'user_email', 'user_name', 'user_role',
    'action_type', 'module', 'module_label', 'target_id', 'target_title',
    'summary', 'changes', 'metadata'
  ],
  trash_items: [
    'id', 'original_id', 'module', 'table_name', 'title', 'data',
    'previous_status', 'deleted_at', 'deleted_by_id', 'deleted_by_email', 'deleted_by_name'
  ],
  institutional_pages: [
    'id', 'slug', 'title_fr', 'title_en', 'subtitle_fr', 'subtitle_en',
    'badge_fr', 'badge_en', 'quote_fr', 'quote_en', 'intro_fr', 'intro_en',
    'body_html_fr', 'body_html_en', 'hero_image', 'hero_image_alt_fr',
    'hero_image_alt_en', 'images', 'blocks', 'meta_title_fr', 'meta_title_en',
    'meta_description_fr', 'meta_description_en', 'is_published', 'updated_at'
  ]
};

const TABLE_TO_MODULE_MAP: Record<string, { module: string; label: string }> = {
  projects: { module: 'projets', label: 'Projets' },
  news: { module: 'actualites', label: 'Actualités' },
  opportunities: { module: 'opportunites', label: 'Opportunités' },
  partners: { module: 'partenaires', label: 'Partenaires' },
  team_members: { module: 'equipe', label: 'Équipe' },
  governance: { module: 'gouvernance', label: 'Gouvernance' },
  documents: { module: 'documents', label: 'Documents & Rapports' },
  media: { module: 'mediatheque', label: 'Médiathèque' },
  albums: { module: 'mediatheque', label: 'Albums Photo' },
  domains: { module: 'domaines', label: "Domaines d'action" },
  statistics: { module: 'statistiques', label: 'Chiffres Clés' },
  site_settings: { module: 'parametres', label: 'Paramètres du Site' },
  history_milestones: { module: 'parametres', label: 'Historique & Jalons' },
  institutional_pages: { module: 'pages_institutionnelles', label: 'Pages Institutionnelles' },
  contact_messages: { module: 'messages', label: 'Messages Reçus' },
  profiles: { module: 'utilisateurs', label: 'Utilisateurs & Rôles' },
  trash_items: { module: 'corbeille', label: 'Corbeille' },
};

async function logMutationEvent(
  client: any,
  user: any,
  table: string,
  action: 'upsert' | 'delete',
  dataOrId: any,
  ip?: string,
  userAgent?: string
) {
  if (table === 'audit_logs') return;
  try {
    const meta = TABLE_TO_MODULE_MAP[table] || { module: 'systeme', label: table };
    let actionType = 'modification';
    let targetTitle = '';
    let targetId = '';
    let summary = '';
    let changes: any = undefined;

    if (action === 'delete') {
      actionType = 'suppression';
      targetId = typeof dataOrId === 'string' ? dataOrId : dataOrId?.id || '';
      targetTitle = dataOrId?.title_fr || dataOrId?.title_en || dataOrId?.full_name || dataOrId?.name || targetId;
      summary = `Suppression dans le module ${meta.label}`;
    } else {
      const data = dataOrId;
      targetId = data?.id || '';
      targetTitle =
        data?.title_fr ||
        data?.title_en ||
        data?.full_name ||
        data?.name ||
        data?.org_name ||
        data?.label_fr ||
        data?.subject ||
        targetId;

      if (data?.status === 'published') {
        actionType = 'publication';
      } else if (data?.status === 'draft' || data?.status === 'archived') {
        actionType = 'depublication';
      } else if (!data?.created_at || new Date(data?.created_at).getTime() > Date.now() - 5000) {
        actionType = 'creation';
      }

      summary = `${actionType === 'creation' ? 'Création' : actionType === 'publication' ? 'Publication' : 'Mise à jour'} de « ${targetTitle || 'élément'} » (${meta.label})`;

      const sanitizedChanges: Record<string, any> = {};
      for (const [k, v] of Object.entries(data || {})) {
        if (
          !['password', 'password_hash', 'token', 'secret'].includes(k.toLowerCase()) &&
          v !== undefined
        ) {
          sanitizedChanges[k] = typeof v === 'object' && v !== null ? JSON.stringify(v).slice(0, 200) : v;
        }
      }
      changes = sanitizedChanges;
    }

    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      user_id: user?.id,
      user_email: user?.email,
      user_name: user?.full_name || user?.email || 'Utilisateur non identifié',
      user_role: user?.role,
      action_type: actionType,
      module: meta.module,
      module_label: meta.label,
      target_id: targetId,
      target_title: String(targetTitle).slice(0, 180),
      summary: summary.slice(0, 300),
      changes: changes ? (typeof changes === 'object' ? changes : undefined) : undefined,
      metadata: {
        table,
        ip: ip ? ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.xxx.xxx') : undefined,
        user_agent: userAgent ? userAgent.slice(0, 150) : undefined,
      },
    };

    const targetClient = adminSupabase || client;
    if (targetClient) {
      const { error: insErr } = await targetClient.from('audit_logs').insert([logEntry]);
      if (insErr) {
        console.error('Audit logging failed on Supabase in mutate route:', insErr.message);
      }
    }
    return logEntry;
  } catch (err) {
    console.error('Audit logging error in mutate route:', err);
    return null;
  }
}

function sanitizeRow(table: string, raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const cols = TABLE_COLUMNS[table];
  if (!cols) return raw;
  const colSet = new Set(cols);
  const clean: Record<string, any> = {};
  for (const k of Object.keys(raw)) {
    if (colSet.has(k)) {
      clean[k] = raw[k];
    }
  }
  // Ensure required non-null fields
  if (table === 'media') {
    if (!clean.title_en) {
      clean.title_en = clean.title_fr || 'Untitled';
    }

    let is_active = raw.is_active;
    let show_in_hero = raw.show_in_hero;
    let hero_order = raw.hero_order;
    let desc_en = clean.description_en || raw.description_en || '';

    if (typeof desc_en === 'string' && desc_en.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(desc_en);
        if (show_in_hero === undefined && parsed.show_in_hero !== undefined) {
          show_in_hero = parsed.show_in_hero;
        }
        if (hero_order === undefined && parsed.hero_order !== undefined) {
          hero_order = parsed.hero_order;
        }
        if (is_active === undefined && parsed.is_active !== undefined) {
          is_active = parsed.is_active;
        }
        desc_en = parsed.desc_en !== undefined ? parsed.desc_en : (parsed.text !== undefined ? parsed.text : (parsed.description_en || ''));
      } catch {
        // ignore
      }
    }

    const final_show_in_hero = Boolean(show_in_hero);
    const final_hero_order = Number(hero_order) || 1;
    const final_is_active = is_active !== false;

    clean.description_en = JSON.stringify({
      desc_en,
      show_in_hero: final_show_in_hero,
      hero_order: final_hero_order,
      is_active: final_is_active,
      updated_at: new Date().toISOString(),
    });
  }

  // Ensure opportunities visual assets are preserved in database via external_link
  if (table === 'opportunities') {
    const main_image = clean.main_image || raw.main_image || '';
    const gallery = Array.isArray(clean.gallery) ? clean.gallery : (Array.isArray(raw.gallery) ? raw.gallery : []);
    const existingUrl = clean.external_link && !clean.external_link.startsWith('{') ? clean.external_link : undefined;

    if (main_image || (gallery && gallery.length > 0)) {
      clean.external_link = JSON.stringify({
        url: existingUrl,
        main_image,
        gallery,
      });
    } else if (clean.external_link && clean.external_link.startsWith('{')) {
      // User explicitly cleared images
      clean.external_link = existingUrl || null;
    }
  }

  // Ensure statistics key, values, and backward-compatible metadata packing
  if (table === 'statistics') {
    clean.key = clean.key || raw.key || raw.id || `stat_${Date.now()}`;
    clean.label_fr = clean.label_fr || raw.label_fr || 'Indicateur';
    clean.value = clean.value !== undefined ? String(clean.value) : (raw.value !== undefined ? String(raw.value) : '0');
    clean.order_index = Number(clean.order_index ?? raw.order_index ?? 0);
    const hasMeta = raw.is_published !== undefined || raw.description_fr || raw.description_en;
    if (hasMeta && (!clean.label_en || !clean.label_en.startsWith('{'))) {
      clean.label_en = JSON.stringify({
        en: clean.label_en || raw.label_en || clean.label_fr,
        desc_fr: clean.description_fr || raw.description_fr || '',
        desc_en: clean.description_en || raw.description_en || '',
        is_published: clean.is_published !== undefined ? clean.is_published : (raw.is_published !== false),
        updated_at: new Date().toISOString()
      });
    } else if (!clean.label_en) {
      clean.label_en = clean.label_fr;
    }
  }

  return clean;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate JWT and verify user, is_active, and legitimate role
    const auth = await authenticateServerRequest(req);
    if (!auth.ok || !auth.user || !auth.client) {
      return NextResponse.json(
        { error: auth.error || 'Authentification requise' },
        { status: auth.status || 401 }
      );
    }

    const body = await req.json();
    const { table, action, data, id } = body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      return NextResponse.json(
        { error: `Table '${table}' non autorisée ou inexistante` },
        { status: 400 }
      );
    }

    // 2. Enforce strict role-based table permissions
    const perm = checkTablePermission(table, auth.user.role);
    if (!perm.allowed) {
      return NextResponse.json(
        { error: perm.error || 'Privilèges insuffisants pour modifier cette table' },
        { status: 403 }
      );
    }

    // Use privileged service client if available on verified server route, otherwise authenticated client
    const client = adminSupabase || auth.client;

    if (action === 'upsert') {
      if (!data) {
        return NextResponse.json({ error: 'Données manquantes pour upsert' }, { status: 400 });
      }

      const sanitizedData = Array.isArray(data)
        ? data.map(item => sanitizeRow(table, item))
        : sanitizeRow(table, data);

      const { data: result, error } = await client
        .from(table)
        .upsert(sanitizedData)
        .select();

      if (error) {
        // Fallback if opportunities table does not have main_image or gallery yet
        if (table === 'opportunities' && error.message?.includes('column') && (error.message?.includes('main_image') || error.message?.includes('gallery'))) {
          console.warn('opportunities column missing in Supabase, retrying without main_image and gallery');
          const fallbackData = Array.isArray(sanitizedData)
            ? sanitizedData.map((item: any) => {
                const { main_image, gallery, ...rest } = item;
                return rest;
              })
            : (() => {
                const { main_image, gallery, ...rest } = sanitizedData;
                return rest;
              })();
          const { data: retryResult, error: retryError } = await client
            .from(table)
            .upsert(fallbackData)
            .select();
          if (!retryError) {
            const unpackedResult = Array.isArray(retryResult)
              ? retryResult.map((row: any) => {
                  try {
                    const parsed = row.external_link && row.external_link.startsWith('{') ? JSON.parse(row.external_link) : {};
                    return { ...row, main_image: parsed.main_image || '', gallery: parsed.gallery || [] };
                  } catch { return row; }
                })
              : retryResult;
            return NextResponse.json({ success: true, data: unpackedResult });
          }
        }

        // Fallback if statistics table does not have is_published or description_fr yet
        if (table === 'statistics' && error.message?.includes('column')) {
          console.warn('statistics optional column missing in Supabase, retrying with core columns');
          const stripExtra = (item: any) => {
            const { description_fr, description_en, is_published, created_at, updated_at, ...core } = item;
            return core;
          };
          const fallbackData = Array.isArray(sanitizedData)
            ? sanitizedData.map(stripExtra)
            : stripExtra(sanitizedData);
          const { data: retryResult, error: retryError } = await client
            .from(table)
            .upsert(fallbackData)
            .select();
          if (!retryError) {
            return NextResponse.json({ success: true, data: retryResult });
          }
        }

        console.error(`Supabase upsert error on ${table}:`, error);
        return NextResponse.json(
          { error: error.message || 'Erreur lors de l\'enregistrement dans Supabase' },
          { status: 400 }
        );
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const ua = req.headers.get('user-agent') || undefined;
      const auditLog = await logMutationEvent(client, auth.user, table, 'upsert', sanitizedData, ip, ua);

      if (table === 'media' && result) {
        const unpackedResult = Array.isArray(result)
          ? result.map(unpackMedia)
          : unpackMedia(result);
        return NextResponse.json({ success: true, data: unpackedResult, auditLog });
      }

      return NextResponse.json({ success: true, data: result, auditLog });
    }

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Identifiant manquant pour la suppression' }, { status: 400 });
      }
      const { error } = await client
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Supabase delete error on ${table}:`, error);
        return NextResponse.json(
          { error: error.message || 'Erreur lors de la suppression dans Supabase' },
          { status: 400 }
        );
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const ua = req.headers.get('user-agent') || undefined;
      const auditLog = await logMutationEvent(client, auth.user, table, 'delete', { id }, ip, ua);

      return NextResponse.json({ success: true, auditLog });
    }

    return NextResponse.json(
      { error: `Action '${action}' non reconnue (seuls 'upsert' et 'delete' sont supportés)` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
