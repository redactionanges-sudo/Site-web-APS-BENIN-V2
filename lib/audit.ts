import { AuditLog, AuditActionType, AuditModule, UserProfile } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

export const MODULE_META: Record<
  AuditModule,
  { label: string; badge: string; icon: string }
> = {
  projets: { label: 'Projets', badge: 'bg-blue-900/60 text-blue-200 border-blue-700', icon: 'FolderKanban' },
  actualites: { label: 'Actualités', badge: 'bg-emerald-900/60 text-emerald-200 border-emerald-700', icon: 'Newspaper' },
  opportunites: { label: 'Opportunités', badge: 'bg-amber-900/60 text-amber-200 border-amber-700', icon: 'Briefcase' },
  partenaires: { label: 'Partenaires', badge: 'bg-indigo-900/60 text-indigo-200 border-indigo-700', icon: 'Handshake' },
  equipe: { label: 'Équipe', badge: 'bg-teal-900/60 text-teal-200 border-teal-700', icon: 'Users' },
  gouvernance: { label: 'Gouvernance', badge: 'bg-cyan-900/60 text-cyan-200 border-cyan-700', icon: 'Building' },
  documents: { label: 'Documents & Rapports', badge: 'bg-sky-900/60 text-sky-200 border-sky-700', icon: 'FileText' },
  mediatheque: { label: 'Médiathèque', badge: 'bg-fuchsia-900/60 text-fuchsia-200 border-fuchsia-700', icon: 'Image' },
  domaines: { label: "Domaines d'action", badge: 'bg-violet-900/60 text-violet-200 border-violet-700', icon: 'ShieldCheck' },
  statistiques: { label: 'Chiffres Clés', badge: 'bg-orange-900/60 text-orange-200 border-orange-700', icon: 'BarChart3' },
  parametres: { label: 'Paramètres du Site', badge: 'bg-gray-800 text-gray-200 border-gray-700', icon: 'Settings' },
  bandeau: { label: 'Bandeau Hero', badge: 'bg-yellow-900/60 text-yellow-200 border-yellow-700', icon: 'Bell' },
  messages: { label: 'Messages Reçus', badge: 'bg-pink-900/60 text-pink-200 border-pink-700', icon: 'Mail' },
  utilisateurs: { label: 'Utilisateurs & Rôles', badge: 'bg-purple-900/60 text-purple-200 border-purple-700', icon: 'UserCog' },
  authentification: { label: 'Authentification', badge: 'bg-stone-800 text-stone-200 border-stone-700', icon: 'Key' },
  systeme: { label: 'Système & Sync', badge: 'bg-rose-900/60 text-rose-200 border-rose-700', icon: 'Server' },
  corbeille: { label: 'Corbeille & Restauration', badge: 'bg-red-900/60 text-red-200 border-red-700', icon: 'Trash2' },
};

export const ACTION_META: Record<
  AuditActionType,
  { label: string; badge: string; color: string }
> = {
  creation: { label: 'Création', badge: 'bg-emerald-950 text-emerald-300 border border-emerald-800', color: 'emerald' },
  modification: { label: 'Modification', badge: 'bg-blue-950 text-blue-300 border border-blue-800', color: 'blue' },
  publication: { label: 'Publication', badge: 'bg-teal-950 text-teal-300 border border-teal-800', color: 'teal' },
  depublication: { label: 'Dépublication', badge: 'bg-amber-950 text-amber-300 border border-amber-800', color: 'amber' },
  suppression: { label: 'Suppression', badge: 'bg-rose-950 text-rose-300 border border-rose-800', color: 'rose' },
  corbeille: { label: 'Mise en corbeille', badge: 'bg-amber-950 text-amber-300 border border-amber-800', color: 'amber' },
  restauration: { label: 'Restauration', badge: 'bg-emerald-950 text-emerald-300 border border-emerald-800', color: 'emerald' },
  suppression_definitive: { label: 'Suppression définitive', badge: 'bg-red-950 text-red-300 border border-red-800', color: 'red' },
  connexion: { label: 'Connexion', badge: 'bg-purple-950 text-purple-300 border border-purple-800', color: 'purple' },
  deconnexion: { label: 'Déconnexion', badge: 'bg-slate-900 text-slate-300 border border-slate-700', color: 'slate' },
  export: { label: 'Export de données', badge: 'bg-indigo-950 text-indigo-300 border border-indigo-800', color: 'indigo' },
  synchronisation: { label: 'Synchronisation', badge: 'bg-cyan-950 text-cyan-300 border border-cyan-800', color: 'cyan' },
  securite: { label: 'Alerte sécurité', badge: 'bg-red-950 text-red-300 border border-red-800', color: 'red' },
};

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'authorization',
  'api_key',
  'service_role',
  'anon_key',
  'private_key',
]);

export function sanitizeAuditData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditData(item)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data as Record<string, any>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('secret')) {
      sanitized[key] = '[CONFIDENTIEL]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeAuditData(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized as T;
}

const AUDIT_STORAGE_KEY = 'aps_audit_logs_v1';

// Strict enforcement: NO fake/mock data in production or dev
export const initialAuditLogs: AuditLog[] = [];

/**
 * Filter out legacy mock/fake items that may have been saved to local storage previously.
 */
