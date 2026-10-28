import fs from 'fs';
import path from 'path';
import { NewsletterSubscriber, NewsletterStatus } from '@/types';
import { adminSupabase } from '@/lib/server-auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'newsletter_subscribers.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SUBSCRIBERS_FILE)) {
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error creating data directory for newsletter:', err);
  }
}

function readLocalSubscribers(): NewsletterSubscriber[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLocalSubscribers(subscribers: NewsletterSubscriber[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local newsletter subscribers:', err);
  }
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed) && trimmed.length <= 254;
}

/**
 * Enregistre un nouvel abonnement ou met à jour un abonnement existant.
 * - Vérifie le consentement obligatoire
 * - Évite les doublons
 * - Gère la réinscription volontaire d'un contact précédemment désinscrit
 */
export async function subscribeNewsletter(
  email: string,
  consent: boolean,
  ip?: string,
  source: string = 'site_public_footer'
): Promise<{
  success: boolean;
  status: 'created' | 'already_active' | 'reactivated' | 'error';
  messageFr: string;
  messageEn: string;
  subscriber?: NewsletterSubscriber;
}> {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      status: 'error',
      messageFr: 'Adresse e-mail invalide. Veuillez vérifier votre saisie.',
      messageEn: 'Invalid email address. Please check your input.',
    };
  }

  if (!consent) {
    return {
      success: false,
      status: 'error',
      messageFr: 'Votre consentement explicite est obligatoire pour recevoir nos informations.',
      messageEn: 'Your explicit consent is required to receive our newsletters.',
    };
  }

  const subscribers = readLocalSubscribers();
  const existingIndex = subscribers.findIndex((s) => s.email === cleanEmail);

  let resultStatus: 'created' | 'already_active' | 'reactivated' = 'created';
  let targetSubscriber: NewsletterSubscriber;

  if (existingIndex >= 0) {
    const existing = subscribers[existingIndex];
    if (existing.status === 'active') {
      return {
        success: true,
        status: 'already_active',
        messageFr: 'Cette adresse e-mail est déjà inscrite à la newsletter d’APS-Bénin.',
        messageEn: 'This email address is already subscribed to the APS-Benin newsletter.',
        subscriber: existing,
      };
    }

    // Réactivation légitime avec nouveau consentement explicite
    targetSubscriber = {
      ...existing,
      status: 'active',
      subscribed_at: new Date().toISOString(),
      unsubscribed_at: undefined,
      consent_given: true,
      consent_ip: ip || existing.consent_ip,
      source,
    };
    subscribers[existingIndex] = targetSubscriber;
    resultStatus = 'reactivated';
  } else {
    targetSubscriber = {
      id: 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      email: cleanEmail,
      status: 'active',
      subscribed_at: new Date().toISOString(),
      consent_given: true,
      consent_ip: ip,
      source,
    };
    subscribers.unshift(targetSubscriber);
    resultStatus = 'created';
  }

  writeLocalSubscribers(subscribers);

  // Essai de persistance Supabase si la table existe
  if (adminSupabase) {
    try {
      await adminSupabase.from('newsletter_subscribers').upsert([targetSubscriber]);
    } catch {
      // Table distante pas encore migrée : le fallback local garantit la persistance
    }
  }

  return {
    success: true,
    status: resultStatus,
    messageFr:
      resultStatus === 'reactivated'
        ? 'Votre abonnement à la newsletter d’APS-Bénin a été réactivé avec succès.'
        : 'Merci pour votre inscription à la newsletter officielle d’APS-Bénin !',
    messageEn:
      resultStatus === 'reactivated'
        ? 'Your subscription to the APS-Benin newsletter has been successfully reactivated.'
        : 'Thank you for subscribing to the official APS-Benin newsletter!',
    subscriber: targetSubscriber,
  };
}

/**
 * Désinscription sécurisée d'un abonné.
 */
