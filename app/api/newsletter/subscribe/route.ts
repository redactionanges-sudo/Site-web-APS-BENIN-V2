import { NextRequest, NextResponse } from 'next/server';
import { subscribeNewsletter } from '@/lib/newsletter-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, consent, honeypot } = body;

    // Protection antirobot Honeypot : si le champ invisible est rempli, rejeter silencieusement
    if (honeypot && String(honeypot).trim().length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Inscription traitée avec succès.',
      });
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'L’adresse e-mail est obligatoire.' },
        { status: 400 }
      );
    }

    // Récupération de l'adresse IP pour la trace légale de consentement (RGPD / Droit béninois)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || 'unknown';

    const result = await subscribeNewsletter(email, Boolean(consent), ip, 'site_public_footer');

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.messageFr,
          errorEn: result.messageEn,
          status: result.status,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      messageFr: result.messageFr,
      messageEn: result.messageEn,
      subscriber: result.subscriber,
    });
  } catch (err: any) {
    console.error('Newsletter subscribe error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de l’inscription. Veuillez réessayer.',
      },
      { status: 500 }
    );
  }
}
