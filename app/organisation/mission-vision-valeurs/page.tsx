'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { InstitutionalPage } from '@/types';
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
  Sparkles,
  EyeOff,
  Target,
  ShieldCheck,
  Award,
  ArrowRight,
  BookOpen,
  BookmarkCheck,
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
  Award: <Award className="w-6 h-6 text-[#92278F]" />,
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
      ? pageData.title_en || pageData.title_fr || 'Mission, Vision, Purpose, Objectives & Values'
      : pageData.title_fr || 'Mission, Vision, But, Objectifs & Valeurs'
    : language === 'en'
    ? 'Mission, Vision, Purpose, Objectives & Values'
    : 'Mission, Vision, But, Objectifs & Valeurs';

  const quote = pageData
    ? language === 'en'
      ? pageData.quote_en || pageData.quote_fr || 'For a more just and egalitarian world'
      : pageData.quote_fr || 'Pour un monde plus juste et égalitaire'
    : language === 'en'
    ? 'For a more just and egalitarian world'
    : 'Pour un monde plus juste et égalitaire';

  const subtitle = pageData
    ? language === 'en'
      ? pageData.subtitle_en || pageData.subtitle_fr || 'Strategic orientations and intangible principles guiding every single intervention.'
      : pageData.subtitle_fr || 'Les orientations stratégiques et les principes intangibles guidant chacune de nos interventions.'
    : language === 'en'
    ? 'Strategic orientations and intangible principles guiding every single intervention.'
    : 'Les orientations stratégiques et les principes intangibles guidant chacune de nos interventions.';

  // 1. VISION
  const visionBlock = pageData?.blocks?.find((b) => b.type === 'vision');
  const visionTitle =
    (language === 'en' ? visionBlock?.title_en || visionBlock?.title_fr : visionBlock?.title_fr) ||
    (language === 'en' ? defaultInstitutionalVision.title_en : defaultInstitutionalVision.title_fr);
  const visionText =
    (language === 'en' ? visionBlock?.content_en || visionBlock?.content_fr : visionBlock?.content_fr) ||
    (language === 'en' ? defaultInstitutionalVision.content_en : defaultInstitutionalVision.content_fr);

  // 2. MISSION
  const missionBlock = pageData?.blocks?.find((b) => b.type === 'mission');
  const missionTitle =
    (language === 'en' ? missionBlock?.title_en || missionBlock?.title_fr : missionBlock?.title_fr) ||
    (language === 'en' ? defaultInstitutionalMission.title_en : defaultInstitutionalMission.title_fr);
  const missionText =
    (language === 'en'
      ? missionBlock?.content_en || missionBlock?.content_fr || pageData?.intro_en || pageData?.intro_fr
      : missionBlock?.content_fr || pageData?.intro_fr) ||
    (language === 'en' ? defaultInstitutionalMission.content_en : defaultInstitutionalMission.content_fr);

  // 3. BUT STATUTAIRE (ARTICLE 9)
  const goalBlock = pageData?.blocks?.find((b) => b.type === 'goal');
  const goalTitle =
    (language === 'en' ? goalBlock?.title_en || goalBlock?.title_fr : goalBlock?.title_fr) ||
    (language === 'en' ? defaultInstitutionalGoal.title_en : defaultInstitutionalGoal.title_fr);
  const goalText =
    (language === 'en'
      ? goalBlock?.content_en || goalBlock?.content_fr || pageData?.body_html_en || pageData?.body_html_fr
      : goalBlock?.content_fr || pageData?.body_html_fr) ||
    (language === 'en' ? defaultInstitutionalGoal.content_en : defaultInstitutionalGoal.content_fr);

  // 4. OBJECTIFS STATUTAIRES (ARTICLE 10)
  const rawObjectiveBlocks = (pageData?.blocks || []).filter((b) => b.type === 'objective');
  const objectives =
    rawObjectiveBlocks.length > 0
      ? rawObjectiveBlocks
          .map((b, idx) => ({
            id: b.id || `obj-${idx + 1}`,
            title: language === 'en' ? b.title_en || b.title_fr || '' : b.title_fr || '',
            description: language === 'en' ? b.content_en || b.content_fr || '' : b.content_fr || '',
            icon_name: b.icon_name || 'ShieldCheck',
            order_index: b.order_index ?? idx + 1,
          }))
          .sort((a, b) => a.order_index - b.order_index)
      : defaultInstitutionalObjectives.map((obj) => ({
          id: obj.id,
          title: language === 'en' ? obj.title_en : obj.title_fr,
          description: language === 'en' ? obj.description_en : obj.description_fr,
          icon_name: obj.icon_name,
          order_index: obj.order_index,
        }));

  // 5. VALEURS FONDAMENTALES (6 PILIERS ÉTHIQUES)
  const rawValueBlocks = (pageData?.blocks || []).filter((b) => b.type === 'pillar' || b.type === 'value');
  const values =
    rawValueBlocks.length > 0
      ? rawValueBlocks
          .map((b, idx) => ({
            id: b.id || `val-${idx + 1}`,
            title: language === 'en' ? b.title_en || b.title_fr || '' : b.title_fr || '',
            description: language === 'en' ? b.content_en || b.content_fr || '' : b.content_fr || '',
            icon_name: b.icon_name || 'Scale',
            order_index: b.order_index ?? idx + 1,
          }))
          .sort((a, b) => a.order_index - b.order_index)
      : defaultInstitutionalValues.map((v) => ({
          id: v.id,
          title: language === 'en' ? v.title_en : v.title_fr,
          description: language === 'en' ? v.desc_en : v.desc_fr,
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

      <main className="flex-1">
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
              <p className="text-lg text-purple-100 font-serif italic border-l-4 border-[#FF8C00] pl-4 mt-3">
                « {quote} »
              </p>
            )}
            {subtitle && (
              <p className="text-sm sm:text-base text-gray-300 max-w-3xl mt-4 leading-relaxed">
                {subtitle}
              </p>
            )}

            {/* Quick anchors bar for the 5 components */}
            <div className="pt-6 flex flex-wrap gap-2 text-xs font-bold">
              <a
                href="#vision"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#FF8C00] transition-colors border border-white/15 inline-flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-[#FF8C00]" />
                <span>1. {language === 'en' ? 'Vision' : 'Vision'}</span>
              </a>
              <a
                href="#mission"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#92278F] transition-colors border border-white/15 inline-flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-purple-300" />
                <span>2. {language === 'en' ? 'Mission' : 'Mission'}</span>
              </a>
              <a
                href="#but"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-amber-600 transition-colors border border-white/15 inline-flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5 text-amber-300" />
                <span>3. {language === 'en' ? 'Statutory Purpose' : 'But Statutaire'}</span>
              </a>
              <a
                href="#objectifs"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-600 transition-colors border border-white/15 inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>4. {language === 'en' ? 'Statutory Objectives' : 'Objectifs'}</span>
              </a>
              <a
                href="#valeurs"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#92278F] transition-colors border border-white/15 inline-flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 text-[#FF8C00]" />
                <span>5. {language === 'en' ? 'Core Values' : 'Valeurs'}</span>
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
                className="p-8 sm:p-10 rounded-2xl bg-orange-50/70 border-2 border-orange-200 relative overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-[#FF8C00] text-white flex items-center justify-center shadow-sm">
                      <Eye className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                      {language === 'en' ? 'Component 1/5' : 'Composante 1/5'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 font-heading mb-4">
                    {visionTitle}
                  </h2>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {visionText}
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-orange-200/60 flex items-center gap-2 text-xs font-bold text-orange-800">
                  <BookmarkCheck className="w-4 h-4 text-[#FF8C00]" />
                  <span>{language === 'en' ? 'Societal horizon for Benin & Africa' : 'Horizon sociétal pour le Bénin et l’Afrique'}</span>
                </div>
              </div>

              {/* 2. MISSION */}
              <div
                id="mission"
                className="p-8 sm:p-10 rounded-2xl bg-purple-50/70 border-2 border-purple-200 relative overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-[#92278F] text-white flex items-center justify-center shadow-sm">
                      <Compass className="w-7 h-7 text-[#FF8C00]" />
                    </div>
                    <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-purple-100 text-[#92278F] border border-purple-300">
                      {language === 'en' ? 'Component 2/5' : 'Composante 2/5'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 font-heading mb-4">
                    {missionTitle}
                  </h2>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {missionText}
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-purple-200/60 flex items-center gap-2 text-xs font-bold text-[#92278F]">
                  <BookmarkCheck className="w-4 h-4 text-[#FF8C00]" />
                  <span>{language === 'en' ? 'Operational mandate on the ground' : 'Mandat d’action opérationnel sur le terrain'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 3: NOTRE BUT STATUTAIRE (ARTICLE 9)                    */}
        {/* ============================================================== */}
        <section id="but" className="py-16 sm:py-20 bg-linear-to-b from-amber-50/60 via-white to-amber-50/30 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border-2 border-amber-200 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-100/50 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                    <Target className="w-4 h-4 text-amber-700" />
                    <span>{language === 'en' ? 'Component 3/5 — Article 9 of Statutes' : 'Composante 3/5 — Article 9 des Statuts'}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-400">
                    APS-BÉNIN / STATUTS OFFICIELS
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-heading mb-6">
                  {goalTitle}
                </h2>

                <div className="p-6 sm:p-8 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-gray-800 leading-relaxed text-base sm:text-lg font-serif italic relative">
                  <span className="text-4xl text-amber-400 font-serif absolute top-2 left-3 select-none leading-none">«</span>
                  <p className="pl-6 pr-2">
                    {goalText}
                  </p>
                  <span className="text-4xl text-amber-400 font-serif absolute bottom-0 right-3 select-none leading-none">»</span>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      {language === 'en'
                        ? 'Legally validated and officially registered in the Republic of Benin.'
                        : 'Légalement enregistré et publié au Journal Officiel de la République du Bénin.'}
                    </span>
                  </div>
                  <Link
                    href="/organisation/documents"
                    className="inline-flex items-center gap-1 font-bold text-[#92278F] hover:underline"
                  >
                    <span>{language === 'en' ? 'Consult official statutes' : 'Consulter les statuts officiels'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 4: NOS OBJECTIFS STATUTAIRES (ARTICLE 10)              */}
        {/* ============================================================== */}
        <section id="objectifs" className="py-16 sm:py-20 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 rounded-full mb-3">
                {language === 'en' ? 'Component 4/5 — Article 10 of Statutes' : 'Composante 4/5 — Article 10 des Statuts'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-heading">
                {language === 'en' ? 'Our 4 Statutory Objectives' : 'Nos 4 Objectifs Statutaires'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">
                {language === 'en'
                  ? 'Fundamental intervention pillars established by the Constitutive Assembly to achieve our institutional purpose.'
                  : 'Les axes d’action fondamentaux définis par l’Assemblée Générale Constitutive pour accomplir notre but.'}
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 font-bold">
                          {iconMap[obj.icon_name] || <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                          {language === 'en' ? `Objective #${idx + 1}` : `Objectif Statutaire #${idx + 1}`}
                        </span>
                      </div>
                      <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 font-heading mb-3 leading-snug">
                      {obj.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {obj.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-5 border-t border-gray-100 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{language === 'en' ? 'Article 10 statutory commitment' : 'Engagement statutaire Article 10'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 5: NOS VALEURS FONDAMENTALES (6 PILIERS ÉTHIQUES)       */}
        {/* ============================================================== */}
        <section id="valeurs" className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-[#92278F] bg-purple-100 border border-purple-200 px-3.5 py-1.5 rounded-full mb-3">
                {language === 'en' ? 'Component 5/5 — Ethical Core' : 'Composante 5/5 — Socle Éthique'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-heading">
                {language === 'en' ? 'Our 6 Core Values' : 'Nos 6 Valeurs Fondamentales'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">
                {language === 'en'
                  ? 'The non-negotiable ethical pillars that guide the posture, partnerships, and daily fieldwork of APS-BENIN.'
                  : 'Les repères intangibles qui guident l’attitude de chaque collaborateur et partenaire d’APS-BÉNIN.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {values.map((v, idx) => (
                <div
                  key={v.id || idx}
                  className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200 hover:border-[#92278F] transition-all hover:shadow-md shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                        {iconMap[v.icon_name] || <Scale className="w-6 h-6 text-[#92278F]" />}
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#92278F] border border-purple-200">
                        {language === 'en' ? `Pillar ${idx + 1}` : `Pilier ${idx + 1}`}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 font-heading mb-2">
                      {v.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {v.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-[#92278F] font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF8C00]" />
                    <span>{language === 'en' ? 'Ethical foundation' : 'Socle éthique institutionnel'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Cross-Links */}
        <section className="py-10 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {language === 'en' ? 'Institutional Architecture' : 'Architecture Institutionnelle'}
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
