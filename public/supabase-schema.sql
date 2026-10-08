-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR APS-BÉNIN INSTITUTIONAL CMS
-- AGISSONS POUR SAUVER – APS-BÉNIN
-- Slogan: "Pour un monde plus juste et égalitaire"
-- Localisation: Djacoṭé-Comè, Département du Mono, République du Bénin
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & ROLES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'editor');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'editor';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('upcoming', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE news_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opp_status AS ENUM ('open', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE msg_status AS ENUM ('unread', 'read', 'replied');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES / USERS
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'editor',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in TIMESTAMPTZ
);

-- Ensure is_active column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 4. SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY DEFAULT 'aps-settings-primary',
    org_name TEXT NOT NULL DEFAULT 'AGISSONS POUR SAUVER – APS-BÉNIN',
    org_name_short TEXT NOT NULL DEFAULT 'APS-BÉNIN',
    slogan_fr TEXT NOT NULL DEFAULT 'Pour un monde plus juste et égalitaire',
    slogan_en TEXT NOT NULL DEFAULT 'For a more just and egalitarian world',
    description_fr TEXT,
    description_en TEXT,
    creation_date TEXT DEFAULT 'Septembre 2014',
    official_registration_date TEXT DEFAULT '20 septembre 2017',
    registration_reference TEXT DEFAULT 'N°9/040PDM/SG/STCCD- du 20 septembre 2017',
    jo_reference TEXT DEFAULT 'JO N°21 du 1er Novembre 2017',
    ifu_number TEXT DEFAULT '6 2022 1407 5648',
    address_location TEXT DEFAULT 'Djacoṭé-Comè, Département du Mono, République du Bénin',
    address_locality TEXT DEFAULT 'Comè, Département du Mono',
    postal_box TEXT DEFAULT 'BP 69 Comè – République du Bénin',
    phones TEXT[] DEFAULT ARRAY['+229 52 94 83 23', '+229 96 44 83 62'],
    email TEXT DEFAULT 'agissonspoursauver@gmail.com',
    logo_url TEXT,
    favicon_url TEXT,
    social_links JSONB DEFAULT '{"facebook":"","twitter":"","linkedin":"","instagram":"","tiktok":"","youtube":""}'::jsonb,
    seo JSONB DEFAULT '{"meta_title_fr":"","meta_title_en":"","meta_description_fr":"","meta_description_en":"","og_image":""}'::jsonb,
    footer_text_fr TEXT,
    footer_text_en TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. KEY STATISTICS
CREATE TABLE IF NOT EXISTS statistics (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    label_fr TEXT NOT NULL,
    label_en TEXT NOT NULL,
    value TEXT NOT NULL,
    order_index INT DEFAULT 0
);

-- 6. DOMAINS OF INTERVENTION
CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    short_desc_fr TEXT,
    short_desc_en TEXT,
    full_desc_fr TEXT,
    full_desc_en TEXT,
    icon_name TEXT DEFAULT 'ShieldCheck',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    excerpt_fr TEXT,
    excerpt_en TEXT,
    context_fr TEXT,
    context_en TEXT,
    problem_fr TEXT,
    problem_en TEXT,
    objectives_fr TEXT,
    objectives_en TEXT,
    activities_fr TEXT,
    activities_en TEXT,
    expected_results_fr TEXT,
    expected_results_en TEXT,
    achieved_results_fr TEXT,
    achieved_results_en TEXT,
    beneficiaries_fr TEXT,
    beneficiaries_en TEXT,
    intervention_zone TEXT,
    communes TEXT[],
    period TEXT,
    duration TEXT,
    partners TEXT[],
    financial_partner TEXT,
    status project_status DEFAULT 'in_progress',
    is_featured BOOLEAN DEFAULT FALSE,
    main_image TEXT,
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    videos TEXT[] DEFAULT ARRAY[]::TEXT[],
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. NEWS
CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    summary_fr TEXT,
    summary_en TEXT,
    content_fr TEXT,
    content_en TEXT,
    author TEXT DEFAULT 'Cellule Communication APS-BÉNIN',
    category_fr TEXT DEFAULT 'Actualité',
    category_en TEXT DEFAULT 'News',
    main_image TEXT,
    gallery TEXT[] DEFAULT ARRAY[]::TEXT[],
    video_url TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    status news_status DEFAULT 'published',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    seo_title TEXT,
    seo_description TEXT
);

