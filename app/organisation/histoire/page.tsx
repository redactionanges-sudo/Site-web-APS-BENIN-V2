'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore, resolveMediaUrl } from '@/lib/supabase';
import { HistoryMilestone, InstitutionalPage } from '@/types';
import { RichTextContent } from '@/components/RichTextContent';
import { Calendar, CheckCircle2, Award, Clock, EyeOff } from 'lucide-react';
import { initialInstitutionalPages, DEFAULT_INSTITUTIONAL_HERO_IMAGE } from '@/lib/initial-pages';
import { OptimizedImage } from '@/components/OptimizedImage';

export default function HistoirePage() {
  const { language } = useLanguage();
  const [milestones, setMilestones] = useState<HistoryMilestone[]>([]);
  const [pageData, setPageData] = useState<InstitutionalPage | null>(() => {
    return initialInstitutionalPages.find((p) => p.slug === 'histoire') || null;
  });

  useEffect(() => {
    supabaseStore.getHistory().then(setMilestones);
    supabaseStore.getInstitutionalPageBySlug('histoire', true).then((res) => {
      if (res) setPageData(res);
    });

    const handlePageChanged = (e: any) => {
      if (e?.detail?.slug === 'histoire') {
        setPageData(e.detail);
      }
    };
    window.addEventListener('aps_page_changed', handlePageChanged);

    return () => {
      window.removeEventListener('aps_page_changed', handlePageChanged);
    };
  }, []);

  const badge = pageData
    ? language === 'en'
      ? pageData.badge_en || pageData.badge_fr || 'Our Trajectory'
      : pageData.badge_fr || 'Notre Trajectoire'
    : language === 'en'
    ? 'Our Trajectory'
    : 'Notre Trajectoire';

  const title = pageData
    ? language === 'en'
      ? pageData.title_en || pageData.title_fr || 'Our History & Evolution'
      : pageData.title_fr || 'Notre Histoire & Évolution'
    : language === 'en'
    ? 'Our History & Evolution'
    : 'Notre Histoire & Évolution';

  const subtitle = pageData
    ? language === 'en'
      ? pageData.subtitle_en || pageData.subtitle_fr || 'From grassroots citizen mobilization in 2014 to a recognized institution for human rights and equality in Benin.'
      : pageData.subtitle_fr || "D'une mobilisation citoyenne spontanée en 2014 à une institution reconnue pour les droits humains et l'égalité au Bénin."
    : language === 'en'
    ? 'From grassroots citizen mobilization in 2014 to a recognized institution for human rights and equality in Benin.'
    : "D'une mobilisation citoyenne spontanée en 2014 à une institution reconnue pour les droits humains et l'égalité au Bénin.";

  const heroImage = resolveMediaUrl(pageData?.hero_image) || DEFAULT_INSTITUTIONAL_HERO_IMAGE;
  const heroAlt =
    language === 'en'
      ? pageData?.hero_image_alt_en || pageData?.hero_image_alt_fr || title
      : pageData?.hero_image_alt_fr || pageData?.hero_image_alt_en || title;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {pageData && pageData.is_published === false && (
        <div className="bg-amber-500 text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-xs">
          <EyeOff className="w-4 h-4 shrink-0" />
          <span>
            {language === 'en'
              ? 'Notice: This page is currently saved as a draft in the admin back-office.'
              : 'Avis : Cette page est actuellement configurée en mode brouillon interne dans le back-office.'}
          </span>
        </div>
      )}

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gray-950 text-white py-16 sm:py-20 relative overflow-hidden">
          {heroImage && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <OptimizedImage
                src={heroImage}
                alt={heroAlt}
                fill
                priority
                className="object-cover opacity-45 transform scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-[#92278F]/45 to-gray-950/80" />
            </div>
          )}
          {!heroImage && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-[#92278F]/45 to-gray-950" />
          )}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
              {badge}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {title}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3 leading-relaxed">
              {subtitle}
            </p>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-8">
            {milestones.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-500 bg-white rounded-2xl border border-gray-200 p-8">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p>Aucun jalon historique n&apos;est enregistré pour le moment.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-[#92278F]/30 ml-4 sm:ml-8 space-y-12">
                {milestones.map((m, index) => (
                  <div key={m.id} className="relative pl-8 sm:pl-12 group">
                    {/* Timeline bullet */}
                    <div className="absolute -left-3.5 top-1.5 w-7 h-7 rounded-full bg-white border-4 border-[#92278F] group-hover:border-[#FF8C00] transition-colors flex items-center justify-center shadow-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#92278F]" />
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200/80 hover:border-[#92278F] transition-all hover:shadow-md">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-xs font-extrabold text-[#92278F] border border-purple-200">
                          <Calendar className="w-3.5 h-3.5 text-[#FF8C00]" />
                          <span>{m.year}</span>
                        </span>
                        <span className="text-xs text-gray-400 font-medium">Étape {index + 1}</span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-heading mb-3 group-hover:text-[#92278F] transition-colors">
                        {language === 'en' ? m.title_en || m.title_fr : m.title_fr}
                      </h3>

                      <div className="text-sm text-gray-700 leading-relaxed">
                        <RichTextContent
                          content={language === 'en' ? m.description_en || m.description_fr : m.description_fr}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
