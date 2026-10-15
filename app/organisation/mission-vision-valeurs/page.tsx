'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { InstitutionalPage } from '@/types';
import { RichTextContent } from '@/components/RichTextContent';
import {
  defaultInstitutionalVision,
  defaultInstitutionalMission,
  defaultInstitutionalGoal,
  defaultInstitutionalObjectives,
  defaultInstitutionalValues,
} from '@/lib/initial-pages';
import {
  Compass,
  Eye,
  Heart,
  Scale,
  ShieldAlert,
  Users,
  CheckCircle2,
  EyeOff,
  Target,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Scale: <Scale className="w-6 h-6 text-[#92278F]" />,
  Heart: <Heart className="w-6 h-6 text-[#FF8C00]" />,
  CheckCircle2: <CheckCircle2 className="w-6 h-6 text-[#92278F]" />,
  Users: <Users className="w-6 h-6 text-[#FF8C00]" />,
  ShieldAlert: <ShieldAlert className="w-6 h-6 text-[#92278F]" />,
  Compass: <Compass className="w-6 h-6 text-[#FF8C00]" />,
  Target: <Target className="w-6 h-6 text-amber-600" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
  Eye: <Eye className="w-6 h-6 text-[#FF8C00]" />,
};

export default function MissionVisionValeursPage() {
  const { language } = useLanguage();
  const [pageData, setPageData] = useState<InstitutionalPage | null>(null);

  useEffect(() => {
    supabaseStore.getInstitutionalPageBySlug('mission-vision-valeurs').then(setPageData);

    const handlePageChanged = (e: any) => {
      if (e?.detail?.slug === 'mission-vision-valeurs') {
        setPageData(e.detail);
      }
    };
    window.addEventListener('aps_page_changed', handlePageChanged);

    return () => {
      window.removeEventListener('aps_page_changed', handlePageChanged);
    };
  }, []);

  // Header data
  const badge = pageData
    ? language === 'en'
      ? pageData.badge_en || pageData.badge_fr || 'Institutional Identity'
      : pageData.badge_fr || 'Identité Institutionnelle'
    : language === 'en'
    ? 'Institutional Identity'
    : 'Identité Institutionnelle';

  const title = pageData
    ? language === 'en'
      ? pageData.title_en || pageData.title_fr || 'Vision, Mission, Purpose, Objectives & Values'
      : pageData.title_fr || 'Vision, Mission, But, Objectifs & Valeurs'
    : language === 'en'
    ? 'Vision, Mission, Purpose, Objectives & Values'
    : 'Vision, Mission, But, Objectifs & Valeurs';

  const quote = pageData
    ? language === 'en'
      ? pageData.quote_en || pageData.quote_fr || 'For a more just and egalitarian world'
      : pageData.quote_fr || 'Pour un monde plus juste et égalitaire'
    : language === 'en'
    ? 'For a more just and egalitarian world'
    : 'Pour un monde plus juste et égalitaire';

  const subtitle = pageData
    ? language === 'en'
      ? pageData.subtitle_en || pageData.subtitle_fr || 'Strategic orientations and fundamental principles guiding our work.'
      : pageData.subtitle_fr || 'Les orientations stratégiques et les principes fondamentaux guidant notre action.'
    : language === 'en'
    ? 'Strategic orientations and fundamental principles guiding our work.'
    : 'Les orientations stratégiques et les principes fondamentaux guidant notre action.';

  // Nettoyage strict des intitulés et textes institutionnels pour un professionnalisme maximal
  const cleanInstitutionalText = (text?: string | null): string => {
    if (!text) return '';
    return text
      .replace(/Mandat d’action opérationnel sur le terrain/gi, 'Notre Mission')
      .replace(/Mandat d'action opérationnel sur le terrain/gi, 'Notre Mission')
      .replace(/Horizon sociétal pour le Bénin et l’Afrique/gi, 'Notre Vision')
      .replace(/Horizon sociétal pour le Bénin et l'Afrique/gi, 'Notre Vision')
      .replace(/Composante\s*[0-9]+(\/[0-9]+)?(\s*—\s*Article\s*[0-9]+(\s*des\s*Statuts)?)?/gi, '')
      .replace(/Composante\s*[0-9]+(\/[0-9]+)?/gi, '')
      .replace(/Socle éthique institutionnel/gi, 'Nos Valeurs')
      .replace(/Socle éthique/gi, 'Nos Valeurs')
      .replace(/—\s*Article\s*[0-9]+(\s*des\s*Statuts)?/gi, '')
      .replace(/\(Article\s*[0-9]+\)/gi, '')
      .replace(/Article\s*[0-9]+(\s*des\s*statuts|\s*du\s*règlement)?/gi, '')
      .replace(/statutaire(s)?/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // 1. VISION
  const visionBlock = pageData?.blocks?.find((b) => b.type === 'vision');
  const rawVisionTitle =
    (language === 'en' ? visionBlock?.title_en || visionBlock?.title_fr : visionBlock?.title_fr) ||
    (language === 'en' ? defaultInstitutionalVision.title_en : defaultInstitutionalVision.title_fr);
  const visionTitle = cleanInstitutionalText(rawVisionTitle) || (language === 'en' ? 'Our Vision' : 'Notre Vision');
  const visionText = cleanInstitutionalText(
    (language === 'en' ? visionBlock?.content_en || visionBlock?.content_fr : visionBlock?.content_fr) ||
    (language === 'en' ? defaultInstitutionalVision.content_en : defaultInstitutionalVision.content_fr)
  );

  // 2. MISSION
  const missionBlock = pageData?.blocks?.find((b) => b.type === 'mission');
  const rawMissionTitle =
    (language === 'en' ? missionBlock?.title_en || missionBlock?.title_fr : missionBlock?.title_fr) ||
    (language === 'en' ? defaultInstitutionalMission.title_en : defaultInstitutionalMission.title_fr);
  const missionTitle = cleanInstitutionalText(rawMissionTitle) || (language === 'en' ? 'Our Mission' : 'Notre Mission');
  const missionText = cleanInstitutionalText(
    (language === 'en'
      ? missionBlock?.content_en || missionBlock?.content_fr || pageData?.intro_en || pageData?.intro_fr
      : missionBlock?.content_fr || pageData?.intro_fr) ||
    (language === 'en' ? defaultInstitutionalMission.content_en : defaultInstitutionalMission.content_fr)
  );

  // 3. BUT
  const goalBlock = pageData?.blocks?.find((b) => b.type === 'goal');
  const rawGoalTitle =
    (language === 'en' ? goalBlock?.title_en || goalBlock?.title_fr : goalBlock?.title_fr) ||
    (language === 'en' ? defaultInstitutionalGoal.title_en : defaultInstitutionalGoal.title_fr);
  const goalTitle = cleanInstitutionalText(rawGoalTitle) || (language === 'en' ? 'Our Purpose' : 'Notre But');

  const goalText = cleanInstitutionalText(
    (language === 'en'
      ? goalBlock?.content_en || goalBlock?.content_fr || pageData?.body_html_en || pageData?.body_html_fr
      : goalBlock?.content_fr || pageData?.body_html_fr) ||
    (language === 'en' ? defaultInstitutionalGoal.content_en : defaultInstitutionalGoal.content_fr)
  );

  // 4. OBJECTIFS
  const rawObjectiveBlocks = (pageData?.blocks || []).filter((b) => b.type === 'objective');
  const objectives =
    rawObjectiveBlocks.length > 0
      ? rawObjectiveBlocks
          .map((b, idx) => ({
            id: b.id || `obj-${idx + 1}`,
            title: cleanInstitutionalText(language === 'en' ? b.title_en || b.title_fr || '' : b.title_fr || ''),
            description: cleanInstitutionalText(language === 'en' ? b.content_en || b.content_fr || '' : b.content_fr || ''),
            icon_name: b.icon_name || 'ShieldCheck',
            order_index: b.order_index ?? idx + 1,
          }))
          .sort((a, b) => a.order_index - b.order_index)
      : defaultInstitutionalObjectives.map((obj) => ({
          id: obj.id,
          title: cleanInstitutionalText(language === 'en' ? obj.title_en : obj.title_fr),
          description: cleanInstitutionalText(language === 'en' ? obj.description_en : obj.description_fr),
          icon_name: obj.icon_name,
          order_index: obj.order_index,
        }));

  // 5. VALEURS
  const rawValueBlocks = (pageData?.blocks || []).filter((b) => b.type === 'pillar' || b.type === 'value');
  const values =
    rawValueBlocks.length > 0
      ? rawValueBlocks
          .map((b, idx) => ({
            id: b.id || `val-${idx + 1}`,
            title: cleanInstitutionalText(language === 'en' ? b.title_en || b.title_fr || '' : b.title_fr || ''),
            description: cleanInstitutionalText(language === 'en' ? b.content_en || b.content_fr || '' : b.content_fr || ''),
            icon_name: b.icon_name || 'Scale',
            order_index: b.order_index ?? idx + 1,
          }))
          .sort((a, b) => a.order_index - b.order_index)
      : defaultInstitutionalValues.map((v) => ({
          id: v.id,
          title: cleanInstitutionalText(language === 'en' ? v.title_en : v.title_fr),
          description: cleanInstitutionalText(language === 'en' ? v.desc_en : v.desc_fr),
          icon_name: v.icon_name,
          order_index: v.order_index,
        }));

  const heroImage = pageData?.hero_image;

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

      <main className="flex-1 font-sans">
        {/* ============================================================== */}
        {/* EN-TÊTE / HERO BANNER                                         */}
        {/* ============================================================== */}
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
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
              {badge}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {title}
            </h1>
            {quote && (
              <p className="text-lg text-purple-100 font-sans italic border-l-4 border-[#FF8C00] pl-4 mt-3">
                « {quote} »
              </p>
            )}
            {subtitle && (
              <p className="text-sm sm:text-base text-gray-300 max-w-3xl mt-4 leading-relaxed font-sans">
                {subtitle}
              </p>
            )}

            {/* Quick anchors bar for navigation */}
            <div className="pt-6 flex flex-wrap gap-2 text-xs font-bold font-sans">
              <a
                href="#vision"
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-[#FF8C00] transition-colors border border-white/15 inline-flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-[#FF8C00]" />
                <span>{language === 'en' ? 'Vision' : 'Vision'}</span>
              </a>
              <a
                href="#mission"
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-[#92278F] transition-colors border border-white/15 inline-flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-purple-300" />
                <span>{language === 'en' ? 'Mission' : 'Mission'}</span>
              </a>
              <a
                href="#but"
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-amber-600 transition-colors border border-white/15 inline-flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'en' ? 'Purpose' : 'But'}</span>
              </a>
              <a
                href="#objectifs"
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-600 transition-colors border border-white/15 inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>{language === 'en' ? 'Objectives' : 'Objectifs'}</span>
              </a>
              <a
                href="#valeurs"
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-[#92278F] transition-colors border border-white/15 inline-flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 text-[#FF8C00]" />
                <span>{language === 'en' ? 'Values' : 'Valeurs'}</span>
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTIONS 1 & 2: VISION & MISSION                               */}
        {/* ============================================================== */}
        <section className="py-16 sm:py-20 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {/* 1. VISION */}
              <div
                id="vision"
                className="p-8 sm:p-10 rounded-2xl bg-orange-50/70 border border-orange-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-xl bg-[#FF8C00] text-white flex items-center justify-center shadow-sm mb-6">
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 font-heading mb-4">
                    {visionTitle}
                  </h2>
                  <div className="text-base text-gray-700 leading-relaxed font-sans">
                    <RichTextContent content={visionText} />
                  </div>
                </div>
              </div>

              {/* 2. MISSION */}
              <div
                id="mission"
                className="p-8 sm:p-10 rounded-2xl bg-purple-50/70 border border-purple-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-xl bg-[#92278F] text-white flex items-center justify-center shadow-sm mb-6">
                    <Compass className="w-7 h-7 text-[#FF8C00]" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 font-heading mb-4">
                    {missionTitle}
                  </h2>
                  <div className="text-base text-gray-700 leading-relaxed font-sans">
                    <RichTextContent content={missionText} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 3: NOTRE BUT                                           */}
        {/* (Police Open Sans / font-sans garantie pour le texte)          */}
        {/* ============================================================== */}
        <section id="but" className="py-16 sm:py-20 bg-linear-to-b from-amber-50/40 via-white to-amber-50/20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-amber-200 shadow-xs relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-700" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-heading">
                    {goalTitle}
                  </h2>
                </div>

                {/* Typography: Open Sans (font-sans) as required by APS-BÉNIN corporate identity */}
                <div className="p-6 sm:p-8 rounded-2xl bg-amber-50/60 border border-amber-200/70">
                  <div className="text-gray-800 leading-relaxed text-base sm:text-lg font-sans">
                    <RichTextContent content={goalText} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 4: NOS OBJECTIFS                                       */}
        {/* ============================================================== */}
        <section id="objectifs" className="py-16 sm:py-20 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-heading">
                {language === 'en' ? 'Our Objectives' : 'Nos Objectifs'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed font-sans">
                {language === 'en'
                  ? 'Our primary focus areas to advance rights, autonomy, and community well-being.'
                  : 'Nos axes d’action prioritaires au service des droits, de l’autonomie et du bien-être des populations.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {objectives.map((obj, idx) => (
                <div
                  key={obj.id || idx}
                  className="bg-white rounded-2xl p-7 sm:p-8 border border-gray-200 hover:border-emerald-500 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 font-bold">
                        {iconMap[obj.icon_name] || <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                      </div>
                      <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center font-sans">
                        {idx + 1}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 font-heading mb-3 leading-snug">
                      {obj.title}
                    </h3>
                    <div className="text-sm text-gray-600 leading-relaxed font-sans">
                      <RichTextContent content={obj.description} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 5: NOS VALEURS                                         */}
        {/* ============================================================== */}
        <section id="valeurs" className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-heading">
                {language === 'en' ? 'Our Values' : 'Nos Valeurs'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed font-sans">
                {language === 'en'
                  ? 'The core principles that guide our everyday interactions, choices, and commitments.'
                  : 'Les principes fondamentaux qui guident nos relations, nos choix et nos actions au quotidien.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {values.map((v, idx) => (
                <div
                  key={v.id || idx}
                  className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200 hover:border-[#92278F] transition-all hover:shadow-md shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 mb-4">
                      {iconMap[v.icon_name] || <Scale className="w-6 h-6 text-[#92278F]" />}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 font-heading mb-2">
                      {v.title}
                    </h3>
                    <div className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
                      <RichTextContent content={v.description} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Navigation vers les autres pages */}
        <section className="py-10 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-wrap items-center justify-between gap-4 font-sans">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {language === 'en' ? 'Institutional Information' : 'Informations Institutionnelles'}
              </p>
              <h4 className="text-base font-bold text-gray-900 font-heading">
                {language === 'en' ? 'Learn more about APS-BENIN' : 'Poursuivre la découverte d’APS-BÉNIN'}
              </h4>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/organisation/presentation"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-[#92278F] hover:border-purple-300 transition-colors shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#92278F]" />
                <span>{language === 'en' ? 'Overview & Identity' : 'Présentation Institutionnelle'}</span>
              </Link>
              <Link
                href="/organisation/histoire"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-[#92278F] hover:border-purple-300 transition-colors shadow-2xs"
              >
                <Compass className="w-3.5 h-3.5 text-[#FF8C00]" />
                <span>{language === 'en' ? 'History & Milestones' : 'Histoire & Jalons'}</span>
              </Link>
              <Link
                href="/organisation/gouvernance"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-[#92278F] hover:border-purple-300 transition-colors shadow-2xs"
              >
                <Users className="w-3.5 h-3.5 text-[#92278F]" />
                <span>{language === 'en' ? 'Governance' : 'Gouvernance'}</span>
              </Link>
            </div>
          </div>
        </section>

        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