-- 9. OPPORTUNITIES
CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    type TEXT NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    organization TEXT DEFAULT 'AGISSONS POUR SAUVER – APS-BÉNIN',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    deadline TIMESTAMPTZ NOT NULL,
    location_fr TEXT,
    location_en TEXT,
    conditions_fr TEXT,
    conditions_en TEXT,
    documents_required_fr TEXT,
    documents_required_en TEXT,
    pdf_url TEXT,
    external_link TEXT,
    contact_email TEXT DEFAULT 'agissonspoursauver@gmail.com',
    status opp_status DEFAULT 'open',
    main_image TEXT,
    gallery TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PARTNERS
CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    category TEXT DEFAULT 'technical',
    collaboration_scope_fr TEXT,
    collaboration_scope_en TEXT,
    website_url TEXT,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 11. TEAM MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role_fr TEXT NOT NULL,
    role_en TEXT NOT NULL,
    photo TEXT,
    bio_fr TEXT,
    bio_en TEXT,
    expertise_fr TEXT,
    expertise_en TEXT,
    category TEXT DEFAULT 'operations',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 12. GOVERNANCE
CREATE TABLE IF NOT EXISTS governance (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    role_fr TEXT,
    role_en TEXT,
    bio_fr TEXT,
    bio_en TEXT,
    organ TEXT DEFAULT 'ca',
    photo TEXT,
    order_index INT DEFAULT 0
);

-- 13. INSTITUTIONAL DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    category TEXT DEFAULT 'institutional_document',
    description_fr TEXT,
    description_en TEXT,
    file_url TEXT NOT NULL,
    file_size TEXT,
    publication_year INT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. PHOTO ALBUMS & MEDIA
CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    cover_image TEXT,
    date DATE DEFAULT CURRENT_DATE,
    project_id TEXT,
    photo_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    album_id TEXT,
    project_id TEXT,
    category TEXT,
    date DATE DEFAULT CURRENT_DATE,
    location TEXT,
    alt_fr TEXT,
    alt_en TEXT,
    description_fr TEXT,
    description_en TEXT,
    video_platform TEXT,
    show_in_hero BOOLEAN DEFAULT FALSE,
    hero_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. HISTORY MILESTONES
CREATE TABLE IF NOT EXISTS history_milestones (
    id TEXT PRIMARY KEY,
    year TEXT NOT NULL,
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    order_index INT DEFAULT 0
);

-- 16. CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    firstname TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    consent BOOLEAN DEFAULT TRUE,
    status msg_status DEFAULT 'unread',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROLE CHECK FUNCTIONS (SECURITY DEFINER WITH SEARCH_PATH SECURED)
-- ====================================================================

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
          AND role = 'super_admin'
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
          AND role IN ('super_admin', 'admin')
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
          AND role IN ('super_admin', 'admin', 'editor')
          AND is_active = true
    );
$$;

-- Trigger to prevent non-super-admins from modifying user roles or active status
CREATE OR REPLACE FUNCTION public.prevent_profile_self_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If role changes and current user is not super_admin, reject immediately
    IF (OLD.role IS DISTINCT FROM NEW.role) AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Seul le Super Administrateur est autorisé à modifier les rôles.';
    END IF;

    -- If is_active changes and current user is not super_admin, reject immediately
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

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 1. PUBLIC READ POLICIES
CREATE POLICY "Public can view site settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public can view statistics" ON statistics FOR SELECT USING (true);
CREATE POLICY "Public can view domains" ON domains FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public can view news" ON news FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view opportunities" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Public can view partners" ON partners FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view team members" ON team_members FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view governance" ON governance FOR SELECT USING (true);
CREATE POLICY "Public can view public documents" ON documents FOR SELECT USING (is_public = true);
CREATE POLICY "Public can view albums" ON albums FOR SELECT USING (true);
CREATE POLICY "Public can view media" ON media FOR SELECT USING (true);
CREATE POLICY "Public can view history" ON history_milestones FOR SELECT USING (true);
CREATE POLICY "Public can insert contact messages" ON contact_messages FOR INSERT WITH CHECK (true);

