import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, adminSupabase } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Diagnostic serveur temporaire
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim() !== '');
  const hasAdminSupabase = Boolean(adminSupabase);

  console.debug('[API UPLOAD DIAGNOSTIC SERVEUR]', {
    hasServiceRoleKey,
    hasAdminSupabase,
    clientUtilise: adminSupabase ? 'adminSupabase (service_role)' : 'auth.client (user_jwt)',
  });

  try {
    // 1. Authentifier l'utilisateur : doit être éditeur, admin ou super_admin actif
    const auth = await authenticateServerRequest(req);
    if (!auth.ok || !auth.user || !auth.client) {
      console.error('[API UPLOAD] Échec authentification serveur :', auth.error);
      return NextResponse.json(
        {
          success: false,
          error: auth.error || 'Authentification requise pour le téléversement',
        },
        { status: auth.status || 401 }
      );
    }

    // 2. Sélection du client (service role privilégié si configuré, sinon client utilisateur authentifié)
    const client = adminSupabase || auth.client;

    // 3. Extraction du fichier
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (formErr: any) {
      console.error('[API UPLOAD] Erreur lecture formData :', formErr);
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de lire les données du formulaire : ${formErr.message || String(formErr)}`,
        },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'images';
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucun fichier fourni dans la requête',
        },
        { status: 400 }
      );
    }

    const cleanFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();
    const filePath = `${folder}/${Date.now()}_${cleanFileName}`;

    console.debug('[API UPLOAD] Traitement fichier :', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} Ko`,
      bucket,
      filePath,
      clientType: adminSupabase ? 'adminSupabase (service_role)' : 'auth.client (user_jwt)',
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await client.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type || (bucket === 'documents' ? 'application/pdf' : 'image/jpeg'),
        upsert: true,
      });

    if (uploadError) {
      console.error('[API UPLOAD] ❌ Erreur Supabase Storage upload :', {
        message: uploadError.message,
        name: uploadError.name,
        statusCode: (uploadError as any).statusCode || (uploadError as any).status || null,
        bucket,
        filePath,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Erreur Supabase Storage: ${uploadError.message}`,
          details: {
            name: uploadError.name,
            statusCode: (uploadError as any).statusCode || (uploadError as any).status || 500,
            bucket,
            filePath,
          },
        },
        { status: 500 }
      );
    }

    // 5. Récupération de l'URL publique
    const { data: { publicUrl } } = client.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.debug('[API UPLOAD] ✅ Upload réussi, URL publique :', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      publicUrl,
      path: filePath,
    });
  } catch (err: any) {
    console.error('[API UPLOAD] ❌ Exception inattendue :', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Erreur interne inattendue lors de l\'upload',
      },
      { status: 500 }
    );
  }
}
