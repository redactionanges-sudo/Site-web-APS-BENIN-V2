-- ====================================================================
-- APS-BÉNIN : CORRECTIF MINIMAL PRIVILÈGES DES FONCTIONS RLS & AUTH
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ====================================================================

-- 1. ACCORDER LES DROITS D'EXÉCUTION AU RÔLE 'authenticated'
-- Permet au moteur PostgreSQL d'évaluer les politiques RLS appelant ces fonctions
-- lors des requêtes d'un utilisateur authentifié (éditeurs, administrateurs).
GRANT EXECUTE ON FUNCTION public.is_editor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 2. RÉVOQUER POUR 'anon' ET 'public' (SÉCURITÉ STRICTE)
REVOKE EXECUTE ON FUNCTION public.is_editor() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon, public;

-- Re-confirmer le droit strict pour authenticated
GRANT EXECUTE ON FUNCTION public.is_editor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 3. CRÉATION DU PROFIL ADMINISTRATEUR D'ANGES KEVIN (SI COMPTE AUTH EXISTANT)
-- Le compte auth e2d8e0a3-14b4-4a2f-bfdb-495d280ef52d (angeskevina@gmail.com)
-- n'avait pas encore de ligne correspondante dans public.profiles.
INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at)
VALUES (
    'e2d8e0a3-14b4-4a2f-bfdb-495d280ef52d',
    'angeskevina@gmail.com',
    'Anges Kevin',
    'admin',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_active = true;
