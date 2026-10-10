-- ==============================================================================
-- APS-BÉNIN - LOT 6.2: MIGRATION SUPABASE POUR JOURNAL D'ACTIVITÉS ET HISTORIQUE
-- ==============================================================================

-- 1. Table audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id TEXT,
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    action_type TEXT NOT NULL,
    module TEXT NOT NULL,
    module_label TEXT,
    target_id TEXT,
    target_title TEXT,
    summary TEXT NOT NULL,
    changes JSONB,
    metadata JSONB
);

-- 2. Index de performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs (module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON public.audit_logs (user_email);

-- 3. Activation du Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Politique de consultation (Lecture réservée aux Administrateurs et Super Administrateurs)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

-- 5. Politique d'insertion (Tous les utilisateurs authentifiés peuvent tracer leurs actions)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Permissions de sécurité
REVOKE ALL ON public.audit_logs FROM anon;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- 7. Nettoyage préventif des données fictives de démonstration
DELETE FROM public.audit_logs 
WHERE id IN ('log-001', 'log-002', 'log-003', 'log-004', 'log-005', 'log-006', 'log-007')
   OR user_name IN ('Dr. Jean-Marc Houndété', 'Amina Dossou', 'Aïssatou Adekambi')
   OR target_title = 'Programme Nutrition & Sécurité Alimentaire dans l’Alibori'
   OR target_title = 'Lancement officiel du projet Eau Propre à Malanville';
