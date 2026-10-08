-- ====================================================================
-- APS-BÉNIN : MIGRATION DES RÔLES ET HARDENING RLS
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ====================================================================

-- 1. ÉVOLUTION DU TYPE ENUM DES RÔLES
DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'editor';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. ASSURER LA PRÉSENCE DE LA COLONNE is_active SUR profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. MIGRER LES UTILISATEURS DU RÔLE OBSOLÈTE 'admin_editor' VERS 'admin' OU 'editor'
-- Note : pour Anges Kevin (angeskevina@gmail.com), assignation au rôle légitime 'admin' (ou 'editor')
UPDATE profiles
SET role = 'admin'
WHERE role::text = 'admin_editor';

-- 4. FONCTIONS DE CONTRÔLE DE RÔLE (SECURITY DEFINER AVEC SEARCH_PATH FIXÉ)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role::text = 'super_admin'
          AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role::text IN ('super_admin', 'admin')
          AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role::text IN ('super_admin', 'admin', 'editor')
          AND is_active = true
    );
$$;

-- 5. TRIGGER DE PROTECTION CONTRE L'AUTO-PROMOTION SUR profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_self_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Bloquer tout changement de rôle par un non-super_admin
    IF (OLD.role IS DISTINCT FROM NEW.role) AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Seul le Super Administrateur est autorisé à modifier les rôles utilisateurs.';
    END IF;

    -- Bloquer l'activation / désactivation par un non-super_admin
    IF (OLD.is_active IS DISTINCT FROM NEW.is_active) AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Seul le Super Administrateur est autorisé à activer ou désactiver un compte.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_self_promotion ON public.profiles;
CREATE TRIGGER trg_prevent_profile_self_promotion
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_self_promotion();

-- 6. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS) GRANULAIRES
-- Supprimer les anciennes politiques globales trop permissives
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to site_settings" ON site_settings;
DROP POLICY IF EXISTS "Admins have full access to statistics" ON statistics;
DROP POLICY IF EXISTS "Admins have full access to domains" ON domains;
DROP POLICY IF EXISTS "Admins have full access to projects" ON projects;
DROP POLICY IF EXISTS "Admins have full access to news" ON news;
DROP POLICY IF EXISTS "Admins have full access to opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins have full access to partners" ON partners;
DROP POLICY IF EXISTS "Admins have full access to team" ON team_members;
DROP POLICY IF EXISTS "Admins have full access to governance" ON governance;
DROP POLICY IF EXISTS "Admins have full access to documents" ON documents;
DROP POLICY IF EXISTS "Admins have full access to albums" ON albums;
DROP POLICY IF EXISTS "Admins have full access to media" ON media;
DROP POLICY IF EXISTS "Admins have full access to history" ON history_milestones;
DROP POLICY IF EXISTS "Admins have full access to contact messages" ON contact_messages;

-- RLS PROFILES : Lecture admin/self, écriture strictement super_admin
DROP POLICY IF EXISTS "Authorized users can view profiles" ON profiles;
CREATE POLICY "Authorized users can view profiles" ON profiles
    FOR SELECT TO authenticated
    USING (public.is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Super admin can insert profiles" ON profiles;
CREATE POLICY "Super admin can insert profiles" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin or self update profiles" ON profiles;
CREATE POLICY "Super admin or self update profiles" ON profiles
    FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR auth.uid() = id)
    WITH CHECK (public.is_super_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Super admin can delete profiles" ON profiles;
CREATE POLICY "Super admin can delete profiles" ON profiles
    FOR DELETE TO authenticated
    USING (public.is_super_admin());

-- RLS SITE SETTINGS : Super Admin uniquement pour modifications
DROP POLICY IF EXISTS "Super admin manage site settings" ON site_settings;
CREATE POLICY "Super admin manage site settings" ON site_settings
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- RLS MESSAGES DE CONTACT : Admins & Super Admin uniquement
DROP POLICY IF EXISTS "Admins manage contact messages" ON contact_messages;
CREATE POLICY "Admins manage contact messages" ON contact_messages
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS CONTENUS ÉDITORIAUX (Éditeurs, Admins, Super Admin)
DROP POLICY IF EXISTS "Editors manage statistics" ON statistics;
CREATE POLICY "Editors manage statistics" ON statistics
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors manage domains" ON domains;
CREATE POLICY "Editors manage domains" ON domains
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors manage projects" ON projects;
CREATE POLICY "Editors manage projects" ON projects
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors manage news" ON news;
CREATE POLICY "Editors manage news" ON news
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors manage opportunities" ON opportunities;
CREATE POLICY "Editors manage opportunities" ON opportunities
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors manage partners" ON partners;
CREATE POLICY "Editors manage partners" ON partners
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors manage team" ON team_members;
CREATE POLICY "Editors manage team" ON team_members
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors manage governance" ON governance;
CREATE POLICY "Editors manage governance" ON governance
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors manage documents" ON documents;
CREATE POLICY "Editors manage documents" ON documents
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors manage albums" ON albums;
CREATE POLICY "Editors manage albums" ON albums
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors manage media" ON media;
CREATE POLICY "Editors manage media" ON media
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Editors manage history" ON history_milestones;
CREATE POLICY "Editors manage history" ON history_milestones
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());
