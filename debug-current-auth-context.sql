-- ====================================================================
-- APS-BÉNIN : FONCTION DE DIAGNOSTIC TEMPORAIRE DU CONTEXTE AUTH
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ====================================================================

CREATE OR REPLACE FUNCTION public.debug_current_auth_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_uid uuid;
    v_role text;
    v_is_active boolean;
    v_is_editor boolean;
BEGIN
    v_uid := auth.uid();
    
    SELECT p.role::text, p.is_active
    INTO v_role, v_is_active
    FROM public.profiles p
    WHERE p.id = v_uid;
    
    v_is_editor := public.is_editor();

    RETURN jsonb_build_object(
        'uid', v_uid,
        'role', v_role,
        'is_active', v_is_active,
        'is_editor', v_is_editor
    );
END;
$$;

-- Accorder le droit d'exécution au rôle authentifié pour le diagnostic
GRANT EXECUTE ON FUNCTION public.debug_current_auth_context() TO authenticated, anon;