export function cleanLegacyMockLogs(logs: any[]): AuditLog[] {
  if (!Array.isArray(logs)) return [];
  const fakeIds = new Set(['log-001', 'log-002', 'log-003', 'log-004', 'log-005', 'log-006', 'log-007']);
  const fakeNames = new Set([
    'Dr. Jean-Marc Houndété',
    'Amina Dossou',
    'Aïssatou Adekambi',
    'Faux Utilisateur',
    'Utilisateur Test'
  ]);
  const fakeTitles = new Set([
    'Programme Nutrition & Sécurité Alimentaire dans l’Alibori',
    'Lancement officiel du projet Eau Propre à Malanville',
    'Recrutement d’un Spécialiste Suivi-Évaluation (M&E)'
  ]);

  return logs.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    if (fakeIds.has(item.id)) return false;
    if (item.user_name && fakeNames.has(item.user_name)) return false;
    if (item.target_title && fakeTitles.has(item.target_title)) return false;
    return true;
  });
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  // 1. Supabase PostgreSQL when available
  if (typeof window !== 'undefined' && isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && Array.isArray(data)) {
        const cleaned = cleanLegacyMockLogs(data);
        // Synchronize cleaned real records into localStorage for fast fallback
        try {
          localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(cleaned));
        } catch {}
        return cleaned;
      }
      if (error) {
        console.warn('Erreur lecture Supabase audit_logs:', error.message);
      }
    } catch (err) {
      console.warn('Exception récupération Supabase audit_logs:', err);
    }
  }

  // 2. Local storage persistence (purged of any legacy fake authors)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = cleanLegacyMockLogs(parsed);
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Erreur lecture localStorage audit:', e);
    }
  }

  // 3. Strict: return empty array when no events exist - NEVER invent authors or data
  return [];
}

export async function recordAuditLog(
  log: Omit<AuditLog, 'id' | 'created_at'> & { id?: string; created_at?: string }
): Promise<AuditLog> {
  // Determine verified author identity
  let userName = log.user_name?.trim();
  let userEmail = log.user_email?.trim();
  let userId = log.user_id;
  let userRole = log.user_role;

  // If author is missing or set to a placeholder, resolve from active verified session
  if (
    typeof window !== 'undefined' &&
    (!userName || userName === 'Système' || userName === 'Utilisateur système')
  ) {
    try {
      const saved = localStorage.getItem('aps_admin_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.full_name) userName = parsed.full_name;
        if (!userEmail && parsed.email) userEmail = parsed.email;
        if (!userId && parsed.id) userId = parsed.id;
        if (!userRole && parsed.role) userRole = parsed.role;
      }
    } catch {}
  }

  // Never fabricate names: if still undefined, specify explicitly « Utilisateur non identifié »
  if (!userName) {
    userName = userEmail || 'Utilisateur non identifié';
  }

  const newEntry: AuditLog = {
    id: log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: log.created_at || new Date().toISOString(),
    user_id: userId,
    user_email: userEmail,
    user_name: userName,
    user_role: userRole,
    action_type: log.action_type,
    module: log.module,
    module_label: log.module_label || MODULE_META[log.module]?.label || log.module,
    target_id: log.target_id,
    target_title: log.target_title,
    summary: log.summary,
    changes: log.changes ? sanitizeAuditData(log.changes) : undefined,
    metadata: log.metadata ? sanitizeAuditData(log.metadata) : undefined,
  };

  // 1. Immediate local cache persistence with broadcast event
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const current = cleanLegacyMockLogs(parsed);
      const updated = [newEntry, ...current.filter((item) => item.id !== newEntry.id)].slice(0, 300);
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));

      // Broadcast real-time update event across back-office views
      window.dispatchEvent(new CustomEvent('aps_audit_log_created', { detail: newEntry }));
    } catch (e) {
      console.warn('Erreur écriture local audit:', e);
    }
  }

  // 2. Direct Supabase insertion
  if (typeof window !== 'undefined' && isSupabaseConfigured && supabase) {
    try {
      const { error: insErr } = await supabase.from('audit_logs').insert([newEntry]);
      if (insErr) {
        console.warn('Supabase direct insert audit_logs failed, trying API route fallback:', insErr.message);
        // Fallback to server route /api/admin/logs
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
          await fetch('/api/admin/logs', {
            method: 'POST',
            headers,
            body: JSON.stringify(newEntry),
          });
        } catch (apiErr) {
          console.warn('API route fallback error:', apiErr);
        }
      }
    } catch (err) {
      console.warn('Erreur persistance Supabase audit:', err);
    }
  }

  return newEntry;
}

export function exportAuditLogsToCSV(logs: AuditLog[]): void {
  const headers = [
    'ID',
    'Date & Heure',
    'Utilisateur',
    'Email',
    'Rôle',
    'Action',
    'Module',
    'Cible (Titre/ID)',
    'Résumé',
  ];

  const rows = logs.map((log) => [
    `"${log.id}"`,
    `"${new Date(log.created_at).toLocaleString('fr-FR')}"`,
    `"${(log.user_name || '').replace(/"/g, '""')}"`,
    `"${(log.user_email || '').replace(/"/g, '""')}"`,
    `"${(log.user_role || '').replace(/"/g, '""')}"`,
    `"${ACTION_META[log.action_type]?.label || log.action_type}"`,
    `"${MODULE_META[log.module]?.label || log.module}"`,
    `"${(log.target_title || log.target_id || '').replace(/"/g, '""')}"`,
    `"${(log.summary || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `journal-actions-aps-benin-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAuditLogsToJSON(logs: AuditLog[]): void {
  const cleanLogs = sanitizeAuditData(logs);
  const jsonContent = JSON.stringify(cleanLogs, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `journal-actions-aps-benin-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
