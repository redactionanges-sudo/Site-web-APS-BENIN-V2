-- ====================================================================
-- APS-BÉNIN : POLITIQUES ROW LEVEL SECURITY POUR SUPABASE STORAGE
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ====================================================================

-- 1. ASSURER LA CRÉATION DES BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('images', 'images', true, 26214400, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('videos', 'videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('documents', 'documents', true, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('logos', 'logos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = EXCLUDED.file_size_limit;

-- 2. ACTIVER ROW LEVEL SECURITY SUR storage.objects SI CE N'EST PAS DÉJÀ FAIT
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. SUPPRESSION DES ANCIENNES POLITIQUES SUR storage.objects
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to logos" ON storage.objects;

DROP POLICY IF EXISTS "Editors can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Editors insert media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload media" ON storage.objects;

DROP POLICY IF EXISTS "Editors can update media" ON storage.objects;
DROP POLICY IF EXISTS "Editors update media" ON storage.objects;

DROP POLICY IF EXISTS "Editors can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Editors delete media" ON storage.objects;

-- 4. POLITIQUES ROW LEVEL SECURITY GRANULAIRES SUR storage.objects

-- A. LECTURE PUBLIQUE (Tous les visiteurs peuvent lire/télécharger les fichiers des buckets publics)
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('images', 'videos', 'documents', 'logos'));

-- B. INSERTION (Réservée aux utilisateurs authentifiés avec le rôle is_editor)
-- Valide l'appartenance à un rôle légitime APS (super_admin, admin, editor) actif
CREATE POLICY "Editors can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id IN ('images', 'videos', 'documents', 'logos')
    AND public.is_editor()
);

-- C. MODIFICATION (Réservée aux utilisateurs authentifiés avec le rôle is_editor)
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

-- D. SUPPRESSION (Réservée aux utilisateurs authentifiés avec le rôle is_editor)
CREATE POLICY "Editors can delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id IN ('images', 'videos', 'documents', 'logos')
    AND public.is_editor()
);
