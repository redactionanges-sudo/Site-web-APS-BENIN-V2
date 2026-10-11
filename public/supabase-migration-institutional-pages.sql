-- ====================================================================
-- SUPABASE MIGRATION: INSTITUTIONAL PAGES TABLE
-- AGISSONS POUR SAUVER – APS-BÉNIN
-- Gestion éditoriale complète des pages de la rubrique "L'Organisation"
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.institutional_pages (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    subtitle_fr TEXT,
    subtitle_en TEXT,
    badge_fr TEXT DEFAULT 'L''Organisation',
    badge_en TEXT DEFAULT 'The Organization',
    quote_fr TEXT,
    quote_en TEXT,
    intro_fr TEXT,
    intro_en TEXT,
    body_html_fr TEXT,
    body_html_en TEXT,
    hero_image TEXT,
    hero_image_alt_fr TEXT,
    hero_image_alt_en TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    blocks JSONB DEFAULT '[]'::jsonb,
    meta_title_fr TEXT,
    meta_title_en TEXT,
    meta_description_fr TEXT,
    meta_description_en TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.institutional_pages ENABLE ROW LEVEL SECURITY;

-- Public can view published pages (or all in internal apps)
DROP POLICY IF EXISTS "Public can view institutional pages" ON public.institutional_pages;
CREATE POLICY "Public can view institutional pages"
ON public.institutional_pages
FOR SELECT
USING (true);

-- Editors & Admins can insert, update and delete institutional pages
DROP POLICY IF EXISTS "Editors manage institutional pages" ON public.institutional_pages;
CREATE POLICY "Editors manage institutional pages"
ON public.institutional_pages
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('super_admin', 'admin', 'editor')
          AND is_active = true
    )
);

-- Grants
GRANT SELECT ON public.institutional_pages TO anon, authenticated;
GRANT ALL ON public.institutional_pages TO authenticated;
