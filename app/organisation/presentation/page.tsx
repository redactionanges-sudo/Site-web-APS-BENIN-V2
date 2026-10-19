'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabaseStore, resolveMediaUrl, unpackInstitutionalPage } from '@/lib/supabase';
import { initialInstitutionalPages } from '@/lib/initial-pages';

import { InstitutionalPage, InstitutionalPageImage, InstitutionalPageBlock } from '@/types';
import { RichTextContent } from '@/components/RichTextContent';
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
  Maximize2,
  X,
  Image as ImageIcon,
  Quote,
  ExternalLink,
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
  Sparkles: <Sparkles className="w-5 h-5 text-[#FF8C00]" />,
};

export default function PresentationPage() {
  const { language } = useLanguage();
  const { orgName, addressLocation, postalBox, settings } = useSiteSettings();
  const fallbackInitial = initialInstitutionalPages.find((p) => p.slug === 'presentation');
  const [pageData, setPageData] = useState<InstitutionalPage | null>(() =>
    fallbackInitial ? unpackInstitutionalPage(fallbackInitial) : null
  );
  const [loading, setLoading] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<InstitutionalPageImage | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabaseStore.getInstitutionalPageBySlug('presentation', true).then((res) => {
      if (isMounted && res) {
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
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aps_page_last_updated' || e.key === 'aps_benin_institutional_pages') {
        supabaseStore.getInstitutionalPageBySlug('presentation', true).then((res) => {
          if (isMounted && res) setPageData(res);
        });
      }
    };
    window.addEventListener('aps_page_changed', handlePageChanged);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('aps_page_changed', handlePageChanged);
      window.removeEventListener('storage', handleStorageChange);
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

  const subtitle = pageData
    ? language === 'en'
      ? pageData.subtitle_en || pageData.subtitle_fr || ''
      : pageData.subtitle_fr || ''
    : language === 'en'
    ? 'A civil society organization dedicated to dignity, justice, and inclusive community growth.'
    : 'Une organisation de la société civile engagée pour la dignité, la justice et le développement inclusif.';

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
    ? 'AGISSONS POUR SAUVER (APS-BENIN) is a non-governmental organization created in September 2014 by a collective of citizens committed to the defense of human rights, human dignity, and social justice.'
    : "AGISSONS POUR SAUVER (APS-BÉNIN) est une organisation non gouvernementale créée en septembre 2014 par un collectif de citoyennes et citoyens engagés pour la défense des droits humains, de la dignité et de la justice sociale.";

  const bodyContent = pageData
    ? language === 'en'
      ? pageData.body_html_en || pageData.body_html_fr || ''
      : pageData.body_html_fr || ''
    : '';

  // Extract paragraphs cleanly (support double or single newlines)
  const paragraphs = bodyContent
    ? bodyContent
        .split(/\r?\n\s*\r?\n|\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [
        language === 'en'
          ? "Officially registered in September 2017 with the Ministry of Interior and Public Security (Prefectural Order N°9/040PDM/SG/STCCD- and published in the Official Gazette of the Republic of Benin N°21 of November 1, 2017), the NGO has established a solid operational footprint in the Mono department."
          : "Enregistrée officiellement en septembre 2017 auprès du Ministère de l'Intérieur et de la Sécurité Publique (Récépissé N°9/040PDM/SG/STCCD- et parution au Journal Officiel de la République du Bénin N°21 du 1er Novembre 2017), l'ONG a bâti un ancrage territorial solide dans le département du Mono.",
        language === 'en'
          ? "APS-BENIN works every day to eliminate all forms of discrimination against women and girls, fight gender-based violence, ensure comprehensive access to sexual and reproductive health information, and support socioeconomic independence through vocational training and solidarity cooperatives."
          : "APS-BÉNIN œuvre au quotidien pour éliminer toutes les formes de discrimination à l'égard des femmes et des filles, éradiquer les violences basées sur le genre, garantir l'accès universel à l'information sur la santé sexuelle et reproductive et favoriser l'autonomie financière des ménages vulnérables par la formation professionnelle et l'appui aux coopératives solidaires."
      ];

  // Hero image
  const heroImage = resolveMediaUrl(pageData?.hero_image);
  const heroAlt = language === 'en'
    ? pageData?.hero_image_alt_en || pageData?.hero_image_alt_fr || title
    : pageData?.hero_image_alt_fr || pageData?.hero_image_alt_en || title;

  // Clean and filter images list from pageData
  const rawImages: InstitutionalPageImage[] = Array.isArray(pageData?.images)
    ? pageData!.images
    : typeof pageData?.images === 'string'
    ? (() => {
        try {
          return JSON.parse(pageData!.images);
        } catch {
          return [];
        }
      })()
    : [];

  const validImages = rawImages
    .map((img, idx) => ({
      ...img,
      id: img.id || `img-pres-${idx + 1}`,
      url: resolveMediaUrl(img.url),
    }))
    .filter((img) => img.url && typeof img.url === 'string' && img.url.trim().length > 0);

  // Categorize images intelligently:
  // 1. Headquarters image: explicitly marked as headquarters or contains 'siège'
  const hqImageObj = validImages.find(
    (img) => img.slot_key === 'headquarters_photo' || (img.label_fr && img.label_fr.toLowerCase().includes('siège'))
  ) || (validImages.length > 1 ? (validImages[0].slot_key === 'community_action' ? validImages[1] : validImages[0]) : null);

  // 2. Field / Main action image: explicitly marked as community_action or contains 'terrain'/'action', or first available
  const fieldImageObj = validImages.find(
    (img) => (img.slot_key === 'community_action' || (img.label_fr && (img.label_fr.toLowerCase().includes('terrain') || img.label_fr.toLowerCase().includes('action')))) && img.id !== hqImageObj?.id
  ) || validImages.find((img) => img.id !== hqImageObj?.id) || (validImages.length === 1 ? validImages[0] : null);

  // Safeguard: if there's at least 1 image, guarantee the main column has one!
  const finalFieldImage = fieldImageObj || (validImages.length > 0 ? validImages[0] : null);
  const finalHqImage = (validImages.length === 1 && finalFieldImage?.id === hqImageObj?.id) ? null : hqImageObj;

  // 3. Remaining gallery images: all other valid photos
  const remainingGalleryImages = validImages.filter(
    (img) => img.id !== finalFieldImage?.id && img.id !== finalHqImage?.id
  );

  // Blocks (Pillars / Principles / Editorial callouts)
  const rawBlocks: InstitutionalPageBlock[] = Array.isArray(pageData?.blocks)
    ? pageData!.blocks
    : typeof pageData?.blocks === 'string'
    ? (() => {
        try {
          return JSON.parse(pageData!.blocks);
        } catch {
          return [];
        }
      })()
    : [];

  const blocks = rawBlocks.length > 0
    ? rawBlocks
    : [
        {
          id: 'blk-pres-1',
          type: 'pillar' as const,
          title_fr: 'Indépendance & Éthique',
          title_en: 'Independence & Ethics',
          content_fr: 'Une association apolitique, laïque et régie par des règles strictes de probité et d’intégrité.',
          content_en: 'A non-partisan, secular civil society entity governed by strict integrity standards.',
          icon_name: 'ShieldCheck',
          order_index: 1,
        },
        {
          id: 'blk-pres-2',
          type: 'pillar' as const,
          title_fr: 'Proximité & Inclusion',
          title_en: 'Proximity & Inclusiveness',
          content_fr: 'Des actions co-construites avec les communautés de base et les personnes en situation de vulnérabilité.',
          content_en: 'Actions co-designed with grassroots community members and vulnerable groups.',
          icon_name: 'Users',
          order_index: 2,
        },
        {
          id: 'blk-pres-3',
          type: 'pillar' as const,
          title_fr: 'Transparence & Résultats',
          title_en: 'Transparency & Results',
          content_fr: 'Redevabilité rigoureuse envers les bénéficiaires, les partenaires institutionnels et les bailleurs.',
          content_en: 'Accountability to beneficiaries, institutional partners, and international donors.',
          icon_name: 'CheckCircle2',
          order_index: 3,
        },
        {
          id: 'blk-pres-4',
          type: 'pillar' as const,
          title_fr: 'Égalité de Genre',
          title_en: 'Gender Equality',
          content_fr: 'Lutte constante pour l’égalité des droits, le leadership et l’autonomie économique des femmes.',
          content_en: 'Advancing equal rights, leadership, and socioeconomic opportunities for women and girls.',
          icon_name: 'Scale',
          order_index: 4,
        },
      ];

  const pillars = blocks.filter((b) => b.type === 'pillar' || !b.type);
  const otherBlocks = blocks.filter((b) => b.type && b.type !== 'pillar');

  // Prevent duplicating organization name if already in intro
  const introTrimmed = intro.trim();
  const startsWithOrg =
    introTrimmed.toLowerCase().startsWith('agissons pour sauver') ||
    introTrimmed.toLowerCase().startsWith('aps-bénin') ||
    introTrimmed.toLowerCase().startsWith('aps-benin');

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
        {/* ============================================================== */}
        {/* PAGE HEADER / HERO                                            */}
        {/* ============================================================== */}
        <section className="bg-gray-950 text-white py-16 sm:py-24 relative overflow-hidden">
          {heroImage && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <OptimizedImage
                src={heroImage}
                alt={heroAlt}
                fill
                priority
                className="object-cover opacity-50 transform scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-[#92278F]/40 to-gray-950/85" />
            </div>
          )}
          {!heroImage && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-[#92278F]/40 to-gray-950" />
          )}

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <div className="max-w-3xl space-y-4">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xs">
                {badge}
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base sm:text-lg text-purple-100/90 leading-relaxed font-sans">
                  {subtitle}
                </p>
              )}
              {quote && (
                <div className="pt-2">
                  <p className="text-base sm:text-lg text-amber-200 font-serif italic border-l-4 border-[#FF8C00] pl-4 py-0.5">
                    « {quote} »
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* MAIN EDITORIAL CONTENT                                        */}
        {/* ============================================================== */}
        <section className="py-16 sm:py-20 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left/Main Column */}
              <div className="lg:col-span-8 space-y-10">
                {/* Introduction & Paragraphs */}
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#92278F]">
                    <Sparkles className="w-4 h-4 text-[#FF8C00]" />
                    <span>{language === 'en' ? 'Institutional Identity' : 'Identité & Histoire'}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-heading">
                    {language === 'en' ? 'Who is APS-BENIN?' : 'Qui est AGISSONS POUR SAUVER (APS-BÉNIN) ?'}
                  </h2>

                  <div className="prose prose-purple max-w-none text-gray-700 space-y-4 leading-relaxed text-base sm:text-lg">
                    {introTrimmed && (
                      <p className="text-gray-900 font-medium leading-relaxed bg-purple-50/50 p-5 rounded-2xl border border-purple-100 text-base sm:text-lg">
                        {startsWithOrg ? (
                          introTrimmed
                        ) : (
                          <>
                            <strong className="text-[#92278F] font-bold">
                              {orgName || 'AGISSONS POUR SAUVER (APS-BÉNIN)'}
                            </strong>{' '}
                            {introTrimmed}
                          </>
                        )}
                      </p>
                    )}

                    {bodyContent ? (
                      <RichTextContent content={bodyContent} className="text-base text-gray-700 space-y-4" />
                    ) : (
                      paragraphs.map((p, i) => (
                        <p key={i} className="text-gray-700 leading-relaxed text-base">
                          {p}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                {/* Main Action Photo (Siège ou Action communautaire de terrain) */}
                {finalFieldImage && finalFieldImage.url && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-white group">
                    <div
                      className="relative h-72 sm:h-96 w-full overflow-hidden bg-gray-100 cursor-pointer"
                      onClick={() => setActiveLightboxImage(finalFieldImage)}
                      title={language === 'en' ? 'Click to enlarge' : 'Cliquer pour agrandir'}
                    >
                      <OptimizedImage
                        src={finalFieldImage.url}
                        alt={language === 'en' ? finalFieldImage.alt_en || finalFieldImage.alt_fr : finalFieldImage.alt_fr || 'Action de terrain APS-BÉNIN'}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-900">
                          {language === 'en'
                            ? finalFieldImage.label_en || finalFieldImage.label_fr
                            : finalFieldImage.label_fr || 'Action de terrain'}
                        </p>
                        {(finalFieldImage.caption_fr || finalFieldImage.caption_en) && (
                          <p className="text-gray-600">
                            {language === 'en'
                              ? finalFieldImage.caption_en || finalFieldImage.caption_fr
                              : finalFieldImage.caption_fr}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-[#92278F] self-start sm:self-auto">
                        {language === 'en' ? 'Official photography' : 'Photographie officielle'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Key Pillars / Fundamental Principles */}
                {pillars.length > 0 && (
                  <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-200/80 pb-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-heading flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-[#92278F]" />
                          <span>{language === 'en' ? 'Our Fundamental Principles' : 'Nos Principes Fondateurs'}</span>
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {language === 'en'
                            ? 'The core pillars guiding every APS-BENIN initiative and field partnership.'
                            : 'Les piliers régissant chaque intervention et partenariat d’APS-BÉNIN.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pillars.map((pillar: any, index: number) => {
                        const pTitle = language === 'en' ? pillar.title_en || pillar.title_fr : pillar.title_fr;
                        const pDesc = language === 'en' ? pillar.content_en || pillar.content_fr : pillar.content_fr;
                        const icon = iconMap[pillar.icon_name || ''] || <CheckCircle2 className="w-5 h-5 text-[#FF8C00] shrink-0 mt-0.5" />;

                        return (
                          <div
                            key={pillar.id || index}
                            className="flex items-start gap-3.5 bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all"
                          >
                            <div className="shrink-0 p-2 rounded-lg bg-purple-50 border border-purple-100">
                              {icon}
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm text-gray-900">
                                {pTitle}
                              </h4>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {pDesc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Additional Editorial Blocks if configured */}
                {otherBlocks.length > 0 && (
                  <div className="space-y-4">
                    {otherBlocks.map((blk) => {
                      const bTitle = language === 'en' ? blk.title_en || blk.title_fr : blk.title_fr;
                      const bContent = language === 'en' ? blk.content_en || blk.content_fr : blk.content_fr;

                      if (blk.type === 'quote') {
                        return (
                          <div key={blk.id} className="p-6 rounded-2xl bg-orange-50/60 border border-orange-200 flex items-start gap-3">
                            <Quote className="w-5 h-5 text-[#FF8C00] shrink-0 mt-1" />
                            <div className="space-y-1">
                              {bTitle && <h4 className="font-bold text-sm text-gray-900">{bTitle}</h4>}
                              <p className="text-sm text-gray-800 font-serif italic">{bContent}</p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={blk.id} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
                          {bTitle && <h4 className="font-bold text-base text-gray-900 font-heading">{bTitle}</h4>}
                          {bContent && <p className="text-sm text-gray-700 leading-relaxed">{bContent}</p>}
                          {blk.button_url && (
                            <Link
                              href={blk.button_url}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#92278F] hover:text-[#741772] mt-2"
                            >
                              <span>{language === 'en' ? blk.button_text_en || 'Learn more' : blk.button_text_fr || 'En savoir plus'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Complementary Photos Gallery (if additional images exist) */}
                {remainingGalleryImages.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
                    <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-[#FF8C00]" />
                          <span>{language === 'en' ? 'Photo Gallery & Field Deployments' : 'Galerie Photographique & Actions'}</span>
                        </h3>
                        <p className="text-xs text-gray-500">
                          {language === 'en'
                            ? 'Complementary imagery of activities, workshops and community mobilization.'
                            : 'Visuels complémentaires illustrant nos activités, ateliers et mobilisations.'}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#92278F] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                        {remainingGalleryImages.length} {language === 'en' ? 'photo(s)' : 'photo(s)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {remainingGalleryImages.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          onClick={() => setActiveLightboxImage(img)}
                          className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 aspect-4/3 cursor-pointer shadow-2xs hover:shadow-md hover:border-purple-300 transition-all"
                        >
                          <OptimizedImage
                            src={img.url}
                            alt={language === 'en' ? img.alt_en || img.alt_fr : img.alt_fr || 'Photo APS-BÉNIN'}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white text-xs">
                            <p className="font-bold line-clamp-1">
                              {language === 'en' ? img.label_en || img.label_fr : img.label_fr}
                            </p>
                            {(img.caption_fr || img.caption_en) && (
                              <p className="text-[11px] text-gray-200 line-clamp-1 mt-0.5">
                                {language === 'en' ? img.caption_en || img.caption_fr : img.caption_fr}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subsections navigation links */}
                <div className="pt-2 flex flex-wrap gap-4">
                  <Link
                    href="/organisation/histoire"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-50 text-[#92278F] font-bold text-sm hover:bg-[#92278F] hover:text-white transition-all shadow-2xs"
                  >
                    <span>{language === 'en' ? 'Discover our history & milestones' : 'Découvrir notre histoire & jalons'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/organisation/mission-vision-valeurs"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-50 text-[#d97500] font-bold text-sm hover:bg-[#FF8C00] hover:text-white transition-all shadow-2xs"
                  >
                    <span>{language === 'en' ? 'Mission, Vision & Values' : 'Mission, Vision & Valeurs'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* ============================================================== */}
              {/* RIGHT COLUMN: INSTITUTIONAL IDENTITY CARD & HQ PHOTO          */}
              {/* ============================================================== */}
              <div className="lg:col-span-4">
                <div className="sticky top-28 space-y-6">
                  {/* Fiche d'identité */}
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
                          <dd className="font-mono text-gray-900 mt-0.5 bg-gray-50 p-1.5 rounded border border-gray-200">
                            {settings.registration_reference}
                          </dd>
                        </div>
                      )}

                      {settings.jo_reference && (
                        <div>
                          <dt className="text-gray-500 font-medium">Journal Officiel</dt>
                          <dd className="font-mono text-gray-900 mt-0.5 bg-gray-50 p-1.5 rounded border border-gray-200">
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

                  {/* Photo officielle du siège (Headquarters photo) */}
                  {finalHqImage && finalHqImage.url && (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-white group">
                      <div
                        className="relative w-full h-52 overflow-hidden bg-gray-100 cursor-pointer"
                        onClick={() => setActiveLightboxImage(finalHqImage)}
                        title={language === 'en' ? 'Click to enlarge' : 'Cliquer pour agrandir'}
                      >
                        <OptimizedImage
                          src={finalHqImage.url}
                          alt={language === 'en' ? finalHqImage.alt_en || finalHqImage.alt_fr : finalHqImage.alt_fr || 'APS-BÉNIN Siège de Djacoṭé-Comè'}
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover group-hover:scale-103 transition-transform duration-500"
                        />
                        <div className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="p-4 bg-white text-xs text-gray-600 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-gray-900">
                            {language === 'en'
                              ? finalHqImage.label_en || finalHqImage.label_fr
                              : finalHqImage.label_fr || 'Siège de Djacoṭé-Comè'}
                          </p>
                          <span className="text-[10px] uppercase font-bold text-[#92278F] bg-purple-50 px-2 py-0.5 rounded-full">
                            Siège
                          </span>
                        </div>
                        {(finalHqImage.caption_fr || finalHqImage.caption_en) && (
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            {language === 'en' ? finalHqImage.caption_en || finalHqImage.caption_fr : finalHqImage.caption_fr}
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

      {/* Lightbox Modal for high-res viewing */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-full h-[65vh] bg-black">
              <OptimizedImage
                src={activeLightboxImage.url}
                alt={language === 'en' ? activeLightboxImage.alt_en || activeLightboxImage.alt_fr : activeLightboxImage.alt_fr}
                fill
                objectFit="contain"
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <div className="p-4 sm:p-6 bg-gray-900 text-white space-y-1">
              <h4 className="font-bold text-base font-heading">
                {language === 'en'
                  ? activeLightboxImage.label_en || activeLightboxImage.label_fr
                  : activeLightboxImage.label_fr}
              </h4>
              {(activeLightboxImage.caption_fr || activeLightboxImage.caption_en) && (
                <p className="text-xs text-gray-300">
                  {language === 'en'
                    ? activeLightboxImage.caption_en || activeLightboxImage.caption_fr
                    : activeLightboxImage.caption_fr}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