export async function unsubscribeNewsletter(email: string): Promise<{
  success: boolean;
  messageFr: string;
  messageEn: string;
}> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const subscribers = readLocalSubscribers();
  const existingIndex = subscribers.findIndex((s) => s.email === cleanEmail);

  if (existingIndex < 0) {
    return {
      success: false,
      messageFr: 'Adresse introuvable dans la liste des abonnés.',
      messageEn: 'Email address not found in the subscriber list.',
    };
  }

  subscribers[existingIndex] = {
    ...subscribers[existingIndex],
    status: 'unsubscribed',
    unsubscribed_at: new Date().toISOString(),
  };

  writeLocalSubscribers(subscribers);

  if (adminSupabase) {
    try {
      await adminSupabase
        .from('newsletter_subscribers')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('email', cleanEmail);
    } catch {}
  }

  return {
    success: true,
    messageFr: 'Vous avez été désinscrit avec succès de la newsletter.',
    messageEn: 'You have been successfully unsubscribed from the newsletter.',
  };
}

/**
 * Récupère les abonnés avec recherche, filtre et pagination pour le back-office.
 */
export async function getNewsletterSubscribers(options: {
  search?: string;
  status?: 'all' | 'active' | 'unsubscribed';
  page?: number;
  limit?: number;
}): Promise<{
  items: NewsletterSubscriber[];
  total: number;
  activeCount: number;
  unsubscribedCount: number;
}> {
  let subscribers = readLocalSubscribers();

  // Si Supabase est disponible, tente de lire la table distante
  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        // Fusionne les données distantes et locales
        const map = new Map<string, NewsletterSubscriber>();
        subscribers.forEach((s) => map.set(s.email, s));
        data.forEach((s: any) => map.set(s.email, s));
        subscribers = Array.from(map.values()).sort(
          (a, b) => new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime()
        );
      }
    } catch {}
  }

  const activeCount = subscribers.filter((s) => s.status === 'active').length;
  const unsubscribedCount = subscribers.filter((s) => s.status === 'unsubscribed').length;

  let filtered = [...subscribers];

  if (options.status && options.status !== 'all') {
    filtered = filtered.filter((s) => s.status === options.status);
  }

  if (options.search) {
    const q = options.search.toLowerCase().trim();
    filtered = filtered.filter((s) => s.email.toLowerCase().includes(q));
  }

  const total = filtered.length;
  const page = options.page || 1;
  const limit = options.limit || 20;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    items,
    total,
    activeCount,
    unsubscribedCount,
  };
}

/**
 * Exporte la liste des abonnés autorisés au format CSV.
 */
export async function exportSubscribersCsv(): Promise<string> {
  const { items } = await getNewsletterSubscribers({ status: 'active', limit: 10000 });
  const headers = ['Email', 'Statut', 'Date Inscription', 'Consentement', 'Source'];
  const rows = items.map((sub) => [
    `"${sub.email}"`,
    `"${sub.status}"`,
    `"${sub.subscribed_at}"`,
    `"${sub.consent_given ? 'Oui' : 'Non'}"`,
    `"${sub.source || 'site_public'}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Vérification de l'état réel du service d'envoi d'e-mails (SMTP / API transactional).
 */
export function checkEmailDeliveryProvider(): {
  isConfigured: boolean;
  provider: string;
  details: string;
} {
  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  if (resendKey && !resendKey.includes('placeholder')) {
    return {
      isConfigured: true,
      provider: 'Resend API',
      details: 'Service d’envoi transactionnel configuré via Resend.',
    };
  }

  if (sendgridKey && !sendgridKey.includes('placeholder')) {
    return {
      isConfigured: true,
      provider: 'SendGrid API',
      details: 'Service d’envoi transactionnel configuré via SendGrid.',
    };
  }

  if (smtpHost && !smtpHost.includes('placeholder')) {
    return {
      isConfigured: true,
      provider: 'Serveur SMTP',
      details: `Service configuré via le relais SMTP : ${smtpHost}`,
    };
  }

  return {
    isConfigured: false,
    provider: 'Aucun service configuré',
    details:
      'Mode collecte d’abonnés actif. Aucun fournisseur d’envoi d’e-mails (Resend, SendGrid ou SMTP) n’est renseigné dans les variables d’environnement.',
  };
}
