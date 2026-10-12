'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabaseStore } from '@/lib/supabase';
import { InstitutionalPage } from '@/types';
import {
  ShieldCheck,
  FileCheck2,
  MapPin,
  Calendar,
  Building,
  CheckCircle2,
  ArrowRight,
  Scale,
  Users,
  Compass,
  Heart,
  ShieldAlert,
  Sparkles,
  EyeOff,
} from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';

const iconMap: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck className="w-5 h-5 text-[#92278F]" />,
  Users: <Users className="w-5 h-5 text-[#FF8C00]" />,
  CheckCircle2: <CheckCircle2 className="w-5 h-5 text-[#92278F]" />,
  Scale: <Scale className="w-5 h-5 text-[#FF8C00]" />,
  Compass: <Compass className="w-5 h-5 text-[#92278F]" />,
  Heart: <Heart className="w-5 h-5 text-[#FF8C00]" />,
  ShieldAlert: <ShieldAlert className="w-5 h-5 text-[#92278F]" />,
};

export default function PresentationPage() {
  const { language } = useLanguage();
  const { orgName, addressLocation, postalBox, settings } = useSiteSettings();
  const [pageData, setPageData] = useState<InstitutionalPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    supabaseStore.getInstitutionalPageBySlug('presentation').then((res) => {
      if (isMounted) {
        setPageData(res);
        setLoading(false);
      }
    });

    // Listen to real-time changes saved from back-office
    const handlePageChanged = (e: any) => {
      if (e?.detail?.slug === 'presentation') {
        setPageData(e.detail);
      }
    };
    window.addEventListener('aps_page_changed', handlePageChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('aps_page_changed', handlePageChanged);
    };
  }, []);

  // Compute values dynamically with fallback to institutional settings
  const badge = pageData
    ? language === 'en'
      ? pageData.badge_en || pageData.badge_fr || 'The Organization'
      : pageData.badge_fr || "L'Organisation"
    : language === 'en'
    ? 'The Organization'
    : "L'Organisation";

  const title = pageData
    ? language === 'en'
      ? pageData.title_en || pageData.title_fr || 'Overview & Identity'
      : pageData.title_fr || 'Présentation Institutionnelle'
    : language === 'en'
    ? 'Overview & Identity'
    : 'Présentation Institutionnelle';

  const quote = pageData
    ? language === 'en'
      ? pageData.quote_en || pageData.quote_fr || settings.slogan_en || 'For a more just and egalitarian world'
      : pageData.quote_fr || settings.slogan_fr || 'Pour un monde plus juste et égalitaire'
    : language === 'en'
    ? 'For a more just and egalitarian world'
    : 'Pour un monde plus juste et égalitaire';

  const intro = pageData
    ? language === 'en'
      ? pageData.intro_en || pageData.intro_fr || ''
      : pageData.intro_fr || ''
    : language === 'en'
    ? 'is a non-governmental organization created in September 2014 by a collective of citizens committed to the defense of human rights, human dignity, and social justice.'
    : "est une organisation non gouvernementale créée en septembre 2014 par un collectif de citoyennes et citoyens engagés pour la défense des droits humains, de la dignité et de la justice sociale.";

  const bodyContent = pageData
    ? language === 'en'
      ? pageData.body_html_en || pageData.body_html_fr || ''
      : pageData.body_html_fr || ''
    : '';

  // Extract paragraphs cleanly
  const paragraphs = bodyContent
    ? bodyContent.split('\n\n').filter(Boolean)
    : [
        language === 'en'
          ? "Officially registered in September 2017 with the Ministry of Interior and Public Security (Prefectural Order N°9/040PDM/SG/STCCD- and published in the Official Gazette of the Republic of Benin N°21 of November 1, 2017), the NGO has established a solid operational footprint in the Mono department."
          : "Enregistrée officiellement en septembre 2017 auprès du Ministère de l'Intérieur et de la Sécurité Publique (Récépissé N°9/040PDM/SG/STCCD- et parution au Journal Officiel de la République du Bénin N°21 du 1er Novembre 2017), l'ONG a bâti un ancrage territorial solide dans le département du Mono.",
        language === 'en'
          ? "APS-BENIN works every day to eliminate all forms of discrimination against women and girls, fight gender-based violence, ensure comprehensive access to sexual and reproductive health information, and support socioeconomic independence through vocational training and solidarity cooperatives."
          : "APS-BÉNIN œuvre au quotidien pour éliminer toutes les formes de discrimination à l'égard des femmes et des filles, éradiquer les violences basées sur le genre, garantir l'accès universel à l'information sur la santé sexuelle et reproductive et favoriser l'autonomie financière des ménages vulnérables par la formation professionnelle et l'appui aux coopératives solidaires."
      ];

  // Hero image
  const heroImage = pageData?.hero_image;

  // Headquarters photo from managed images
  const hqImageObj = pageData?.images?.find(
    (img) => img.slot_key === 'headquarters_photo' || img.slot_key === 'image_1'
  ) || pageData?.images?.[0];

  const fieldImageObj = pageData?.images?.find(
    (img) => img.slot_key === 'community_action' || img.slot_key === 'image_2'
  ) || pageData?.images?.[1];

  // Blocks (Pillars / Principles)
  const pillars = pageData?.blocks && pageData.blocks.length > 0
    ? pageData.blocks
    : [
        {
          id: 'blk-pres-1',
          type: 'pillar',
          title_fr: 'Indépendance & Éthique',
          title_en: 'Independence & Ethics',
          content_fr: 'Une association apolitique, laïque et régie par des règles strictes de probité.',
          content_en: 'A non-partisan, secular civil society entity governed by strict integrity.',
          icon_name: 'ShieldCheck',
          order_index: 1,
        },
        {
          id: 'blk-pres-2',
          type: 'pillar',
          title_fr: 'Proximité & Inclusion',
          title_en: 'Proximity & Inclusiveness',
          content_fr: 'Des actions co-construites avec les communautés de base et les personnes vulnérables.',
          content_en: 'Actions co-designed with grassroots community members and vulnerable groups.',
          icon_name: 'Users',
          order_index: 2,
        },
        {
          id: 'blk-pres-3',
          type: 'pillar',
          title_fr: 'Transparence & Résultats',
          title_en: 'Transparency & Results',
          content_fr: 'Redevabilité rigoureuse envers les bénéficiaires, les partenaires et les bailleurs.',
          content_en: 'Accountability to beneficiaries, institutional partners and donors.',
          icon_name: 'CheckCircle2',
          order_index: 3,
        },
        {
          id: 'blk-pres-4',
          type: 'pillar',
          title_fr: 'Égalité de Genre',
          title_en: 'Gender Equality',
          content_fr: 'Lutte constante pour l’égalité des droits, le leadership et l’autonomie des femmes.',
          content_en: 'Advancing equal rights, leadership and economic opportunities.',
          icon_name: 'Scale',
          order_index: 4,
        },
      ];

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Navbar />

      {pageData && pageData.is_published === false && (
        <div className="bg-amber-500 text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-xs">
          <EyeOff className="w-4 h-4 shrink-0" />
          <span>
            {language === 'en'
              ? 'Notice: This institutional page is currently saved as a draft in the admin back-office.'
              : 'Avis : Cette page institutionnelle est actuellement configurée en mode brouillon interne dans le back-office.'}
          </span>
        </div>
      )}

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          {heroImage && (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center opacity-25"
              style={{
                backgroundImage: `url('${heroImage}')`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <div className="max-w-3xl space-y-4">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20">
                {badge}
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
                {title}
              </h1>
              {quote && (
                <p className="text-lg text-purple-100 font-serif italic border-l-4 border-[#FF8C00] pl-4">
                  « {quote} »
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-white/75 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left/Main Column */}
              <div className="lg:col-span-8 space-y-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-heading mb-4">
                    {language === 'en' ? 'Who is APS-BENIN?' : 'Qui est AGISSONS POUR SAUVER (APS-BÉNIN) ?'}
                  </h2>
                  <div className="prose prose-purple max-w-none text-gray-700 space-y-4 leading-relaxed text-base">
                    <p>
                      <strong>{orgName || 'AGISSONS POUR SAUVER (APS-BÉNIN)'}</strong>{' '}
                      {intro}
                    </p>
                    {paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>

                {/* Key Pillars */}
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 font-heading mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#92278F]" />
                    <span>{language === 'en' ? 'Our Fundamental Principles' : 'Nos Principes Fondateurs'}</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pillars.map((pillar: any, index: number) => {
                      const pTitle = language === 'en' ? pillar.title_en || pillar.title_fr : pillar.title_fr;
                      const pDesc = language === 'en' ? pillar.content_en || pillar.content_fr : pillar.content_fr;
                      const icon = iconMap[pillar.icon_name || ''] || <CheckCircle2 className="w-5 h-5 text-[#FF8C00] shrink-0 mt-0.5" />;

                      return (
                        <div key={pillar.id || index} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
                          <div className="shrink-0 mt-0.5">
                            {icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-900">
                              {pTitle}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {pDesc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional illustrative photos if configured in admin */}
                {fieldImageObj && fieldImageObj.url && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-white">
                    <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-100">
                      <OptimizedImage
                        src={fieldImageObj.url}
                        alt={language === 'en' ? fieldImageObj.alt_en || fieldImageObj.alt_fr : fieldImageObj.alt_fr}
                        fill
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover"
                      />
                    </div>
                    {(fieldImageObj.caption_fr || fieldImageObj.caption_en) && (
                      <div className="p-4 bg-white border-t border-gray-100 text-xs text-gray-600">
                        <p className="font-semibold text-gray-900">
                          {language === 'en'
                            ? fieldImageObj.caption_en || fieldImageObj.caption_fr
                            : fieldImageObj.caption_fr}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Subsections links */}
                <div className="pt-4 flex flex-wrap gap-4">
                  <Link
                    href="/organisation/histoire"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-purple-50 text-[#92278F] font-bold text-sm hover:bg-[#92278F] hover:text-white transition-colors"
                  >
                    <span>{language === 'en' ? 'Discover our history' : 'Découvrir notre histoire'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/organisation/mission-vision-valeurs"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-orange-50 text-[#d97500] font-bold text-sm hover:bg-[#FF8C00] hover:text-white transition-colors"
                  >
                    <span>{language === 'en' ? 'Mission, Vision & Values' : 'Mission, Vision & Valeurs'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Institutional Identity Card */}
              <div className="lg:col-span-4">
                <div className="sticky top-28 space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
                    <h3 className="text-base font-bold text-gray-900 font-heading border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-[#92278F]" />
                      <span>{language === 'en' ? 'Institutional Identity Card' : "Fiche d'Identité Officielle"}</span>
                    </h3>

                    <dl className="space-y-3.5 text-xs">
                      <div>
                        <dt className="text-gray-500 font-medium">Nom officiel</dt>
                        <dd className="font-bold text-gray-900 mt-0.5">{orgName || 'AGISSONS POUR SAUVER – APS-BÉNIN'}</dd>
                      </div>

                      {settings.creation_date && (
                        <div>
                          <dt className="text-gray-500 font-medium">Date de création</dt>
                          <dd className="font-semibold text-gray-900 mt-0.5">{settings.creation_date}</dd>
                        </div>
                      )}

                      {settings.official_registration_date && (
                        <div>
                          <dt className="text-gray-500 font-medium">Enregistrement officiel</dt>
                          <dd className="font-semibold text-gray-900 mt-0.5">{settings.official_registration_date}</dd>
                        </div>
                      )}

                      {settings.registration_reference && (
                        <div>
                          <dt className="text-gray-500 font-medium">Récépissé Préfectoral</dt>
                          <dd className="font-mono text-gray-900 mt-0.5 bg-white p-1.5 rounded border border-gray-200">
                            {settings.registration_reference}
                          </dd>
                        </div>
                      )}

                      {settings.jo_reference && (
                        <div>
                          <dt className="text-gray-500 font-medium">Journal Officiel</dt>
                          <dd className="font-mono text-gray-900 mt-0.5 bg-white p-1.5 rounded border border-gray-200">
                            {settings.jo_reference}
                          </dd>
                        </div>
                      )}

                      {settings.ifu_number && (
                        <div>
                          <dt className="text-gray-500 font-medium">Identifiant Fiscal Unique (IFU)</dt>
                          <dd className="font-mono font-bold text-[#92278F] mt-0.5 bg-purple-50 p-1.5 rounded border border-purple-200 text-sm">
                            {settings.ifu_number}
                          </dd>
                        </div>
                      )}

                      {addressLocation && (
                        <div>
                          <dt className="text-gray-500 font-medium">Siège Social</dt>
                          <dd className="font-semibold text-gray-900 mt-0.5 flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#FF8C00] shrink-0 mt-0.5" />
                            <span>{addressLocation}</span>
                          </dd>
                        </div>
                      )}

                      {postalBox && (
                        <div>
                          <dt className="text-gray-500 font-medium">Boîte Postale</dt>
                          <dd className="font-semibold text-gray-900 mt-0.5">{postalBox}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Photo of headquarters or community */}
                  {hqImageObj && hqImageObj.url && (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
                      <div className="relative w-full h-44 overflow-hidden bg-gray-100">
                        <OptimizedImage
                          src={hqImageObj.url}
                          alt={language === 'en' ? hqImageObj.alt_en || hqImageObj.alt_fr : hqImageObj.alt_fr || 'APS-BÉNIN Siège'}
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4 bg-white text-xs text-gray-600">
                        <p className="font-semibold text-gray-900">
                          {language === 'en' ? hqImageObj.label_en || hqImageObj.label_fr : hqImageObj.label_fr || 'Siège de Djacoṭé-Comè'}
                        </p>
                        {(hqImageObj.caption_fr || hqImageObj.caption_en) && (
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {language === 'en' ? hqImageObj.caption_en || hqImageObj.caption_fr : hqImageObj.caption_fr}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
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
