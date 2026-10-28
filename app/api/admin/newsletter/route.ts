import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest } from '@/lib/server-auth';
import {
  getNewsletterSubscribers,
  exportSubscribersCsv,
  unsubscribeNewsletter,
  checkEmailDeliveryProvider,
} from '@/lib/newsletter-store';

export async function GET(req: NextRequest) {
  const auth = await authenticateServerRequest(req, 'editor');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error || 'Non autorisé' }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'export') {
    const csvContent = await exportSubscribersCsv();
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="abonnes-newsletter-aps-benin.csv"',
      },
    });
  }

  const search = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') as 'all' | 'active' | 'unsubscribed' || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const data = await getNewsletterSubscribers({
    search,
    status: statusParam,
    page,
    limit,
  });

  const emailProvider = checkEmailDeliveryProvider();

  return NextResponse.json({
    success: true,
    ...data,
    emailProvider,
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateServerRequest(req, 'admin');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error || 'Non autorisé' }, { status: auth.status || 401 });
  }

  try {
    const body = await req.json();
    const { action, email } = body;

    if (action === 'unsubscribe' && email) {
      const res = await unsubscribeNewsletter(email);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
