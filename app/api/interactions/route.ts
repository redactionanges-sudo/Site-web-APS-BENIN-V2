import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { adminSupabase } from '@/lib/server-auth';

interface EngagementRecord {
  views: number;
  likes: number;
  updated_at: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const METRICS_FILE = path.join(DATA_DIR, 'engagement_metrics.json');

// Mémoire locale pour les environnements serverless à système de fichiers en lecture seule
let inMemoryMetrics: Record<string, EngagementRecord> = {};

function readLocalMetrics(): Record<string, EngagementRecord> {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      const raw = fs.readFileSync(METRICS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        inMemoryMetrics = { ...inMemoryMetrics, ...parsed };
      }
    }
  } catch {
    // Ignore read errors
  }
  return inMemoryMetrics;
}

function saveLocalMetrics(metrics: Record<string, EngagementRecord>) {
  inMemoryMetrics = metrics;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2), 'utf-8');
  } catch {
    // Ignore read-only filesystem errors (e.g. Vercel)
  }
}

/**
 * Récupère le dictionnaire des likes réels depuis Supabase site_settings.seo.likes
 */
async function getStoredLikes(): Promise<Record<string, number>> {
  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase
        .from('site_settings')
        .select('id, seo')
        .eq('id', 'aps-settings-primary')
        .maybeSingle();

      if (!error && data?.seo?.likes && typeof data.seo.likes === 'object') {
        return data.seo.likes;
      }
    } catch {
      // Fallback local
    }
  }
  const local = readLocalMetrics();
  const likesMap: Record<string, number> = {};
  for (const [k, v] of Object.entries(local)) {
    likesMap[k] = v.likes || 0;
  }
  return likesMap;
}

/**
 * Enregistre le nouveau nombre de likes réels
 */
async function saveStoredLikes(key: string, newCount: number): Promise<void> {
  if (adminSupabase) {
    try {
      const { data } = await adminSupabase
        .from('site_settings')
        .select('id, seo')
        .eq('id', 'aps-settings-primary')
        .maybeSingle();

      if (data) {
        const seo = data.seo || {};
        const likes = { ...(seo.likes || {}), [key]: newCount };
        await adminSupabase
          .from('site_settings')
          .update({ seo: { ...seo, likes } })
          .eq('id', 'aps-settings-primary');
      }
    } catch {
      // Fallback
    }
  }

  const local = readLocalMetrics();
  local[key] = {
    views: local[key]?.views || 0,
    likes: newCount,
    updated_at: new Date().toISOString(),
  };
  saveLocalMetrics(local);
}

/**
 * Calcule le nombre RÉEL de vues issues de la table officielle analytics_events
 * RÈGLE ABSOLUE : Zéro chiffre fictif. Si aucun événement, retourne 0.
 */
async function getRealViewsFromSupabase(
  type: string,
  id: string,
  slug?: string | null
): Promise<number> {
  if (!adminSupabase) return 0;

  try {
    const table = type === 'project' ? 'projects' : 'news';
    let resolvedId = id;
    let resolvedSlug = slug || '';

    // Si le slug n'est pas fourni, résolution rapide depuis la table
    if (!resolvedSlug) {
      const { data } = await adminSupabase
        .from(table)
        .select('id, slug')
        .or(`id.eq.${id},slug.eq.${id}`)
        .maybeSingle();

      if (data) {
        resolvedId = data.id || id;
        resolvedSlug = data.slug || '';
      }
    }

    const prefix = type === 'project' ? '/projets/' : '/actualites/';
    const filterConditions = new Set<string>();

    if (resolvedSlug) {
      filterConditions.add(`path.eq.${prefix}${resolvedSlug}`);
      filterConditions.add(`path.eq.${prefix}${encodeURIComponent(resolvedSlug)}`);
      filterConditions.add(`target_id.eq.${resolvedSlug}`);
    }
    if (resolvedId) {
      filterConditions.add(`path.eq.${prefix}${resolvedId}`);
      filterConditions.add(`target_id.eq.${resolvedId}`);
    }

    if (filterConditions.size === 0) return 0;

    const { count, error } = await adminSupabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .or(Array.from(filterConditions).join(','));

    if (error) {
      console.warn('Error fetching views from analytics_events:', error.message);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.warn('Exception querying analytics views:', err);
    return 0;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'news';
  const id = searchParams.get('id');
  const slug = searchParams.get('slug');
  const idsParam = searchParams.get('ids');

  // Support de requêtes par lots (batch) pour les grilles d'actualités et projets
  if (idsParam) {
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    const likesMap = await getStoredLikes();
    const results: Record<string, { views: number; likes: number }> = {};

    await Promise.all(
      ids.map(async (itemId) => {
        const key = `${type}:${itemId}`;
        const realViews = await getRealViewsFromSupabase(type, itemId);
        results[itemId] = {
          views: realViews,
          likes: likesMap[key] || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      batch: true,
      results,
    });
  }

  if (!id) {
    return NextResponse.json({ error: 'Identifiant requis' }, { status: 400 });
  }

  const key = `${type}:${id}`;
  const realViews = await getRealViewsFromSupabase(type, id, slug);
  const likesMap = await getStoredLikes();
  const realLikes = likesMap[key] || 0;

  return NextResponse.json({
    success: true,
    key,
    views: realViews,
    likes: realLikes,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type = 'news', id, slug, action = 'view' } = body;

    if (!id) {
      return NextResponse.json({ error: 'Identifiant requis' }, { status: 400 });
    }

    const key = `${type}:${id}`;
    const likesMap = await getStoredLikes();
    let currentLikes = likesMap[key] || 0;

    if (action === 'like') {
      currentLikes += 1;
      await saveStoredLikes(key, currentLikes);
    } else if (action === 'unlike') {
      currentLikes = Math.max(0, currentLikes - 1);
      await saveStoredLikes(key, currentLikes);
    }

    const realViews = await getRealViewsFromSupabase(type, id, slug);

    return NextResponse.json({
      success: true,
      key,
      views: realViews,
      likes: currentLikes,
    });
  } catch (err: any) {
    console.error('Error handling interaction:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
