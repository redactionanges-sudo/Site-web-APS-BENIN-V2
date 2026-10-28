import fs from 'fs';
import path from 'path';
import { NewsletterSubscriber } from '@/types';
import { adminSupabase } from '@/lib/server-auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'newsletter_subscribers.json');

// Mémoire cache pour les environnements serverless à système de fichiers en lecture seule
let inMemorySubscribersCache: NewsletterSubscriber[] | null = null;

function readLocalFallback(): NewsletterSubscriber[] {
  if (inMemorySubscribersCache !== null) {
    return inMemorySubscribersCache;
  }
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const raw = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemorySubscribersCache = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore read errors in read-only environments
  }
  inMemorySubscribersCache = [];
  return [];
}

function writeLocalFallback(subscribers: NewsletterSubscriber[]): void {
  inMemorySubscribersCache = subscribers;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf-8');
  } catch {
    // Ignore read-only filesystem errors (e.g. Vercel / serverless runtime)
  }
}

/**
 * Récupère la liste réelle des abonnés depuis Supabase.
 * Tente d'abord la table 'newsletter_subscribers', et si absente, utilise le stockage
 * persistant JSONB dans 'site_settings' (champ seo.newsletter_subscribers) sans modification de schéma.
 */
async function loadSubscribersFromSupabase(): Promise<NewsletterSubscriber[] | null> {
  if (!adminSupabase) return null;

  // 1. Tenter la table dédiée si elle existe
  try {
    const { data, error } = await adminSupabase
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data as NewsletterSubscriber[];
    }
  } catch {
    // Table absente
  }

  // 2. Utiliser le conteneur JSONB persistant existant dans 'site_settings'
  try {
    const { data: row, error } = await adminSupabase
      .from('site_settings')
      .select('seo')
      .eq('id', 'aps-settings-primary')
      .single();

    if (!error && row && row.seo && Array.isArray(row.seo.newsletter_subscribers)) {
      return row.seo.newsletter_subscribers as NewsletterSubscriber[];
    }
  } catch (err) {
    console.warn('Could not read newsletter subscribers from site_settings:', err);
  }

  return null;
}

/**
 * Sauvegarde les abonnés dans la source de vérité Supabase.
 */
async function saveSubscribersToSupabase(subscribers: NewsletterSubscriber[], singleSubscriber?: NewsletterSubscriber): Promise<boolean> {
  if (!adminSupabase) return false;

  let saved = false;

  // 1. Tenter la table dédiée si présente
  if (singleSubscriber) {
    try {
      const { error } = await adminSupabase
        .from('newsletter_subscribers')
        .upsert([singleSubscriber]);
      if (!error) saved = true;
    } catch {
      // Table absente
    }
  }

  // 2. Persistance garantie dans 'site_settings.seo.newsletter_subscribers' sans modification de schéma
  try {
    const { data: row, error: fetchErr } = await adminSupabase
      .from('site_settings')
      .select('seo')
      .eq('id', 'aps-settings-primary')
      .single();

    if (!fetchErr && row) {
      const currentSeo = row.seo || {};
      const updatedSeo = {
        ...currentSeo,
        newsletter_subscribers: subscribers,
        newsletter_updated_at: new Date().toISOString(),
      };

      const { error: updateErr } = await adminSupabase
        .from('site_settings')
        .update({ seo: updatedSeo, updated_at: new Date().toISOString() })
        .eq('id', 'aps-settings-primary');

      if (!updateErr) {
        saved = true;
      } else {
        console.error('Erreur mise à jour site_settings.seo.newsletter_subscribers:', updateErr);
      }
    }
  } catch (err) {
    console.error('Exception saveSubscribersToSupabase:', err);
  }

  return saved;
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

  // 1. Charger la liste depuis Supabase (avec fallback local)
  let subscribers = await loadSubscribersFromSupabase();
  if (!subscribers) {
    subscribers = readLocalFallback();
  }

  const existingIndex = subscribers.findIndex((s) => s.email.toLowerCase() === cleanEmail);

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

  // 2. Persister à la fois dans Supabase et en fallback local
  writeLocalFallback(subscribers);
  await saveSubscribersToSupabase(subscribers, targetSubscriber);

  return {
    success: true,
    status: resultStatus,
    messageFr:
      resultStatus === 'reactivated'
        ? 'Votre abonnement à la newsletter d’APS-Bénin a été réactivé avec succès.'
        : 'Merci pour votre inscription à la newsletter officielle d’APS-BÉNIN !',
    messageEn:
      resultStatus === 'reactivated'
        ? 'Your subscription to the APS-Benin newsletter has been successfully reactivated.'
        : 'Thank you for subscribing to the official APS-BENIN newsletter!',
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

  let subscribers = await loadSubscribersFromSupabase();
  if (!subscribers) {
    subscribers = readLocalFallback();
  }

  const existingIndex = subscribers.findIndex((s) => s.email.toLowerCase() === cleanEmail);

  if (existingIndex < 0) {
    return {
      success: false,
      messageFr: 'Adresse introuvable dans la liste des abonnés.',
      messageEn: 'Email address not found in the subscriber list.',
    };
  }

  const updatedSubscriber: NewsletterSubscriber = {
    ...subscribers[existingIndex],
    status: 'unsubscribed',
    unsubscribed_at: new Date().toISOString(),
  };

  subscribers[existingIndex] = updatedSubscriber;

  writeLocalFallback(subscribers);
  await saveSubscribersToSupabase(subscribers, updatedSubscriber);

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
  let subscribers = await loadSubscribersFromSupabase();

  if (!subscribers || subscribers.length === 0) {
    subscribers = readLocalFallback();
  } else {
    // Mettre à jour le cache local avec les données fraîches de Supabase
    writeLocalFallback(subscribers);
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
  const limit = options.limit || 50;
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