-- 2. PROFILES (STRICT ACCESS CONTROL & ANTI SELF-PROMOTION)
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
CREATE POLICY "Authorized users can view profiles" ON profiles
    FOR SELECT TO authenticated
    USING (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Super admin can insert profiles" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin or self update profiles" ON profiles
    FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR auth.uid() = id)
    WITH CHECK (public.is_super_admin() OR auth.uid() = id);

CREATE POLICY "Super admin can delete profiles" ON profiles
    FOR DELETE TO authenticated
    USING (public.is_super_admin());

-- 3. SITE SETTINGS (SUPER ADMIN ONLY FOR MODIFICATIONS)
DROP POLICY IF EXISTS "Admins have full access to site_settings" ON site_settings;
CREATE POLICY "Super admin manage site settings" ON site_settings
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 4. CONTACT MESSAGES (ADMINS & SUPER ADMIN ONLY)
DROP POLICY IF EXISTS "Admins have full access to contact messages" ON contact_messages;
CREATE POLICY "Admins manage contact messages" ON contact_messages
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. EDITORIAL CONTENT (EDITORS, ADMINS, AND SUPER ADMINS)
DROP POLICY IF EXISTS "Admins have full access to statistics" ON statistics;
CREATE POLICY "Editors manage statistics" ON statistics
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Admins have full access to domains" ON domains;
CREATE POLICY "Editors manage domains" ON domains
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Admins have full access to projects" ON projects;
CREATE POLICY "Editors manage projects" ON projects
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Admins have full access to news" ON news;
CREATE POLICY "Editors manage news" ON news
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Admins have full access to opportunities" ON opportunities;
CREATE POLICY "Editors manage opportunities" ON opportunities
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Admins have full access to partners" ON partners;
CREATE POLICY "Editors manage partners" ON partners
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Admins have full access to team" ON team_members;
CREATE POLICY "Editors manage team" ON team_members
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Admins have full access to governance" ON governance;
CREATE POLICY "Editors manage governance" ON governance
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Admins have full access to documents" ON documents;
CREATE POLICY "Editors manage documents" ON documents
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Admins have full access to albums" ON albums;
CREATE POLICY "Editors manage albums" ON albums
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Admins have full access to media" ON media;
CREATE POLICY "Editors manage media" ON media
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "Admins have full access to history" ON history_milestones;
CREATE POLICY "Editors manage history" ON history_milestones
    FOR ALL TO authenticated
    USING (public.is_editor()) WITH CHECK (public.is_editor());

-- 17. STORAGE BUCKETS ET POLITIQUES STORAGE (Supabase Storage)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('images', 'images', true, 26214400, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('videos', 'videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('documents', 'documents', true, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('logos', 'logos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = EXCLUDED.file_size_limit;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('images', 'videos', 'documents', 'logos'));

DROP POLICY IF EXISTS "Editors can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Editors insert media" ON storage.objects;
CREATE POLICY "Editors can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id IN ('images', 'videos', 'documents', 'logos')
    AND public.is_editor()
);

DROP POLICY IF EXISTS "Editors can update media" ON storage.objects;
DROP POLICY IF EXISTS "Editors update media" ON storage.objects;
CREATE POLICY "Editors can update media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id IN ('images', 'videos', 'documents', 'logos')
    AND public.is_editor()
)
WITH CHECK (
    bucket_id IN ('images', 'videos', 'documents', 'logos')
    AND public.is_editor()
);

DROP POLICY IF EXISTS "Editors can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Editors delete media" ON storage.objects;
CREATE POLICY "Editors can delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id IN ('images', 'videos', 'documents', 'logos')
    AND public.is_editor()
);

