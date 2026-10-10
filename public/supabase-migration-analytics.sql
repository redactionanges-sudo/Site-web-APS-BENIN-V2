-- ==============================================================================
-- APS-BÉNIN - LOT 6.5: MIGRATION SUPABASE POUR ANALYTICS & STATISTIQUES DU SITE
-- ==============================================================================
--
-- Description :
--   Création de la table `analytics_events` pour la collecte sécurisée,
--   respectueuse de la vie privée (aucune donnée personnelle PII stockée,
--   session_id anonyme généré par session) de la fréquentation réelle du site web.
--
-- Indicateurs collectés :
--   - Visites et consultations de pages (page_view)
--   - Consultations spécifiques de Projets, Actualités, Opportunités
--   - Téléchargements effectifs de documents institutionnels
--   - Clics d'action "Appeler le siège" (CTA principal)
--   - Répartition par type d'appareil (mobile / desktop / tablet)
--   - Référents / sources de trafic
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

-- Index pour optimiser les requêtes d'agrégation et de filtrage temporel
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_path ON public.analytics_events (path);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON public.analytics_events (session_id);

-- Activation de la sécurité au niveau des lignes (RLS)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Autoriser l'insertion pour tout visiteur (anon et authentifié) - strictly INSERT only
DROP POLICY IF EXISTS "Public can record analytics events" ON public.analytics_events;
CREATE POLICY "Public can record analytics events"
ON public.analytics_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Lecture réservée aux utilisateurs de l'administration (éditeurs, admins, super admins)
DROP POLICY IF EXISTS "Admins can view analytics" ON public.analytics_events;
CREATE POLICY "Admins can view analytics"
ON public.analytics_events FOR SELECT
TO authenticated
USING (public.is_editor());

-- Suppression / purge réservée aux administrateurs
DROP POLICY IF EXISTS "Admins can delete analytics" ON public.analytics_events;
CREATE POLICY "Admins can delete analytics"
ON public.analytics_events FOR DELETE
TO authenticated
USING (public.is_admin());

-- Attribution des privilèges SQL
REVOKE ALL ON public.analytics_events FROM anon;
GRANT INSERT ON public.analytics_events TO anon;
GRANT SELECT, INSERT, DELETE ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
