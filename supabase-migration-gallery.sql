-- ====================================================================
-- APS-BÉNIN : MIGRATION GALERIE MULTI-IMAGES POUR LES OPPORTUNITÉS
-- Permet d'associer une image principale et une galerie d'images
-- aux Opportunités (les tables Projets et Actualités disposent déjà
-- de colonnes main_image, photos[] et gallery[]).
--
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ====================================================================

-- 1. Ajout des colonnes main_image et gallery sur la table opportunities
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS main_image TEXT;

ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. Commentaires informatifs sur les colonnes
COMMENT ON COLUMN public.opportunities.main_image IS 'Image de couverture principale pour les opportunités';
COMMENT ON COLUMN public.opportunities.gallery IS 'Liste ordonnée des URLs d''images de la galerie pour les opportunités';

-- Vérification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'opportunities' AND column_name IN ('main_image', 'gallery');
