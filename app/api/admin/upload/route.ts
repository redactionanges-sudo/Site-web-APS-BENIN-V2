import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, adminSupabase } from '@/lib/server-auth';
import { optimizeImageBuffer, isValidImageMime } from '@/lib/image-optimizer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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
    const profile = (formData.get('profile') as any) || 'auto'; // hero | content | portrait | thumbnail | auto

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucun fichier fourni dans la requête',
        },
        { status: 400 }
      );
    }

    const rawFileName = file.name || 'fichier';
    const rawFileExt = rawFileName.split('.').pop()?.toLowerCase() || '';
    const baseName = rawFileName.substring(0, rawFileName.lastIndexOf('.')) || rawFileName;
    const cleanBaseName = baseName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();

    const timestamp = Date.now();
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const isImageFile = bucket !== 'documents' && (isValidImageMime(file.type, rawFileName) || ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff'].includes(rawFileExt));

    console.debug('[API UPLOAD] Réception fichier :', {
      name: rawFileName,
      size: `${(file.size / 1024).toFixed(1)} Ko`,
      bucket,
      isImageFile,
      clientType: adminSupabase ? 'adminSupabase (service_role)' : 'auth.client (user_jwt)',
    });

    let primaryPublicUrl = '';
    let primaryStoragePath = '';
    let thumbnailPublicUrl = '';
    let thumbnailStoragePath = '';
    let originalPublicUrl = '';
    let originalStoragePath = '';
    let optimizationDetails: any = null;

    if (isImageFile) {
      try {
        // 4. Traitement automatique avec sharp (WebP, redimensionnement sans agrandissement, auto-orientation)
        const optResult = await optimizeImageBuffer(rawBuffer, {
          profile,
          generateThumbnail: true,
        });

        // 4a. Sauvegarder l'original pour préservation et traçabilité (ex: /uploads/originals/12345_nom.jpg)
        originalStoragePath = `${folder}/originals/${timestamp}_${cleanBaseName}.${rawFileExt || 'jpg'}`;
        const { error: origUploadErr } = await client.storage
          .from(bucket)
          .upload(originalStoragePath, rawBuffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (!origUploadErr) {
          const { data: { publicUrl: origUrl } } = client.storage
            .from(bucket)
            .getPublicUrl(originalStoragePath);
          originalPublicUrl = origUrl;
        }

        // 4b. Sauvegarder la version optimisée WebP principale (ex: /uploads/12345_nom.webp)
        primaryStoragePath = `${folder}/${timestamp}_${cleanBaseName}.webp`;
        const { error: optUploadErr } = await client.storage
          .from(bucket)
          .upload(primaryStoragePath, optResult.optimized.buffer, {
            contentType: optResult.optimized.contentType,
            upsert: true,
          });

        if (optUploadErr) {
          throw new Error(`Échec upload version optimisée: ${optUploadErr.message}`);
        }

        const { data: { publicUrl: optUrl } } = client.storage
          .from(bucket)
          .getPublicUrl(primaryStoragePath);
        primaryPublicUrl = optUrl;

        // 4c. Sauvegarder la miniature WebP si produite (ex: /uploads/thumbs/12345_nom_thumb.webp)
        if (optResult.thumbnail) {
          thumbnailStoragePath = `${folder}/thumbs/${timestamp}_${cleanBaseName}_thumb.webp`;
          const { error: thumbUploadErr } = await client.storage
            .from(bucket)
            .upload(thumbnailStoragePath, optResult.thumbnail.buffer, {
              contentType: optResult.thumbnail.contentType,
              upsert: true,
            });

          if (!thumbUploadErr) {
            const { data: { publicUrl: thumbUrl } } = client.storage
              .from(bucket)
              .getPublicUrl(thumbnailStoragePath);
            thumbnailPublicUrl = thumbUrl;
          }
        }

        // Si la miniature n'a pas été générée (ex: image déjà sous 400px), réutiliser la version optimisée
        if (!thumbnailPublicUrl) {
          thumbnailPublicUrl = primaryPublicUrl;
        }

        optimizationDetails = {
          originalWidth: optResult.originalWidth,
          originalHeight: optResult.originalHeight,
          originalSizeBytes: optResult.originalSizeBytes,
          optimizedWidth: optResult.optimized.width,
          optimizedHeight: optResult.optimized.height,
          optimizedSizeBytes: optResult.optimized.sizeBytes,
          savingsPercent: optResult.savingsPercent,
          format: 'webp',
        };

        console.debug('[API UPLOAD] ✅ Optimisation terminée :', {
          original: `${(optResult.originalSizeBytes / 1024).toFixed(1)} Ko`,
          optimise: `${(optResult.optimized.sizeBytes / 1024).toFixed(1)} Ko`,
          economie: `${optResult.savingsPercent}%`,
          dimensions: `${optResult.optimized.width}x${optResult.optimized.height}`,
        });
      } catch (optError: any) {
        console.warn('[API UPLOAD] Avertissement sharp, basculement sécurisé sur fichier direct :', optError.message);
        // Fallback sécurisé en cas d'erreur de conversion
        primaryStoragePath = `${folder}/${timestamp}_${cleanBaseName}.${rawFileExt || 'jpg'}`;
        const { error: directUploadErr } = await client.storage
          .from(bucket)
          .upload(primaryStoragePath, rawBuffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (directUploadErr) {
          throw directUploadErr;
        }

        const { data: { publicUrl } } = client.storage
          .from(bucket)
          .getPublicUrl(primaryStoragePath);
        primaryPublicUrl = publicUrl;
        thumbnailPublicUrl = publicUrl;
      }
    } else {
      // Fichier non-image ou document PDF
      primaryStoragePath = `${folder}/${timestamp}_${cleanBaseName}.${rawFileExt || 'bin'}`;
      const { error: docUploadErr } = await client.storage
        .from(bucket)
        .upload(primaryStoragePath, rawBuffer, {
          contentType: file.type || (bucket === 'documents' ? 'application/pdf' : 'application/octet-stream'),
          upsert: true,
        });

      if (docUploadErr) {
        throw docUploadErr;
      }

      const { data: { publicUrl } } = client.storage
        .from(bucket)
        .getPublicUrl(primaryStoragePath);
      primaryPublicUrl = publicUrl;
      thumbnailPublicUrl = publicUrl;
    }

    return NextResponse.json({
      success: true,
      url: primaryPublicUrl,
      publicUrl: primaryPublicUrl,
      thumbnailUrl: thumbnailPublicUrl || primaryPublicUrl,
      path: primaryStoragePath,
      originalUrl: originalPublicUrl || primaryPublicUrl,
      originalPath: originalStoragePath || primaryStoragePath,
      optimized: Boolean(optimizationDetails),
      optimization: optimizationDetails,
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
