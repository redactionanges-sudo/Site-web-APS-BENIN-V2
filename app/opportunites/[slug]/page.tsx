'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { OpportunityItem } from '@/types';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Mail,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Send,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function OpportunityDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { language, t } = useLanguage();
  const [opp, setOpp] = useState<OpportunityItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseStore.getOpportunityBySlug(slug).then((res) => {
      setOpp(res);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-[#92278F] border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <div className="flex-1 max-w-3xl mx-auto px-4 py-24 text-center">
          <AlertCircle className="w-12 h-12 text-[#FF8C00] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Opportunité introuvable</h1>
          <p className="text-gray-600 mb-6">L’offre recherchée n’existe pas ou a été retirée.</p>
          <Link
            href="/opportunites"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#92278F] text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour aux opportunités</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Header Banner */}
        <section className="bg-gray-900 text-white py-14 sm:py-20 relative overflow-hidden">
          {opp.main_image ? (
            <div className="absolute inset-0">
              <img
                src={opp.main_image}
                alt=""
                className="w-full h-full object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-[#92278F]/80 to-gray-950/95" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/60 to-black/90" />
          )}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <Link
              href="/opportunites"
              className="inline-flex items-center gap-2 text-xs font-semibold text-orange-300 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('opp.view_all')}</span>
            </Link>

            <div className="max-w-4xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded text-white ${
                    opp.status === 'open' ? 'bg-green-700' : 'bg-gray-700'
                  }`}
                >
                  {opp.status === 'open' ? t('opp.status_open') : t('opp.status_closed')}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded bg-white/10 text-white border border-white/20 uppercase tracking-wider">
                  {opp.type.replace('_', ' ')}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
                {language === 'en' ? opp.title_en : opp.title_fr}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-xs text-purple-100 pt-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-[#FF8C00]" />
                  <span>{language === 'en' ? opp.location_en : opp.location_fr}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-[#FF8C00]" />
                  <span>Publié le {formatDate(opp.published_at)}</span>
                </span>
                <span className="flex items-center gap-1.5 font-bold text-orange-300 bg-white/10 px-3 py-1 rounded border border-white/20">
                  <Clock className="w-4 h-4" />
                  <span>Date limite : {formatDate(opp.deadline)}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Body */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-10">
                {/* Main Cover Image if present */}
                {opp.main_image && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-gray-50 h-72 sm:h-96">
                    <img
                      src={opp.main_image}
                      alt={language === 'en' ? opp.title_en : opp.title_fr}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                    {language === 'en' ? 'Position / Mission Overview' : 'Description du Poste & Contexte'}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                    {language === 'en' ? opp.description_en : opp.description_fr}
                  </p>
                </div>

                {/* Conditions / Profil recherché */}
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                    {language === 'en' ? 'Eligibility & Qualifications' : 'Conditions de Candidature & Profil'}
                  </h2>
                  <div className="p-6 rounded-xl bg-purple-50/50 border border-purple-100 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                    {language === 'en' ? opp.conditions_en : opp.conditions_fr}
                  </div>
                </div>

                {/* Pièces à fournir */}
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                    {language === 'en' ? 'Required Application Documents' : 'Dossier de Candidature / Pièces à Fournir'}
                  </h2>
                  <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                    {language === 'en' ? opp.documents_required_en : opp.documents_required_fr}
                  </div>
                </div>

                {/* Gallery of Images if present */}
                {opp.gallery && opp.gallery.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 font-heading">
                      {language === 'en' ? 'Photo Gallery' : 'Galerie d’Images de l’Opportunité'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {opp.gallery.map((img, i) => (
                        <div
                          key={i}
                          className="h-48 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer shadow-xs hover:shadow-lg transition-shadow duration-300 group"
                        >
                          <img
                            src={img}
                            alt={`${opp.title_fr} - Image ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                  <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-3">
                    {language === 'en' ? 'How to Apply' : 'Modalités de Soumission'}
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-gray-500 font-medium block">Organisation :</span>
                      <span className="font-bold text-gray-900">{opp.organization}</span>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium block">Email de transmission :</span>
                      <a
                        href={`mailto:${opp.contact_email}?subject=Candidature : ${opp.title_fr}`}
                        className="font-bold text-[#92278F] hover:underline break-all block mt-0.5"
                      >
                        {opp.contact_email}
                      </a>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium block">Lieu de dépôt physique :</span>
                      <span className="font-semibold text-gray-800 block mt-0.5">
                        Siège APS-BÉNIN, Djacoṭé-Comè (Département du Mono)
                      </span>
                    </div>

                    {opp.status === 'open' ? (
                      <a
                        href={`mailto:${opp.contact_email}?subject=Candidature : ${opp.title_fr}`}
                        className="w-full mt-4 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white font-bold text-xs transition-colors shadow-xs"
                      >
                        <Send className="w-4 h-4 text-[#FF8C00]" />
                        <span>Transmettre mon dossier par email</span>
                      </a>
                    ) : (
                      <div className="p-3 rounded-lg bg-gray-200 text-center text-xs text-gray-600 font-semibold">
                        Les candidatures pour cette offre sont désormais closes.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
