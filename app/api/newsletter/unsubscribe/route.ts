import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeNewsletter } from '@/lib/newsletter-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Adresse e-mail requise pour la désinscription.' },
        { status: 400 }
      );
    }

    const result = await unsubscribeNewsletter(email);
    return NextResponse.json(result, { status: result.success ? 200 : 404 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Erreur lors de la désinscription' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Paramètre email manquant.' },
      { status: 400 }
    );
  }

  const result = await unsubscribeNewsletter(email);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}
