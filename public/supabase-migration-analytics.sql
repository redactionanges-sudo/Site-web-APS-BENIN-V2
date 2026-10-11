-- ==============================================================================
-- MIGRATION LOT 6.5 : ANALYTICS & STATISTIQUES DU SITE APS-BÉNIN
-- Table et index pour la collecte respectueuse de la vie privée et vérifiable
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    device_type TEXT DEFAULT 'desktop',
    browser TEXT,
    country TEXT DEFAULT 'BJ',
    target_id TEXT,
    target_title TEXT,
    metadata JSONB
);

-- Index pour optimiser les requêtes chronologiques et d'agrégation
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_path ON public.analytics_events (path);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON public.analytics_events (session_id);

-- Activation de Row Level Security (RLS)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 1. Politique publique d'insertion : les visiteurs anonymes ou connectés peuvent enregistrer des événements
DROP POLICY IF EXISTS "Public can record analytics events" ON public.analytics_events;
CREATE POLICY "Public can record analytics events"
ON public.analytics_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Politique de lecture réservée aux éditeurs et administrateurs
DROP POLICY IF EXISTS "Admins can view analytics" ON public.analytics_events;
CREATE POLICY "Admins can view analytics"
ON public.analytics_events FOR SELECT
TO authenticated
USING (public.is_editor());

-- 3. Politique de suppression réservée aux administrateurs
DROP POLICY IF EXISTS "Admins can delete analytics" ON public.analytics_events;
CREATE POLICY "Admins can delete analytics"
ON public.analytics_events FOR DELETE
TO authenticated
USING (public.is_admin());

-- Permissions sur la table
REVOKE ALL ON public.analytics_events FROM anon;
GRANT INSERT ON public.analytics_events TO anon;
GRANT SELECT, INSERT, DELETE ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
