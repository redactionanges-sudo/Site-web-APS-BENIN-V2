'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

interface NewsletterSubscriptionFormProps {
  variant?: 'footer' | 'card' | 'inline';
  className?: string;
}

export const NewsletterSubscriptionForm: React.FC<NewsletterSubscriptionFormProps> = ({
  variant = 'footer',
  className = '',
}) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFeedback({
        type: 'error',
        message:
          language === 'en'
            ? 'Please enter a valid email address.'
            : 'Veuillez renseigner une adresse e-mail valide.',
      });
      return;
    }

    if (!consent) {
      setFeedback({
        type: 'error',
        message:
          language === 'en'
            ? 'Please accept the consent terms to subscribe.'
            : 'Veuillez cocher la case de consentement pour valider votre inscription.',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          consent: true,
          honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: 'error',
          message:
            language === 'en'
              ? data.errorEn || data.error || 'Failed to process subscription.'
              : data.error || 'Impossible d’enregistrer l’inscription.',
        });
      } else {
        if (data.status === 'already_active') {
          setFeedback({
            type: 'info',
            message:
              language === 'en'
                ? data.messageEn || 'You are already subscribed to our newsletter.'
                : data.messageFr || 'Cette adresse e-mail est déjà inscrite à la newsletter d’APS-Bénin.',
          });
        } else {
          setFeedback({
            type: 'success',
            message:
              language === 'en'
                ? data.messageEn || 'Thank you! You are now subscribed to our newsletter.'
                : data.messageFr || 'Merci ! Vous êtes bien inscrit(e) à la newsletter officielle d’APS-Bénin.',
          });
          setEmail('');
          setConsent(false);
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message:
          language === 'en'
            ? 'A network error occurred. Please try again.'
            : 'Une erreur réseau est survenue. Veuillez réessayer.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFooter = variant === 'footer';

  return (
    <div className={`w-full ${className}`}>
      {/* Title & Description */}
      <div className="mb-3 space-y-1">
        <h4
          className={`font-bold font-heading flex items-center gap-2 ${
            isFooter ? 'text-sm text-white' : 'text-base text-gray-900'
          }`}
        >
          <Mail className="w-4 h-4 text-[#FF8C00] shrink-0" />
          <span>
            {language === 'en' ? 'APS-Benin Newsletter' : 'Newsletter d’APS-Bénin'}
          </span>
        </h4>
        <p className={`text-xs ${isFooter ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
          {language === 'en'
            ? 'Stay informed of our field missions, advocacy actions, and institutional reports.'
            : 'Recevez nos rapports de mission, nos actualités de terrain et l’impact de nos projets.'}
        </p>
      </div>

      {/* Subscription Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Antispam honeypot (invisible to humans) */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <input
            type="text"
            name="website_hp"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Email Input + Submit Button Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Your email address...'
                  : 'Votre adresse e-mail...'
              }
              disabled={loading}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-all outline-none ${
                isFooter
                  ? 'bg-gray-900/90 border-gray-700 text-white placeholder-gray-500 focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00]'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#92278F] focus:ring-1 focus:ring-[#92278F]'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF8C00] hover:bg-[#e07b00] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 shrink-0 cursor-pointer active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{language === 'en' ? 'Subscribing...' : 'Inscription...'}</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Subscribe' : 'S’inscrire'}</span>
              </>
            )}
          </button>
        </div>

        {/* Consent Checkbox */}
        <div className="flex items-start gap-2 pt-0.5">
          <input
            id="newsletter-consent"
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 w-3.5 h-3.5 rounded border-gray-400 text-[#FF8C00] focus:ring-[#FF8C00] cursor-pointer shrink-0"
          />
          <label
            htmlFor="newsletter-consent"
            className={`text-[11px] leading-tight cursor-pointer ${
              isFooter ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {language === 'en' ? (
              <>
                I agree to receive communications from APS-Benin. Unsubscribe anytime.{' '}
                <Link
                  href="/politique-confidentialite"
                  className="underline hover:text-[#FF8C00] transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </>
            ) : (
              <>
                J’accepte de recevoir les communications de l’ONG APS-Bénin. Désinscription possible à tout moment.{' '}
                <Link
                  href="/politique-confidentialite"
                  className="underline hover:text-[#FF8C00] transition-colors"
                >
                  Politique de confidentialité
                </Link>
                .
              </>
            )}
          </label>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-start gap-2 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                : feedback.type === 'info'
                ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            ) : feedback.type === 'info' ? (
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-snug">{feedback.message}</span>
          </div>
        )}
      </form>
    </div>
  );
};
