-- ====================================================================
-- APS-BÉNIN : MIGRATION TABLE STATISTICS (LOT 4.1)
-- Ajout des colonnes pour la gestion dynamique des chiffres clés :
-- publication, descriptions contextuelles, dates d'audit.
--
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ====================================================================

-- 1. Ajout des colonnes sur la table statistics
ALTER TABLE public.statistics 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

ALTER TABLE public.statistics 
ADD COLUMN IF NOT EXISTS description_fr TEXT DEFAULT '';

ALTER TABLE public.statistics 
ADD COLUMN IF NOT EXISTS description_en TEXT DEFAULT '';

ALTER TABLE public.statistics 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.statistics 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Commentaires informatifs
COMMENT ON COLUMN public.statistics.is_published IS 'Visibilité publique de la statistique sur la page d''accueil';
COMMENT ON COLUMN public.statistics.description_fr IS 'Courte description ou précision contextuelle en français';
COMMENT ON COLUMN public.statistics.description_en IS 'Courte description ou précision contextuelle en anglais';

-- 3. Mise à jour des valeurs par défaut sur les enregistrements existants
UPDATE public.statistics SET order_index = 0 WHERE order_index IS NULL;
UPDATE public.statistics SET is_published = true WHERE is_published IS NULL;

-- 4. Vérification du schéma
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'statistics';
