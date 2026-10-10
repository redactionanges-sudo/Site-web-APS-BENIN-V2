-- ==============================================================================
-- APS-BÉNIN - LOT 6.3: MIGRATION SUPABASE POUR LA CORBEILLE ET LA RESTAURATION
-- ==============================================================================
--
-- Description :
--   Met en place la table persistante `trash_items` pour conserver tous les contenus
--   éditoriaux déplacés dans la corbeille, avec leurs métadonnées d'origine,
--   leur statut antérieur, la date de suppression et l'identité réelle de l'auteur.
--   Permet la restauration intégrale ou la suppression définitive sécurisée.
--
-- Tables gérées :
--   - projects (Projets)
--   - news (Actualités)
--   - opportunities (Opportunités)
--   - partners (Partenaires)
--   - team_members (Équipe)
--   - governance (Gouvernance)
--   - documents (Documents & Rapports)
--   - media / albums (Médiathèque)
--   - domains (Domaines d'action)
--   - statistics (Chiffres Clés)
-- ==============================================================================

-- 1. CRÉATION DE LA TABLE TRASH_ITEMS
CREATE TABLE IF NOT EXISTS public.trash_items (
    id TEXT PRIMARY KEY,
    original_id TEXT NOT NULL,
    module TEXT NOT NULL,
    table_name TEXT NOT NULL,
    title TEXT NOT NULL,
    data JSONB NOT NULL,
    previous_status TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_by_id TEXT,
    deleted_by_email TEXT,
    deleted_by_name TEXT
);

-- 2. INDEX POUR PERFORMANCES & FILTRAGES
CREATE INDEX IF NOT EXISTS idx_trash_items_deleted_at ON public.trash_items (deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_trash_items_module ON public.trash_items (module);
CREATE INDEX IF NOT EXISTS idx_trash_items_table_name ON public.trash_items (table_name);
CREATE INDEX IF NOT EXISTS idx_trash_items_original_id ON public.trash_items (original_id);

-- 3. ACTIVATION ROW LEVEL SECURITY (RLS)
ALTER TABLE public.trash_items ENABLE ROW LEVEL SECURITY;

-- 4. POLITIQUES RLS
-- Les utilisateurs authentifiés avec rôle éditeur/admin/super_admin peuvent consulter la corbeille
DROP POLICY IF EXISTS "Authenticated users can view trash items" ON public.trash_items;
CREATE POLICY "Authenticated users can view trash items"
ON public.trash_items FOR SELECT
TO authenticated
USING (public.is_editor());

-- Les utilisateurs authentifiés peuvent envoyer des éléments à la corbeille
DROP POLICY IF EXISTS "Authenticated users can insert trash items" ON public.trash_items;
CREATE POLICY "Authenticated users can insert trash items"
ON public.trash_items FOR INSERT
TO authenticated
WITH CHECK (public.is_editor());

-- Les utilisateurs authentifiés peuvent restaurer ou supprimer des éléments de la corbeille
DROP POLICY IF EXISTS "Authenticated users can delete trash items" ON public.trash_items;
CREATE POLICY "Authenticated users can delete trash items"
ON public.trash_items FOR DELETE
TO authenticated
USING (public.is_editor());

-- 5. PERMISSIONS DE BASE
REVOKE ALL ON public.trash_items FROM anon;
GRANT SELECT, INSERT, DELETE, UPDATE ON public.trash_items TO authenticated;
GRANT ALL ON public.trash_items TO service_role;
