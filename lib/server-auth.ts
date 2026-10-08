import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '@/types';

let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
if (rawUrl.endsWith('/')) rawUrl = rawUrl.slice(0, -1);
if (rawUrl.endsWith('/rest/v1')) rawUrl = rawUrl.replace(/\/rest\/v1$/, '');

const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const adminSupabase = serviceKey && rawUrl ? createClient(rawUrl, serviceKey) : null;

export interface AuthValidationResult {
  ok: boolean;
  status?: number;
  error?: string;
  user?: UserProfile;
  client?: any;
}

/**
 * Validates the user's JWT from the Authorization header,
 * verifies their existence in `profiles`, ensures `is_active = true`,
 * and checks their role ('super_admin' | 'admin' | 'editor').
 */
export async function authenticateServerRequest(
  req: NextRequest,
  requiredMinRole?: 'editor' | 'admin' | 'super_admin'
): Promise<AuthValidationResult> {
  if (!rawUrl || !anonKey) {
    return { ok: false, status: 500, error: 'Configuration Supabase incomplète sur le serveur' };
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { ok: false, status: 401, error: 'Authentification requise : Jeton de session manquant' };
  }

  // 1. Verify JWT with Supabase Auth
  const authClient = createClient(rawUrl, anonKey);
  const { data: authData, error: authErr } = await authClient.auth.getUser(token);

  if (authErr || !authData?.user) {
    return { ok: false, status: 401, error: 'Session invalide ou expirée' };
  }

  const clientWithToken = createClient(rawUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // 2. Fetch corresponding profile
  const dbClient = adminSupabase || clientWithToken;
  const { data: profile, error: profErr } = await dbClient
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profErr || !profile) {
    return { ok: false, status: 403, error: 'Profil administrateur non trouvé' };
  }

  // 3. Verify is_active
  if (profile.is_active === false) {
    return { ok: false, status: 403, error: 'Ce compte administrateur a été désactivé' };
  }

  // 4. Verify legitimate role
  const role = profile.role as UserRole;
  if (!role || !['super_admin', 'admin', 'editor'].includes(role)) {
    return { ok: false, status: 403, error: 'Rôle non autorisé pour accéder au Back-Office' };
  }

  // 5. Check role hierarchy if required
  if (requiredMinRole === 'super_admin' && role !== 'super_admin') {
    return { ok: false, status: 403, error: 'Opération strictement réservée au Super Administrateur' };
  }

  if (requiredMinRole === 'admin' && role !== 'super_admin' && role !== 'admin') {
    return { ok: false, status: 403, error: 'Opération réservée aux Administrateurs' };
  }

  return {
    ok: true,
    user: profile as UserProfile,
    client: clientWithToken,
  };
}

/**
 * Checks table-level mutation permissions according to APS-BÉNIN policy:
 * - 'profiles': strictly super_admin
 * - 'site_settings': strictly super_admin
 * - 'contact_messages': super_admin, admin
 * - Editorial tables: super_admin, admin, editor
 */
export function checkTablePermission(table: string, role: UserRole): { allowed: boolean; error?: string } {
  if (table === 'profiles') {
    if (role !== 'super_admin') {
      return { allowed: false, error: 'Seul le Super Administrateur peut gérer les profils et les rôles.' };
    }
    return { allowed: true };
  }

  if (table === 'site_settings') {
    if (role !== 'super_admin') {
      return { allowed: false, error: 'Seul le Super Administrateur peut modifier les paramètres généraux du site.' };
    }
    return { allowed: true };
  }

  if (table === 'contact_messages') {
    if (role !== 'super_admin' && role !== 'admin') {
      return { allowed: false, error: 'Gestion des messages réservée aux Administrateurs.' };
    }
    return { allowed: true };
  }

  // All other tables are editorial
  return { allowed: true };
}
