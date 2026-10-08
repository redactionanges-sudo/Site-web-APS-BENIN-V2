'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { SocialLinksConfig } from '@/types';
import { getActiveSocialPlatforms } from '@/lib/social';
import {
  MapPin,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Building,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
} from 'lucide-react';

export default function ContactPage() {
  const { language, t } = useLanguage();
  const [socialLinks, setSocialLinks] = useState<SocialLinksConfig | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabaseStore.getSettings().then((s) => {
      if (isMounted && s?.social_links) {
        setSocialLinks(s.social_links);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeSocials = useMemo(() => {
    return getActiveSocialPlatforms(socialLinks);
  }, [socialLinks]);

  const renderSocialIcon = (id: string, badge: string) => {
    switch (id) {
      case 'facebook':
        return <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />;
      case 'twitter':
        return <Twitter className="w-3.5 h-3.5 text-black" />;
      case 'linkedin':
        return <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />;
      case 'instagram':
        return <Instagram className="w-3.5 h-3.5 text-[#E4405F]" />;
      case 'youtube':
        return <Youtube className="w-3.5 h-3.5 text-[#FF0000]" />;
      default:
        return <span className="text-[10px] font-bold text-gray-800">{badge}</span>;
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    firstname: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    consent: false,
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      alert('Veuillez accepter le traitement de vos données pour soumettre le formulaire.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      await supabaseStore.sendMessage({
        name: formData.name,
        firstname: formData.firstname,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        consent: formData.consent,
      });

      setStatus('success');
      setFormData({
        name: '',
        firstname: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        consent: false,
      });
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Erreur lors de la transmission du message.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
              {language === 'en' ? 'Get In Touch' : 'Écoute & Contact'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {t('contact.title')}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3">
              {t('contact.subtitle')}
            </p>
          </div>
        </section>

        {/* Contact info cards & form */}
        <section className="py-16 bg-white/75 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Contact info & address */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 space-y-6 shadow-sm">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-heading">
                      AGISSONS POUR SAUVER – APS-BÉNIN
                    </h2>
                    <p className="text-xs text-gray-500 font-serif italic mt-1 text-[#92278F]">
                      « {language === 'en' ? 'For a more just and egalitarian world' : 'Pour un monde plus juste et égalitaire'} »
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-gray-700">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                        <MapPin className="w-5 h-5 text-[#FF8C00]" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block text-sm">
                          Siège de l’ONG
                        </span>
                        <p className="text-gray-600 mt-0.5">
                          Djacoṭé-Comè, Département du Mono
                        </p>
                        <p className="text-gray-600">République du Bénin</p>
                        <p className="text-gray-600 font-medium mt-1">
                          BP : 69 Comè – République du Bénin
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                        <Phone className="w-5 h-5 text-[#FF8C00]" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block text-sm">
                          Lignes directes
                        </span>
                        <a
                          href="tel:+22952948323"
                          className="block text-gray-700 hover:text-[#92278F] font-semibold mt-0.5"
                        >
                          +229 52 94 83 23
                        </a>
                        <a
                          href="tel:+22996448362"
                          className="block text-gray-700 hover:text-[#92278F] font-semibold"
                        >
                          +229 96 44 83 62
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                        <Mail className="w-5 h-5 text-[#FF8C00]" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block text-sm">
                          Courrier électronique
                        </span>
                        <a
                          href="mailto:agissonspoursauver@gmail.com"
                          className="text-[#92278F] hover:underline font-semibold block mt-0.5"
                        >
                          agissonspoursauver@gmail.com
                        </a>
                      </div>
                    </div>

                    {/* Dynamic Social Networks */}
                    {activeSocials.length > 0 && (
                      <div className="pt-4 border-t border-gray-200/80">
                        <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider mb-2.5">
                          {language === 'en' ? 'Official Social Networks' : 'Réseaux Sociaux Officiels'}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {activeSocials.map((platform) => (
                            <a
                              key={platform.id}
                              href={platform.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-[#92278F] hover:text-[#92278F] text-gray-700 transition-colors text-xs font-semibold shadow-2xs"
                              title={platform.name}
                            >
                              {renderSocialIcon(platform.id, platform.badge)}
                              <span>{platform.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Permanent desk hours card */}
                <div className="p-6 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                  <h3 className="font-bold text-sm text-[#92278F]">
                    Permanences d'Écoute et d'Accueil
                  </h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Le secrétariat et les cellules d’orientation sont ouverts du <strong>lundi au vendredi</strong> de <strong>08h00 à 12h30</strong> et de <strong>15h00 à 18h30</strong>.
                  </p>
                  <p className="text-[11px] text-gray-500 italic">
                    Pour toute urgence liée à des violences basées sur le genre, nos relais communautaires restent joignables 7j/7.
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl p-8 sm:p-10 border border-gray-200 shadow-sm">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading mb-2">
                    {language === 'en' ? 'Send Us a Message' : 'Formulaire de Contact'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mb-6">
                    {language === 'en'
                      ? 'Fill out the form below; our team will review and reply promptly.'
                      : 'Renseignez les champs ci-dessous ; votre message sera directement transmis à la coordination.'}
                  </p>

                  {status === 'success' && (
                    <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Message envoyé avec succès !</strong>
                        {t('contact.form_success')}
                      </div>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Erreur</strong>
                        {errorMessage || t('contact.form_error')}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          {t('contact.form_lastname')} *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          {t('contact.form_firstname')} *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstname}
                          onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          {t('contact.form_email')} *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          {t('contact.form_phone')}
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+229 ..."
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {t('contact.form_subject')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Partenariat, information, signalement..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {t('contact.form_message')} *
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-900"
                      />
                    </div>

                    {/* Consent checkbox */}
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          checked={formData.consent}
                          onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                          className="mt-0.5 rounded text-[#92278F] focus:ring-[#92278F] border-gray-300 w-4 h-4"
                        />
                        <span className="text-[11px] text-gray-600 leading-snug">
                          {t('contact.form_consent')}
                        </span>
                      </label>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 text-[#FF8C00]" />
                        <span>
                          {status === 'submitting'
                            ? t('contact.form_sending')
                            : t('contact.form_submit')}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
