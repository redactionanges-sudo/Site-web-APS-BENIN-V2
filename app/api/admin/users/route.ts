import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, adminSupabase } from '@/lib/server-auth';
import { UserRole } from '@/types';

export const dynamic = 'force-dynamic';

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  const all = upper + lower + digits + symbols;
  for (let i = 4; i < 14; i++) {
    pwd.push(all[Math.floor(Math.random() * all.length)]);
  }
  return pwd.sort(() => Math.random() - 0.5).join('');
}

// -------------------------------------------------------------
// GET : Lister les utilisateurs avec profils réels Supabase
// -------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req, 'admin');
    if (!auth.ok || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Accès refusé' },
        { status: auth.status || 403 }
      );
    }

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Client administratif Supabase non configuré' },
        { status: 500 }
      );
    }

    const { data: profiles, error } = await adminSupabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /api/admin/users GET] Erreur profiles:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ users: profiles || [] });
  } catch (err: any) {
    console.error('[API /api/admin/users GET] Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// -------------------------------------------------------------
// POST : Créer un nouvel utilisateur (Super Admin requis)
// Crée le compte dans Supabase Auth + profil public.profiles
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req, 'super_admin');
    if (!auth.ok || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Seul le Super Administrateur peut créer des utilisateurs.' },
        { status: auth.status || 403 }
      );
    }

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Client administratif Supabase non initialisé sur le serveur.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { email, full_name, role, password, is_active } = body;

    // 1. Validation de l'adresse email
    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Veuillez renseigner une adresse email valide.' },
        { status: 400 }
      );
    }

    // 2. Validation du nom complet
    const cleanFullName = (full_name || '').trim();
    if (!cleanFullName || cleanFullName.length < 2) {
      return NextResponse.json(
        { error: 'Le nom et prénom de l’utilisateur sont obligatoires (au moins 2 caractères).' },
        { status: 400 }
      );
    }

    // 3. Validation du rôle
    const allowedRoles: UserRole[] = ['super_admin', 'admin', 'editor'];
    if (!role || !allowedRoles.includes(role as UserRole)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Les rôles autorisés sont : super_admin, admin, editor.' },
        { status: 400 }
      );
    }

    // 4. Validation ou génération du mot de passe
    let finalPassword = (password || '').trim();
    if (finalPassword) {
      if (finalPassword.length < 8) {
        return NextResponse.json(
          { error: 'Le mot de passe doit contenir au minimum 8 caractères.' },
          { status: 400 }
        );
      }
    } else {
      finalPassword = generateSecurePassword();
    }

    // 5. Vérifier si l'adresse email est déjà enregistrée dans public.profiles
    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Cette adresse e-mail est déjà utilisée' },
        { status: 409 }
      );
    }

    // 6. Vérifier si l'email existe déjà dans Supabase Auth
    try {
      const { data: userList } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
      const authConflict = userList?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );

      if (authConflict) {
        // Si l'utilisateur Auth existe déjà sans profil public.profiles, réparer ou signaler conflit
        return NextResponse.json(
          { error: 'Cette adresse e-mail est déjà utilisée' },
          { status: 409 }
        );
      }
    } catch (listErr) {
      console.warn('[API /api/admin/users POST] Vérification préalable auth non-bloquante:', listErr);
    }

    // 7. Créer réellement le compte dans Supabase Auth via adminSupabase
    const { data: authCreated, error: authCreateErr } = await adminSupabase.auth.admin.createUser({
      email: cleanEmail,
      password: finalPassword,
      email_confirm: true,
      user_metadata: {
        full_name: cleanFullName,
        role,
      },
    });

    if (authCreateErr || !authCreated?.user) {
      const errMsg = authCreateErr?.message || '';
      console.error('[API /api/admin/users POST] Erreur création Auth:', authCreateErr);

      if (
        errMsg.toLowerCase().includes('already') ||
        errMsg.toLowerCase().includes('duplicate') ||
        errMsg.toLowerCase().includes('exists')
      ) {
        return NextResponse.json(
          { error: 'Cette adresse e-mail est déjà utilisée' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: `Erreur Supabase Auth : ${errMsg}` },
        { status: 400 }
      );
    }

    const newUserId = authCreated.user.id;
    const isActiveStatus = is_active !== false;

    // 8. Créer l'enregistrement dans public.profiles avec l'UUID Auth
    const { data: createdProfile, error: profileInsertErr } = await adminSupabase
      .from('profiles')
      .insert({
        id: newUserId,
        email: cleanEmail,
        full_name: cleanFullName,
        role,
        is_active: isActiveStatus,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    // 9. PROTECTION ATOMIQUE / TRANSACTIONNELLE :
    // Si l'insertion dans public.profiles échoue, supprimer le compte Auth pour éviter un compte orphelin !
    if (profileInsertErr || !createdProfile) {
      console.error('[API /api/admin/users POST] Erreur insertion profile. Rollback Auth...', profileInsertErr);
      try {
        await adminSupabase.auth.admin.deleteUser(newUserId);
      } catch (rollbackErr) {
        console.error('[API /api/admin/users POST] Échec du rollback Auth:', rollbackErr);
      }

      return NextResponse.json(
        {
          error: `Erreur lors de la création du profil en base de données : ${profileInsertErr?.message || 'Inconnue'}`,
        },
        { status: 500 }
      );
    }

    // 10. Génération du lien de réinitialisation/invitation avec le domaine officiel
    const redirectUrl = 'https://www.apsbeninong.org/admin/reset-password';
    let recoveryLink: string | null = null;
    try {
      const linkRes = await adminSupabase.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
        options: { redirectTo: redirectUrl },
      });
      if (linkRes.data?.properties?.action_link) {
        recoveryLink = linkRes.data.properties.action_link;
      }
    } catch (linkErr) {
      console.warn('[API /api/admin/users POST] Génération du lien recovery non-critique:', linkErr);
    }

    // 11. Journalisation d'audit
    try {
      await adminSupabase.from('audit_logs').insert({
        user_id: auth.user.id,
        user_email: auth.user.email,
        user_name: auth.user.full_name,
        user_role: auth.user.role,
        action_type: 'creation',
        module: 'utilisateurs',
        module_label: 'Utilisateurs & Rôles',
        target_id: newUserId,
        target_title: `${cleanFullName} (${cleanEmail})`,
        summary: `Création du compte administrateur « ${cleanFullName} » avec le rôle ${role}`,
        changes: {
          role: { new: role },
          is_active: { new: isActiveStatus },
        },
      });
    } catch (auditErr) {
      console.warn('[API /api/admin/users POST] Audit log non-bloquant:', auditErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Utilisateur créé avec succès',
        user: createdProfile,
        initialPassword: finalPassword,
        recoveryLink,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API /api/admin/users POST] Erreur serveur:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur interne du serveur lors de la création de l’utilisateur' },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------
// PUT : Mettre à jour un utilisateur existant (Super Admin requis)
// Synchronise public.profiles et Supabase Auth
// -------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req, 'super_admin');
    if (!auth.ok || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Seul le Super Administrateur peut modifier les utilisateurs.' },
        { status: auth.status || 403 }
      );
    }

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Client administratif Supabase non initialisé sur le serveur.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { id, full_name, role, is_active, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'Identifiant utilisateur requis.' }, { status: 400 });
    }

    // Récupérer le profil existant
    const { data: existing, error: fetchErr } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    // Empêcher le super admin actuel de se retirer ses propres droits de super admin s'il est le seul
    if (existing.id === auth.user.id && role && role !== 'super_admin') {
      const { data: otherSuperAdmins } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('role', 'super_admin')
        .eq('is_active', true)
        .neq('id', existing.id);

      if (!otherSuperAdmins || otherSuperAdmins.length === 0) {
        return NextResponse.json(
          { error: 'Impossible de rétrograder le seul Super Administrateur actif du système.' },
          { status: 400 }
        );
      }
    }

    // Empêcher de désactiver son propre compte
    if (existing.id === auth.user.id && is_active === false) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas désactiver votre propre compte.' },
        { status: 400 }
      );
    }

    // Mettre à jour profiles
    const updatePayload: Record<string, any> = {};
    if (full_name !== undefined) updatePayload.full_name = full_name.trim();
    if (role !== undefined) updatePayload.role = role;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    const { data: updatedProfile, error: updateErr } = await adminSupabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[API /api/admin/users PUT] Erreur mise à jour profil:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Synchroniser avec Supabase Auth (métadonnées, mot de passe éventuel, bannissement si désactivé)
    const authUpdatePayload: any = {
      user_metadata: {
        full_name: updatedProfile.full_name,
        role: updatedProfile.role,
      },
    };

    if (password && password.trim().length >= 8) {
      authUpdatePayload.password = password.trim();
    }

    if (is_active === false) {
      // Bloque l'utilisateur dans Supabase Auth
      authUpdatePayload.ban_duration = '876000h';
    } else if (is_active === true) {
      // Débloque l'utilisateur
      authUpdatePayload.ban_duration = 'none';
    }

    try {
      await adminSupabase.auth.admin.updateUserById(id, authUpdatePayload);
    } catch (authSyncErr) {
      console.warn('[API /api/admin/users PUT] Synchro Auth metadata non-bloquante:', authSyncErr);
    }

    // Journalisation d'audit
    try {
      await adminSupabase.from('audit_logs').insert({
        user_id: auth.user.id,
        user_email: auth.user.email,
        user_name: auth.user.full_name,
        user_role: auth.user.role,
        action_type: 'modification',
        module: 'utilisateurs',
        module_label: 'Utilisateurs & Rôles',
        target_id: id,
        target_title: `${updatedProfile.full_name} (${updatedProfile.email})`,
        summary: `Mise à jour des informations et rôle de « ${updatedProfile.full_name} » (${updatedProfile.role})`,
        changes: {
          role: { old: existing.role, new: updatedProfile.role },
          is_active: { old: existing.is_active, new: updatedProfile.is_active },
          password_changed: !!password,
        },
      });
    } catch (auditErr) {
      console.warn('[API /api/admin/users PUT] Audit log non-bloquant:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: updatedProfile,
    });
  } catch (err: any) {
    console.error('[API /api/admin/users PUT] Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// -------------------------------------------------------------
// DELETE : Supprimer définitivement un utilisateur (Super Admin requis)
// Supprime de public.profiles ET de Supabase Auth
// -------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req, 'super_admin');
    if (!auth.ok || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Seul le Super Administrateur peut supprimer des utilisateurs.' },
        { status: auth.status || 403 }
      );
    }

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Client administratif Supabase non initialisé sur le serveur.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    let targetId = searchParams.get('id');

    if (!targetId) {
      try {
        const body = await req.json();
        targetId = body.id;
      } catch {}
    }

    if (!targetId) {
      return NextResponse.json({ error: 'Identifiant utilisateur requis.' }, { status: 400 });
    }

    // Empêcher l'auto-suppression
    if (targetId === auth.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte.' },
        { status: 400 }
      );
    }

    // Récupérer le profil cible
    const { data: targetProfile, error: fetchErr } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    if (fetchErr || !targetProfile) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    // Si la cible est un super_admin, vérifier qu'il reste un autre super_admin actif
    if (targetProfile.role === 'super_admin') {
      const { data: otherSuperAdmins } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('role', 'super_admin')
        .eq('is_active', true)
        .neq('id', targetId);

      if (!otherSuperAdmins || otherSuperAdmins.length === 0) {
        return NextResponse.json(
          { error: 'Impossible de supprimer le seul Super Administrateur restant.' },
          { status: 400 }
        );
      }
    }

    // 1. Supprimer de public.profiles
    const { error: profileDeleteErr } = await adminSupabase
      .from('profiles')
      .delete()
      .eq('id', targetId);

    if (profileDeleteErr) {
      console.error('[API /api/admin/users DELETE] Erreur suppression profile:', profileDeleteErr);
      return NextResponse.json(
        { error: `Erreur lors de la suppression du profil : ${profileDeleteErr.message}` },
        { status: 400 }
      );
    }

    // 2. Supprimer de Supabase Auth
    try {
      await adminSupabase.auth.admin.deleteUser(targetId);
    } catch (authDeleteErr: any) {
      console.warn('[API /api/admin/users DELETE] Erreur suppression compte Auth:', authDeleteErr);
    }

    // 3. Journalisation d'audit
    try {
      await adminSupabase.from('audit_logs').insert({
        user_id: auth.user.id,
        user_email: auth.user.email,
        user_name: auth.user.full_name,
        user_role: auth.user.role,
        action_type: 'suppression',
        module: 'utilisateurs',
        module_label: 'Utilisateurs & Rôles',
        target_id: targetId,
        target_title: `${targetProfile.full_name} (${targetProfile.email})`,
        summary: `Suppression définitive du compte utilisateur « ${targetProfile.full_name} » (${targetProfile.email})`,
      });
    } catch (auditErr) {
      console.warn('[API /api/admin/users DELETE] Audit log non-bloquant:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Compte utilisateur « ${targetProfile.full_name} » supprimé avec succès.`,
    });
  } catch (err: any) {
    console.error('[API /api/admin/users DELETE] Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
