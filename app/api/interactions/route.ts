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

function ensureMetricsFile(): Record<string, EngagementRecord> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(METRICS_FILE)) {
      const initialSeed: Record<string, EngagementRecord> = {
        'news:news-1': { views: 428, likes: 64, updated_at: new Date().toISOString() },
        'news:news-2': { views: 312, likes: 45, updated_at: new Date().toISOString() },
        'news:news-3': { views: 254, likes: 38, updated_at: new Date().toISOString() },
        'project:proj-1': { views: 890, likes: 112, updated_at: new Date().toISOString() },
        'project:proj-2': { views: 654, likes: 87, updated_at: new Date().toISOString() },
        'project:proj-3': { views: 520, likes: 73, updated_at: new Date().toISOString() },
        'project:proj-4': { views: 410, likes: 59, updated_at: new Date().toISOString() },
        'project:act-1': { views: 285, likes: 41, updated_at: new Date().toISOString() },
        'project:act-2': { views: 198, likes: 29, updated_at: new Date().toISOString() },
      };
      fs.writeFileSync(METRICS_FILE, JSON.stringify(initialSeed, null, 2), 'utf-8');
      return initialSeed;
    }
    const raw = fs.readFileSync(METRICS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading engagement metrics:', err);
    return {};
  }
}

function saveMetricsFile(metrics: Record<string, EngagementRecord>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving engagement metrics:', err);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'news';
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Identifiant requis' }, { status: 400 });
  }

  const key = `${type}:${id}`;
  const metrics = ensureMetricsFile();
  const item = metrics[key] || { views: 1, likes: 0, updated_at: new Date().toISOString() };

  return NextResponse.json({
    success: true,
    key,
    views: item.views || 0,
    likes: item.likes || 0,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type = 'news', id, action = 'view' } = body;

    if (!id) {
      return NextResponse.json({ error: 'Identifiant requis' }, { status: 400 });
    }

    const key = `${type}:${id}`;
    const metrics = ensureMetricsFile();

    if (!metrics[key]) {
      metrics[key] = {
        views: action === 'view' ? 1 : 0,
        likes: action === 'like' ? 1 : 0,
        updated_at: new Date().toISOString(),
      };
    } else {
      if (action === 'view') {
        metrics[key].views = (metrics[key].views || 0) + 1;
      } else if (action === 'like') {
        metrics[key].likes = (metrics[key].likes || 0) + 1;
      } else if (action === 'unlike') {
        metrics[key].likes = Math.max(0, (metrics[key].likes || 1) - 1);
      }
      metrics[key].updated_at = new Date().toISOString();
    }

    saveMetricsFile(metrics);

    if (adminSupabase && (action === 'like' || action === 'unlike')) {
      const targetTable = type === 'project' ? 'projects' : 'news';
      try {
        await adminSupabase
          .from(targetTable)
          .update({ likes_count: metrics[key].likes })
          .eq('id', id);
      } catch {
        // Ignorer en mode local sans base connectée
      }
    }

    return NextResponse.json({
      success: true,
      key,
      views: metrics[key].views,
      likes: metrics[key].likes,
    });
  } catch (err: any) {
    console.error('Error handling interaction:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
